# Screening methodology: operator manual for the Malaysia Executive Brief

This is the complete, step-by-step manual for running the Malaysia Executive Brief. It is written so another AI agent can take over the role without any other briefing. Read it together with `docs/editorial-guide.md` (style), `docs/daily-runbook.md` (short version) and `docs/deployment.md` (hosting).

Facts here come from the repo's own files: `config/sources.json`, `config/sectors.json`, `config/watchlist.json`, `scripts/validate.js`, the edition files in `data/editions/`, and the source access audit of 14 Oct 2026. Where something has not been verified, this manual says so.

---

## 1. Role and output

1. **Product:** a daily, one-sentence-per-item executive news brief on Malaysian business, covering 10 sectors and a 12-company watchlist.
2. **Public portal:** https://s213stud.github.io/malaysia-exec-brief/ . Each edition has its own page: `https://s213stud.github.io/malaysia-exec-brief/editions/<YYYY-MM-DD>/`.
3. **Repo:** `s213stud/malaysia-exec-brief` (public). One edition = one file, `data/editions/<YYYY-MM-DD>.json`.
4. **Schedule (Malaysia time, MYT = UTC+8), every day including weekends:**
   1. 07:17: start the research run.
   2. As early as possible: save a full draft edition file (see section 11).
   3. 08:43: backup check (section 11).
   4. By 09:00: edition live, and the reader has the message (section 10).
5. The GitHub Actions workflow also rebuilds at 01:00 UTC (09:00 MYT), but it only rebuilds what is committed. It does not research news.

---

## 2. Tools and access method per source

### 2.1 Tools you need
- **Plain HTTP fetch** (curl, or a web-fetch tool): for RSS feeds and pages that serve static HTML or Next.js `__NEXT_DATA__` JSON.
- **Web search:** for the search and regional pass (section 3.3).
- **A real browser** (the box desktop browser): for The Star, EdgeProp, MCMC, Bursa, Cloudflare-protected sites, and any page a fetch cannot read.
- **Node 20 and npm:** to run `npm test` and `npm run build:prod`.
- **git**, plus a working way to push to `main` (section 9).

### 2.2 Fallback order (always)
1. Try the feed or plain fetch.
2. If it is blocked (403), empty, a JavaScript shell or a timeout, open it in the browser.
3. If the browser also fails, mark the source **"not fully checked"** in coverage notes and `sourceTally` (status `blocked`, `partial` or `pending-browser-check`). **Never write "no news"** for a source you could not read.

### 2.3 Source table

Status codes in brackets are from a quick `curl -L -A "Mozilla/5.0"` test on **20 Oct 2026, 09:17 MYT**, from the box. A 200 only means the page answered; it does not prove the body or date is readable. A 403 from curl does not mean the browser fails.

