#!/bin/sh
# usage: scripts/shots.sh  (needs google-chrome; serves dist on :8767)
cd "$(dirname "$0")/.." && (cd dist && python3 -m http.server 8767 >/dev/null 2>&1 & echo $! > /tmp/shots.pid); sleep 1
C="google-chrome --headless=new --no-sandbox --hide-scrollbars --virtual-time-budget=4000"
rm -f screenshots/*.png
for w in 320 390; do $C --window-size=$w,3400 --screenshot=screenshots/latest-$w.png http://localhost:8767/ 2>/dev/null; done
$C --window-size=1280,2600 --screenshot=screenshots/latest-1280.png http://localhost:8767/ 2>/dev/null
$C --window-size=390,1900 --screenshot=screenshots/filtered-construction-390.png "http://localhost:8767/?sector=construction" 2>/dev/null
$C --window-size=390,1600 --force-dark-mode --enable-features=WebContentsForceDark:false --screenshot=screenshots/dark-390.png http://localhost:8767/ 2>/dev/null
$C --window-size=390,900 --screenshot=screenshots/archive-390.png http://localhost:8767/archive/ 2>/dev/null
kill $(cat /tmp/shots.pid)
