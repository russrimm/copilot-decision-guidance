# Azure App Service deployment

The supported Linux App Service entry point is `node server-production.mjs`. Build and package dependencies in CI rather than installing or transpiling application code during startup.

## Build

```powershell
npm ci
npm run build
npm run build:web
```

The deployment package must include `server-production.mjs`, production dependencies, `packages/decision-engine/dist`, `apps/api/dist`, and `apps/web/dist`.

## App Service settings

Set the startup command to:

```text
node server-production.mjs
```

Set `NODE_ENV=production`. App Service supplies `PORT`. Configure `WEBSITES_CONTAINER_START_TIME_LIMIT=1800` for slow cold starts. Keep secrets in App Service settings or Azure Key Vault references, and prefer managed identity for Azure OpenAI access.

When a separate browser origin calls the API, set `CORS_ALLOWED_ORIGINS` to a comma-separated allowlist. Same-origin deployments do not need this setting.

## Post-deployment checks

```powershell
curl.exe --fail https://YOUR_APP.azurewebsites.net/api/health
curl.exe --fail https://YOUR_APP.azurewebsites.net/api/ready
curl.exe --fail https://YOUR_APP.azurewebsites.net/
```

`/api/health` verifies liveness. `/api/ready` returns `200` only after the decision model and scoring functions are loaded.

## Troubleshooting

If startup fails, confirm the startup command first, then inspect Log Stream for the earliest startup error. Verify the deployment contains the built decision model at `packages/decision-engine/dist/data/decision-model.v1.json` and the frontend at `apps/web/dist/index.html`.

Do not fix missing runtime packages by adding `npm ci`, `tsx`, or TypeScript transpilation to the startup command. Rebuild the deployment artifact in CI instead.

If a deployment remains unhealthy, restore the last known-good artifact and startup command, restart the app, and retain the first 100 startup log lines for root-cause analysis.