| Source | Tier / priority | URLs and feeds (curl status, 20 Oct 2026) | Method | Known quirks (from `config/sources.json`) |
|---|---|---|---|---|
| The Edge | core / P1 | home/listing: `https://theedgemalaysia.com` (200)<br>section: `https://theedgemalaysia.com/categories/corporate` (200)<br>section: `https://theedgemalaysia.com/categories/malaysia` (200)<br>section: `https://theedgemalaysia.com/flash-categories/Highlight` (200)<br>section: `https://theedgemalaysia.com/flash-categories/Economic%20Focus` (200)<br>section: `https://theedgemalaysia.com/flash-categories/Tech` (200)<br>section: `https://theedgemalaysia.com/flash-categories/Commodities` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Browser-first. No paywall seen on tested stories (some Premium may truncate). No RSS/sitemap (all 404). Category pages are Next.js; article ids and bodies are in __NEXT_DATA__ (/node/{id}). Date: ALWAYS use meta article:published_time (+08:00) or the created epoch inside the article, NEVER the site date banner (it shows today on old stories). Property category is stale (nothing since 2022): use EdgeProp for property. |
| The Star | core / P1 | home/listing: `https://www.thestar.com.my` (200)<br>section: `https://www.thestar.com.my/business` (200)<br>section: `https://www.thestar.com.my/business/property` (404)<br>section: `https://www.thestar.com.my/tech` (200) | Real browser (`access: needs-browser`) | No working RSS (/rss/business 404); sitemap only has section pages. Use the browser on Business, Property and Tech sections. StarPlus paywall on some stories: flag partial reads. Confirm date from article meta. |
| Malay Mail | core / P1 | home/listing: `https://www.malaymail.com` (200)<br>feed: `https://www.malaymail.com/feed/rss/money` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Full text, no paywall. Date: JSON-LD datePublished (+08:00). |
| TNGlobal (especially tech) | core / P1 | home/listing: `https://technode.global` (200)<br>feed: `https://technode.global/feed/` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Full text. Date: meta/JSON-LD in UTC, convert to MYT. |
| The Malaysian Reserve | core / P1 | home/listing: `https://themalaysianreserve.com` (403)<br>feed: `https://themalaysianreserve.com/feed/` (403) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Full text; some "Premium" labels. Date: JSON-LD (+08:00). |
| Bernama | core / P1 | home/listing: `https://www.bernama.com/en/business/` (200)<br>feed: `https://www.bernama.com/en/rssfeed.php` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | General all-sections feed; filter business. Date: meta published_time in DD/MM/YYYY h:mm PM format. |
| NST / Business Times | core / P1 | home/listing: `https://www.nst.com.my/business` (200)<br>feed: `https://www.nst.com.my/feed` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Full text, occasional premium; one status check timed out (retry). Date: JSON-LD (+08:00). |
| EdgeProp | topup / P2 | home/listing: `https://www.edgeprop.my/news` (200) | Real browser (`access: needs-browser`) | Property source replacing The Edge property category. Date not in meta/JSON-LD: read it from the page. |
| The Sun | topup / P2 | home/listing: `https://www.thesun.my` (200)<br>feed: `https://www.thesun.my/rss` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Mixed BM/EN feed. Date: meta + JSON-LD (+08:00). |
| FMT | topup / P2 | home/listing: `https://www.freemalaysiatoday.com` (200)<br>feed: `https://www.freemalaysiatoday.com/feed/` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | /category/business/ 404; use feed (business URLs inside). Date: JSON-LD UTC. |
| Sinar Harian | topup / P2 | home/listing: `https://www.sinarharian.com.my/bisnes` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Some premium. Date: JSON-LD (+08:00). No feed found. |
| China Press | topup / P2 | home/listing: `https://www.chinapress.com.my/category/财经/` (403) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Easy/partial: paywall marker present; /feed/ redirects to listing. Date: meta + JSON-LD (+08:00). |
| Berita Harian | topup / P3 | home/listing: `https://www.bharian.com.my` (403)<br>feed: `https://www.bharian.com.my/feed` (200) | Real browser (`access: needs-browser`) | Cloudflare 403 on pages/articles; feed gives headlines + pubDate only. Use browser for bodies. |
| Sin Chew | topup / P3 | home/listing: `https://www.sinchew.com.my` (200) | Real browser (`access: needs-browser`) | Cloudflare 403 incl. /feed: browser only, may be not accessible. |
| Malaysiakini | topup / P3 | home/listing: `https://www.malaysiakini.com` (200)<br>feed: `https://www.malaysiakini.com/rss/en/news.rss` (200) | Fetch headline/lede; browser for body; usually partial (`access: hard`) | Hard paywall: headline + lede only. Date JSON-LD UTC. |
| KiniBiz | topup / P3 | home/listing: `https://www.kinibiz.com` (200)<br>feed: `https://www.kinibiz.com/feed/` (200) | Fetch headline/lede; browser for body; usually partial (`access: hard`) | Likely paywalled; feed ~10 items, pubDate only. |
| Nanyang | topup / P3 | home/listing: `https://www.enanyang.my/财经` (200) | Fetch headline/lede; browser for body; usually partial (`access: hard`) | Metered: ~350 chars readable; no feed. Date: meta + JSON-LD (+08:00). |
| Bursa Malaysia announcements and company IR | primary / P2 | home/listing: `https://www.bursamalaysia.com/market_information/announcements/company_announcement` (403) | Real browser (`access: needs-browser`) | Cloudflare 403 page and API: browser only. Use as a later watchlist check after core media; if it will not load, mark "not fully checked", never "no announcements". |
| MOF press releases | primary / P3 | home/listing: `https://www.mof.gov.my/portal/en/news/press-release` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Page dates. |
| Bank Negara Malaysia | primary / P3 | home/listing: `https://www.bnm.gov.my` (200) | Fetch homepage links; browser (`access: partial`) | RSS 403 Access Denied; /press-release 404. Homepage links only. |
| MCMC and telco operators | primary / P3 | home/listing: `https://www.mcmc.gov.my/en/media/press-releases` (200) | Real browser (`access: needs-browser`) | Dates not found statically (JS/PDF): use browser. |
| CIDB | primary / P3 | home/listing: `https://www.cidb.gov.my` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Low volume; page dates. Quick daily check. |
| KPKT | primary / P3 | home/listing: `https://www.kpkt.gov.my` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Low volume; page dates. Quick daily check. |
| MPOB | primary / P3 | home/listing: `https://mpob.gov.my` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Low volume; /news 404, use homepage. Quick daily check. |
| Tourism Malaysia | primary / P3 | home/listing: `https://www.tourism.gov.my` (200) | Fetch headline/lede; browser for body; usually partial (`access: hard`) | News page returned 500 in audit. |
| Malaysian Association of Hotels | primary / P3 | home/listing: `https://www.hotels.org.my` (200) | Feed/plain HTTP fetch first; browser if blocked (`access: easy`) | Low volume. |
| Government budget, policy and regulatory documents | primary / P3 | (no fixed URL) | As needed (`access: varies`) | Use when an item cites a policy document. |
| Manufacturer and company releases | primary / P3 | (no fixed URL) | As needed (`access: varies`) | Use to confirm company figures. |
### 2.4 Extra quirks seen in real runs (from edition coverage notes)
- **The Edge:** the site date banner shows today's date on old stories. Search often surfaces old `/article/` URLs (2021-22 stories) with today's banner; the 18 Oct edition rejected about 16 of them. Date only by `article:published_time` or the `created` epoch in `__NEXT_DATA__`. A fetch pass on 18 Oct missed later articles that a browser sweep found, so if the newest Edge item looks suspiciously early, re-check in the browser. `/categories/property` is stale: use EdgeProp.
- **The Star:** `/business/property` returned 404 in today's test. Business listing pages show a date but no time; JSON-LD `datePublished` is UTC, convert to MYT. Saturday print and StarPlus pieces are often paywalled teasers: mark partial.
- **The Malaysian Reserve:** home page and feed both returned 403 to curl today; earlier runs saw only the home page. Use the browser and mark partial if needed.
- **TMR, Bernama, NST feeds** only go back about one day. Run them every day; for a longer window use the browser listings.
- **NST:** some article bodies return only the headline to curl and fetch; one status check timed out once. Use the browser, or cite as read from a syndicated summary and say so.
- **Bernama:** the BM RSS returned 500 in one run. Dates are `DD/MM/YYYY h:mm PM` (MYT).
- **TNGlobal and FMT:** dates are in UTC. Convert to MYT.
- **The Sun:** pages were a JavaScript shell with empty bodies in one run: use the browser.
- **Bursa:** curl and API return 403 (Cloudflare). A real browser works (section 3.2). Lists show dates only, no times.
- **Regional and secondary sources** (Business Times Singapore, DealStreetAsia, Digital News Asia, Business Today, i3investor, KLSE Screener): no fixed feed or section URL has been verified for these. Reach them through web search and open the article page.

