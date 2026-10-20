# Operations: triggers, publishing and failure handling

This page explains what starts each daily run, how an edition gets published, and what happens when publishing fails. It covers the Malaysia Executive Brief (https://s213stud.github.io/malaysia-exec-brief/).

## 1. What triggers the research

Research is **not** triggered by GitHub. Two scheduled routines on the Grok Bot scheduler run it:

| Routine | Cron | Role |
|---|---|---|
| Daily Malaysia Executive Brief | `CRON_TZ=Asia/Kuala_Lumpur 17 7 * * *` (07:17 MYT, daily, weekends included) | Does the research, writes the edition and logs, publishes |
| Brief publish check | `CRON_TZ=Asia/Kuala_Lumpur 43 8 * * *` (08:43 MYT, daily) | Backup: makes sure the edition is live by 09:00 |

The text exports of both saved prompts are in [docs/routines/](routines/):
- [daily-malaysia-executive-brief.md](routines/daily-malaysia-executive-brief.md)
- [brief-publish-check.md](routines/brief-publish-check.md)

Screenshots of the scheduler UI can't be taken from the bot computer, so text exports are provided instead. They contain no credentials or account details.

The GitHub Action `.github/workflows/deploy.yml` runs on every push to `main`. It runs `npm test` and `npm run build:prod`, then deploys `dist/` to GitHub Pages. It **only builds and publishes the JSON already in the repo**. It does no research.

## 2. Publishing steps (normal route)

1. The daily routine saves `data/editions/<date>.json` early, so the backup can use it, and writes `logs/<date>/` (see [source-logs.md](source-logs.md)).
2. It runs `node scripts/tally.js <date> --check`, then `npm test` and `npm run build:prod`.
3. It launches a **new Cursor cloud agent each day** on `s213stud/malaysia-exec-brief`. The agent gets a `git archive` tarball of the files and an instruction to add **only** the new edition file and `logs/<date>/` on top of current `main`, leaving every other file unchanged.
   - A new agent is used each time because a long-lived agent stopped accepting follow-ups.
   - The bot computer itself holds no GitHub token.
4. The cloud agent runs `npm test` and `npm run build:prod` on Node 20 and pushes to `main`. It then confirms the Pages deploy succeeded and that `/editions/<date>/` is live.
5. The routine messages Jason with the link, the item count, the top takeaway and any sources not fully checked.

The repository and its GitHub Pages site are owned by the GitHub user **s213stud**. Pages deploys through GitHub Actions.

## 3. What the 08:43 backup does

This is taken from its saved prompt:

1. It checks the live site for today's MYT date. **If it's live, it does nothing and sends no message.**
2. If today's edition isn't live, it looks for `data/editions/<today>.json` in the bot's working copy.
   - **If the file exists** and passes `npm test` and `npm run build:prod`, it launches a **new** cloud agent with a `git archive` tarball. That agent adds only that file to `main`, keeps every other file unchanged, pushes, and confirms the Pages deploy.
   - **If there is no file**, it quickly builds a shorter edition from the core portals following `docs/editorial-guide.md`, says in the coverage notes that it's a **reduced run**, and publishes it the same way.
3. It messages Jason with the link, the item count and the top takeaway, and says plainly if the edition was late or reduced.

## 4. If both attempts fail

There is **no third automatic route**. The edition stays unpublished and Jason is told. Recovery is manual:
- rerun the routine by hand; or
- push the saved edition through a new cloud agent; or
- have the repo owner upload the file to `data/editions/` themselves (see [restore.md](restore.md) and [deployment.md](deployment.md)).

History so far: the daily runs on 16 and 19 Oct 2026 were cut off, and the backup recovered both editions.

## 5. Browser access for Bursa (and blocked sites)

Bursa Malaysia returns HTTP 403 to plain fetches such as curl. Bursa checks are done in the bot computer's **own desktop browser**, driven by an automated browser agent, with no login. The same browser is the fallback for other portals that block fetches.

## 6. How blocked or incomplete checks are recorded

Each source checked gets a `sourceTally` entry with `status` set to `checked`, `partial` or `blocked`, plus a note saying what failed. These are real entries from [data/editions/2026-10-20.json](../data/editions/2026-10-20.json):

**The Malaysian Reserve**: scanned 9, used 0, status `partial`

> Feed and homepage return HTTP 403 to curl, and the 07:45-08:10 browser sweep hit a Cloudflare interstitial on the homepage (blocked; not retried). Only the earlier WebFetch homepage list of 9 headlines dated 19 Oct was seen (PTP 16GWh green energy, UOB OPR call, CAAM SAF, economic freedom, ECRL fares, haze), all covered via other outlets. Bodies not opened, so no TMR source is cited. Not fully checked.

**The Star**: scanned 45, used 9, status `partial`

> Browser sweep, 07:45-08:10 MYT 20 Oct: /business, /business/business-news and /tech listings (the sweep counted about 45 window links, of which about 30 were business/tech items dated 19-20 Oct). 15 relevant articles opened with page date lines. Earlier curl and WebSearch pass (07:27-07:40) found 4 more. Used: Tourism Malaysia-Berjaya (ho-1), the ECRL 12 Dec opening (con-4), CIMB sustainability-linked financing (cf-6), the MPOA palm outlook (pl-3), The Capitol (pi-2), plus the Star versions of GDB (con-1), Jati Tinggi (cb-1), DNB (ai-3) and KIP REIT (pi-1). Triaged by headline, not opened (most are covered elsewhere): Batik Air Batam-Penang, FBM KLCI below 1,600, Farlim Shah Alam, ringgit close, MAHB decarbonisation, Amir Hamzah at IMF, Toyo Ventures privatisation, LYC Healthcare suspension, Yinson depreciation. Excluded: Kencana Agri fire inquiry (Indonesia). The sweep agent rated its own coverage partial because of those unopened headlines. Marked partial: some in-window headlines were judged by title only and not opened.

**NST / Business Times**: scanned 50, used 3, status `partial`

> General feed (50 items, 21:28 on 19 Oct to 07:20 on 20 Oct), plus a browser sweep of /business and /business/corporate (07:45-08:10 MYT; about 25 corporate items dated 19-20 Oct; the /business landing page's newest item is 17 Oct). 5 opened in the browser: KIP REIT, Propel Global, TNB-PTP, CTOS (cof-4) and CAB Cakaran-Oiltek. Vehicle sales (cof-1) and the 12.3GW data-centre approvals (ai-1) were read earlier. Triaged by headline, not opened: Mi Technovation SGX listing, index below 1,600, Khee San MoU, IHH Gleneagles Johor, UDA parks, Bus Cap, MMAG aircraft disposal, Toyo Ventures. The sweep agent rated its own coverage partial. Marked partial: some in-window headlines were judged by title only and not opened.

**Bursa announcements**: scanned 367, used 4, status `checked`

> Browser check of bursamalaysia.com (finished ~07:37 MYT 20 Oct): filter 19/10/2026-20/10/2026 returned 367 announcements, all dated 19 Oct; 20 Oct had 0 at ~07:35 MYT. The Bursa list shows dates only, no times, so filings are dated, not timed. All 367 titles were scanned and the material filings were opened. Watchlist: GDB's I-Ilham subcontract (ann 3716263; con-1), Southern Cable's placement completion (3716152) and EPF's 5.49% stake (3716159; cb-3), Pesona Metro's share buy-back (3716209) and Inta Bina's notice of a director's intention to deal in a closed period (3716185); the last two are routine and not itemised. Sector filings used: Sime Darby Property's Kulai land circular (3715941; pd-4) and Zetrix AI's dividend withdrawal (3715842) and MD's share disposal (3716270; cf-4). Bursa URLs were cross-checked against KLSE Screener's links to the original filings. Seen, titles or summaries only: the United Malacca takeover offer (covered 16 Oct), the XOX Networks disclosure, the fund-raisings and the EPF/KWAP bank holdings (see sector notes). Filings made after ~07:35 MYT on 20 Oct are not captured.

The Bursa entry above says `checked`, but its filtered list of 367 announcements **was not saved**. The browser check reported only the count and the announcement ids used. The list has not been reconstructed. From 20 Oct the raw log records this as `complete: false` (see [source-logs.md](source-logs.md)). From now on, logs record the status per source in `logs/<date>/status.json` and each fetch attempt in `checks.jsonl`.
