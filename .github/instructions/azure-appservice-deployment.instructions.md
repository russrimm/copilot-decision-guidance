---
description: 'Azure App Service deployment standards for this repository'
applyTo: '.github/workflows/master_copilot-decision-guidance.yml, startup.sh, startup-command.txt, server-production.mjs'
---

# Azure App Service Deployment Standards

## Primary Rules

- Use `node server-production.mjs` as the startup command for Linux App Service.
- Do **not** run `npm ci` in startup command.
- Build and package dependencies during CI/CD, not runtime startup.
- Keep `WEBSITES_CONTAINER_START_TIME_LIMIT` configured for resilience (recommended `1800`).

## Workflow Requirements

- Deployment workflows must include:
  - build
  - deploy
  - post-deploy health validation (`/api/health`)
- Fail deployment if health check does not pass within timeout window.

## Verification Checklist

- Confirm startup command is plain text (no markdown, no links).
- Confirm app responds at:
  - `/api/health`
  - `/`
- Confirm Log Stream emits startup logs within 60 seconds after restart.

## Rollback Guidance

- If deployment fails health checks:
  - restore last known good startup command
  - restart app
  - capture first 100 log lines
  - open follow-up issue with root cause and prevention action
