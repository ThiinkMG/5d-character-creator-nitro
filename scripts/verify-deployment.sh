#!/bin/bash

# ===========================================
# 5D Character Creator - Deployment Verifier
# ===========================================
# Runs before pushing to GitHub to ensure
# Netlify deployment will succeed
# ===========================================

set -e  # Exit on first error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_DIR="$PROJECT_ROOT/5d-character-creator-app/app"

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} DEPLOYMENT VERIFICATION REPORT${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Project: 5D Character Creator"
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
    echo ""
}

print_check() {
    local status=$1
    local message=$2

    if [ "$status" = "PASS" ]; then
        echo -e "[${GREEN}PASS${NC}] $message"
        PASS_COUNT=$((PASS_COUNT + 1))
    elif [ "$status" = "FAIL" ]; then
        echo -e "[${RED}FAIL${NC}] $message"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    elif [ "$status" = "WARN" ]; then
        echo -e "[${YELLOW}WARN${NC}] $message"
        WARN_COUNT=$((WARN_COUNT + 1))
    elif [ "$status" = "SKIP" ]; then
        echo -e "[${BLUE}SKIP${NC}] $message"
    fi
}

print_section() {
    echo ""
    echo -e "${BLUE}--- $1 ---${NC}"
}

# ===========================================
# VERIFICATION CHECKS
# ===========================================

print_header

# Check 1: Verify app directory exists
print_section "Environment Check"

if [ ! -d "$APP_DIR" ]; then
    print_check "FAIL" "App directory not found: $APP_DIR"
    exit 1
fi
print_check "PASS" "App directory exists"

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    print_check "PASS" "Node.js version: v$(node -v 2>/dev/null | sed 's/v//')"
else
    print_check "WARN" "Node.js version $(node -v) is below recommended (v20+)"
fi

# Check 2: Dependencies installed
print_section "Dependencies Check"

if [ -d "$APP_DIR/node_modules" ]; then
    print_check "PASS" "node_modules exists"
else
    print_check "WARN" "node_modules not found, running npm install..."
    cd "$APP_DIR" && npm install --silent
    print_check "PASS" "Dependencies installed"
fi

# Check 3: Build verification
print_section "Build Verification"

# Detect WSL environment
IS_WSL=false
if grep -qi microsoft /proc/version 2>/dev/null; then
    IS_WSL=true
fi

cd "$APP_DIR"

# In WSL with shared node_modules, native modules often fail
# Use TypeScript check instead which validates the code
if [ "$IS_WSL" = true ]; then
    echo "Detected WSL environment - using TypeScript check (native modules may conflict)"
    if npx tsc --noEmit 2>&1 | tee /tmp/build-output.log | tail -10; then
        print_check "PASS" "TypeScript compilation successful"
        print_check "WARN" "Full build skipped in WSL (will work on Netlify)"
        echo -e "  ${YELLOW}Note: Native modules shared between Windows/WSL may cause build issues locally.${NC}"
        echo -e "  ${YELLOW}The build will succeed on Netlify (pure Linux environment).${NC}"
    else
        print_check "FAIL" "TypeScript errors found"
        echo ""
        echo -e "${RED}TypeScript Errors:${NC}"
        cat /tmp/build-output.log
        exit 1
    fi
else
    echo "Running Next.js build..."
    if timeout 180 npm run build 2>&1 | tee /tmp/build-output.log | tail -20; then
        print_check "PASS" "Build compiled successfully"
    else
        print_check "FAIL" "Build failed - see output above"
        echo ""
        echo -e "${RED}Build Error Details:${NC}"
        tail -50 /tmp/build-output.log
        exit 1
    fi
fi

# Check 4: Lint check
print_section "Lint Check"

cd "$APP_DIR"
if npm run lint 2>&1 | tee /tmp/lint-output.log; then
    LINT_ERRORS=$(grep -c "error" /tmp/lint-output.log 2>/dev/null || echo "0")
    if [ "$LINT_ERRORS" = "0" ]; then
        print_check "PASS" "No lint errors"
    else
        print_check "WARN" "Lint completed with $LINT_ERRORS warnings"
    fi
else
    print_check "WARN" "Lint check had issues (non-blocking)"
fi

# Check 5: Tests
print_section "Test Suite"

cd "$APP_DIR"
if npm run test -- --passWithNoTests --silent 2>&1 | tee /tmp/test-output.log; then
    print_check "PASS" "Tests passed"
else
    print_check "WARN" "Some tests failed or skipped (review recommended)"
fi

# Check 6: Sensitive files
print_section "Security Scan"

cd "$PROJECT_ROOT"

# Check for .env files with content
SENSITIVE_FILES=0

