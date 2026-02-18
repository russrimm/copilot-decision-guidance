---
description: 'Operational observability and incident response runbook standards'
applyTo: 'apps/api/src/**/*, server-production.mjs, .github/workflows/*.yml, docs/*'
---

# Observability and Runbook Standards

## Minimum Runtime Signals

- Startup logs: version, environment, port, startup success/failure.
- Health endpoint (`/api/health`) with timestamp and uptime.
- Error logs must include operation context and sanitized message.

## Incident Triage Sequence

1. Validate app state and health endpoint.
2. Check startup command and app settings.
3. Inspect latest deployment status.
4. Capture recent logs and classify root cause.
5. Apply rollback if SLA impact is active.

## Runbook Artifact Expectations

- Keep incident notes with:
  - symptom
  - impact
  - root cause
  - fix
  - prevention action

## Alerting Recommendation

- Trigger alerts on sustained health endpoint failures and restart loops.