---

## 3. Screening order and per-source procedure

Do the passes in this order. Record the real time of each check in `checkedAt` (ISO with `+08:00`).

### 3.1 Portal pass (core seven, in this order)
1. **Set the window.** Open the previous edition file in `data/editions/` and read its last research check time (`checkedAt` and `generalCoverage`). The window runs from that time to now.
2. **The Edge:** open the six section URLs in the table. Parse article ids and dates from `__NEXT_DATA__` (fetch) or read in the browser. Open each candidate `/node/{id}`. Date by `article:published_time`.
3. **The Star:** in the browser, open `/business` and `/tech`. Open each candidate article and read the date from article meta (JSON-LD, UTC to MYT). Flag paywalled reads as partial.
4. **Malay Mail:** read `https://www.malaymail.com/feed/rss/money`; past runs also used the `/news/malaysia` page. Date from JSON-LD `datePublished`.
5. **TNGlobal:** read `https://technode.global/feed/`. Convert UTC dates to MYT. Most items are regional; keep only Malaysian ones.
6. **The Malaysian Reserve:** try `https://themalaysianreserve.com/feed/`; if 403, use the browser on the home page.
7. **Bernama:** read `https://www.bernama.com/en/rssfeed.php` (all sections) and filter to business; also `https://www.bernama.com/en/business/`. BernamaBiz article pages (`bernamabiz.com/news.php?id=`) carry the same ids.
8. **NST / Business Times:** read `https://www.nst.com.my/feed` and `https://www.nst.com.my/business`.
9. For each source, count links scanned in window and items used, for `sourceTally`.

