---
name: Microsoft Product Updates Detected (Automated)
about: Validation workflow detected changes in Microsoft product documentation
title: '📋 Microsoft Product Updates - [DATE]'
labels: documentation, needs-review, automated
assignees: ''
---

<!-- This issue was automatically created by the Microsoft Updates Validation workflow -->

## 🔍 Summary

The automated validation workflow has detected changes in Microsoft product documentation that may require updates to this repository.

**Validation Date:** [AUTO-FILLED]  
**Total Changes Detected:** [AUTO-FILLED]  
**Severity:** [AUTO-FILLED]

---

## 📊 Changes Detected

<!-- Detailed changes will be added here by the workflow -->

---

## ✅ Required Actions

### 1. Review Changes

- [ ] Review the validation report (attached as artifact)
- [ ] Verify changes against official Microsoft sources
- [ ] Confirm accuracy of detected changes

### 2. Update Files

If changes are confirmed, update the following files as needed:

- [ ] `packages/decision-engine/src/data/licensing-data.json`
  - Update pricing information
  - Update feature lists
  - Update metadata dates

- [ ] `.github/copilot-instructions.md`
  - Update comparison tables
  - Update feature descriptions
  - Update pricing references

- [ ] `docs/decision-model.md`
  - Update methodology if needed
  - Update example scenarios
  - Update references

- [ ] Other documentation files
  - README.md
  - FAQ sections
  - Guides and tutorials

### 3. Test Changes

- [ ] Run validation script locally: `npm run validate`
- [ ] Test decision engine: `npm test`
- [ ] Review wizard flow in browser
- [ ] Verify export functionality

### 4. Merge Updates

- [ ] Review auto-generated draft PR (if created)
- [ ] OR create manual PR with updates
- [ ] Ensure all tests pass
- [ ] Merge when approved

---

## 🔗 Resources

- **Workflow Run:** [LINK TO ACTIONS RUN]
- **Validation Report:** Download from artifacts
- **Draft PR:** [LINK IF CREATED]
- **Microsoft Sources:**
  - [Microsoft 365 Roadmap](https://www.microsoft.com/en-us/microsoft-365/roadmap?filters=Microsoft%20Copilot)
  - [Power Platform Release Planner](https://learn.microsoft.com/en-us/power-platform/release-plan/)
  - [Copilot Studio What's New](https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-whats-new)
  - [Power Platform Pricing](https://www.microsoft.com/en-us/power-platform/products/power-apps/pricing)

---

## 📝 Notes

- This is an automated issue created by the validation workflow
- Changes should be verified manually before applying
- Close this issue once updates are complete
- If changes are not applicable, add a comment explaining why and close

---

## 🆘 Need Help?

- See [AUTOMATED_VALIDATION.md](../docs/AUTOMATED_VALIDATION.md) for full documentation
- Review [POWER_AUTOMATE_SETUP.md](../docs/POWER_AUTOMATE_SETUP.md) for notification setup
- Check workflow logs in the Actions tab
- Contact the repository maintainers

---

**Automation Status:** 🤖 Active  
**Next Scheduled Run:** Monday 9 AM UTC  
**Last Updated:** [TIMESTAMP]
