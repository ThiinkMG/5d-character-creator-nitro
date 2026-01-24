# Kill Next.js Dev Server Script
# Use this if you get lock file errors

Write-Host "Checking for processes using port 3000..." -ForegroundColor Cyan

# Find processes using port 3000
$port3000 = netstat -ano | findstr :3000
if ($port3000) {
    Write-Host "Found processes using port 3000:" -ForegroundColor Yellow
    $port3000 | ForEach-Object {
        $pid = ($_ -split '\s+')[-1]
        if ($pid -match '^\d+$') {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "  PID $pid : $($proc.ProcessName)" -ForegroundColor Gray
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  ✓ Killed process $pid" -ForegroundColor Green
            }
        }
    }
} else {
    Write-Host "No processes found using port 3000" -ForegroundColor Green
}

# Clean up lock files
$lockPath = "5d-character-creator-app\app\.next\dev\lock"
if (Test-Path $lockPath) {
    Remove-Item $lockPath -Force
    Write-Host "✓ Removed lock file" -ForegroundColor Green
} else {
    Write-Host "No lock file found" -ForegroundColor Gray
}

Write-Host "`nReady to start netlify dev!" -ForegroundColor Green
Write-Host "Run: cd 5d-character-creator-app\app && netlify dev" -ForegroundColor Cyan