### 3.2 Bursa pass (browser only)
The browser filter steps below match what earlier runs recorded (per-company search for the window, per-company newest-first list, and the full unfiltered list for the window). Exact field labels on the Bursa page were not recorded in the repo, so read them on screen.

1. In the browser, open `https://www.bursamalaysia.com/market_information/announcements/company_announcement`.
2. For each of the 12 companies below, in turn:
   1. Type the company name (or code) in the company filter and pick the matching listed company.
   2. Set the date range from the window start date to today.
   3. Search. Note every filing title, date and its `announcement_details?ann_id=` link.
   4. Clear the date filter and view the company's newest filings, so you can record "newest filing date" when nothing is in window.
3. Then clear the company filter, set only the date range, and scan the titles of all filings in the window for material sector news (contracts, land deals, IPOs, circulars, clarifications) from non-watchlist companies.
4. Open the viewer for filings you will use. Say if PDF attachments were not opened.
5. Lists show dates only. Today's list is often empty early in the morning; say so (for example "none yet for 20 Oct at ~07:35 MYT").
6. If the page will not load, write "Bursa not fully checked", never "no announcements".

| Key | Company | Code | Group |
|---|---|---|---|
| oka | OKA CORPORATION BHD | 7140 | Building Materials |
| chinhin | CHIN HIN GROUP BERHAD | 5273 | Building Materials |
| southerncable | SOUTHERN CABLE GROUP BERHAD | 0225 | Cables |
| mastertec | MASTER TEC GROUP BERHAD | 0295 | Cables |
| crest | CREST BUILDER HOLDINGS BHD | 8591 | Construction |
| tujusetia | TUJU SETIA BERHAD | 5297 | Construction |
| pesona | PESONA METRO HOLDINGS BHD | 8311 | Construction |
| gdb | GDB HOLDINGS BERHAD | 0198 | Construction |
| tcs | TCS GROUP HOLDINGS BERHAD | 0221 | Construction |
| intabina | INTA BINA GROUP BERHAD | 0192 | Construction |
| nestcon | NESTCON BERHAD | 0235 | Construction |
| kitacon | KUMPULAN KITACON BERHAD | 5310 | Construction |

Codes are strings: keep leading zeros (`0225`, not `225`).

### 3.3 Search and regional pass
Run after portals and Bursa. Use web search; open every hit and read the body.

1. **Per sector** (one or more per sector): `<sector term> Malaysia <theme> <month year>`. Examples of sector terms are in section 4.
2. **Per watchlist company** (all 12): `"<exact company name>" <code> <date range>`, e.g. `"Southern Cable Group" 0225 October 2026`. Keep a hit only if the article body names that company and it is the same entity. Never match on a ticker substring.
3. **Per event:** `<named deal or event> Malaysia financing OR contract OR IPO`, to find the primary or best-dated report.
4. **Regional and secondary outlets allowed:** Business Times Singapore, DealStreetAsia, Digital News Asia, Business Today, i3investor and other broker research pages, KLSE Screener (broker digests). Use them only when the story is about a Malaysian company, asset, regulator or policy. Broker research is an analyst view: label it.

