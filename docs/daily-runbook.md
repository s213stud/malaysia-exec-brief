# Daily runbook: Malaysia Executive Brief

The full daily procedure, written so any agent can pick it up. Read `editorial-guide.md` for style and `deployment.md` for hosting.

Full step-by-step screening method: see screening-methodology.md

## Schedule (MYT, every day including weekends)
- 07:17: start the research run.
- Save a first full draft early as `data/editions/<YYYY-MM-DD>.json` with `status: "published"`.
- By 09:00: publish and confirm it's live, then send the reader the link, the item count, the top takeaway and any sources not fully checked.
- 08:43 backup check: if today's edition isn't live, publish the saved draft if it passes the tests. If there's no draft, build a shorter edition from the core portals and label it a reduced run in the coverage notes.

## Research method (the combined method)
Cover the window since the last edition. Skip stories already covered in earlier editions unless there's a material update.

1. **Portal pass, in this order:**
   1. The Edge: corporate, malaysia, Highlight, Economic Focus, Tech and Commodities. Use a browser if a fetch fails. Date each story by its article `published_time` or body dateline, never the site banner.
   2. The Star: business and tech, in a browser.
   3. Malay Mail: money (`/feed/rss/money`).
   4. TNGlobal (`technode.global/feed/`; its dates are UTC).
   5. The Malaysian Reserve.
   6. Bernama.
   7. NST / Business Times.

   If a page won't load, try a browser. If it still fails, mark the source "not fully checked" rather than reporting no news.
2. **Bursa pass (browser):** check company announcements for all 12 watchlist companies (`config/watchlist.json`) across the window, plus material filings from companies in the sectors. Direct fetches are blocked, but a browser with the company and date filters works.
3. **Search and regional pass:**
   - Per-sector searches: `<sector term> Malaysia <theme> <month year>`.
   - Per-company searches: `"<company name>" <ticker> <date range>`. Check that the article body names the company.
   - Event searches: e.g. `Malaysia data centre financing OR contract OR IPO`.
   - Also allowed: Business Times Singapore, DealStreetAsia, Digital News Asia, Business Today, i3investor and other broker research, plus the top-up sources (The Sun, FMT, EdgeProp, MOF, MPOB, CIDB, KPKT). Use them only when the story is about a Malaysian company, asset, regulator or policy.
   - Read the article body to confirm the date and figures.
4. **Write each item:**
   - Lead with a specific number.
   - Give a verdict: Positive, Mixed, Negative or Watch.
   - Add a one-line so-what, with an optional opportunity and watch-out.
   - Label analyst views as such.
   - Merge one development reported by several outlets into one item with multiple sources.
   - Add 3–5 key takeaways, the sector heatmap, coverage notes for each sector, and a `sourceTally` for every source checked.
5. **Two review passes:** check dates, duplicates against past editions, and facts against the sources. Nothing may be invented.
6. **Confidentiality:** never put the reader's employer name, private documents or private context on the site or in this repo.

## Publishing
- Run `npm test` and `npm run build:prod` on Node 20.
- Commit only the new `data/editions/<date>.json` to `main`. Pushing to `main` triggers the GitHub Pages deploy (`.github/workflows/deploy.yml`).
- Confirm the live page shows today's date: `https://s213stud.github.io/malaysia-exec-brief/editions/<date>/`. The raw JSON is not served; only the built pages are.
- Don't regenerate or overwrite earlier editions when pushing.

## Known source quirks
- The Edge's site banner shows today's date on old stories. Use the article's own date.
- The Edge's `/categories/property` section is stale, so use EdgeProp for property.
- The Star's `/property` page returns 404, and its paywalled print pieces can only be partly read.
- The feeds for The Malaysian Reserve, Bernama and NST only go back about a day, and The Malaysian Reserve sometimes blocks fetches.
