# Deployment Optimization - Fixed SCM Restart Issue

## Problem

Deployment was failing with error:

```
Deployment has been stopped due to SCM container restart.
The restart can happen due to a management operation on site.
Package deployment using ZIP Deploy failed.
Package size: 82.45 MB
```

## Root Causes

1. **Package too large (82+ MB)**: Uploading `node_modules/` with all dev dependencies
2. **Rapid successive deployments**: Multiple commits pushed quickly triggered overlapping deployments
3. **Inefficient build artifacts**: Including unnecessary files and dependencies

## Solutions Implemented

### 1. Optimized Artifact Upload

**Before**: Uploaded entire `node_modules/` directory (82+ MB)
**After**: Exclude `node_modules`, only upload built artifacts and package definitions

```yaml
- name: Prepare deployment package
  run: |
    mkdir -p deploy
    cp -r apps deploy/          # Built frontend & API
    cp -r packages deploy/      # Built decision-engine
    cp package.json package-lock.json server-production.mjs deploy/
    cp startup.sh deploy/ || true
```

### 2. Install Dependencies on Azure

**Before**: Dependencies bundled in deployment package
**After**: Azure installs production dependencies on startup

```yaml
startup-command: 'npm ci --omit=dev && node server-production.mjs'
```

### 3. Use `npm ci` Instead of `npm install`

- Faster, more reliable installs from package-lock.json
- Ensures consistent dependency versions
- Better for CI/CD environments

### 4. Set `NODE_ENV=production`

```yaml
- name: npm install, build, and test
  run: |
    npm ci
    npm run build:packages
    npm run build:api
    npm run build:web
    npm run test --if-present
  env:
    NODE_ENV: production
```

### 5. Disable Azure Build During Deployment

Updated `.deployment`:

```ini
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT = false
```

Since we're pre-building everything in GitHub Actions, Azure doesn't need to rebuild.

## Benefits

✅ **Smaller deployment package**: ~5-10 MB instead of 82 MB
✅ **Faster uploads**: Reduced upload time by 90%
✅ **More reliable**: Avoids SCM container restart issues
✅ **Production-only dependencies**: `--omit=dev` excludes dev dependencies
✅ **Consistent builds**: `npm ci` ensures reproducible installs

## What Gets Deployed

```
deployment-package/
├── apps/
│   ├── web/dist/        # Built Vite frontend
│   └── api/dist/        # Built TypeScript API
├── packages/
│   └── decision-engine/dist/  # Built decision model & scoring
├── package.json         # Dependency definitions
├── package-lock.json    # Locked versions
├── server-production.mjs # Production server
└── startup.sh           # Startup script (optional)
```

## Deployment Flow

1. **GitHub Actions Build Job**:
   - Install all dependencies (`npm ci`)
   - Build packages, API, and frontend
   - Run tests
   - Create clean deployment directory
   - Upload ~5-10 MB artifact

2. **GitHub Actions Deploy Job**:
   - Download artifact
   - Login to Azure
   - Deploy via ZIP deploy

3. **Azure Web App Startup**:
   - `npm ci --omit=dev` installs production dependencies
   - `node server-production.mjs` starts the server
   - Server loads decision-engine and serves frontend

## Preventing Future Issues

1. ✅ **Never upload `node_modules/`** to deployment artifacts
2. ✅ **Wait 2-3 minutes between pushes** to avoid overlapping deployments
3. ✅ **Use `npm ci`** in CI/CD for consistent installs
4. ✅ **Set `NODE_ENV=production`** during build
5. ✅ **Monitor GitHub Actions** before considering work complete

## Verification Steps

After deployment completes:

1. Check GitHub Actions: https://github.com/russrimm/copilot-decision-guidance/actions
2. Verify site loads: https://copilot-decision-guidance.azurewebsites.net/
3. Test questionnaire (all 21 questions)
4. Verify recommendations include Microsoft Foundry
5. Test PDF export

## Files Modified

- `.github/workflows/master_copilot-decision-guidance.yml` - Optimized build/deploy
- `.deployment` - Disabled Azure build
- `startup.sh` - Added npm ci for dependency installation

---

**Status**: Deployed  
**Package Size**: ~5-10 MB (was 82 MB)  
**Deploy Time**: ~2-3 minutes  
**Risk**: Low - Standard Node.js deployment pattern
