# Monthly Licensing & Survey Question Validation Process

This document describes the automated monthly process for:

1. Validating Copilot Studio licensing information against the official Microsoft Power Platform Licensing Guide
2. Validating survey questions against Microsoft 365 Copilot enablement resources and documentation

## Overview

**Frequency:** 1st of each month at 9:00 AM UTC  
**Duration:** ~10-15 minutes per validation (20-30 minutes total)  
**Primary Sources:**

- [Power Platform Licensing Guide](https://go.microsoft.com/fwlink/?linkid=2320995)
- [Microsoft 365 Copilot Documentation Hub](https://learn.microsoft.com/en-us/copilot/microsoft-365/)
- [M365 Copilot Enablement Resources](https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources)  
  **Automation:** GitHub Actions workflow + TypeScript validation scripts

## What Gets Validated

### 1. **Pricing Information**

- Microsoft 365 Copilot: $30/user/month
- Copilot Studio Pay-as-you-go (Copilot Credits consumption)
- Copilot Studio License (Copilot Credit capacity pack: 25,000 Copilot Credits per pack)
- Copilot Credit Pre-Purchase Plan (P3)
- Microsoft Agent Pre-Purchase Plan (P3)
- Premium connector costs
- AI Builder capacity pricing

### 2. **Entitlements & Inclusions**

- What's included with M365 Copilot license
- What requires separate Copilot Studio license
- Free vs. paid connector capabilities
- Channel availability (Teams, Web, WhatsApp, etc.)

### 3. **Usage Limits & Quotas**

- Copilot Credits consumption and fair usage boundaries
- Request capacity allocations
- API call quotas
- Storage limitations

### 4. **Feature Availability**

- Copilot Studio in Teams/SharePoint/Word/Excel/Outlook
- External channel publishing requirements
- ALM and governance capabilities
- Premium features and add-ons

### 5. **Survey Questions** (New - includes M365 Copilot enablement resources)

- Question relevance against current Microsoft guidance
- Answer options comprehensiveness
- Alignment with Microsoft 365 Copilot capabilities
- Integration patterns and architectures
- Deployment guidance and best practices
- Role-specific recommendations
- Success metrics and measurement approaches

## Primary Sources Referenced

### For Licensing Validation:

- **Power Platform Licensing Guide** (PDF): https://go.microsoft.com/fwlink/?linkid=2320995
  - Appendix section specifically checked
  - Pricing tables
  - Entitlement matrices

### For Survey Question Validation:

- **Microsoft 365 Copilot Documentation Hub** (PRIMARY): https://learn.microsoft.com/en-us/copilot/microsoft-365/
  - Top-level source for all M365 Copilot topics
  - Comprehensive product information
  - Feature capabilities and limitations

- **M365 Copilot Enablement Resources** (PRIMARY): https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources
  - Adoption guidance
  - Readiness assessments
  - Deployment recommendations
  - Role-specific guidance
  - Success metrics and KPIs

- **M365 Copilot Release Notes**: https://learn.microsoft.com/en-us/copilot/microsoft-365/release-notes
  - Latest feature releases
  - Deprecation notices
  - Platform updates

- **Copilot Studio What's New**: https://learn.microsoft.com/en-us/microsoft-copilot-studio/whats-new
  - New Copilot Studio capabilities
  - Platform changes

- **Azure AI Foundry**: https://learn.microsoft.com/en-us/azure/ai-studio/what-is-ai-studio
  - Azure AI platform updates
  - Model capabilities

## Automation Architecture

```
Monthly Trigger (1st of month)
    ↓
GitHub Actions Workflow
    ↓
├── validate-licensing-guide.ts
│   ├── Download metadata from licensing guide URL
│   ├── Compare Appendix sections with last month
│   ├── Validate pricing in repository files
│   ├── Validate features in repository files
│   └── Generate licensing validation report
│
└── validate-survey-questions.ts
    ├── Fetch all primary Microsoft sources
    ├── Parse M365 Copilot enablement resources
    ├── Validate each question group
    ├── Check answer options against current docs
    ├── Identify outdated or missing content
    └── Generate survey validation report
    ↓
If changes detected:
├── Create GitHub Issue with findings (combined)
├── Upload report artifacts (kept for 1 year)
├── Send Slack notification (optional)
└── Commit check data to .github/data/
```

## Files Involved

### Validation Scripts

- **Location:** `scripts/validate-licensing-guide.ts` + `scripts/validate-survey-questions.ts`
- **Purpose:** Automated validation logic
- **Language:** TypeScript
- **Dependencies:** Node.js 20+, ts-node

### GitHub Action

- **Location:** `.github/workflows/validate-licensing-monthly.yml`
- **Trigger:** Cron schedule `0 9 1 * *` (monthly)
- **Manual Trigger:** Available via workflow_dispatch

### Data Storage

- **Licensing Check History:** `.github/data/last-licensing-check.json`
- **Licensing Snapshots:** `.github/data/licensing-snapshots/YYYY-MM.json`
- **Survey Check History:** Stored in workflow artifacts
- **Reports:** Uploaded as workflow artifacts (365-day retention)

### Repository Files Validated

**For Licensing:**

- `.github/copilot-instructions.md` - Main licensing guidance
- `README.md` - Pricing table and feature comparison
- `packages/decision-engine/src/data/licensing-data.json` - Structured data

**For Survey Questions:**

- `packages/decision-engine/src/data/decision-model.v1.json` - Question definitions
- Question text relevance
- Answer option comprehensiveness
- Alignment with Microsoft guidance

## How It Works

### Automated Steps (GitHub Actions)

1. **Trigger:** Runs automatically on the 1st of each month at 9 AM UTC
2. **Checkout:** Gets latest repository code
3. **Setup:** Installs Node.js 20 and dependencies
4. **Execute Licensing Validation:** Runs `validate-licensing-guide.ts`
   - Downloads licensing guide metadata
   - Compares Appendix sections with last month
   - Validates pricing and features in repository files
   - Generates licensing-validation-report.md + JSON
5. **Execute Survey Validation:** Runs `validate-survey-questions.ts`
   - Fetches all 5 primary Microsoft sources
   - Validates question relevance against current docs
   - Checks answer options comprehensiveness
   - Generates survey-validation-report.md + JSON
6. **Report:** Combines both reports into comprehensive validation summary
7. **Issue:** Creates GitHub issue if ANY changes detected in either validation
8. **Artifact:** Uploads all reports for download (365-day retention)
9. **Commit:** Saves check data for next month's comparison

### Manual Steps for Licensing (Required)

Since the licensing guide is a PDF, some steps require human verification:

1. **Download the Guide**
   - Visit: https://go.microsoft.com/fwlink/?linkid=2320995
   - This redirects to the latest PDF version
   - Save as: `licensing-guide-YYYY-MM.pdf`

2. **Review the Appendix**
   - Navigate to the "Appendix" section (usually near end)
   - Look for: "Microsoft Copilot Studio" section
   - Check for: Pricing updates, new features, entitlement changes

3. **Compare with Last Month**
   - Open previous month's snapshot in `.github/data/licensing-snapshots/`
   - Identify what changed (pricing, features, limits)

4. **Update Repository**
   - If pricing changed: Update `.github/copilot-instructions.md` and `README.md`
   - If features changed: Update feature comparison tables
   - If limits changed: Update `licensing-data.json`

### Manual Steps for Survey Questions (Required)

Review the survey validation report and take action:

1. **Review Flagged Questions**
   - Check survey-validation-report.md for questions marked "⚠️ Needs Review"
   - Read the specific issues identified for each question

2. **Verify Against Microsoft Sources**
   - Visit the M365 Copilot hub: https://learn.microsoft.com/en-us/copilot/microsoft-365/
   - Review enablement resources: https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources
   - Check latest release notes for recent changes

3. **Update Decision Model**
   - Edit `packages/decision-engine/src/data/decision-model.v1.json`
   - Update question text if outdated
   - Add/remove/modify answer options as needed
   - Ensure alignment with current Microsoft guidance

4. **Test Changes**
   - Run `npm run validate:survey` locally
   - Verify all questions now pass validation
   - Test the wizard UI to ensure questions display correctly

### Closing Out Monthly Validation

1. **Document Changes**
   - Add entry to `CHANGELOG.md` with all licensing and survey updates
   - Commit with message: `chore: monthly validation updates (Month YYYY)`

2. **Close Issue**
   - Mark the GitHub issue complete
   - Add a comment summarizing:
     - Licensing changes applied (or none found)
     - Survey question updates applied (or none needed)
     - Any follow-up actions required

## Running Manually

### Local Execution

**Run Licensing Validation:**

```bash
# Install dependencies
npm install

# Run licensing validation
npm run validate:licensing
# or
ts-node scripts/validate-licensing-guide.ts
```

**Run Survey Question Validation:**

```bash
# Run survey validation
npm run validate:survey
# or
ts-node scripts/validate-survey-questions.ts
```

**Run Both:**

```bash
npm run validate:licensing && npm run validate:survey
```

### Manual GitHub Action Trigger

1. Go to **Actions** tab in GitHub
2. Select "Monthly Copilot Studio Licensing & Survey Validation"
3. Click "Run workflow"
4. (Optional) Check "force_notification" to create issue regardless of whether changes are detected

## Configuration

### Environment Variables

None required - uses public Microsoft documentation URLs

### Secrets (Optional)

- `SLACK_WEBHOOK_URL` - For Slack notifications when changes detected

### Workflow Schedule

To change the schedule, edit `.github/workflows/validate-licensing-monthly.yml`:

```yaml
schedule:
  - cron: '0 9 1 * *' # Minute Hour Day Month DayOfWeek
```

## Troubleshooting

### Issue: Validation script fails

**Solution:** Check Node.js version (requires 20+) and ensure dependencies installed

```bash
node --version  # Should be v20+
npm install
```

### Issue: No issue created despite changes

**Solution:** Check workflow permissions (needs `issues: write`)

- Go to Settings > Actions > General > Workflow permissions
- Enable "Read and write permissions"

### Issue: Cannot download licensing guide

**Solution:** The URL is a redirect to a PDF

1. Visit https://go.microsoft.com/fwlink/?linkid=2320995 in browser
2. Download manually
3. The redirect URL changes monthly, so use the fwlink

### Issue: Survey validation fails to fetch sources

**Solution:** Network issues or broken Microsoft URLs

1. Check each source URL manually in browser:
   - https://learn.microsoft.com/en-us/copilot/microsoft-365/
   - https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources
2. If URL moved, update `PRIMARY_SOURCES` array in `validate-survey-questions.ts`
3. Microsoft may temporarily rate-limit; re-run after 5 minutes

### Issue: False positives (no actual changes)

**Solution:**

- **For licensing:** The baseline may need updating
  1. Review `.github/data/last-licensing-check.json`
  2. Delete it to reset baseline
  3. Re-run validation
- **For survey:** Content may have reorganized without substantive changes
  1. Review the specific questions flagged
  2. Manually verify against Microsoft docs
  3. If content is equivalent, no changes needed

### Issue: All questions flagged as needing review

**Solution:** May indicate Microsoft documentation structure changed

1. Open survey-validation-report.md
2. Look for patterns (e.g., all failing same check)
3. May need to update validation logic in `validate-survey-questions.ts`
4. Check if Microsoft reorganized their documentation hierarchy

## Maintenance

### Monthly (Automated ✅)

- Licensing validation runs automatically on 1st of month at 9 AM UTC
- Survey question validation runs immediately after licensing validation
- Combined issue created if ANY changes detected in either validation
- Reports uploaded as artifacts (licensing + survey)

### Monthly (Manual 📋)

**For Licensing:**

- Download and review Appendix of licensing guide PDF
- Compare with automated validation findings
- Update repository content if pricing/features/entitlements changed

**For Survey Questions:**

- Review flagged questions in survey-validation-report.md
- Verify against Microsoft 365 Copilot documentation hub
- Update decision-model.v1.json if questions outdated
- Test changes locally before committing

**Completion:**

- Close validation issue once all updates applied
- Document changes in CHANGELOG.md

### Quarterly (Manual 📋)

- Review validation script accuracy for both scripts
- Update known pricing in `validate-licensing-guide.ts`
- Update validation logic in `validate-survey-questions.ts` if Microsoft doc structure changed
- Verify all repository files still relevant

### Annually (Manual 📋)

- Download all monthly reports from artifacts (365-day retention)
- Archive for compliance/audit purposes
- Review validation process for improvements
- Document lessons learned and refine automation

## Notification Channels

### GitHub Issue

- **Created:** When licensing OR survey changes detected, or validation fails
- **Labels:** `licensing`, `survey-questions`, `documentation`, `monthly-maintenance`
- **Assignee:** (none by default - can configure in workflow)
- **Content:** Combined report showing both licensing and survey validation results

### Slack (Optional)

- **Enabled:** When `SLACK_WEBHOOK_URL` secret is set
- **Message:** Summary with links to issue, licensing guide, and M365 Copilot docs
- **Configure:** Add webhook URL in repository secrets

### Email

- **Enabled:** Via GitHub watch preferences
- **Recommendation:** Watch "Issues" to get notified when monthly validation issue created
- **Configure:** Watch repository > Custom > Issues

## Historical Data

### Artifacts

All validation reports are stored as workflow artifacts for 365 days:

- **Location:** Actions > Workflow run > Artifacts

## Historical Data

### Artifacts

All validation reports are stored as workflow artifacts for 365 days:

- **Location:** Actions > Workflow run > Artifacts
- **Files:**
  - `licensing-validation-report.md` - Human-readable licensing report
  - `licensing-validation-results.json` - Machine-readable licensing data
  - `survey-validation-report.md` - Human-readable survey question report
  - `survey-validation-results.json` - Machine-readable survey data
- **Purpose:** Compliance, audit trail, trend analysis, historical comparison

### Check Data

**Licensing Data** stored in repository at `.github/data/`:

- `last-licensing-check.json` - Last check date, guide version, known pricing
- `licensing-snapshots/YYYY-MM.json` - Monthly snapshots for comparison

**Survey Data:**

- Currently stored only in workflow artifacts
- Can be extended to `.github/data/` if historical tracking needed

## Best Practices

1. **Review Promptly:** Check the issue within 48 hours of creation
2. **Document Changes:** Always note what changed and why it was updated
3. **Test Locally:** Run both validation scripts locally before committing updates
   ```bash
   npm run validate:licensing && npm run validate:survey
   ```
4. **Verify Source:** Always use official Microsoft documentation as source of truth
   - For licensing: Use the official Power Platform Licensing Guide PDF
   - For M365 Copilot: Use https://learn.microsoft.com/en-us/copilot/microsoft-365/ as primary source
   - For enablement: Use https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources
5. **Keep History:** Don't delete old artifacts - useful for trending and compliance audit
6. **Cross-Validate:** When survey validation flags questions, verify against BOTH licensing guide and M365 docs
7. **Update Decision Model First:** Before updating documentation, ensure decision-model.v1.json is accurate

## Related Documentation

### Official Microsoft Sources

- [Microsoft 365 Copilot Documentation Hub](https://learn.microsoft.com/en-us/copilot/microsoft-365/) ⭐ Primary Source
- [M365 Copilot Enablement Resources](https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources) ⭐ Primary Source
- [Microsoft Power Platform Licensing Guide](https://go.microsoft.com/fwlink/?linkid=2320995) ⭐ Primary Source
- [M365 Copilot Release Notes](https://learn.microsoft.com/en-us/copilot/microsoft-365/release-notes)
- [Copilot Studio What's New](https://learn.microsoft.com/en-us/microsoft-copilot-studio/whats-new)
- [Copilot Studio Documentation](https://learn.microsoft.com/en-us/microsoft-copilot-studio/)
- [Power Platform Licensing FAQ](https://learn.microsoft.com/en-us/power-platform/admin/pricing-billing-skus)
- [Azure AI Foundry Overview](https://learn.microsoft.com/en-us/azure/ai-studio/what-is-ai-studio)

### Repository Documentation

- [RECURRING-MAINTENANCE.md](./RECURRING-MAINTENANCE.md) - Overview of all recurring tasks
- [README.md](../README.md) - Main repository documentation

## Support

For questions about:

- **The validation process:** See this document or check workflow logs
- **Licensing questions:** Contact Microsoft support or your CSAM
- **Repository updates:** Create an issue or pull request

---

**Last Updated:** February 2026  
**Next Review:** May 2026  
**Maintained By:** Repository maintainers