### 3.4 Top-up and primary sources (time permitting)
1. EdgeProp (property, browser), The Sun, FMT, Sinar Harian, China Press; then Berita Harian, Sin Chew, Malaysiakini, KiniBiz, Nanyang (mostly partial or paywalled).
2. Primary: MOF, BNM, MCMC, CIDB, KPKT, MPOB, Tourism Malaysia, MAH. Low volume: a quick daily look, and record the outcome even if it is "nothing readable".
3. Browser sweep: if any core source was only partly read by fetch, re-open its listing in the browser before compiling.

---

## 4. Per-sector checklist (all 10 sectors from `config/sectors.json`)

| Sector key | What to look for | Sources and regulators that matter |
|---|---|---|
| aiTelcoIct | Data centres (power, water, financing, approvals), AI investment, telcos and 5G, cloud, digital regulation, chip design | The Edge Tech, Star Tech, TNGlobal, Digital News Asia, BT Singapore and DealStreetAsia for DC financing; MCMC; PETRA/TNB statements; Bursa |
| propertyDevelopment | Launches, GDV, land deals, sales, approvals, housing policy | EdgeProp (not Edge property), Star, Malay Mail; KPKT; Bursa land circulars |
| construction | Contract awards with value, tenders, order books, cost (cement, steel), infrastructure budgets | The Edge corporate, NST, TMR, Bernama; CIDB; MOF; Bursa contract filings |
| propertyInvestment | Malls, retail landlords, retail REITs only (not all office news) | Edge, Star, TMR; Bursa REIT filings. Often empty: say "not evidence of no news" |
| plantation | CPO prices and outlook, production, stocks, exports, labour, haze and policy, planter results | MPOB (home page), BernamaBiz CPO weekly, Edge Commodities, broker research |
| capitalFinancing | Licensed moneylending, sukuk, bond ratings, IPOs, bank and capital-market moves; verify terms exactly | Bursa, BNM, SC, KPKT (moneylending), rating agencies as reported, Business Today, broker research |
| consumerFinancing | Financing relevant to civil servants: cooperatives, personal financing, HP, BNPL, payroll deduction policy | BNM, Star, Business Today, NST; MOF |
| cablesManufacturing | Cable makers, orders, capacity, copper costs, grid/DC/construction demand | Bursa (Southern Cable, Master Tec), Edge, Star; TNB tender news (standing tender pages are not news) |
| buildingMaterialsIbs | Wall panels and IBS, plus OKA and Chin Hin. Do not replace with generic materials news | CIDB, Bursa, Edge, Star |
| hotels | Hotel openings, deals, occupancy, tourism arrivals and policy | MAH, Tourism Malaysia (news page unreliable), Business Today, Edge, Bursa |

For each sector, write a coverage note listing sources checked, used items, things seen and not itemised (with reason), blocked or partial sources, and the Bursa result.

---

## 5. Screening and inclusion rules

1. **Relevance:** keep only items with a clear Malaysian business implication for one of the 10 sectors or a watchlist company.
2. **Window:** published since the previous edition's research check. Older items may appear only as `recent` (still developing) or `earlier-context`, never relabelled as `current`.
3. **Dedupe against past editions:** before writing an item, search earlier editions, for example `rg -i "<company or key term>" data/editions/`, and check the last few files. If it is already covered, do not repeat it; mention it in coverage notes ("already in 17 Oct edition, con-4").
4. **Material-update exception:** a story already covered may return only with a new fact (new figure, ruling, rating action, deadline outcome). Say in `note` which earlier item it follows.
5. **Merge:** one development reported by several outlets = one item with several `sources`. Distinct developments in the same story family stay separate.
6. **Label:** analyst estimates, forecasts, company targets, proposals, MOUs, deal status (proposed, pending, completed) and conditional effects. Mark computed figures "(computed)".
7. **Exclude:** old stories under a current banner, undated items, headline-only or unreadable bodies, advertorials and promotions, global-only stories with no Malaysian link, unverified third-party financial terms, and items whose sector fit cannot be verified. If two figures in one source conflict, drop the figure (as with a 70.2% vs 174% case).
8. **No fabrication:** never invent an item, figure, date, quote or URL. Do not fill an empty sector. Never claim coverage is exhaustive.

