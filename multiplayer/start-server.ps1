# Risk Multiplayer Server Launcher
# Quick start script for Windows PowerShell

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║     🎲 Risk Multiplayer Server Launcher      ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check if dependencies are installed
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
}

# Get local IP address
Write-Host "🌐 Network Information:" -ForegroundColor Cyan
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*"} | Select-Object -First 1).IPAddress
Write-Host "   Local IP: $localIP" -ForegroundColor White
Write-Host "   Port: 3000" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Starting multiplayer server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Access points:" -ForegroundColor Yellow
Write-Host "   Local:    http://localhost:3000/multiplayer/client/index.html" -ForegroundColor White
Write-Host "   Network:  http://${localIP}:3000/multiplayer/client/index.html" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host ""

# Start the server
node server/server.js
