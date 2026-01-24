# Auto Git Sync Scripts

These scripts automatically commit and push changes to GitHub when files are added or modified.

## Available Scripts

### 1. Node.js Version (Cross-platform)
```bash
node scripts/auto-git-sync.js
```

### 2. PowerShell Version (Windows)
```powershell
.\scripts\auto-git-sync.ps1
```

## How It Works

1. **Watches for file changes** in your repository
2. **Waits 5 seconds** after the last change (to batch multiple edits)
3. **Stages all changes** automatically
4. **Commits** with a timestamp and list of changed files
5. **Pushes to GitHub** automatically

## Features

- ✅ Ignores files in `.gitignore` and common build/dependency folders
- ✅ Batches multiple changes together (5-second delay)
- ✅ Safe to run in background
- ✅ Handles errors gracefully

## Usage

### Option 1: Run the watcher script
Start the file watcher in a separate terminal:

**Windows (PowerShell):**
```powershell
.\scripts\auto-git-sync.ps1
```

**Cross-platform (Node.js):**
```bash
node scripts/auto-git-sync.js
```

### Option 2: Use Git Hook (Manual Commits Only)
The `.git/hooks/post-commit` hook automatically pushes after each manual commit.

To enable it (if not already):
```bash
chmod +x .git/hooks/post-commit  # Linux/Mac
# On Windows, it should work automatically
```

## Notes

- The watcher respects your `.gitignore` file
- Changes are committed after 5 seconds of inactivity
- Press `Ctrl+C` to stop the watcher
- If push fails (e.g., no upstream), you'll see a warning message

## Troubleshooting

**"No upstream branch" error:**
```bash
git push -u origin main
```

**Script not working:**
- Make sure you're in the repository root
- Check that git is initialized: `git status`
- Verify you have push permissions to the remote