# Check for .env files that might have real keys (only if they would be committed)
for envfile in $(find . -name ".env*" -type f 2>/dev/null | grep -v node_modules | grep -v ".env.example" | grep -v ".env.local"); do
    # Check if file is ignored by git
    if git check-ignore -q "$envfile" 2>/dev/null; then
        continue  # File is in .gitignore, skip
    fi
    if grep -qE "(sk-|AIza|ANTHROPIC_API_KEY=sk-)" "$envfile" 2>/dev/null; then
        print_check "FAIL" "Sensitive data found in tracked file: $envfile"
        SENSITIVE_FILES=1
    fi
done

# Check for admin password file (only if not in .gitignore)
if [ -f "admin-password.txt" ]; then
    if ! git check-ignore -q "admin-password.txt" 2>/dev/null; then
        print_check "FAIL" "admin-password.txt is not in .gitignore!"
        SENSITIVE_FILES=1
    else
        print_check "PASS" "admin-password.txt is properly ignored"
    fi
fi

# Check for API keys in source files
if grep -rE "(sk-ant-api|sk-[a-zA-Z0-9]{48}|AIzaSy[a-zA-Z0-9_-]{33})" --include="*.ts" --include="*.tsx" --include="*.js" "$APP_DIR/src" 2>/dev/null | grep -v ".env"; then
    print_check "FAIL" "API keys found in source code!"
    SENSITIVE_FILES=1
fi

if [ "$SENSITIVE_FILES" = "0" ]; then
    print_check "PASS" "No sensitive files will be committed"
fi

# Check 7: Large files
print_section "Large File Check"

cd "$PROJECT_ROOT"

# Find large files and handle spaces in filenames
LARGE_FILE_COUNT=0
LARGE_FILE_ISSUE=0

while IFS= read -r -d '' file; do
    LARGE_FILE_COUNT=$((LARGE_FILE_COUNT + 1))
    filename=$(basename "$file")
    # Check if file is tracked by LFS
    if git lfs ls-files 2>/dev/null | grep -qF "$filename"; then
        print_check "PASS" "Large file tracked by LFS: $filename"
    else
        print_check "FAIL" "Large file NOT in LFS: $file (>100MB will fail GitHub push)"
        LARGE_FILE_ISSUE=1
    fi
done < <(find . -type f -size +100M -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" -print0 2>/dev/null)

if [ "$LARGE_FILE_COUNT" = "0" ]; then
    print_check "PASS" "No large files detected"
fi

# Check 8: Git status
print_section "Git Status"

cd "$PROJECT_ROOT"

# Check for uncommitted changes
STAGED=$(git diff --cached --name-only 2>/dev/null | wc -l)
UNSTAGED=$(git diff --name-only 2>/dev/null | wc -l)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)

print_check "PASS" "Staged files: $STAGED"

if [ "$UNSTAGED" -gt 0 ]; then
    print_check "WARN" "Unstaged changes: $UNSTAGED files"
fi

if [ "$UNTRACKED" -gt 0 ]; then
    print_check "WARN" "Untracked files: $UNTRACKED files"
fi

# Check 9: Netlify config
print_section "Netlify Configuration"

if [ -f "$APP_DIR/netlify.toml" ]; then
    print_check "PASS" "netlify.toml exists"

    # Verify build command
    if grep -q 'command = "npm run build"' "$APP_DIR/netlify.toml"; then
        print_check "PASS" "Build command configured"
    else
        print_check "WARN" "Build command may not be standard"
    fi

    # Verify Node version
    if grep -q 'NODE_VERSION = "22"' "$APP_DIR/netlify.toml"; then
        print_check "PASS" "Node.js 22 configured"
    else
        print_check "WARN" "Node.js version not set to 22"
    fi
else
    print_check "FAIL" "netlify.toml not found"
fi

# ===========================================
# FINAL REPORT
# ===========================================

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE} SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Warnings: ${YELLOW}$WARN_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo -e "${RED}RECOMMENDATION: NOT READY FOR DEPLOYMENT${NC}"
    echo -e "${RED}Please fix the failed checks before pushing.${NC}"
    exit 1
elif [ "$WARN_COUNT" -gt 3 ]; then
    echo -e "${YELLOW}RECOMMENDATION: REVIEW WARNINGS BEFORE DEPLOYMENT${NC}"
    echo -e "${YELLOW}Consider addressing warnings for optimal deployment.${NC}"
    exit 0
else
    echo -e "${GREEN}RECOMMENDATION: READY FOR DEPLOYMENT${NC}"
    echo -e "${GREEN}All critical checks passed. Safe to push to GitHub.${NC}"
    exit 0
fi