---

## 6. Date verification procedure

1. Open the article page itself (not a listing or search snippet).
2. Read the machine date: `article:published_time` meta or JSON-LD `datePublished`; for The Edge also `created` in `__NEXT_DATA__`; Bernama `DD/MM/YYYY h:mm PM`; EdgeProp from the visible page date.
3. Convert UTC dates (TNGlobal, FMT, Star JSON-LD, Malaysiakini) to MYT.
4. Cross-check with the body dateline. If they disagree, use the earlier date and note it.
5. Never use a site banner, "1d ago" label or search-engine date. If an item shows only "1d ago", treat its time as unverified.
6. Check the date against the window; set `publishedDate` (YYYY-MM-DD, MYT) and `freshness`. `publishedDate` may not be after the edition date (the validator rejects it).

---

## 7. Writing format

### 7.1 Edition fields
`date`, `demo: false`, `status` (`draft` or `published`), `checkedAt` (real ISO times with `+08:00`), `sectors` (array of `{sectorKey, theme?, items}`), `sectorCoverage` (object keyed by sector), `watchlistCoverage` (array of lines), `generalCoverage` (array of lines: window, dating method, partial sources, "Coverage is not exhaustive"), `keyTakeaways`, `sourceTally`, `publishedAt`.

### 7.2 Item fields (checked by `scripts/validate.js`)
- `id`: unique, e.g. `2026-10-18-ai-2` (sector short codes seen: ai, pd, con, pl, cf, ho).
- `headline`: required. Lead with the specific number.
- `verdict`: required, one of `Positive`, `Mixed`, `Negative`, `Watch` (use Watch for proposals, MOUs, unresolved issues).
- `freshness`: required, one of `current`, `recent`, `earlier-context`.
- `publishedDate`: required, `YYYY-MM-DD`, not after the edition date.
- `detail`: the event and selective material detail.
- `sources`: at least one `{publisher, url}`, url must start with http(s).
- `watchlistCompanyKeys`: only keys from `config/watchlist.json`, and only when the body names the company.
- `note`: editorial interpretation and links to earlier items.
- `soWhat`, `opportunity`, `watchOut`: optional, but non-empty strings when present.

### 7.3 Other blocks
- `keyTakeaways`: 3-5 entries when there are 3 or more items (max 5). Each has `headline`, `soWhat`, `sectorKeys` (known sectors) and `itemIds` (ids in this edition). No facts that are not in those items.
- **Heatmap:** built automatically. A sector is Positive or Negative only if all its non-Watch items agree; Mixed otherwise or if only Watch items; "No item today" if empty.
- `sourceTally`: one row per source checked: `source`, `scanned` (integer or `null`), `used` (integer), `status` (`checked`, `partial`, `pending-browser-check`, `blocked`, `not-checked`), `note`, `publishers`. `used` must not exceed `scanned`.

### 7.4 Real example item (from `data/editions/2026-10-18.json`)
```json
{
 "id": "2026-10-18-ai-2",
 "headline": "Sidec targets six Selangor semiconductor and IC firms to go public by 2030, and will train 1,000 engineers a year from 2027 (3,000 by 2030) against about 10,000 industry vacancies",
 "verdict": "Watch",
 "freshness": "current",
 "publishedDate": "2026-10-17",
 "detail": "Sidec CEO Yong Kai Ping set the IPO target at AiSEM@Selangor 2026 (14-17 Oct, KLCC). ...",
 "soWhat": "Selangor wants its chip-design cluster to become an IPO pipeline, which would bring ECM, advisory and financing business, but talent is the bottleneck.",
 "opportunity": "IPO advisory, venture debt and SME financing for chip-design firms. Engineering-talent and campus property demand around Puchong and Cyberjaya.",
 "watchOut": "The IPO count is an agency target, not a pipeline of filed listings. The 10,000 vacancies show the talent gap.",
 "sources": [
  {"publisher": "Bernama", "url": "https://www.bernama.com/en/news.php?id=2621628"},
  {"publisher": "BernamaBiz", "url": "https://www.bernamabiz.com/news.php?id=2621628"},
  {"publisher": "Bernama", "url": "https://www.bernama.com/en/news.php?id=2621767"}
 ],
 "watchlistCompanyKeys": [],
 "note": "Follows the 17 Oct item on the six homegrown chips (ai-3). ..."
}
```
(`detail` and `note` shortened here with "...".)

