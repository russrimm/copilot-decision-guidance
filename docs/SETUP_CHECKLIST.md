# Automated Validation System - Complete Setup Checklist

Use this checklist to ensure your automated validation system is properly configured and running.

## ⏱️ Time Estimate

- **Basic Setup:** 15-20 minutes
- **Testing & Verification:** 10-15 minutes
- **Customization (Optional):** 10-30 minutes
- **Total:** ~45-65 minutes for complete setup

---

## 📋 Phase 1: Prerequisites (5 minutes)

### Environment Check

- [ ] Node.js 20+ installed: `node --version`
- [ ] npm 10+ installed: `npm --version`
- [ ] Git installed and configured
- [ ] GitHub repository access (write permissions)
- [ ] Microsoft 365 account (for Power Automate) OR Azure subscription (for Logic Apps)
- [ ] GitHub CLI installed (optional but recommended): `gh --version`

### Access Verification

- [ ] Can create GitHub Secrets
- [ ] Can enable GitHub Actions
- [ ] Can access Power Automate (make.powerautomate.com)
- [ ] Can create flows in Power Automate

---

## 📋 Phase 2: Local Setup (10 minutes)

### Install Dependencies

```bash
cd copilot-decision-guidance
npm install
```

**Verify:**

- [ ] No error messages during install
- [ ] `node_modules/` folder created
- [ ] `ts-node` available: `npx ts-node --version`
- [ ] TypeScript available: `npx tsc --version`

### Test Validation Script Locally

```bash
npm run validate
```

**Expected Output:**

- [ ] Script runs without errors
- [ ] Checks 5+ Microsoft sources
- [ ] Generates `validation-report.md`
- [ ] Generates `validation-results.json`
- [ ] Exits with code 0 (no changes) or 1 (changes detected)

**Troubleshooting:**

- If fails: Check network connectivity
- If can't find TypeScript: Run `npm install -g typescript ts-node`
- If module errors: Delete `node_modules` and run `npm install` again

---

## 📋 Phase 3: Power Automate Setup (15 minutes)

### Option A: Import Template (Easier)

1. **Download Template:**
   - [ ] Locate `docs/power-automate-flow-template.json`

