#!/bin/sh
# macOS/Linux launcher: double-click (macOS) or run ./start.command
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then
  exec node server.js
elif command -v python3 >/dev/null 2>&1; then
  echo "Globe AI Studio mockup running at http://localhost:4173 (Ctrl+C to stop)"
  (sleep 1; open "http://localhost:4173" 2>/dev/null || xdg-open "http://localhost:4173") &
  exec python3 -m http.server 4173 --bind 127.0.0.1
else
  open index.html 2>/dev/null || xdg-open index.html
fi
