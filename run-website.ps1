$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$frontendDirectory = Join-Path $projectRoot 'frontend'
$backendDirectory = Join-Path $projectRoot 'backend'
$pythonExecutable = Join-Path $projectRoot '.venv\Scripts\python.exe'
$websiteUrl = 'http://127.0.0.1:5173/'
$healthUrl = 'http://127.0.0.1:8000/api/health'

if (-not (Test-Path -LiteralPath $pythonExecutable)) {
    throw 'Python environment not found. Run: python -m venv .venv, then install backend\requirements.txt.'
}

if (-not (Test-Path -LiteralPath (Join-Path $frontendDirectory 'node_modules'))) {
    throw 'Frontend packages not found. Run npm install inside the frontend folder first.'
}

Write-Host 'Building the visible website...'
Push-Location $frontendDirectory
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'The frontend build failed.' }
}
finally {
    Pop-Location
}

$backendReady = $false
try {
    $backendReady = (Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2).status -eq 'healthy'
}
catch { }

if (-not $backendReady) {
    Start-Process -FilePath $pythonExecutable -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000') -WorkingDirectory $backendDirectory -WindowStyle Hidden
}

$frontendReady = $false
try {
    $frontendReady = (Invoke-WebRequest -Uri $websiteUrl -TimeoutSec 2).StatusCode -eq 200
}
catch { }

if (-not $frontendReady) {
    Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'preview', '--', '--host', '127.0.0.1', '--port', '5173') -WorkingDirectory $frontendDirectory -WindowStyle Hidden
}

for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
    try {
        $frontendReady = (Invoke-WebRequest -Uri $websiteUrl -TimeoutSec 2).StatusCode -eq 200
        $backendReady = (Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2).status -eq 'healthy'
        if ($frontendReady -and $backendReady) { break }
    }
    catch { }
    Start-Sleep -Milliseconds 500
}

if (-not ($frontendReady -and $backendReady)) {
    throw 'The website did not become ready. Check whether ports 5173 or 8000 are already being used.'
}

Write-Host "Website ready: $websiteUrl"
Start-Process $websiteUrl
