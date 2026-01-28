# Netlify Configuration Guide for 5D Character Creator

## ✅ Recommended Settings

### 1. **Build Settings** (Most Important)

**Current Configuration:**
- ✅ Base directory: `5d-character-creator-app/app` (CORRECT - keep this)
- ✅ Build command: `npm run build` (CORRECT - keep this)
- ✅ Publish directory: `5d-character-creator-app/app/.next` (CORRECT - keep this)
- ✅ Functions directory: `5d-character-creator-app/app/netlify/functions` (CORRECT - keep this)

**Runtime:**
- ✅ **Set to:** `Node.js 22.x` (recommended for Agent Runners and optimal performance)
- Your netlify.toml specifies `NODE_VERSION = "22"` which matches Netlify's default
- Agent Runners work best with Node.js 22 or higher
- Next.js 16.1.1 fully supports Node.js 22

### 2. **Environment Variables** (Critical for Admin Mode)

**Required Variables:**
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
```

**How to Set:**
1. Go to: Site settings → Environment variables
2. Add each variable with your actual API keys
3. **Important:** Set scope to "All scopes" (production, preview, branch deploys)
4. After adding, trigger a new deploy

### 3. **Branch Deploys** (Recommended for Testing)

**Current:** "Deploy only the production branch"

**Recommended Change:**
- ✅ **Enable Branch Deploys** → Select "All branches" or specific branches
- This allows you to test changes on feature branches before merging to main
- Preview deployments for pull requests are already enabled (good!)

**Benefits:**
- Test changes without affecting production
- Preview deployments for every PR automatically
- Can test admin mode on preview deployments

### 4. **Deploy Log Visibility** (Optional)

**Current:** "Logs are public"

**Recommendation:**
- ✅ Keep as "public" if you want to share build logs
- Or change to "private" for security (hides sensitive info from public URLs)

### 5. **Functions Region** (Performance)

**Current:** US East (Ohio) - us-east-2

**Recommendation:**
- ✅ Keep current region if most users are in US
- Or change to region closest to your primary user base:
  - **US West:** `us-west-1` (Oregon)
  - **Europe:** `eu-central-1` (Frankfurt)
  - **Asia Pacific:** `ap-southeast-1` (Singapore)

### 6. **Node.js Version** (Important)

**Current:** 22.x (in Netlify UI)

**Recommendation:**
- ✅ **Keep at:** `22.x` (recommended for Agent Runners)
- Your package.json specifies: `"node": ">=20.9.0"` (22.x is compatible)
- Agent Runners work best with Node.js 22 or higher
- Next.js 16.1.1 fully supports Node.js 22
- Better performance and latest features

**How to Verify:**
- Go to: Site settings → Dependency management → Node.js
- Should show: `22.x` (matches netlify.toml configuration)

### 7. **Automatic Deploy Deletion** (Storage Management)

**Current:** Delete deploys after 90 days

**Recommendation:**
- ✅ Keep at 90 days (good balance)
- Or reduce to 30 days if you want to save storage
- Production and latest successful deploy are never auto-deleted

### 8. **Preview Server Settings** (For Local Testing)

**Current:** Not set

**Recommendation:**
- **Preview Server command:** `npm run dev`
- **Target port:** `3000` (Next.js default)
- Only needed if using Netlify CLI for local preview

### 9. **Build Hooks** (Optional - For CI/CD)

**Recommendation:**
- ✅ Create a build hook if you want to trigger builds from external services
- Useful for: GitHub Actions, Zapier, webhooks, etc.
- Not required for basic Git-based deployments

### 10. **Snippet Injection** (Optional - For Analytics)

**Current:** Not configured

**Recommendation:**
- Add Google Analytics, Plausible, or other analytics if needed
- Add before `</head>` or before `</body>` tag
- Only if you want to track usage

## 🚫 Settings to Avoid/Not Configure

### ❌ **Runtime** (Don't Set Manually)
- Your `netlify.toml` already handles this
- Setting it in UI might conflict with the config file

### ❌ **Legacy Prerendering** (Deprecated)
- Don't enable - it's deprecated
- Next.js handles this automatically

### ❌ **Split Testing** (Not Needed Yet)
- Only enable if you want A/B testing
- Requires branch deploys to be enabled first

## 📋 Quick Setup Checklist

- [ ] Verify Base directory: `5d-character-creator-app/app`
- [ ] Verify Build command: `npm run build`
- [ ] Verify Publish directory: `5d-character-creator-app/app/.next`
- [ ] Set Node.js version to `20.x` in Dependency management
- [ ] Add environment variables: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`
- [ ] Enable Branch Deploys (optional but recommended)
- [ ] Set Functions region to closest to users (optional)
- [ ] Configure Preview Server if using Netlify CLI (optional)

## 🔧 Priority Order

1. **CRITICAL:** Environment Variables (required for admin mode)
2. **IMPORTANT:** Node.js version (set to 22.x for Agent Runners)
3. **RECOMMENDED:** Enable Branch Deploys
4. **OPTIONAL:** Functions region, Preview Server, Build Hooks

## 📝 Notes

- Your `netlify.toml` file already has most settings configured correctly
- Netlify UI settings override `netlify.toml` if there's a conflict
- Environment variables set in UI are more secure than in config files
- Always redeploy after changing environment variables
