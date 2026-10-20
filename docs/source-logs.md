# Source logs and script-generated tallies

From 20 Oct 2026, each run saves raw evidence under `logs/<date>/`. `scripts/tally.js` then calculates the `sourceTally` counts from those files, so the totals are no longer typed in by hand. The logs keep two things separate:
- **discovered**: a headline seen in a feed, listing, probe, search or browser page;
- **opened**: the article body was actually read.

## Files

### `logs/<date>/articles.jsonl`
One JSON line per **headline discovered**:

| field | values |
|---|---|
| `source` | the portal name exactly as in `sourceTally` (e.g. `TNGlobal`) |
| `section` | feed or listing section |
| `title`, `url` | as discovered |
| `published` | ISO 8601 with `+08:00`, or `null` if unknown |
| `publishedBasis` | `article:published_time` \| `dateline` \| `listing` \| `unknown` |
| `discoveredVia` | `feed` \| `listing` \| `probe` \| `search` \| `browser` |
| `opened` | `true` only if the article body was read |
| `inWindow` | published within the edition window |
| `decision` | `included` \| `excluded` \| `duplicate` \| `out_of_window` \| `not_opened` |
| `reason` | short reason for the decision; say "title triage only" when the article was not opened |
| `itemId` | the edition item id when included, else `null` |

### `logs/<date>/bursa.json`
```json
{"checkedAt":"ISO+08:00","method":"browser ...","filters":{"dateFrom":"YYYY-MM-DD","dateTo":"YYYY-MM-DD","market":null,"category":null,"keywords":null},
 "complete":true,"reportedCount":0,"note":"",
 "results":[{"annId":"","company":"","title":"","date":"YYYY-MM-DD","url":"","opened":false,"decision":"","reason":"","itemId":null}]}
```
- `results` must hold the **full filtered list**, not just the filings used.
- Set `complete:false` whenever it doesn't.
- In `filters`, `null` means *not recorded*.

### `logs/<date>/checks.jsonl`
One line per page or feed fetch attempt: `{source,url,method,httpStatus,result,at}`.
- `method` is `curl`, `webfetch` or `browser`.
- `result` starts with `ok` on success. Anything else (e.g. `blocked: cloudflare`, `error: 403`) counts as a failure.

### `logs/<date>/status.json` (optional)
`{"<source>":{"status":"checked|partial|blocked","note":"..."}}`. This overrides the status the script would otherwise derive.

### `logs/<date>/manifest.json` (optional)
`{"complete":bool,"checkSources":[...],"note":"..."}`. `checkSources` limits `--check` and the test to the sources that were fully logged.

## How `scripts/tally.js` counts

For each source:
- **scanned** = headlines discovered with `inWindow:true`. For Bursa, it is the number of `results`.
  - Headlines discovered outside the window are logged and reported as `discovered`, but are not counted as scanned. This matches how the published tallies have always counted.
- **used** = the number of distinct `itemId`s whose decision is `included`.
- **status** comes from `status.json`. If that is absent, it is derived from the logs:
  - `blocked` if the source had fetch attempts and none succeeded;
  - `partial` if `bursa.json` has `complete:false`;
  - otherwise `checked`.

Commands:

    node scripts/tally.js <date>            # print computed tally (+ discovered, opened)
    node scripts/tally.js <date> --check    # compare with data/editions/<date>.json; exit 1 on mismatch
    node scripts/tally.js <date> --write    # write scanned/used/status into the edition (notes kept)
    node scripts/tally.js <date> --sources "TNGlobal" --check   # explicit scope
    node scripts/tally.js <date> --all --check                  # every logged source, ignoring the manifest
    npm run tally -- <date> --check

`npm test` includes `tests/tally.test.js`. It runs `--check` for every date folder in `logs/`, using the manifest scope where there is one. Dates without logs are skipped.

## Worked example: 20 Oct 2026 (retrospective, partial)

[`logs/2026-10-20/`](../logs/2026-10-20/) was built after the run, using only files that the 20 Oct run saved on the bot computer. **Nothing in it was reconstructed or estimated.**

- **TNGlobal is the matching example.** The saved `technode.global/feed/` file (fetched 07:27:58 MYT) has 30 items. 12 fall in the window, which starts 19 Oct 07:30 MYT. One of them, Aolani's 500MW plan, was opened (body saved at 07:28:54) and used as item `2026-10-20-ai-4`. The other 11 were triaged by title and not opened. The 18 older items are logged as `out_of_window`. The computed `12 scanned / 1 used / checked` matches the published entry exactly. See [`tally-check.txt`](../logs/2026-10-20/tally-check.txt):

      tally --check 2026-10-20 (scope: TNGlobal)
        TNGlobal: logs scanned=12 used=1 status=checked | edition scanned=12 used=1 status=checked | discovered=30 opened=1
      OK: edition sourceTally matches logs

  The 20 Oct run didn't record HTTP status codes, so `httpStatus` is `null` in `checks.jsonl`.

- **Bursa, 20 Oct: incomplete.** `bursa.json` has `complete:false` and the note "filtered list not saved; count 367 reported by browser check only". The browser check reported the count (367 announcements for 19/10/2026–20/10/2026) and the ids it used. **The list of 367 filings was not saved and has not been reconstructed.**
  - `results` holds only the 6 filings whose bodies were saved during the run, read via KLSE Screener mirrors of the Bursa filings. They map to 4 items: `con-1`, `cb-3`, `pd-4` and `cf-4`.
  - Two more ids named in the edition note (3716209, 3716185) have no saved copy and are not logged.
  - The market, category and keyword filters weren't recorded.
  - The script therefore computes `scanned=6, status=partial`, against `367 / checked` in the edition. `used=4` matches. This mismatch is expected and is why Bursa is outside the manifest's `checkSources`.

### Known discrepancies in the 20 Oct published tally
- **Bursa announcements**: `scanned=367` cannot be verified from saved files (see above). In hindsight it should have been marked `partial`, because the filtered list wasn't kept.
- **EdgeProp**: the published entry is `6 scanned / 2 used`, and the saved feed does have 6 in-window items. But one of the 2 "used" items (`pd-4`) cites an EdgeProp story (content id 1917861) that isn't among those 6. It was found through the Bursa/Sime Darby Property follow-up. A log of only the feed would give `used=1`, so EdgeProp isn't presented as a match.
- **All other sources** (The Edge, The Star, Malay Mail, The Malaysian Reserve, Bernama, NST/Business Times, FMT, The Sun, regional/search): their 20 Oct counts were typed in by hand from browser sweeps, ID probes and searches. Not every discovered headline was saved, so they are **not logged**, and their published counts can't be reproduced by the script.

From 21 Oct the daily routine writes these logs as it runs, so every source can be checked.
