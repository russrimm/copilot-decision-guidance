# CRITICAL: Azure Deployment Fix

## Problem

"Failed to calculate recommendation" error on Azure App Service only.

## Root Cause

**The decision-engine package in node_modules is stale.** Azure is using an old version without the fixes.

## Solution - Deploy Fresh node_modules

### Step 1: Clean and Rebuild Locally

```bash
# Clean everything
rm -rf node_modules
rm -rf apps/api/node_modules
rm -rf apps/web/node_modules
rm -rf packages/decision-engine/node_modules
rm -rf packages/decision-engine/dist

# Fresh install
npm install

# Build decision-engine with updated model
npm run build:packages

# Verify the built files
ls packages/decision-engine/dist/data/
# Should show: decision-model.v1.json

# Verify budget question is gone
cat packages/decision-engine/dist/data/decision-model.v1.json | grep "cost_budget"
# Should return NOTHING
```

### Step 2: Deploy to Azure with node_modules

The key is that Azure needs the BUILT decision-engine package from node_modules.

#### Option A: Zip Deploy with node_modules (RECOMMENDED)

```bash
# Create deployment package INCLUDING node_modules
# This ensures Azure gets the correct built packages

# On Windows PowerShell:
Compress-Archive -Path @(
  "server-production.mjs",
  "package.json",
  "package-lock.json",
  "node_modules",
  "apps/web/dist",
  "web.config"
) -DestinationPath deploy.zip -Force

# Deploy to Azure
az webapp deploy `
  --resource-group YOUR_RESOURCE_GROUP `
  --name YOUR_APP_NAME `
  --src-path deploy.zip `
  --type zip `
  --async false

# Restart
az webapp restart `
  --resource-group YOUR_RESOURCE_GROUP `
  --name YOUR_APP_NAME
```

#### Option B: Force Azure to Rebuild node_modules

If Azure builds node_modules remotely, it might not build the decision-engine properly.

Add to your App Service Configuration:

```bash
# Tell Azure to build scoped packages
az webapp config appsettings set `
  --resource-group YOUR_RESOURCE_GROUP `
  --name YOUR_APP_NAME `
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Also ensure it runs our build script
az webapp config appsettings set `
  --resource-group YOUR_RESOURCE_GROUP `
  --name YOUR_APP_NAME `
  --settings POST_BUILD_COMMAND="npm run build:packages"
```

Then deploy without node_modules:

```bash
# .deployment file in root
[config]
SCM_DO_BUILD_DURING_DEPLOYMENT = true
```

### Step 3: Verify with Enhanced Logging

After deployment, check logs:

```bash
az webapp log tail --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP
```

Look for:

```
[STARTUP] Loading decision engine from @copilot-guidance/decision-engine
[STARTUP] Engine imported, available exports: [ 'decisionModel', 'calculateRecommendation', ... ]
[STARTUP] ✅ Decision engine loaded successfully
[STARTUP] 📊 Decision model v1.0
[STARTUP] Decision model has 7 question groups
[STARTUP] calculateRecommendation type: function
```

When you test the wizard, look for:

```
[SCORE] Received answers: 12 questions
[SCORE] Decision model loaded: true
[SCORE] Decision model has questionGroups: true
[SCORE] calculateRecommendation function: function
[SCORE] Calculation successful, result: true
```

If you see errors:

```
[SCORE] Error calculating recommendation: TypeError: ...
[SCORE] Error stack: ...
```

This will tell us exactly what's failing.

### Step 4: SSH into Azure Container (If Needed)

```bash
# SSH into the running container
az webapp ssh --name YOUR_APP_NAME --resource-group YOUR_RESOURCE_GROUP

# Once inside, check:
cd /home/site/wwwroot

# Verify decision-engine package exists
ls -la node_modules/@copilot-guidance/decision-engine/

# Should show:
# - dist/
# - package.json

# Check dist folder
ls -la node_modules/@copilot-guidance/decision-engine/dist/

# Should show:
# - index.js
# - recommendations.js
# - scoring.js
# - types.js
# - data/

# Check data folder
ls -la node_modules/@copilot-guidance/decision-engine/dist/data/

# Should show:
# - decision-model.v1.json

# Verify the model is correct
cat node_modules/@copilot-guidance/decision-engine/dist/data/decision-model.v1.json | grep -i "cost_budget"
# Should return NOTHING (budget question removed)

# Check model structure
node -e "const m = require('./node_modules/@copilot-guidance/decision-engine/dist/data/decision-model.v1.json'); console.log('Question groups:', m.questionGroups.length); console.log('Has cost_budget:', m.questionGroups.some(g => g.questions.some(q => q.id === 'cost_budget')));"
# Should show: Question groups: 7, Has cost_budget: false
```

## Why This Happens

1. **Local Development**: You run `npm install` which builds decision-engine locally
2. **Azure Deployment**: If you don't include node_modules, Azure runs `npm install` remotely
3. **Problem**: Azure's `npm install` might not properly build the @copilot-guidance/decision-engine package
4. **Result**: Azure gets an unbuild or stale version of the package

## The Fix

**Deploy node_modules with the built decision-engine package**, or ensure Azure runs the build script after install.

## Quick Test

Before deploying, verify locally that server-production.mjs works:

```bash
# Start production server locally
node server-production.mjs

# In another terminal, test it
curl http://localhost:8080/api/health

# Should show decision model loaded
curl http://localhost:8080/api/model

# Test with sample data
curl -X POST http://localhost:8080/api/score \
  -H "Content-Type: application/json" \
  -d '{"answers": {"goal": "productivity", "skill_level": "low_code"}}'
```

If this works locally with server-production.mjs, then the issue is definitely the Azure deployment not having the correct node_modules.
