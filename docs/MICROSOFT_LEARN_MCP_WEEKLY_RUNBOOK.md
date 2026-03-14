# Microsoft Learn MCP Weekly Runbook

Use this runbook to refresh portal guidance from the latest Microsoft Learn documentation every week.

## Objective

Keep recommendations, licensing guidance, and portal copy aligned to current Microsoft Learn updates using MCP as the authoritative source.

## Required Tools

- `microsoft_docs_search`
- `microsoft_docs_fetch`

## Weekly Steps

1. Run `microsoft_docs_search` for:

- Microsoft 365 Copilot release notes
- Copilot Studio what's new
- Microsoft Foundry what's new

2. For each high-value result, run `microsoft_docs_fetch` to pull full page content.

3. Update `docs/microsoft-learn-weekly-snapshot.json`:

- `capturedAt`
- `pages[].highlights`
- `pages[].changeSummary`
- `impacts[]` entries with affected files

4. Implement repository updates for each `impacts[].recommendedFiles` item.

5. Set each completed impact to `status: "completed"`.

6. Run validation:

```bash
npm run validate
```

7. If needed, run follow-up validation:

```bash
npm run validate:mindmaps
```

## Notes

- The weekly GitHub Action uses `docs/microsoft-learn-weekly-snapshot.json` as the source of truth.
- Validation reports action required when snapshot is stale (>8 days) or impacts remain pending.
- A scheduled reminder workflow (`.github/workflows/mcp-snapshot-refresh-reminder.yml`) opens an issue when the snapshot is stale (>6 days).
- GitHub Actions validates MCP snapshot outputs; MCP tool execution itself is performed in Copilot/agent tooling, then committed to this repository.
