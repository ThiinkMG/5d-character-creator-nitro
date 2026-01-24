# Auto Git Sync - PowerShell version for Windows
# Automatically commits and pushes changes to GitHub

$REPO_ROOT = Split-Path -Parent $PSScriptRoot
$COMMIT_DELAY = 5  # seconds
$commitTimer = $null

# Files/folders to ignore
$IGNORE_PATTERNS = @(
    'node_modules',
    '.git',
    '.next',
    'out',
    'build',
    '.vercel',
    '.DS_Store',
    '*.log',
    '.env',
    '.env.local',
    '*.tsbuildinfo',
    'next-env.d.ts',
    '.cache',
    '.temp',
    'tmp',
    'app-gh-pages'
)

function Test-Ignored {
    param([string]$FilePath)
    
    $relativePath = $FilePath.Replace($REPO_ROOT + '\', '')
    
    foreach ($pattern in $IGNORE_PATTERNS) {
        if ($pattern -like '*.*') {
            $regex = $pattern -replace '\*', '.*'
            if ($relativePath -match $regex) {
                return $true
            }
        } elseif ($relativePath -like "*$pattern*") {
            return $true
        }
    }
    
    return $false
}

function Get-GitStatus {
    try {
        Push-Location $REPO_ROOT
        $status = git status --porcelain 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $status | Where-Object { $_.Trim() -ne '' }
        }
        return @()
    } catch {
        Write-Host "Error checking git status: $_" -ForegroundColor Red
        return @()
    } finally {
        Pop-Location
    }
}

function Stage-AndCommit {
    try {
        Push-Location $REPO_ROOT
        
        $changes = Get-GitStatus
        
        if ($changes.Count -eq 0) {
            Write-Host "No changes to commit." -ForegroundColor Yellow
            return
        }
        
        # Filter out ignored files and categorize changes
        $validChanges = $changes | Where-Object {
            $filePath = ($_ -split '\s+', 2)[1]
            $fullPath = Join-Path $REPO_ROOT $filePath
            -not (Test-Ignored $fullPath)
        }
        
        if ($validChanges.Count -eq 0) {
            Write-Host "All changes are in ignored files." -ForegroundColor Yellow
            return
        }
        
        # Categorize changes
        $created = $validChanges | Where-Object { $_ -match '^\?\?' -or $_ -match '^A ' }
        $modified = $validChanges | Where-Object { $_ -match '^ M' -or $_ -match '^M ' -and $_ -notmatch '^\?\?' -and $_ -notmatch '^A ' }
        $deleted = $validChanges | Where-Object { $_ -match '^D ' -or $_ -match '^ D' }
        $renamed = $validChanges | Where-Object { $_ -match '^R ' -or $_ -match '^ R' }
        
        Write-Host "`n📦 Detected changes:" -ForegroundColor Cyan
        if ($created.Count -gt 0) { Write-Host "   ✨ $($created.Count) file(s) created/added" -ForegroundColor Green }
        if ($modified.Count -gt 0) { Write-Host "   ✏️  $($modified.Count) file(s) modified" -ForegroundColor Yellow }
        if ($deleted.Count -gt 0) { Write-Host "   🗑️  $($deleted.Count) file(s) deleted" -ForegroundColor Red }
        if ($renamed.Count -gt 0) { Write-Host "   📝 $($renamed.Count) file(s) renamed/moved" -ForegroundColor Magenta }
        Write-Host "`n📦 Staging $($validChanges.Count) file(s)..." -ForegroundColor Cyan
        
        # Stage all changes (including deletions)
        git add -A
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to stage files"
        }
        
        # Create detailed commit message
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $changeDetails = @()
        
        if ($created.Count -gt 0) {
            $changeDetails += "Created/Added ($($created.Count)):"
            $created | ForEach-Object {
                $filePath = ($_ -split '\s+', 2)[1]
                $changeDetails += "  + $filePath"
            }
        }
        
        if ($modified.Count -gt 0) {
            $changeDetails += "Modified ($($modified.Count)):"
            $modified | ForEach-Object {
                $filePath = ($_ -split '\s+', 2)[1]
                $changeDetails += "  ~ $filePath"
            }
        }
        
        if ($deleted.Count -gt 0) {
            $changeDetails += "Deleted ($($deleted.Count)):"
            $deleted | ForEach-Object {
                $filePath = ($_ -split '\s+', 2)[1]
                $changeDetails += "  - $filePath"
            }
        }
        
        if ($renamed.Count -gt 0) {
            $changeDetails += "Renamed/Moved ($($renamed.Count)):"
            $renamed | ForEach-Object {
                $filePath = ($_ -split '\s+', 2)[1]
                $changeDetails += "  → $filePath"
            }
        }
        
        $commitMessage = "Auto-commit: $timestamp`n`n$($changeDetails -join "`n")"
        
        Write-Host "💾 Committing changes..." -ForegroundColor Cyan
        git commit -m $commitMessage
        if ($LASTEXITCODE -ne 0) {
            if ($LASTEXITCODE -eq 1) {
                Write-Host "No changes to commit." -ForegroundColor Yellow
                return
            }
            throw "Failed to commit"
        }
        
        Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
        git push origin main
        if ($LASTEXITCODE -ne 0) {
            if ($LASTEXITCODE -eq 128) {
                Write-Host "⚠️  No upstream branch set. Run: git push -u origin main" -ForegroundColor Yellow
                return
            }
            throw "Failed to push"
        }
        
        Write-Host "✅ Successfully synced with GitHub!`n" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error: $_" -ForegroundColor Red
    } finally {
        Pop-Location
    }
}

