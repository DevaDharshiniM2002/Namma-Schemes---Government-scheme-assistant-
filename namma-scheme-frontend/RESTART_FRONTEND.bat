@echo off
echo.
echo ========================================
echo NAMMA SCHEME - RESTART FRONTEND
echo ========================================
echo.

echo Killing existing Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak

echo.
echo Starting Frontend Server...
echo.
cd namma-scheme-frontend
npm run dev

pause
