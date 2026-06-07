# GozoBee Platform - Unified Launcher
# Run from: d:\cl API\webapi-scanner\

$root = "d:\cl API\webapi-scanner"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  GozoBee Platform - Starting All Services" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Kill anything on our ports
foreach ($port in @(8000, 8001, 5173, 5174)) {
    $lines = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
    foreach ($line in $lines) {
        $parts = ($line -replace '\s+', ' ').Trim() -split ' '
        $pid_ = $parts[-1]
        if ($pid_ -match '^\d+$' -and [int]$pid_ -gt 0) {
            Stop-Process -Id ([int]$pid_) -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Seconds 1
Write-Host "  Ports cleared." -ForegroundColor DarkGray

# -------------------------------------------------------
# MAIN APP - WebAPI Scanner (ports 8000 / 5173)
# -------------------------------------------------------
Write-Host ""
Write-Host "  [1/4] Main App Backend  -> port 8000" -ForegroundColor Yellow

$mainBackend    = "$root\backend"
$mainBackendLog = "$root\backend.log"
Start-Process powershell -ArgumentList "-NoProfile -WindowStyle Hidden -Command `"cd '$mainBackend'; py -m uvicorn src.main:app --host 0.0.0.0 --port 8000 *> '$mainBackendLog'`"" -WindowStyle Hidden

Write-Host "  [2/4] Main App Frontend -> port 5173" -ForegroundColor Yellow
$mainFrontend    = "$root\frontend"
$mainFrontendLog = "$root\frontend.log"
Start-Process cmd -ArgumentList "/c cd /d `"$mainFrontend`" && npm run dev > `"$mainFrontendLog`" 2>&1" -WindowStyle Hidden

# -------------------------------------------------------
# HEADER SCANNER v1 (ports 8001 / 5174)
# -------------------------------------------------------
Write-Host "  [3/4] Header Scanner v1 Backend  -> port 8001" -ForegroundColor Yellow

$hsBackend    = "$root\header-scanner\backend"
$hsVenv       = "$hsBackend\venv"
$hsBackendLog = "$root\header-scanner\backend.log"

if (-not (Test-Path $hsVenv)) {
    Write-Host "  Creating venv for header-scanner..." -ForegroundColor DarkGray
    py -m venv $hsVenv
    & "$hsVenv\Scripts\pip.exe" install -r "$hsBackend\requirements.txt" --quiet
}

Start-Process powershell -ArgumentList "-NoProfile -WindowStyle Hidden -Command `"cd '$hsBackend'; & '$hsVenv\Scripts\uvicorn.exe' src.main:app --host 0.0.0.0 --port 8001 *> '$hsBackendLog'`"" -WindowStyle Hidden

Write-Host "  [4/4] Header Scanner v1 Frontend -> port 5174" -ForegroundColor Yellow
$hsFrontend    = "$root\header-scanner\frontend"
$hsFrontendLog = "$root\header-scanner\frontend.log"

if (-not (Test-Path "$hsFrontend\node_modules")) {
    Write-Host "  Installing npm deps for header-scanner..." -ForegroundColor DarkGray
    Push-Location $hsFrontend; npm install --silent; Pop-Location
}

Start-Process cmd -ArgumentList "/c cd /d `"$hsFrontend`" && npm run dev > `"$hsFrontendLog`" 2>&1" -WindowStyle Hidden

# -------------------------------------------------------
# Wait for services
# -------------------------------------------------------
Write-Host ""
Write-Host "  Waiting for services..." -ForegroundColor DarkGray
Start-Sleep -Seconds 12

# Check ports
$up = @{}
foreach ($item in @("8000","8001","5173","5174")) {
    $listening = netstat -ano | Select-String ":$item\s" | Select-String "LISTENING"
    $up[$item] = ($null -ne $listening)
}

# -------------------------------------------------------
# Summary
# -------------------------------------------------------
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  All Services Status" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  MAIN APP (WebAPI Scanner)" -ForegroundColor Cyan
Write-Host "    Frontend : http://localhost:5173  $(if($up['5173']){'[UP]'}else{'[STARTING...]'})" -ForegroundColor White
Write-Host "    API      : http://localhost:8000  $(if($up['8000']){'[UP]'}else{'[STARTING...]'})" -ForegroundColor White
Write-Host "    API Docs : http://localhost:8000/docs" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  HEADER SCANNER v1 (GozoBee)" -ForegroundColor Cyan
Write-Host "    Frontend : http://localhost:5174  $(if($up['5174']){'[UP]'}else{'[STARTING...]'})" -ForegroundColor White
Write-Host "    API      : http://localhost:8001  $(if($up['8001']){'[UP]'}else{'[STARTING...]'})" -ForegroundColor White
Write-Host "    API Docs : http://localhost:8001/docs" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Demo logins:" -ForegroundColor Magenta
Write-Host "    Main App (Pro)  : demo@scanapi.io / demo1234" -ForegroundColor White
Write-Host "    Header v1 (Free): demo@scanner.dev / Demo-Password-2025" -ForegroundColor White
Write-Host ""

# Open browsers
Start-Process "http://localhost:5173"
Start-Sleep -Milliseconds 800
Start-Process "http://localhost:5174"

Write-Host "  Browsers opened!" -ForegroundColor Green
Write-Host ""
