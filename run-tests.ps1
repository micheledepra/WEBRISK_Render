# 🧪 Run Pre-Firebase Tests
# This script runs the complete test suite before Firebase integration

Write-Host "🧪 Running Pre-Firebase Test Suite" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    Write-Host "   Download from: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Push-Location multiplayer
npm install --silent
$installResult = $LASTEXITCODE
Pop-Location

if ($installResult -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
Write-Host ""
node tests/pre-firebase-tests.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "" -ForegroundColor Red
    Write-Host "❌ Tests failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ All tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 System ready for Firebase integration!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review test results above" -ForegroundColor White
Write-Host "  2. Start server: cd multiplayer; npm start" -ForegroundColor White
Write-Host "  3. Test at: http://localhost:3000/api/health" -ForegroundColor White
Write-Host "  4. When ready, proceed with Firebase setup" -ForegroundColor White
Write-Host ""
