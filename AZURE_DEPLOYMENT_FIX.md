# Azure Deployment Fix: Cannot find module 'server-production.js'

## Error

```
Error: Cannot find module '/home/site/wwwroot/server-production.js'
code: 'MODULE_NOT_FOUND'
```

## Root Cause

The `server-production.js` file was not deployed to Azure because:

1. Azure's default deployment doesn't know to use our custom build script
2. The `.deployment` file wasn't configured to run `.azure/deploy.sh`

## Solution Applied

Updated `.deployment` file to explicitly use our custom deploy script:

```ini
[config]
command = bash .azure/deploy.sh
```

This ensures:

- ✅ Dependencies are installed
- ✅ TypeScript is compiled
- ✅ Frontend is built
- ✅ **All files including server-production.js are present**
- ✅ Build is verified before deployment completes

## Verification

The deploy script now checks for all required files:

```bash
✓ Decision engine compiled
✓ Frontend built
✓ Server file present
```

If any file is missing, deployment will fail with a clear error.

## Next Steps

1. **Redeploy** your application:
   - Via VS Code: Azure extension → Deploy to Web App
   - Via Git: `git push azure main`

2. **Check deployment logs** in Azure Portal:
   - You should see the custom deploy script output
   - All verification checks should pass: ✓ ✓ ✓

3. **Verify startup** in Log Stream:
   ```
   PATH="$PATH:/home/site/wwwroot" node server-production.js
   🚀 Server running on port 8080
   📊 Decision model v1.0
   ```

## Why This Happened

Azure App Service uses **Oryx** for automatic deployment. By default, Oryx:

- Detects Node.js apps
- Runs `npm install`
- Looks for standard entry points (index.js, app.js, server.js)

Our app uses:

- **Custom build process** (compile TypeScript → JavaScript)
- **Custom entry point** (server-production.js)
- **Monorepo structure** (packages/_, apps/_)

The `.deployment` file with `command = bash .azure/deploy.sh` tells Azure:
"Don't use default behavior - use our custom build script instead"

## Related Files

- [.deployment](.deployment) - Points to custom deploy script
- [.azure/deploy.sh](.azure/deploy.sh) - Custom build and verification
- [server-production.js](server-production.js) - Main entry point
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Full deployment guide

## Testing Locally

Before redeploying, test locally:

```powershell
# Verify all files present
npm run test:prod

# Should output:
# ✅ Production build test PASSED!
# Ready to deploy to Azure!
```
