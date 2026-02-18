---
description: 'Dependency management policy for monorepo workspaces'
applyTo: 'package.json, package-lock.json, apps/*/package.json, packages/*/package.json'
---

# Monorepo Dependency Policy

## Upgrade Safety Rules

- Prefer patch/minor upgrades over major upgrades.
- For frontend:
  - keep `react` and `react-dom` aligned at the same major/minor line.
  - keep `react-router` and `react-router-dom` aligned at the same version line.
- Do not introduce `react-router-dom` v7 unless React compatibility and route behavior validation are explicitly completed.

## Change Procedure

1. Update workspace `package.json` first.
2. Update lockfile.
3. Build affected workspace(s).
4. Run targeted smoke checks.

## Required Validation

- For `apps/web` changes: run `npm run build --workspace=apps/web`.
- For `apps/api` changes: run `npm run build --workspace=apps/api`.
- Document any known non-blocking warnings separately from functional failures.

## Prohibited

- Silent major upgrades.
- Mixing incompatible framework majors across workspaces.
