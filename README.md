# Malaysia Executive News Portal

Static, mobile-first daily executive news brief for Malaysia. Plain HTML/CSS/JS rendered by a small Node script from JSON edition data. No dependencies (Node 20+).

## Layout
- `config/sectors.json`: ten sectors (key, label, scope)
- `config/watchlist.json`: twelve companies (key, name, ticker as **string**, aliases)
- `config/sources.json`: media portals and primary sources
- `data/editions/YYYY-MM-DD.json`: one file per edition
- `scripts/validate.js`, `scripts/build.js`: validate and render to `dist/`
- `src/`: CSS and the filter script
- `tests/`: validator tests (`npm test`)

## Commands
    npm test            # validator tests
    npm run validate    # validate all data
    npm run build       # render dist/ (latest, archive, editions/<date>/, 404)
    npm run build:prod  # same, but refuses demo editions

## Edition schema
`date`, `status` (`published`|`draft`; only published are rendered), `demo` (bool), `checkedAt` (ISO times with offset), `publishedAt`, `sectors[]` of `{sectorKey, items[]}`; each item: `headline`, optional `detail` and `note`, `freshness` (`current`|`recent`|`earlier-context`), `publishedDate`, `sources[]` `{publisher,url}`, `watchlistCompanyKeys[]`, required `verdict` (`Positive`|`Mixed`|`Negative`|`Watch`), optional `soWhat`, `opportunity`, `watchOut`. Each item also has a unique `id`; each sector may carry a short `theme`. `keyTakeaways[]` (3-5 when the edition has 3 or more items): `{headline, soWhat, sectorKeys[], itemIds[]}`; every itemId must exist in the edition. Plus `sectorCoverage{key:note}`, `watchlistCoverage[]`, `generalCoverage[]`.

## Status
Production: demo editions removed; CI runs `build:prod`, which refuses demo data. A demo edition is kept as a test fixture in `tests/fixtures/`.

See `docs/editorial-guide.md`, `docs/deployment.md` and `docs/restore.md`.

## Screenshots
`scripts/shots.sh` (needs google-chrome) rebuilds `screenshots/`. Font: Poppins (Google Fonts, 400/500/600/700), falling back to system sans.

## Theme
This `corporate` branch is an alternative research-note theme of the same site and data. Compare with `main`.
