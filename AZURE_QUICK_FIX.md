# ⚡ Quick Fix: Azure Deployment - "Cannot find package 'tsx'" Error

## The Problem

Your Azure deployment is failing with:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'tsx'
```

## The Solution (2 minutes)

### In Azure Portal:

1. Navigate to: **Your App Service** → **Configuration** → **Application Settings**

2. Click **+ New application setting** and add:

   ```
   Name:  NPM_CONFIG_PRODUCTION
   Value: false
   ```

3. Verify this setting exists (add if missing):

   ```
   Name:  SCM_DO_BUILD_DURING_DEPLOYMENT
   Value: true
   ```

4. Go to **General settings** → **Startup Command** and set:

   ```
   node --import tsx server-production.js
   ```

5. Click **Save** (top of the page)

6. Click **Restart** (top of the page)

7. Redeploy from VS Code:
   - Azure extension → Right-click your app → **Deploy to Web App**

## Why This Works

By default, Azure runs `npm install --production`, which:

- ❌ Skips devDependencies
- ❌ Doesn't install `tsx`
- ❌ Can't run TypeScript files

Setting `NPM_CONFIG_PRODUCTION=false`:

- ✅ Installs ALL dependencies
- ✅ Includes `tsx` package
- ✅ Allows running TypeScript with `node --import tsx`

## Verify It Worked

After redeploying, check **Log Stream** in Azure Portal:

✅ **Success looks like:**

```
Installing dependencies...
✅ Decision engine loaded successfully
📊 Decision model v1.0
🚀 Server running on port 8080
```

❌ **Still failing?** See [AZURE_DEPLOYMENT_TROUBLESHOOTING.md](./AZURE_DEPLOYMENT_TROUBLESHOOTING.md)

## Alternative: Pre-compile TypeScript (Advanced)

If you don't want to use `tsx` in production, you can:

1. Compile all TypeScript to JavaScript during build
2. Change startup command to run compiled .js files
3. This requires updating the decision-engine package to output compiled .js

The `tsx` approach is simpler and recommended for this monorepo setup.
