# Azure ZIP Deploy Configuration

When deploying directly via VS Code (ZIP deploy), use these settings in Azure Portal:

## Application Settings

Add these in **Configuration → Application Settings**:

```
WEBSITE_RUN_FROM_PACKAGE = 0
SCM_DO_BUILD_DURING_DEPLOYMENT = true
```

## Why This Matters

- `WEBSITE_RUN_FROM_PACKAGE = 0` → Extracts ZIP to file system (not read-only)
- `SCM_DO_BUILD_DURING_DEPLOYMENT = true` → Runs npm build after deployment

## Deployment Methods

### Method 1: Git Push (Recommended)

```powershell
# Initialize git (if not done)
git init
git add .
git commit -m "Production build"

# Add Azure remote (get URL from Azure Portal)
git remote add azure <your-git-url>
git push azure main
```

### Method 2: VS Code ZIP Deploy

1. Set application settings above
2. VS Code → Azure extension → Deploy
3. Oryx will run build after extraction

### Method 3: Azure CLI

```bash
az webapp up --name <app-name> --resource-group <rg-name>
```

## Current Issue

VS Code ZIP deploy without `SCM_DO_BUILD_DURING_DEPLOYMENT=true` skips the build step,
so `server-production.js` gets deployed but compiled packages don't get built.

**FIX: Set the application setting above, then redeploy.**