Real `sourceTally` row (same edition): `{"source": "TNGlobal", "scanned": 3, "used": 0, "status": "checked", "note": "technode.global feed: 3 items in window (...), none Malaysian.", "publishers": ["TNGlobal"]}`.

---

## 8. Two review passes

**Pass 1: facts and dates**
1. Every item's date checked on the article page, in window or correctly labelled.
2. Every number, name and status matches the source body. Computed figures marked.
3. Every URL opens to the cited article.
4. Watchlist keys only where the body names the company.
5. Analyst views, forecasts and proposals labelled.

**Pass 2: edition quality**
1. No duplicate of a past edition (re-run the `rg` search); follow-ups explain the new fact in `note`.
2. Multi-outlet stories merged.
3. Headlines lead with a number; verdicts fit.
4. Takeaways 3-5, only from items in this edition, ids correct.
5. Every sector has a coverage note; partial/blocked sources named; no "no news" for unread sources.
6. `sourceTally` complete, `used <= scanned`.
7. No private or employer information (section 12).
8. `npm test` passes.

---

## 9. Publishing, step by step

1. Save as `data/editions/<YYYY-MM-DD>.json` with `status: "published"` and `publishedAt` set.
2. On Node 20: `npm test`, then `npm run build:prod` (production build rejects demo editions).
3. Commit **only** the new edition file. Do not regenerate or overwrite earlier editions (corrections only, logged).
4. Push to `main`. This triggers `.github/workflows/deploy.yml` (tests, build, deploy to GitHub Pages; `concurrency: pages`).
5. **Push route actually used:** the box had no valid GitHub token, so earlier runs pushed by launching a fresh Cursor cloud agent, giving it a `git archive` tarball of the repo, and asking it to add and push only that edition file. Use a fresh publisher each day (one job was refused when reused). If you have a working token or connector, a normal `git push` is fine.
6. Wait for the deploy, then open `https://s213stud.github.io/malaysia-exec-brief/editions/<date>/` and confirm it shows today's edition and item count. The home page should also show it.
7. Raw JSON is not served (`/data/editions/<date>.json` returned 404 on 20 Oct 2026); only built pages are. Do not use it to check.

---

## 10. Reader message

Send once, after the live page is confirmed:
1. Link to the edition page.
2. Item count.
3. Top takeaway in one or two sentences.
4. Sources not fully checked.
5. If late (after 09:00) or a reduced run, say so plainly and give the reason.
Do not send a duplicate if the reader already got today's link (check before the backup run sends).

---

## 11. Failure handling

1. **Save the draft early:** as soon as a full set of items exists, write the edition file (valid, `status: "published"`) so a later job can publish it. Earlier runs were cut off after drafting but before publishing (16 and 19 Oct).
2. **08:43 backup check:**
   1. If today's edition is live and the reader has the link: do nothing.
   2. If it is live but no message went out: send the message.
   3. If a draft exists and passes `npm test`: publish it and message.
   4. If there is no draft: build a **reduced run** from the core portals only, label it "reduced run" in `generalCoverage`, publish and message before 09:00.
3. If publishing fails, keep the file, report the failure and the reason; the live site stays on the last good edition.

---

## 12. Confidentiality

1. The site and repo are public.
2. Never put the reader's employer name, private documents, private context or credentials on the site, in edition files, in commit messages or in docs.
3. Leave out stories that are only relevant because of private context (for example a company the reader is privately linked to), unless they qualify on public merit alone and contain nothing private.
4. When in doubt, leave it out and mention it only to the reader privately.

---

## Appendix: URL check, 20 Oct 2026 09:17 MYT
Failed or non-200 in the curl test: The Star `/business/property` (404), The Malaysian Reserve home and feed (403), China Press listing (403), Berita Harian home (403; feed 200), Bursa announcements (403; browser works), portal raw JSON (404, expected). The portal home and 20 Oct edition page returned 200.