function Start-FileWatcher {
    Write-Host "👀 Starting file watcher..." -ForegroundColor Cyan
    Write-Host "📁 Watching: $REPO_ROOT" -ForegroundColor Cyan
    Write-Host "⏱️  Changes will be committed after $COMMIT_DELAY seconds of inactivity" -ForegroundColor Cyan
    Write-Host "📋 Monitoring: Create, Edit, Delete, Rename, Move`n" -ForegroundColor Cyan
    
    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $REPO_ROOT
    $watcher.IncludeSubdirectories = $true
    $watcher.EnableRaisingEvents = $true
    
    $action = {
        $filePath = $Event.SourceEventArgs.FullPath
        $fileName = $Event.SourceEventArgs.Name
        $changeType = $Event.SourceEventArgs.ChangeType
        
        # Skip ignored files
        if (Test-Ignored $filePath) {
            return
        }
        
        # Determine icon and message based on change type
        $icon = "📝"
        $message = $changeType
        
        switch ($changeType) {
            "Created" { $icon = "✨"; $message = "Created" }
            "Changed" { $icon = "✏️"; $message = "Modified" }
            "Deleted" { $icon = "🗑️"; $message = "Deleted" }
            "Renamed" { 
                $icon = "📝"
                $oldName = $Event.SourceEventArgs.OldName
                $newName = $Event.SourceEventArgs.Name
                $message = "Renamed: $oldName → $newName"
            }
        }
        
        # Handle both files and directories
        if (Test-Path $filePath -PathType Leaf) {
            Write-Host "$icon $message`: $fileName" -ForegroundColor Gray
        } elseif ($changeType -eq "Created" -and (Test-Path $filePath -PathType Container)) {
            Write-Host "📁 Directory Created: $fileName" -ForegroundColor Gray
        } elseif ($changeType -eq "Deleted") {
            Write-Host "$icon $message`: $fileName" -ForegroundColor Gray
        }
        
        # Cancel existing timer
        if ($script:commitTimer) {
            $script:commitTimer.Dispose()
        }
        
        # Schedule new commit
        $script:commitTimer = [System.Timers.Timer]::new($COMMIT_DELAY * 1000)
        $script:commitTimer.AutoReset = $false
        $script:commitTimer.Add_Elapsed({
            Stage-AndCommit
        })
        $script:commitTimer.Start()
    }
    
    # Register all file system events
    Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action | Out-Null
    
    Write-Host "✅ File watcher is active. Press Ctrl+C to stop.`n" -ForegroundColor Green
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } finally {
        $watcher.Dispose()
        if ($script:commitTimer) {
            $script:commitTimer.Dispose()
        }
        Write-Host "`n🛑 File watcher stopped." -ForegroundColor Yellow
    }
}

# Check if we're in a git repository
try {
    Push-Location $REPO_ROOT
    git rev-parse --git-dir | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Not a git repository. Please initialize git first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Not a git repository. Please initialize git first." -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

# Start the watcher
Start-FileWatcher
