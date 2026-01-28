# Project Structure

This document outlines the organization of the 5D Character Creator project.

## 📁 Directory Structure

```
5D-Character-Creator-Nitro/
├── docs/                          # Project documentation
│   ├── testing/                   # Testing documentation
│   │   ├── AGENTIC_AI_TEST_CHECKLIST.md
│   │   ├── AGENTIC_AI_TEST_PLAN.md
│   │   ├── AGENTIC_AI_TESTER_QUICKSTART.md
│   │   └── LOCAL_TESTING.md
│   ├── deployment/                # Deployment guides
│   │   └── NETLIFY_CONFIGURATION_GUIDE.md
│   ├── development/               # Development guides (future)
│   └── README.md                  # Documentation index
│
├── scripts/                       # Utility scripts
│   ├── auto-git-sync.js          # Auto Git sync (Node.js)
│   ├── auto-git-sync.ps1         # Auto Git sync (PowerShell)
│   ├── kill-dev-server.ps1       # Dev server management
│   ├── temp/                      # Temporary scripts (gitignored)
│   └── README.md                  # Scripts documentation
│
├── 5d-character-creator-app/     # Main application
│   ├── app/                       # Next.js application
│   │   ├── src/                   # Source code
│   │   ├── public/                # Static assets
│   │   ├── netlify.toml           # Netlify configuration
│   │   └── package.json           # Dependencies
│   ├── docs/                      # App-specific documentation
│   ├── knowledge-bank/            # Reference materials
│   └── refrence-image-assets/     # Reference images
│
├── README.md                      # Main project README
├── PROJECT_STRUCTURE.md          # This file
└── .gitignore                     # Git ignore rules
```

## 📚 Documentation Locations

### Root Level
- **README.md** - Main project overview and getting started guide
- **PROJECT_STRUCTURE.md** - This file (project organization)

### `/docs`
- **docs/README.md** - Documentation index
- **docs/testing/** - All testing-related documentation
- **docs/deployment/** - Deployment and infrastructure guides
- **docs/development/** - Development guides (for future use)

### `/5d-character-creator-app/docs`
- Application-specific technical documentation
- Workflow guides
- Reference system documentation

## 🗂️ File Organization Principles

1. **Documentation**: All project docs in `/docs` organized by category
2. **Scripts**: Utility scripts in `/scripts` with temp folder for one-time fixes
3. **Application**: Main app code in `/5d-character-creator-app/app`
4. **Clean Root**: Keep root directory minimal with only essential files

## 🔍 Finding Files

- **Testing docs**: `docs/testing/`
- **Deployment guides**: `docs/deployment/`
- **Scripts**: `scripts/`
- **App code**: `5d-character-creator-app/app/src/`
- **App docs**: `5d-character-creator-app/docs/`
