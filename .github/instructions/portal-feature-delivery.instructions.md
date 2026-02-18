---
description: 'Feature delivery standards for customer-success portal capabilities'
applyTo: 'apps/web/src/**/*, apps/api/src/**/*, docs/PORTAL_PRODUCT_BACKLOG.md'
---

# Portal Feature Delivery Standards

## Every Feature Must Include

- Objective tied to one customer success outcome.
- Acceptance criteria that are testable.
- Instrumentation plan (events + KPIs).
- Rollout and fallback strategy.

## KPI Mapping Requirement

Each feature PR should state:

- primary KPI affected
- baseline assumption
- expected directional impact
- how KPI is measured in-app

## UX Requirements

- Keep workflow simple and guided.
- Prefer progressive disclosure over dense single-page layouts.
- Surface blockers and next actions explicitly.

## Engineering Requirements

- Include API error/fallback handling.
- Add lightweight health/smoke validation where applicable.
- Update docs when behavior or workflow changes.
