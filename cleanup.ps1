# Pre-Deployment Cleanup Script (PowerShell)
# Removes temporary files and test artifacts

Write-Host "🧹 Starting cleanup..." -ForegroundColor Cyan

# Remove profile files
Write-Host "Removing profile files..." -ForegroundColor Yellow
Remove-Item -Path "*.cpuprofile" -ErrorAction SilentlyContinue
Remove-Item -Path "*.heapprofile" -ErrorAction SilentlyContinue
Write-Host "✓ Profile files removed" -ForegroundColor Green

# Remove test artifacts
Write-Host "Removing test artifacts..." -ForegroundColor Yellow
Set-Location webapp
Remove-Item -Path "playwright-report" -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path "test-results" -Recurse -ErrorAction SilentlyContinue
Remove-Item -Path "coverage" -Recurse -ErrorAction SilentlyContinue
Set-Location ..
Write-Host "✓ Test artifacts removed" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: cd webapp; npm run test:all"
Write-Host "2. Run: npm run build"
Write-Host "3. Commit and push"