2. **Import to Power Automate:**
   - [ ] Go to [make.powerautomate.com](https://make.powerautomate.com)
   - [ ] Click **My flows** → **Import** → **Import Package (Legacy)**
   - [ ] Upload the JSON template
   - [ ] Click **Import**

3. **Configure Connections:**
   - [ ] Office 365 Outlook - Create/select connection
   - [ ] Approvals - Create/select connection
   - [ ] Teams (optional) - Create/select connection

4. **Customize Flow:**
   - [ ] Open the imported flow
   - [ ] Update email addresses (search for `your-email@example.com`)
   - [ ] Update Teams channel ID (if using Teams integration)
   - [ ] Save the flow

5. **Get Webhook URL:**
   - [ ] Open the flow in edit mode
   - [ ] Click on the first "When an HTTP request is received" trigger
   - [ ] Copy the **HTTP POST URL** (appears after saving)
   - [ ] Save this URL securely (you'll need it for GitHub)

### Option B: Create Manually

Follow the detailed guide: [docs/POWER_AUTOMATE_SETUP.md](../POWER_AUTOMATE_SETUP.md)

- [ ] HTTP trigger configured
- [ ] JSON schema added
- [ ] Email action configured
- [ ] Approval action configured (optional)
- [ ] Webhook URL copied

---

## 📋 Phase 4: GitHub Configuration (5 minutes)

### Add GitHub Secret

**Via GitHub UI:**

1. [ ] Go to your repository on GitHub
2. [ ] Click **Settings** → **Secrets and variables** → **Actions**
3. [ ] Click **New repository secret**
4. [ ] Name: `POWER_AUTOMATE_WEBHOOK_URL`
5. [ ] Value: Paste your webhook URL from Power Automate
6. [ ] Click **Add secret**

**Via GitHub CLI (Alternative):**

```bash
gh secret set POWER_AUTOMATE_WEBHOOK_URL --body "YOUR_WEBHOOK_URL"
```

### Verify GitHub Actions

- [ ] Go to **Actions** tab in GitHub
- [ ] Verify Actions are enabled
- [ ] See "Validate Microsoft Product Updates" workflow listed
- [ ] No error messages or warnings

---

## 📋 Phase 5: Testing (15 minutes)

### Test 1: Local Validation

```bash
npm run validate
```

**Verify:**

- [ ] Script completes successfully
- [ ] Report generated
- [ ] No errors in output

### Test 2: Manual Workflow Trigger (With Notification)

**Via GitHub UI:**

1. [ ] Go to **Actions** tab
2. [ ] Select "Validate Microsoft Product Updates"
3. [ ] Click **Run workflow** (right side)
4. [ ] Check **force_notification** checkbox
5. [ ] Click **Run workflow** (green button)
6. [ ] Wait 1-2 minutes

**Via GitHub CLI:**

```bash
gh workflow run validate-microsoft-updates.yml -f force_notification=true
```

**Expected Results:**

- [ ] Workflow appears in Actions list
- [ ] Status changes to "In progress" then "Success" (green checkmark)
- [ ] Email received within 2-3 minutes
- [ ] Email contains validation report
- [ ] Email has correct formatting
- [ ] Links in email work correctly

### Test 3: Approval Workflow (If Configured)

- [ ] Email includes approval request
- [ ] Can approve/reject from email
- [ ] Approval/rejection triggers subsequent actions
- [ ] Follow-up email received
- [ ] Teams notification posted (if configured)

### Test 4: Issue and PR Creation

After manual trigger with changes:

- [ ] GitHub issue created automatically
- [ ] Issue has correct labels (documentation, needs-review, automated)
- [ ] Issue contains validation report
- [ ] Draft PR created (if changes detected)
- [ ] PR has correct title and description

---

## 📋 Phase 6: Verification (5 minutes)

### Workflow Files Check

- [ ] `.github/workflows/validate-microsoft-updates.yml` exists
- [ ] Workflow has correct schedule (cron expression)
- [ ] Workflow has manual trigger configured
- [ ] All jobs defined correctly

### Script Files Check

- [ ] `scripts/validate-microsoft-updates.ts` exists
- [ ] `scripts/tsconfig.json` exists
- [ ] Script runs without TypeScript errors

### Documentation Check

- [ ] `docs/AUTOMATED_VALIDATION.md` accessible
- [ ] `docs/QUICKSTART_AUTOMATED_VALIDATION.md` accessible
- [ ] `docs/POWER_AUTOMATE_SETUP.md` accessible
- [ ] `docs/AUTOMATION_SUMMARY.md` accessible
- [ ] `docs/power-automate-flow-template.json` accessible

### package.json Check

- [ ] `npm run validate` command defined
- [ ] `npm run validate:watch` command defined
- [ ] Dev dependencies include `ts-node` and `typescript`

---

## 📋 Phase 7: Schedule Verification (2 minutes)

### Confirm Weekly Schedule

Current schedule: **Monday 9 AM UTC**

**Check your timezone:**

- EST (UTC-5): Monday 4 AM
- PST (UTC-8): Monday 1 AM
- GMT (UTC+0): Monday 9 AM
- IST (UTC+5:30): Monday 2:30 PM

**Change schedule (if needed):**

1. [ ] Edit `.github/workflows/validate-microsoft-updates.yml`
2. [ ] Modify cron expression: `'0 9 * * 1'`
3. [ ] Commit and push changes
4. [ ] Verify in Actions tab

**Cron Examples:**

```yaml
# Daily at 9 AM UTC
- cron: '0 9 * * *'

# Twice weekly (Monday and Thursday)
- cron: '0 9 * * 1,4'

# First day of month
- cron: '0 9 1 * *'

# Every 6 hours
- cron: '0 */6 * * *'
```

---

## 📋 Phase 8: Monitoring Setup (5 minutes)

### Enable Notifications

**GitHub Actions Notifications:**

- [ ] Go to GitHub Settings (your profile)
- [ ] Navigate to **Notifications**
- [ ] Enable **Actions** notifications
- [ ] Choose delivery method (email/web)

**Power Automate Monitoring:**

- [ ] Go to [make.powerautomate.com](https://make.powerautomate.com)
- [ ] Open your flow
- [ ] Enable **Run history** notifications
- [ ] Set up failure alerts

### Create Monitoring Dashboard (Optional)

- [ ] Bookmark GitHub Actions tab
- [ ] Bookmark Power Automate flow
- [ ] Add calendar reminder to check weekly
- [ ] Set up status page (if using one)

---

## 📋 Phase 9: Documentation (5 minutes)

### Team Communication

- [ ] Share setup completion with team
- [ ] Document custom changes made
- [ ] Share approval workflow instructions
- [ ] Explain how to respond to notifications
- [ ] Provide troubleshooting contacts

### Create Runbook (Recommended)

Document your specific setup:

```markdown
# Our Validation Automation

## Schedule: [Your schedule]

## Notification Recipients: [Your email list]

## Approval Required: [Yes/No]

## Primary Contact: [Name/Email]

## Backup Contact: [Name/Email]

## Custom Configurations:

- [List any changes from defaults]

## Emergency Contacts:

- GitHub Admin: [Name]
- Power Automate Admin: [Name]
- Repository Owner: [Name]
```

---

## 📋 Phase 10: Final Checks (3 minutes)

### Security Verification

- [ ] Webhook URL stored only in GitHub Secrets
- [ ] No sensitive data in code or logs
- [ ] Flow has proper authentication
- [ ] Repository permissions reviewed
- [ ] Secrets not visible to forks

### Performance Check

- [ ] Workflow completes in < 5 minutes
- [ ] Email arrives in < 3 minutes after trigger
- [ ] No rate limiting issues
- [ ] Script runs efficiently

### Cost Verification

- [ ] GitHub Actions within free tier limits
- [ ] Power Automate within included runs
- [ ] No unexpected charges
- [ ] Monitoring costs acceptable

---

## ✅ Success Criteria

Your setup is complete when:

- [x] All prerequisite checks pass
- [x] Dependencies installed successfully
- [x] Local validation runs without errors
- [x] Power Automate flow created and configured
- [x] GitHub Secret added correctly
- [x] Manual workflow trigger succeeds
- [x] Email notification received
- [x] Approval workflow works (if configured)
- [x] Issues and PRs created automatically
- [x] Documentation reviewed and accessible
- [x] Team notified and trained
- [x] Monitoring enabled
- [x] First scheduled run anticipated

---

## 🎯 Post-Setup Actions

### Week 1

- [ ] Monitor first scheduled run closely
- [ ] Verify all notifications work
- [ ] Check for any errors or issues
- [ ] Gather feedback from team
- [ ] Make any necessary adjustments

### Week 2-4

- [ ] Ensure weekly runs are successful
- [ ] Process any detected changes
- [ ] Refine approval process if needed
- [ ] Update documentation based on learnings

### Month 2+

- [ ] Review validation accuracy
- [ ] Adjust sources or parsers if needed
- [ ] Optimize run schedule if necessary
- [ ] Consider advanced features (AI, additional sources)

---

## 🆘 Troubleshooting Quick Reference

### Workflow Not Running

1. Check Actions enabled in repository settings
2. Verify cron syntax is correct
3. Check for workflow file syntax errors
4. Trigger manually to test

### Email Not Received

1. Check Power Automate run history
2. Verify webhook URL in GitHub Secret
3. Check email address in flow
4. Review spam/junk folders
5. Test flow manually in Power Automate

### Validation Script Errors

1. Check network connectivity
2. Verify Microsoft URLs are accessible
3. Review error messages in logs
4. Test locally with `npm run validate`
5. Check TypeScript compilation

### Permission Issues

1. Verify GitHub repository permissions
2. Check Power Automate connection permissions
3. Verify Secrets can be accessed by workflows
4. Review approval permissions

---

## 📞 Support Resources

### Documentation

- **Quick Start:** [docs/QUICKSTART_AUTOMATED_VALIDATION.md](../docs/QUICKSTART_AUTOMATED_VALIDATION.md)
- **Full Guide:** [docs/AUTOMATED_VALIDATION.md](../docs/AUTOMATED_VALIDATION.md)
- **Power Automate:** [docs/POWER_AUTOMATE_SETUP.md](../docs/POWER_AUTOMATE_SETUP.md)
- **Summary:** [docs/AUTOMATION_SUMMARY.md](../docs/AUTOMATION_SUMMARY.md)

### External Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Power Automate Docs](https://learn.microsoft.com/en-us/power-automate/)
- [Cron Expression Generator](https://crontab.guru/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

### Getting Help

1. Review troubleshooting sections in docs
2. Check GitHub Actions logs
3. Review Power Automate run history
4. Create GitHub issue with details
5. Contact repository maintainers

---

## 🎉 Congratulations!

If you've completed all checkboxes, your automated validation system is:

✅ **Fully configured**  
✅ **Tested and verified**  
✅ **Running on schedule**  
✅ **Notifications working**  
✅ **Team informed**  
✅ **Documented**

Your repository will now automatically stay up-to-date with Microsoft product changes!

---

**Setup Date:** ******\_\_\_******  
**Completed By:** ******\_\_\_******  
**Verified By:** ******\_\_\_******  
**Next Review:** ******\_\_\_****** (30 days)
