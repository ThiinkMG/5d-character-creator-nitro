#!/usr/bin/env node

/**
 * Auto Git Sync - Automatically commits and pushes changes to GitHub
 * 
 * This script watches for file changes and automatically:
 * 1. Stages new/modified files
 * 2. Commits with a timestamp
 * 3. Pushes to GitHub
 * 
 * Usage: node scripts/auto-git-sync.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const REPO_ROOT = path.resolve(__dirname, '..');
const IGNORE_PATTERNS = [
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
  'tmp'
];

// Debounce timer to batch multiple changes
let commitTimer = null;
const COMMIT_DELAY = 5000; // Wait 5 seconds after last change before committing

function isIgnored(filePath) {
  const relativePath = path.relative(REPO_ROOT, filePath);
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(relativePath);
    }
    return relativePath.includes(pattern);
  });
}

function getGitStatus() {
  try {
    const status = execSync('git status --porcelain', {
      cwd: REPO_ROOT,
      encoding: 'utf-8'
    }).trim();
    return status.split('\n').filter(line => line.trim());
  } catch (error) {
    console.error('Error checking git status:', error.message);
    return [];
  }
}

function getChangeType(statusLine) {
  const status = statusLine.substring(0, 2).trim();
  if (status.includes('??')) return 'Created';
  if (status.includes('A')) return 'Added';
  if (status.includes('M')) return 'Modified';
  if (status.includes('D')) return 'Deleted';
  if (status.includes('R')) return 'Renamed';
  if (status.includes('C')) return 'Copied';
  return 'Changed';
}

function stageAndCommit() {
  try {
    const changes = getGitStatus();
    
    if (changes.length === 0) {
      console.log('No changes to commit.');
      return;
    }

    // Filter out ignored files and categorize changes
    const validChanges = changes.filter(change => {
      const filePath = change.substring(3).trim(); // Remove status prefix
      const fullPath = path.join(REPO_ROOT, filePath);
      return !isIgnored(fullPath);
    });

    if (validChanges.length === 0) {
      console.log('All changes are in ignored files.');
      return;
    }

    // Categorize changes
    const created = validChanges.filter(c => c.startsWith('??') || c.startsWith('A'));
    const modified = validChanges.filter(c => c.includes('M') && !c.startsWith('??') && !c.startsWith('A'));
    const deleted = validChanges.filter(c => c.includes('D'));
    const renamed = validChanges.filter(c => c.includes('R'));

    console.log(`\n📦 Detected changes:`);
    if (created.length > 0) console.log(`   ✨ ${created.length} file(s) created/added`);
    if (modified.length > 0) console.log(`   ✏️  ${modified.length} file(s) modified`);
    if (deleted.length > 0) console.log(`   🗑️  ${deleted.length} file(s) deleted`);
    if (renamed.length > 0) console.log(`   📝 ${renamed.length} file(s) renamed/moved`);
    console.log(`\n📦 Staging ${validChanges.length} file(s)...`);
    
    // Stage all changes (including deletions)
    execSync('git add -A', {
      cwd: REPO_ROOT,
      stdio: 'inherit'
    });

    // Create detailed commit message
    const timestamp = new Date().toISOString();
    let changeDetails = [];
    if (created.length > 0) {
      changeDetails.push(`Created/Added (${created.length}):`);
      created.forEach(c => changeDetails.push(`  + ${c.substring(3).trim()}`));
    }
    if (modified.length > 0) {
      changeDetails.push(`Modified (${modified.length}):`);
      modified.forEach(c => changeDetails.push(`  ~ ${c.substring(3).trim()}`));
    }
    if (deleted.length > 0) {
      changeDetails.push(`Deleted (${deleted.length}):`);
      deleted.forEach(c => changeDetails.push(`  - ${c.substring(3).trim()}`));
    }
    if (renamed.length > 0) {
      changeDetails.push(`Renamed/Moved (${renamed.length}):`);
      renamed.forEach(c => changeDetails.push(`  → ${c.substring(3).trim()}`));
    }

    const commitMessage = `Auto-commit: ${timestamp}\n\n${changeDetails.join('\n')}`;

    console.log('💾 Committing changes...');
    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      cwd: REPO_ROOT,
      stdio: 'inherit'
    });

    console.log('🚀 Pushing to GitHub...');
    execSync('git push origin main', {
      cwd: REPO_ROOT,
      stdio: 'inherit'
    });

    console.log('✅ Successfully synced with GitHub!\n');
  } catch (error) {
    console.error('❌ Error during git operations:', error.message);
    
    // Check if it's a "nothing to commit" error (which is fine)
    if (error.message.includes('nothing to commit') || error.message.includes('no changes')) {
      console.log('No changes to commit.');
    } else if (error.message.includes('no upstream branch')) {
      console.log('⚠️  No upstream branch set. Run: git push -u origin main');
    } else {
      console.error('Full error:', error);
    }
  }
}

function scheduleCommit() {
  // Clear existing timer
  if (commitTimer) {
    clearTimeout(commitTimer);
  }

  // Schedule new commit
  commitTimer = setTimeout(() => {
    stageAndCommit();
    commitTimer = null;
  }, COMMIT_DELAY);
}

// Watch for file changes using fs.watch (simple, no dependencies)
function startWatcher() {
  console.log('👀 Starting file watcher...');
  console.log(`📁 Watching: ${REPO_ROOT}`);
  console.log('⏱️  Changes will be committed after 5 seconds of inactivity');
  console.log('📋 Monitoring: Create, Edit, Delete, Rename, Move\n');

  // Watch the entire repository
  fs.watch(REPO_ROOT, { recursive: true }, (eventType, filename) => {
    if (!filename) return;
    
    const filePath = path.join(REPO_ROOT, filename);
    
    // Skip ignored files
    if (isIgnored(filePath)) {
      return;
    }

    // Determine change type
    let changeType = 'Changed';
    let icon = '📝';
    
    try {
      const exists = fs.existsSync(filePath);
      
      if (!exists) {
        // File was deleted
        changeType = 'Deleted';
        icon = '🗑️';
        console.log(`${icon} ${changeType}: ${filename}`);
        scheduleCommit();
        return;
      }
      
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        if (eventType === 'rename') {
          // Could be rename or new file
          changeType = 'Created/Renamed';
          icon = '✨';
        } else {
          changeType = 'Modified';
          icon = '✏️';
        }
        console.log(`${icon} ${changeType}: ${filename}`);
        scheduleCommit();
      } else if (stats.isDirectory() && eventType === 'rename') {
        // Directory created
        changeType = 'Directory Created';
        icon = '📁';
        console.log(`${icon} ${changeType}: ${filename}`);
        scheduleCommit();
      }
    } catch (error) {
      // File might not exist yet or was just deleted
      if (error.code === 'ENOENT') {
        changeType = 'Deleted';
        icon = '🗑️';
        console.log(`${icon} ${changeType}: ${filename}`);
      } else {
        console.log(`📝 Detected change: ${filename}`);
      }
      scheduleCommit();
    }
  });

  console.log('✅ File watcher is active. Press Ctrl+C to stop.\n');
}

// Check if we're in a git repository
function checkGitRepo() {
  try {
    execSync('git rev-parse --git-dir', {
      cwd: REPO_ROOT,
      stdio: 'ignore'
    });
    return true;
  } catch {
    console.error('❌ Not a git repository. Please initialize git first.');
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  if (!checkGitRepo()) {
    process.exit(1);
  }

  startWatcher();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping file watcher...');
    if (commitTimer) {
      console.log('⏳ Committing pending changes...');
      clearTimeout(commitTimer);
      stageAndCommit();
    }
    process.exit(0);
  });
}

module.exports = { startWatcher, stageAndCommit };
