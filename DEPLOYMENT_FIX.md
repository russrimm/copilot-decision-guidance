# Deployment Fix - Published Site Not Matching Localhost

## Problem

The published Azure site (https://copilot-decision-guidance.azurewebsites.net/) was showing outdated content that didn't match the local development version at http://localhost:5173.

## Root Cause

The GitHub Actions deployment workflow had three critical issues:

1. **Missing Frontend Build**: The workflow only ran `npm run build --if-present`, which builds the API and decision-engine packages but **NOT the Vite frontend** (`apps/web`).

2. **Wrong Startup Command**: The workflow used `node apps/api/dist/index.js` instead of `node server-production.mjs`, which meant:
   - The production server wasn't being used
   - Frontend files weren't being served
   - Only the API was running

3. **Inefficient Artifact Upload**: Uploaded the entire workspace (`.`) including source files, .git, and other unnecessary files instead of just the built artifacts.

## Solution

Updated [.github/workflows/master_copilot-decision-guidance.yml](.github/workflows/master_copilot-decision-guidance.yml) with:

### 1. Complete Build Process (Lines 25-30)

```yaml
- name: npm install, build, and test
  run: |
    npm install
    npm run build:packages  # Build decision-engine
    npm run build:api       # Build API
    npm run build:web       # Build Vite frontend ← ADDED
    npm run test --if-present
```

### 2. Optimized Artifact Upload (Lines 32-43)

```yaml
- name: Upload artifact for deployment job
  uses: actions/upload-artifact@v4
  with:
    name: node-app
    path: |
      apps/web/dist/           # Built frontend
      apps/api/dist/           # Built API
      packages/decision-engine/dist/  # Built decision engine
      node_modules/            # Dependencies
      package.json
      package-lock.json
      server-production.mjs    # Production server
```

### 3. Correct Startup Command (Line 73)

```yaml
- name: 'Deploy to Azure Web App'
  uses: azure/webapps-deploy@v3
  with:
    app-name: 'copilot-decision-guidance'
    startup-command: 'node server-production.mjs' # ← FIXED
```

## What Gets Deployed Now

The production server (`server-production.mjs`) runs on Azure and:

1. Loads the decision engine from `packages/decision-engine/dist`
2. Exposes API endpoints at `/api/*`
3. Serves the built Vite frontend from `apps/web/dist/`
4. Handles React Router with SPA fallback

## Next Steps

To deploy the latest changes:

1. **Commit and push the workflow fix:**

   ```bash
   git add .github/workflows/master_copilot-decision-guidance.yml
   git commit -m "Fix deployment workflow to build and deploy frontend"
   git push origin master
   ```

2. **Wait for GitHub Actions to complete** (~2-3 minutes)
   - Monitor at: https://github.com/[YOUR-ORG]/copilot-decision-guidance/actions

3. **Verify the deployment:**
   - Visit https://copilot-decision-guidance.azurewebsites.net/
   - Check that all 21 questions appear correctly
   - Verify the `governance_alm` question (formerly duplicate `governance_lifecycle`)
   - Test PDF export with new page break logic
   - Confirm Microsoft Foundry appears in recommendations

## Changes That Will Now Be Live

Once deployed, the Azure site will include:

✅ **Microsoft AI Decision Framework Alignment** (100% coverage)

- All 16 evaluation criteria covered across 21 questions

✅ **Microsoft Foundry Integration**

- Explicit mentions in M365 Copilot, Copilot Studio, Agent Builder, and Hybrid recommendations
- Complete 5-platform weight system (m365Copilot, copilotStudio, foundry, agentBuilder, hybrid)

✅ **Fixed Duplicate Question ID**

- `governance_lifecycle` → `governance_alm` for ALM question
- No more ID conflicts in the questionnaire

✅ **Fixed PDF Export**

- Improved page break logic prevents text cutoff
- Proper space calculation before writing content
- Better handling of long recommendation sections

✅ **Test Suite Improvements**

- All 19 tests passing
- Hybrid recommendation now uses "Microsoft 365 Copilot" (full name)

## Technical Details

### Production Server Architecture

```
server-production.mjs (Port 8080)
├── API Routes (/api/*)
│   ├── GET /api/health
│   ├── GET /api/model
│   ├── POST /api/score
│   ├── POST /api/explain
│   └── GET /api/sources
├── Static Files (apps/web/dist)
└── SPA Fallback (index.html for React Router)
```

### Build Artifacts Structure

```
deployment-package/
├── apps/
│   ├── web/dist/        # Vite built frontend (HTML, CSS, JS)
│   └── api/dist/        # Compiled TypeScript API
├── packages/
│   └── decision-engine/dist/  # Decision model + scoring logic
├── node_modules/        # Runtime dependencies
├── package.json
├── package-lock.json
└── server-production.mjs
```

## Why This Happened

The original workflow was created before the monorepo structure was fully established. It assumed a simpler build process and didn't account for:

- Separate frontend build step (`apps/web` Vite app)
- Production server that integrates frontend + API
- Workspace-based dependency management

## Prevention

To avoid similar issues in the future:

1. ✅ Test production builds locally: `npm run build:web && npm run build:api && node server-production.mjs`
2. ✅ Monitor GitHub Actions after pushing to master
3. ✅ Compare deployed version against localhost before considering work complete
4. ✅ Document deployment architecture (this file!)

---

**Status**: Ready to deploy  
**Impact**: High - Fixes all recent improvements not visible on production site  
**Risk**: Low - Changes are proven working on localhost with all tests passing
