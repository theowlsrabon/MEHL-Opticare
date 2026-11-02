@echo off
cd /d D:\MEHL
echo Starting Express Server...
npx tsx server.ts > server.log 2>&1
echo Server started on port 3000

echo Starting Vite Frontend...
npx vite --port 5173 > vite.log 2>&1
echo Vite started on port 5173

pause