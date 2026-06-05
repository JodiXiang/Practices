@echo off
cd /d "%~dp0"
echo Starting Lullaby for Daiyu...
echo If the browser does not open automatically, visit:
echo http://127.0.0.1:4173/
start http://127.0.0.1:4173/
npm start
pause
