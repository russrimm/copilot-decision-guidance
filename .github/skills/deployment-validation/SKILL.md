---
name: deployment-validation
description: Validate Azure App Service deployments for this repository. Use when asked to verify startup commands, health endpoints, deployment success, post-deploy smoke checks, rollback readiness, or troubleshoot app startup/log stream issues.
license: Apache-2.0
---

# Deployment Validation Skill

Run consistent post-deploy validation and produce actionable diagnostics.

## When to Use This Skill

- User reports app unavailable after deploy
- Need to verify health after GitHub Actions deployment
- Need structured triage for startup failures

## Validation Checklist

1. Confirm app state and startup command.
2. Verify `/api/health` and root page response.
3. Validate key feature endpoint(s) behavior.
4. Review log stream/startup logs.
5. Determine pass/fail and rollback recommendation.

## Pass Criteria

- Health endpoint returns 200 and expected JSON shape.
- Root page responds successfully.
- No active startup crash/restart loop.

## Failure Output

- Symptom
- Root cause hypothesis
- Minimal fix
- Verification commands
- Rollback guidance
