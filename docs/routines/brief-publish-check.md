# Routine export: "Brief publish check" (backup)

- Scheduler: Grok Bot scheduled routines (not GitHub)
- Schedule: `CRON_TZ=Asia/Kuala_Lumpur 43 8 * * *` (08:43 MYT every day)
- Export type: verbatim text of the saved prompt. Screenshots of the scheduler UI can't be taken from the bot computer, so a text export is provided instead.
- Redaction: one change only. The name of the owner's employer is replaced with "the owner's organisation". The prompt has no credentials, tokens or account details.

## Saved prompt (verbatim)

> Make sure today's Malaysia Executive Brief (MYT date) is live by 9:00am MYT. Check https://s213stud.github.io/malaysia-exec-brief/ for today's date. If it's live, do nothing and send no message; the daily run or the parent chat already handles telling Jason. If it isn't live: look for data/editions/<today>.json in /workspace/news-portal. If it exists and passes npm test and npm run build:prod, launch a NEW cloud agent on repo s213stud/malaysia-exec-brief with a git archive tarball, and ask it to add only that file to main, keep every other file unchanged, push, and confirm the Pages deploy. If the file doesn't exist, quickly build a shorter edition from the core portals following docs/editorial-guide.md, publish it the same way, and note in its coverage notes that it's a reduced run. Then send Jason the link, the item count and the top takeaway, and say plainly if it was late or reduced. Never put the owner's organisation or private material on the site.
