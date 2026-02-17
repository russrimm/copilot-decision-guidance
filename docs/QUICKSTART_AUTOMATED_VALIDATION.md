# Quick Start: Automated Validation Setup

Get the Microsoft product updates automation running in 15 minutes.

## ⚡ Fast Track Setup

### 1. Prerequisites Check (2 minutes)

Ensure you have:

- [ ] GitHub repository access
- [ ] Microsoft 365 account (for Power Automate)
- [ ] Node.js 20+ installed (for local testing)

### 2. Install Dependencies (3 minutes)

```bash
cd copilot-decision-guidance
npm install
```

### 3. Test Locally (2 minutes)

```bash
# Run validation script
npm run validate

# You should see output checking Microsoft sources
# Exit code 0 = no changes, 1 = changes detected
```

### 4. Setup Power Automate (5 minutes)

#### Quick Method - Import Template

1. Go to [make.powerautomate.com](https://make.powerautomate.com)
2. Click **My flows** → **Import** → **Import Package (Legacy)**
3. Upload `docs/power-automate-flow-template.json`
4. Configure connections:
   - Office 365 Outlook
   - Approvals
   - Teams (optional)
5. Update email addresses in the flow
6. Save and copy the HTTP trigger URL

#### Alternative - Create Manual Flow

See [detailed guide](./POWER_AUTOMATE_SETUP.md) if import doesn't work.

### 5. Add GitHub Secret (2 minutes)

1. Go to your repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `POWER_AUTOMATE_WEBHOOK_URL`
4. Value: Paste your Flow's HTTP URL
5. Click **Add secret**

### 6. Test End-to-End (1 minute)

1. Go to **Actions** tab in GitHub
2. Select **Validate Microsoft Product Updates**
3. Click **Run workflow**
4. Check **force_notification**
5. Click **Run workflow**
6. Wait 1-2 minutes and check your email!

## ✅ Success Checklist

After setup, you should have:

- [x] Validation script runs locally
- [x] GitHub Actions workflow created
- [x] Power Automate flow active
- [x] GitHub secret configured
- [x] Test email received
- [x] Workflow runs successfully

## 🎯 What Happens Next?

### Weekly (Automated)

- Monday at 9 AM UTC: Workflow runs
- If changes detected:
  - GitHub issue created
  - Email sent to you
  - Approval requested
- If approved:
  - Draft PR created
  - Team notified

### Your Action Items

- Check email for notifications
- Review and approve/reject changes
- Update documentation files
- Merge PRs

## 🔧 Quick Customization

### Change Schedule

Edit `.github/workflows/validate-microsoft-updates.yml`:

```yaml
schedule:
  - cron: '0 9 * * 1' # Monday 9 AM UTC

  # Change to:
  - cron: '0 14 * * 3' # Wednesday 2 PM UTC
```

### Change Email Recipients

In Power Automate flow:

1. Open your flow
2. Find "Send an email" action
3. Update the **To** field
4. Save

### Add More Sources

Edit `scripts/validate-microsoft-updates.ts`:

```typescript
private sources: MicrosoftSource[] = [
  // Add new source
  {
    name: 'My Custom Source',
    url: 'https://...',
    type: 'web',
    parser: this.parseMySource.bind(this)
  }
];
```

## 📱 Quick Commands

```bash
# Run validation
npm run validate

# Watch mode (re-run on file changes)
npm run validate:watch

# Trigger GitHub Action
gh workflow run validate-microsoft-updates.yml

# Check workflow status
gh run list --workflow=validate-microsoft-updates.yml

# View latest run logs
gh run view --log

# List all workflows
gh workflow list
```

## 🆘 Quick Troubleshooting

### "Validation failed"

→ Check network, Microsoft URLs may have changed
→ Run `npm run validate` locally for details

### "No email received"

→ Check Power Automate run history
→ Verify secret in GitHub matches webhook URL
→ Check email address in flow

### "Workflow not running"

→ Verify Actions enabled in Settings
→ Check cron syntax
→ Manually trigger to test

### "Approval not working"

→ Ensure Approvals connector is configured
→ Check email address is correct
→ Review flow run history for errors

## 📚 Next Steps

1. ✅ **Complete setup** - Follow steps above
2. 📖 **Read full docs** - See [AUTOMATED_VALIDATION.md](./AUTOMATED_VALIDATION.md)
3. 🎨 **Customize** - Tailor to your needs
4. 🔔 **Monitor** - Watch first few runs
5. 🔄 **Iterate** - Improve based on feedback

## 🎓 Learn More

- [Full Documentation](./AUTOMATED_VALIDATION.md) - Complete guide
- [Power Automate Setup](./POWER_AUTOMATE_SETUP.md) - Detailed flow config
- [Troubleshooting](./AUTOMATED_VALIDATION.md#-troubleshooting) - Common issues

## 💡 Pro Tips

1. **Test first** - Always run manual workflow before relying on schedule
2. **Monitor initially** - Check first 2-3 automated runs closely
3. **Update regularly** - Keep dependencies current
4. **Document changes** - Track customizations you make
5. **Backup secrets** - Keep webhook URLs in secure location

## 🚀 Advanced Setup Options

Want more power? Check these out:

- **Teams Integration** - Post to channels
- **Multi-approvers** - Require multiple sign-offs
- **Custom sources** - Add your own validation endpoints
- **AI analysis** - Enhance with Azure OpenAI
- **Metrics dashboard** - Track validation over time

See [Advanced Features](./AUTOMATED_VALIDATION.md#-advanced-features) for details.

---

**Setup Time:** ~15 minutes  
**Difficulty:** Beginner  
**Maintenance:** ~5 minutes/month

Need help? Create a GitHub issue or check the full documentation.
