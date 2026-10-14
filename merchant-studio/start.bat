@echo off
REM Starts the Globe AI Studio mockup on http://localhost:4173
REM Uses Node if installed, then Python, otherwise opens index.html directly.
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel%==0 (
  node server.js
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  echo Globe AI Studio mockup running at http://localhost:4173  ^(Ctrl+C to stop^)
  start "" "http://localhost:4173"
  python -m http.server 4173 --bind 127.0.0.1
  goto :eof
)

echo Node and Python not found - opening index.html directly in your browser.
start "" "%~dp0index.html"
