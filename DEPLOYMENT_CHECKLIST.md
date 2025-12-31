# ✅ Production-Ready Deployment Checklist

## What Changed?

All TypeScript issues are now **permanently solved**:

- ✅ **Decision engine** compiles to JavaScript (`packages/decision-engine/dist/`)
- ✅ **No tsx needed** at runtime - pure Node.js
- ✅ **No special npm flags** - standard production install works
- ✅ **Automated testing** - `npm run test:prod` validates before deploy

## Pre-Deployment Checklist

### 1. Build Everything

```powershell
npm run build
```

**What this does:**

- Compiles decision-engine TypeScript → JavaScript
- Builds React frontend → static HTML/CSS/JS
- Copies JSON data files to dist folders

**Expected output:**

```
✓ packages/decision-engine/dist/index.js
✓ apps/web/dist/index.html
✓ Decision model v1.0
```

### 2. Test Production Build Locally

```powershell
npm run test:prod
```

**This validates:**

- ✅ All required files exist
- ✅ TypeScript is compiled correctly
- ✅ Server starts with pure JavaScript
- ✅ All API endpoints respond
- ✅ Frontend is served correctly

**Expected output:**

```
✅ Production build test PASSED!
Ready to deploy to Azure!
No tsx needed - pure JavaScript runtime ✨
```

If this passes locally, it **will work on Azure**.

### 3. Azure Portal Configuration

**Startup Command** (Configuration → General settings):

```
node server-production.js
```

**Application Settings** (Configuration → Application settings):

```
SCM_DO_BUILD_DURING_DEPLOYMENT = true
WEBSITE_NODE_DEFAULT_VERSION = 20-lts
```

**Optional** (for AI features):

```
AZURE_OPENAI_API_KEY = your-key
AZURE_OPENAI_ENDPOINT = your-endpoint
AZURE_OPENAI_DEPLOYMENT = your-deployment
```

### 4. Deploy

**IMPORTANT:** Make sure these files are in your deployment source:

- `server-production.js` (main entry point)
- `packages/decision-engine/dist/` (compiled code)
- `apps/web/dist/` (frontend build)
- `.azure/deploy.sh` (custom build script)
- `.deployment` (points to deploy.sh)

#### Via VS Code:

1. Azure extension → Right-click your app
2. "Deploy to Web App"
3. Select this folder
4. Wait for "Deployment Complete" message

#### Via Git:

```powershell
git add .
git commit -m "Production-ready deployment"
git push azure main
```

**Note:** The `.deployment` file tells Azure to use `.azure/deploy.sh` which:

- Installs dependencies
- Compiles TypeScript packages
- Builds frontend
- Verifies all files are present

### 5. Verify Deployment

Check **Log Stream** in Azure Portal:

```
✅ Building packages...
✅ Building frontend...
🚀 Server running on port 8080
📊 Decision model v1.0
```

Test endpoints:

- `https://<your-app>.azurewebsites.net/api/health`
- `https://<your-app>.azurewebsites.net/`

## What If Something Goes Wrong?

### Build Fails Locally

```powershell
# Clean and rebuild
npm run build:clean
npm install
npm run build
npm run test:prod
```

### Azure Deployment Fails

1. Check **Deployment Center → Logs** in Azure Portal
2. Verify startup command is: `node server-production.js`
3. Ensure `SCM_DO_BUILD_DURING_DEPLOYMENT = true`
4. Check that `.azure/deploy.sh` has execute permissions

### Server Won't Start on Azure

1. Check **Log Stream** for errors
2. Verify all files deployed:
   - Go to **Advanced Tools (Kudu)** → Debug Console
   - Check `D:\home\site\wwwroot\packages\decision-engine\dist\` exists
   - Check `D:\home\site\wwwroot\apps\web\dist\` exists

## Ongoing Maintenance

### After Making Code Changes

```powershell
# 1. Rebuild
npm run build

# 2. Test locally
npm run test:prod

# 3. Deploy
# (Via VS Code or git push)
```

### Updating Decision Model

1. Edit `packages/decision-engine/src/data/decision-model.v1.json`
2. Run `npm run build:packages`
3. Test with `npm run test:prod`
4. Deploy

## Why This Approach Works

**Previous issues:**

- ❌ TypeScript at runtime (tsx dependency)
- ❌ Complex build process
- ❌ Platform-specific configuration
- ❌ Difficult to test locally

**Current solution:**

- ✅ Compiled JavaScript (no runtime transpilation)
- ✅ Simple `npm run build`
- ✅ Works everywhere (Azure, AWS, Docker, etc.)
- ✅ `npm run test:prod` catches issues before deployment

## Files You Should Know About

- **`server-production.js`** - Production server (pure JavaScript, no tsx)
- **`packages/decision-engine/dist/`** - Compiled TypeScript → JavaScript
- **`apps/web/dist/`** - Built React app
- **`.azure/deploy.sh`** - Azure deployment script
- **`scripts/test-production.js`** - Production validation script

## Quick Reference

| Command             | Purpose                         |
| ------------------- | ------------------------------- |
| `npm run build`     | Build everything for production |
| `npm run test:prod` | Test production build locally   |
| `npm start`         | Run production server           |
| `npm run dev`       | Run development mode            |
| `npm test`          | Run unit tests                  |

---

**🎉 Your app is now production-ready with zero TypeScript deployment issues!**
