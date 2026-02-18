---
description: 'Contract and fallback behavior for Copilot Studio release planner integration'
applyTo: 'apps/api/src/services/release-planner.ts, apps/web/src/pages/CopilotStudioReleaseDates.tsx, docs/*release*'
---

# Release Planner Data Contract

## Data Source Priority

1. Primary source: `https://aka.ms/ReleasePlans/Planner/API/AllPlans`
2. Filter strictly to Copilot Studio product variants.

## Contract Expectations

- Required output fields:
  - `date`
  - `featureName`
  - `releaseWave` (optional)
  - `releasePlanId` (optional)
- Date format must be normalized to `YYYY-MM-DD`.

## Linking Rules

- Do not render clickable feature links unless plan IDs are validated against working URL pattern.
- If links are not reliable, render feature names as plain text.

## Reliability Requirements

- Cache source responses with TTL.
- Fail gracefully with user-facing fallback message.
- Log source URL and parse failures for diagnostics.
