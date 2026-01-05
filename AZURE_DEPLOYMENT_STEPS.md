# Azure App Service Deployment Steps

## Issue

"Failed to calculate recommendation" error occurs **only on Azure App Service**, not on localhost.

## Root Cause Analysis

The server-production.mjs file is correct (has the fix), but the Azure deployment likely has:

1. Stale/old code deployed
2. Missing decision-engine package updates
3. Missing data files (decision-model.v1.json)

## Pre-Deployment Build

Ensure all packages are built with the latest changes:

```bash
# Build decision-engine package (includes updated decision model without budget question)
npm run build:packages

# Build web frontend (production bundle with admin excluded)
npm run build:web
```

## What Gets Deployed to Azure

Azure App Service needs these files:

```
/
├── server-production.mjs          # Production server (already has fix)
├── node_modules/                  # All dependencies
│   └── @copilot-guidance/
│       └── decision-engine/
│           ├── dist/
│           │   ├── index.js      # Compiled decision engine
│           │   └── data/
│           │       └── decision-model.v1.json  # ⚠️ CRITICAL: Updated model
├── apps/
│   └── web/
│       └── dist/                  # Production frontend bundle
```

## Deployment Methods

### Method 1: Azure CLI (Recommended)

```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Deploy using zip deploy
az webapp deploy \
  --resource-group YOUR_RESOURCE_GROUP \
  --name YOUR_APP_NAME \
  --src-path deployment.zip \
  --type zip \
  --async false

# Restart the app
az webapp restart \
  --resource-group YOUR_RESOURCE_GROUP \
  --name YOUR_APP_NAME
```

### Method 2: VS Code Azure Extension

1. Open VS Code
2. Install "Azure App Service" extension
3. Right-click on the workspace root
4. Select "Deploy to Web App..."
5. Choose your App Service
6. Confirm deployment

### Method 3: GitHub Actions (Continuous Deployment)

Create `.github/workflows/azure-deploy.yml`:

```yaml
name: Deploy to Azure App Service

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: npm run build:packages

      - name: Build web
        run: npm run build:web

      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: YOUR_APP_NAME
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

## Verification Steps

After deployment, verify:

1. **Check if app is running:**

   ```bash
   curl https://YOUR_APP_NAME.azurewebsites.net/api/health
   ```

2. **Check logs for errors:**

   ```bash
   az webapp log tail \
     --resource-group YOUR_RESOURCE_GROUP \
     --name YOUR_APP_NAME
   ```

3. **Test the recommendation endpoint:**

   ```bash
   curl -X POST https://YOUR_APP_NAME.azurewebsites.net/api/score \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

4. **Verify decision model loaded:**
   - Look for "📊 Decision model loaded: v1.0" in logs
   - If missing, the data file wasn't copied

## Common Issues

### Issue: "model.questionGroups is not iterable"

**Cause:** Old version of decision-engine deployed without the fix
**Solution:** Rebuild and redeploy packages

### Issue: "Failed to calculate recommendation"

**Cause:** Could be multiple reasons:

- Missing decision-model.v1.json file
- Decision model with old budget question causing validation errors
- Module resolution issues

**Solution:**

1. Verify dist/data folder exists in deployment
2. Check logs for actual error (not just "Failed to calculate")
3. Ensure node_modules/@copilot-guidance/decision-engine is up to date

### Issue: Old cached data in production

**Cause:** User browsers have old localStorage with budget question
**Solution:** The wizardStore version bump (version 2) will automatically clear old data on first load

## Environment Variables

Ensure these are set in Azure App Service:

```bash
# Required for production
NODE_ENV=production
PORT=8080  # Or whatever Azure assigns

# Optional - AI explanation features
AZURE_OPENAI_KEY=your_key
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_DEPLOYMENT=your_deployment
```

Check in Azure Portal:

1. Go to your App Service
2. Settings → Configuration
3. Application settings

## Post-Deployment Testing

1. Clear browser cache and localStorage
2. Visit the production URL
3. Go through the wizard
4. Verify:
   - No budget question appears
   - Admin page is not accessible
   - Recommendation calculation works
   - Results page displays correctly

## Troubleshooting Commands

```bash
# View recent logs
az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP

# Download all logs
az webapp log download --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP --log-file logs.zip

# SSH into container (if Linux)
az webapp ssh --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP

# Check environment
az webapp config appsettings list --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP

# Restart app
az webapp restart --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP
```

## Files to Verify in Azure

Once deployed, verify these files exist in the Azure container:

```bash
# Via SSH (az webapp ssh)
ls -la /home/site/wwwroot/
ls -la /home/site/wwwroot/node_modules/@copilot-guidance/decision-engine/dist/
ls -la /home/site/wwwroot/node_modules/@copilot-guidance/decision-engine/dist/data/

# Check decision model
cat /home/site/wwwroot/node_modules/@copilot-guidance/decision-engine/dist/data/decision-model.v1.json | grep -i "cost_budget"
# Should return nothing if budget question is removed
```

## Summary

✅ **Builds completed successfully:**

- decision-engine package built with updated model (no budget question)
- Web app built with admin excluded
- All files ready in dist/ folders

⚠️ **Next step:** Deploy to Azure using one of the methods above

🔍 **After deployment:** Check Azure logs to confirm "📊 Decision model loaded: v1.0" and test the wizard
