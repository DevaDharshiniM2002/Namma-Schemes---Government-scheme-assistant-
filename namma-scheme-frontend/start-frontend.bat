@echo off
cd /d "e:\namma scheme updated\namma-scheme-frontend"
echo Starting Namma Scheme Frontend...
echo.
echo Installing dependencies if needed...
call npm install
echo.
echo Starting development server...
call npm run dev
pause
