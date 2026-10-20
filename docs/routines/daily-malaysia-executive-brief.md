# Routine export: "Daily Malaysia Executive Brief"

- Scheduler: Grok Bot scheduled routines (not GitHub)
- Schedule: `CRON_TZ=Asia/Kuala_Lumpur 17 7 * * *` (07:17 MYT every day, weekends included)
- Export type: text export of the saved routine prompt. Screenshots of the scheduler UI can't be taken from the bot computer, so a text export is provided instead.
- Redaction: private watchlist names and internal context omitted. There are no credentials, tokens or account details in the prompt.
- Version: the saved prompt as updated on 20 Oct 2026, which now requires source logs and script-generated tallies.

## Saved prompt (faithful summary in numbered steps)

The saved prompt is written as steps 0–7. This is a faithful summary of that text. Private watchlist names and internal context are omitted.

0. **Set up.** Take today's MYT date and use the window since the last edition. Start from a fresh copy of the repo's `main`. Create `logs/<date>/`, and log every headline you discover and every check you make as you go, following `docs/source-logs.md`. Log `articles.jsonl` (one line per headline discovered), `checks.jsonl` (every page or feed fetch attempt), `bursa.json` and `status.json`.
1. **Portal pass, in this order:** The Edge, The Star, Malay Mail, TNGlobal, The Malaysian Reserve, Bernama, NST/Business Times. Date each story from the article itself, never the site banner. If a fetch fails, retry in the browser. If it still fails, record the source as partial or blocked; don't report it as having no news.
2. **Bursa pass, in the browser:** check company announcements for the 12 watchlist companies (`config/watchlist.json`) plus material sector filings across the window. Save the filters used and the full filtered result list to `logs/<date>/bursa.json`.
3. **Search and regional pass:** per-sector, per-company and event searches, plus the allowed regional and top-up sources. Open the article body to confirm dates and figures.
4. **Write the items in C-suite style.** Each item leads with a number and carries a Positive/Mixed/Negative/Watch verdict and a so-what. Add 3–5 key takeaways, the sector heatmap and sector coverage notes. Generate `sourceTally` with `node scripts/tally.js <date>` (or `--write`), and run `node scripts/tally.js <date> --check` before publishing. Don't type totals in by hand.
5. **Two review passes:** dates, duplicates against past editions, and facts against the sources. Nothing invented.
6. **Save the edition early** as `data/editions/<date>.json` so the 08:43 backup can publish it if this run is cut off.
7. **Publish** via a NEW cloud agent that adds only the edition file and `logs/<date>/` to `main`. It runs `npm test` and `npm run build:prod` on Node 20, pushes, and confirms the Pages deploy. Then message Jason with the link, the item count, the top takeaway and any sources not fully checked. Never put the owner's organisation, private documents or private context on the site.
