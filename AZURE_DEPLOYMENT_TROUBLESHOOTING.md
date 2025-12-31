# Azure App Service Deployment - Troubleshooting Guide

## Issue 1: Module Not Found Error (dist/server/index.js)

If you see this error:

```
Error: Cannot find module '/home/site/wwwroot/dist/server/index.js'
```

This means Azure is not finding the correct entry point. **Solution**: Set the Startup Command (see Step 2 below).

## Issue 2: Cannot find package 'tsx'

If you see this error:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'tsx'
```

This means Azure installed dependencies with `--production` flag, skipping devDependencies. **Solution**: Configure NPM_CONFIG_PRODUCTION=false (see Step 2 below).

## Solution: Proper Deployment Setup

### Step 1: Initialize Git Repository (if not already done)

```powershell
git init
git add .
git commit -m "Initial commit with Azure deployment config"
```

### Step 2: Configure Azure App Service Settings (CRITICAL)

In the Azure Portal, configure these Application Settings:

1. **General Settings** → **Startup Command**:

   ```
   node --import tsx server-production.js
   ```

2. **Configuration** → **Application Settings** (add these):
   - `SCM_DO_BUILD_DURING_DEPLOYMENT` = `true`
   - `NPM_CONFIG_PRODUCTION` = `false` ← **CRITICAL** (installs all dependencies including tsx)
   - `WEBSITE_NODE_DEFAULT_VERSION` = `20-lts`
   - `PORT` = (leave empty, Azure assigns automatically)

### Step 3: Environment Variables (Optional - for AI features)

Add these if you want AI-enhanced explanations:

- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT`

Or for OpenAI:

- `OPENAI_API_KEY`

### Step 4: Deploy via VS Code Azure Extension

1. Install Azure App Service extension in VS Code
2. Click Azure icon in sidebar
3. Sign in to Azure
4. Right-click on App Service → Deploy to Web App
5. Select this workspace folder

### Step 5: Verify Deployment

After deployment completes:

1. Check **Deployment Center** in Azure Portal for build logs
2. Check **Log stream** for runtime logs
3. Visit your app URL: `https://<your-app-name>.azurewebsites.net`
4. Test health endpoint: `https://<your-app-name>.azurewebsites.net/api/health`

## Alternative: Deploy via Git

```powershell
# Add Azure remote
az webapp deployment source config-local-git --name <your-app-name> --resource-group <your-rg>

# Get the deployment URL
$deployUrl = az webapp deployment list-publishing-credentials --name <your-app-name> --resource-group <your-rg> --query scmUri -o tsv

# Add remote and push
git remote add azure $deployUrl
git push azure main
```

## Troubleshooting

### If deployment still fails:

1. **Clear Azure cache**: In Azure Portal → Development Tools → Advanced Tools (Kudu) → Debug Console → CMD

   ```
   cd D:\home\site
   del /s /q wwwroot\*
   ```

2. **Restart the app**: Configuration → Restart

3. **Check build logs**: Deployment Center → Logs

4. **Verify files deployed**: Advanced Tools (Kudu) → Debug Console
   - Check that `server-production.js` exists in `D:\home\site\wwwroot`
   - Check that `apps/web/dist/` exists with built files

## Important Files for Deployment

These files MUST be committed to git:

- ✅ `server-production.js` - Production server entry point
- ✅ `package.json` - With "main": "server-production.js" and correct start script
- ✅ `.deployment` - Azure deployment config
- ✅ `.azure/deploy.sh` - Custom deployment script
- ✅ `web.config` - IIS configuration (for Windows App Service)
- ✅ `apps/web/dist/` - Pre-built frontend (or build during deployment)

## Verification Checklist

Before deploying, verify locally:

```powershell
# Build the frontend
cd apps/web
npm run build
cd ../..

# Test production server
npm start

# Should see:
# 🚀 Server running on port 3001
# 📊 Decision model v1.0
```

Visit http://localhost:3001 - if it works locally, it will work on Azure.
