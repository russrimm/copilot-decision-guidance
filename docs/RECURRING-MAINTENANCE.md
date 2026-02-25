# Recurring Maintenance Tasks

This document tracks all recurring automation and manual maintenance tasks for the Copilot Decision Guidance repository.

## Monthly Tasks

### 1. Licensing Guide Validation 🔄 (1st of each month)

**Frequency:** Monthly (automated with manual verification)  
**Duration:** 15-30 minutes  
**Priority:** High  
**Automation:** ✅ Automated GitHub Action + Manual review

**What it does:**

- Downloads latest Microsoft Power Platform Licensing Guide
- Checks Appendix for Copilot Studio pricing/entitlement changes
- Validates repository documentation accuracy (100% up-to-date)
- Creates GitHub issue if changes detected

**Manual steps required:**

1. Review GitHub issue created by automation (if any)
2. Download the PDF from: https://go.microsoft.com/fwlink/?linkid=2320995
3. Review Appendix section for:
   - Pricing updates (M365 Copilot, Copilot Studio, AI Builder)
   - Entitlement changes (what's included/excluded)
   - New features or capabilities
   - Usage limits or quota changes
4. Update affected files:
   - `.github/copilot-instructions.md`
   - `README.md` (pricing table)
   - `packages/decision-engine/src/data/licensing-data.json`
5. Commit changes: `chore: update licensing information (Month YYYY)`
6. Close the GitHub issue

**How to run manually:**

```bash
npm run validate:licensing
```

**Documentation:** [MONTHLY-LICENSING-VALIDATION.md](docs/MONTHLY-LICENSING-VALIDATION.md)

---

## Weekly Tasks

### 2. Microsoft Product Updates Validation 🔄 (Every Monday)

**Frequency:** Weekly  
**Duration:** 10-20 minutes  
**Priority:** Medium  
**Automation:** ✅ Automated GitHub Action

**What it does:**

- Checks Microsoft 365 Copilot release notes
- Checks Copilot Studio "What's New" documentation
- Checks Azure AI Foundry updates
- Monitors Microsoft 365 Roadmap
- Validates decision model questions remain relevant
- Validates mind map integrity and Microsoft 365 Copilot link policy

**Manual steps (if changes detected):**

1. Review validation report in GitHub Actions artifacts
2. Update questionnaire if new features affect decision criteria
3. Update decision-model.v1.json weights if needed
4. Update copilot-instructions.md with new capabilities
5. Run mind map validator and resolve any violations

**How to run manually:**

```bash
npm run validate
npm run validate:mindmaps
```

**Workflow:** `.github/workflows/validate-microsoft-updates.yml`

**Primary source links:**

- https://learn.microsoft.com/en-us/copilot/microsoft-365/release-notes
- https://learn.microsoft.com/en-us/microsoft-copilot-studio/whats-new
- https://learn.microsoft.com/en-us/azure/ai-studio/what-is-ai-studio
- https://www.microsoft.com/en-us/microsoft-365/roadmap?filters=Microsoft%20Copilot
- https://learn.microsoft.com/en-us/power-platform/release-plan/

---

## Quarterly Tasks

### 3. Decision Model Review 📋 (Every 3 months)

**Frequency:** Quarterly (March, June, September, December)  
**Duration:** 2-4 hours  
**Priority:** High  
**Automation:** ❌ Manual

**What to review:**

1. **Question Relevance**
   - Are all questions still relevant?
   - Do we need new questions for new features?
   - Are answer options clear and exhaustive?

2. **Scoring Weights**
   - Do weights reflect current product capabilities?
   - Has Microsoft strengthened any platform recently?
   - Do we need to adjust hybrid recommendations?

3. **Thresholds**
   - Is the `winMargin: 15` still appropriate?
   - Is the `hybridThreshold: 10` working well?
   - Review actual user decision distributions

4. **User Feedback**
   - Review any issues or feedback about decision accuracy
   - Check if users are surprised by recommendations
   - Validate with real-world implementations

**How to test:**

```bash
npm run test
npm run test:prod
```

**Files to review:**

- `packages/decision-engine/src/data/decision-model.v1.json`
- `packages/decision-engine/src/scoring.ts`
- `packages/decision-engine/src/recommendations.ts`

---

### 4. Dependency Updates 📋 (Every 3 months)

**Frequency:** Quarterly  
**Duration:** 1-2 hours  
**Priority:** Medium  
**Automation:** 🔔 Dependabot alerts enabled

**What to update:**

1. **Security Updates** (immediate when alerted)

   ```bash
   npm audit fix
   ```

2. **Minor Updates** (quarterly)

   ```bash
   npm outdated
   npm update
   ```

3. **Major Updates** (quarterly, test carefully)
   - React (currently 18.x)
   - TypeScript (currently 5.x)
   - Vite (currently 6.x)
   - Express (currently 4.x)

4. **Test after updates:**
   ```bash
   npm run build
   npm run test
   npm run dev  # Test locally
   ```

**Files affected:**

- `package.json` (root)
- `apps/api/package.json`
- `apps/web/package.json`
- `packages/decision-engine/package.json`

---

## Annual Tasks

### 5. Comprehensive Documentation Audit 📋 (Once per year)

**Frequency:** Annually (January)  
**Duration:** 1 full day  
**Priority:** Medium  
**Automation:** ❌ Manual

**What to audit:**

1. **README.md**
   - Installation instructions accurate
   - Feature list complete
   - Screenshots up-to-date
   - Pricing table current

2. **Instruction Files**
   - `.github/copilot-instructions.md` - Complete and accurate
   - `.github/instructions/*.instructions.md` - Still relevant
   - Architecture decisions documented

3. **Code Comments**
   - Complex logic explained
   - TODO items addressed or removed
   - API endpoints documented

4. **User-Facing Content**
   - Landing page copy current
   - Result page descriptions accurate
   - Admin dashboard help text clear

---

### 6. Licensing Report Archive 📋 (Once per year)

**Frequency:** Annually (December)  
**Duration:** 30 minutes  
**Priority:** Low  
**Automation:** ❌ Manual

**What to archive:**

1. Download all monthly licensing validation reports from GitHub Actions artifacts
2. Create summary document: `docs/licensing-changes-YYYY.md`
3. Archive in: `.github/data/licensing-snapshots/YYYY/`
4. Keep for compliance/audit purposes (7 years recommended)

---

## Ad-Hoc Tasks

### 7. Microsoft Pricing Changes 🔔 (As announced)

**Frequency:** Ad-hoc (when Microsoft announces changes)  
**Duration:** 1-2 hours  
**Priority:** Critical  
**Automation:** ❌ Manual (but monthly check catches most)

**Trigger sources:**

- Microsoft blog announcements
- Email notifications from Microsoft
- Monthly licensing validation catching early

**What to update:**

1. Pricing in README.md
2. Pricing in copilot-instructions.md
3. Pricing in licensing-data.json
4. Cost comparison tables
5. Decision recommendations if pricing affects TCO significantly

---

### 8. New Microsoft Product Features 🔔 (As announced)

**Frequency:** Ad-hoc (major releases)  
**Duration:** 2-4 hours  
**Priority:** High  
**Automation:** 🔔 Weekly check alerts

**What to evaluate:**

1. Does this change decision criteria?
2. Do we need new questionnaire questions?
3. Do scoring weights need adjustment?
4. Do recommendations need updates?

**Recent examples:**

- Microsoft Agent Builder (added as 5th option)
- Azure AI Foundry (replaces Azure AI Studio)
- Multi-agent orchestration capabilities

---

## Automation Status Summary

| Task                       | Frequency | Automation      | Alert            | Manual Work |
| -------------------------- | --------- | --------------- | ---------------- | ----------- |
| Licensing Guide Validation | Monthly   | ✅ Script       | ✅ Issue         | 30 min      |
| Product Updates            | Weekly    | ✅ Script       | ✅ Issue         | 15 min      |
| Decision Model Review      | Quarterly | ❌              | 🔔 Calendar      | 3 hrs       |
| Dependency Updates         | Quarterly | 🔔 Dependabot   | ✅ PR            | 2 hrs       |
| Documentation Audit        | Annually  | ❌              | 🔔 Calendar      | 1 day       |
| Licensing Archive          | Annually  | ❌              | 🔔 Calendar      | 30 min      |
| Pricing Changes            | Ad-hoc    | ❌              | 🔔 Monthly catch | 2 hrs       |
| New Features               | Ad-hoc    | 🔔 Weekly catch | ✅ Issue         | 3 hrs       |

**Legend:**

- ✅ = Fully automated or enabled
- 🔔 = Notification/reminder exists
- ❌ = Fully manual

---

## Setting Up Reminders

### GitHub Actions (Automated)

Already configured:

- Monthly: Licensing validation (1st of month)
- Weekly: Product updates (Mondays)

### Calendar Reminders (Manual)

Set up recurring calendar events for:

- **1st of each month:** Check licensing validation GitHub issue
- **1st of quarter:** Decision model review (Mar 1, Jun 1, Sep 1, Dec 1)
- **1st of quarter:** Dependency updates (same dates)
- **January 15:** Annual documentation audit
- **December 15:** Annual licensing report archive

### Email Notifications

Configure in GitHub:

1. Watch this repository
2. Custom > Issues + Pull Requests
3. Get emails when automation creates issues

---

## Maintenance Log

Keep track of when tasks were last completed:

| Task                  | Last Completed | Next Due     | Completed By   | Notes      |
| --------------------- | -------------- | ------------ | -------------- | ---------- |
| Licensing Validation  | (auto)         | Mar 1, 2026  | GitHub Actions |            |
| Product Updates       | (auto)         | Weekly       | GitHub Actions |            |
| Decision Model Review | -              | Mar 1, 2026  | -              | First run  |
| Dependency Updates    | -              | Mar 1, 2026  | -              | Post-audit |
| Documentation Audit   | -              | Jan 15, 2027 | -              | Annual     |
| Licensing Archive     | -              | Dec 15, 2026 | -              | Annual     |

---

## Questions or Issues?

- **Automation not running?** Check `.github/workflows/` and GitHub Actions settings
- **False positives?** Review validation scripts in `scripts/` directory
- **Need to adjust schedule?** Edit workflow YAML files
- **Want to add new task?** Create issue with label `maintenance`

---

**Last Updated:** February 16, 2026  
**Maintained By:** Repository maintainers  
**Review Frequency:** Update this doc when adding new maintenance tasks
