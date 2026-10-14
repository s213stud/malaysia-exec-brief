# Deployment (GitHub Pages + Actions)

1. Create a GitHub repo, push this folder to `main`.
2. Settings → Pages → Source: **GitHub Actions**.
3. `.github/workflows/deploy.yml` runs on push, manual dispatch, and daily at 01:00 UTC (09:00 MYT). It runs tests, builds `dist/`, and deploys. `concurrency: pages` stops overlapping deploys overwriting each other.
4. The scheduled run only rebuilds what is committed. The daily edition must be committed before 09:00 MYT by the editor or a research job; the cron does not research news by itself. GitHub may delay scheduled runs by some minutes.
5. Before production: replace placeholder config, delete demo editions, change `npm run build` to `npm run build:prod` in the workflow.
6. Custom domain (optional): add `CNAME` handling in Pages settings.
7. Verify in a signed-out browser: `/`, `/archive/`, `/editions/<date>/`, an unknown route (404 page).
