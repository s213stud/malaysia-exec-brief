# Backup, rollback and restore

**Backup.** The git repo is the backup: code, config, editions, docs, workflow. Keep a second remote or a periodic `git bundle create backup-$(date +%F).bundle --all`. `dist/build-info.json` records which editions were built and when; the Actions run history records which deploy succeeded.

**Rollback.** `git revert <bad-commit>` and push (or re-run the last good workflow run from the Actions tab). The previous deployment stays live until a new build passes tests.

**Restore.**
1. `git clone <backup-remote-or-bundle>` (or `git clone backup.bundle news-portal`).
2. `npm test && npm run build`; check `dist/archive/index.html` lists every edition.
3. Push to a GitHub repo, enable Pages via Actions (see deployment.md); this restores the schedule too.
4. Verify signed-out: latest, archive, several dated pages, source links, 404.
