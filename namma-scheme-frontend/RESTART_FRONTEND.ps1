# Restart Frontend Server - PowerShell Script
# Run: powershell -ExecutionPolicy Bypass -File RESTART_FRONTEND.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NAMMA SCHEME - RESTART FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill existing Node processes
Write-Host "Killing existing Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Frontend Server
Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Write-Host ""

Set-Location "$PSScriptRoot\namma-scheme-frontend"
npm run dev
