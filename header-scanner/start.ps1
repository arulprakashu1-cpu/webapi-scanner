# Security Header Scanner - Start Script (Windows PowerShell)
Write-Host "=== Security Header Scanner ===" -ForegroundColor Cyan
Write-Host "Starting backend (port 8001) and frontend (port 5174)..." -ForegroundColor Green

# Backend setup
$backendDir = Join-Path $PSScriptRoot "backend"
$venvPath = Join-Path $backendDir "venv"

if (-not (Test-Path $venvPath)) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv $venvPath
}

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
& "$venvPath\Scripts\pip.exe" install -r "$backendDir\requirements.txt" --quiet

# Frontend setup
$frontendDir = Join-Path $PSScriptRoot "frontend"
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location $frontendDir
    npm install
    Pop-Location
}

# Start backend in background
Write-Host "Starting backend..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    param($dir, $venv)
    Set-Location $dir
    & "$venv\Scripts\uvicorn.exe" src.main:app --host 0.0.0.0 --port 8001 --reload
} -ArgumentList $backendDir, $venvPath

# Start frontend in background
Write-Host "Starting frontend..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $frontendDir

Write-Host ""
Write-Host "=== Services starting ===" -ForegroundColor Cyan
Write-Host "Backend API:  http://localhost:8001" -ForegroundColor White
Write-Host "Frontend:     http://localhost:5174" -ForegroundColor White
Write-Host "API Docs:     http://localhost:8001/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor Gray

try {
    while ($true) {
        Start-Sleep -Seconds 5
        $backendOutput = Receive-Job $backendJob
        $frontendOutput = Receive-Job $frontendJob
        if ($backendOutput) { Write-Host "[Backend] $backendOutput" }
        if ($frontendOutput) { Write-Host "[Frontend] $frontendOutput" }
    }
} finally {
    Stop-Job $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "All services stopped." -ForegroundColor Red
}
