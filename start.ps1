# ScanAPI - One-command startup for Windows
# Run from: d:\cl API\webapi-scanner\

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   ScanAPI - API Security Scanner MVP" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Find Python
$pythonCandidates = @(
    "C:\Users\$env:USERNAME\AppData\Local\Python\pythoncore-3.14-64\python.exe",
    "C:\Python312\python.exe",
    "C:\Python311\python.exe",
    "C:\Python310\python.exe"
)
$pythonExe = $null
foreach ($p in $pythonCandidates) {
    if (Test-Path $p) { $pythonExe = $p; break }
}
if (-not $pythonExe) {
    # Try from PATH
    $found = Get-Command python3 -ErrorAction SilentlyContinue
    if ($found) { $pythonExe = $found.Source }
}
if (-not $pythonExe) {
    Write-Host "ERROR: Python not found. Please install Python 3.10+." -ForegroundColor Red
    exit 1
}
Write-Host "Using Python: $pythonExe" -ForegroundColor Gray

# ---- Backend ----
Write-Host "[1/2] Starting Backend..." -ForegroundColor Yellow
$backendPath = Join-Path $root "backend"

$backendScript = "cd '$backendPath'; Write-Host 'Installing Python deps...' -ForegroundColor Gray; & '$pythonExe' -m pip install -r requirements.txt --quiet; Write-Host 'Backend ready at http://localhost:8000' -ForegroundColor Green; & '$pythonExe' -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendScript
Start-Sleep -Seconds 6

# ---- Frontend ----
Write-Host "[2/2] Starting Frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $root "frontend"

$frontendScript = "cd '$frontendPath'; Write-Host 'Installing npm deps...' -ForegroundColor Gray; npm install --silent; Write-Host 'Frontend ready at http://localhost:5173' -ForegroundColor Green; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendScript
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Services starting in separate windows." -ForegroundColor Green
Write-Host ""
Write-Host "  App:      http://localhost:5173" -ForegroundColor Cyan
Write-Host "  API:      http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Demo:  demo@scanapi.io / demo1234" -ForegroundColor Magenta
Write-Host ""
Start-Process "http://localhost:5173"
