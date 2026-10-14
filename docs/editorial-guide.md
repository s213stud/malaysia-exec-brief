# Editorial guide and daily procedure (09:00 MYT, every day incl. weekends)

1. **Research (from ~07:30 MYT).** Check each source in `config/sources.json` plus relevant primary sources (Bursa filings, BNM, ministries). Open every article; confirm the body and the actual publication date.
2. **Classify.** `current` = published since the previous edition; `recent` = the last few days, still developing; `earlier-context` = older background. Never relabel old news as current.
3. **Write.** Event, selective material detail, business driver, watch-out. Label analyst estimates, forecasts, deal status (proposed/pending/completed) and conditional effects. Keep editorial interpretation in `note`.
4. **Watchlist.** Add a company key only when the article body names the company and you have confirmed it is the same entity (not a namesake).
5. **Coverage notes.** For each sector record which sources were checked, blocked, partial or unsearched. Never treat an unreadable source as "no news". Never claim the coverage is exhaustive. Do not fabricate items to fill an empty sector.
6. **Key takeaways (after all items are verified).** Write 3-5 takeaways in `keyTakeaways`, each with `headline`, `soWhat` (1-2 sentences on why it matters to executives), `sectorKeys`, and `itemIds` pointing to the verified items it rests on. Use only items in this edition. Do not add facts that are not in those items. Label forecasts and conditional effects. The page marks this block "Editorial interpretation". If fewer than 3 items are verified, leave the takeaways out instead of padding. Optionally set a short `theme` per sector for the Sector pulse strip, again based only on that sector's items.
7. **Record real check times** in `checkedAt` (ISO with `+08:00`).
8. **Save** as `data/editions/YYYY-MM-DD.json` with `status: "draft"`, run `npm run validate` and `npm run build`, preview `dist/`.
9. **Publish.** Set `status: "published"` and `publishedAt`, commit and push to `main`. CI tests, builds and deploys; a failed check leaves the live site on the last good version.
10. **Never edit past editions** except for logged corrections. Never put private documents, personal context or credentials in the repo.
