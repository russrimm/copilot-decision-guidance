---
description: 'Security guardrails for secrets, credentials, and sensitive configuration'
applyTo: '**/*'
---

# Security and Secrets Guardrails

## Absolute Rules

- Never commit secrets, PATs, client secrets, or private keys.
- Keep credentials in secure environment configuration only.
- Redact secrets from logs and error output.

## Development Hygiene

- Use `.env.example` as template only (no real secrets).
- Rotate any credential immediately if exposed in code, logs, or chat.
- Prefer managed identity or federated credentials over static secrets where possible.

## Validation Expectations

- Before merge/deploy, verify no sensitive values in:
  - git diff
  - workflow logs
  - generated docs

## Incident Response

If a secret is exposed:

1. Revoke/rotate immediately.
2. Remove from source and history if required.
3. Update affected environment variables.
4. Document incident and prevention actions.
