# Power Automate / Logic Apps Integration Setup

This guide explains how to set up automated email notifications when Microsoft product updates are detected.

## Overview

The validation workflow can trigger either:

- **Power Automate** (recommended for Microsoft 365 environments)
- **Azure Logic Apps** (recommended for Azure-native deployments)

Both options will:

1. Receive validation results from GitHub Actions
2. Send formatted email notifications
3. Optionally require approval before updates are applied

---

## Option 1: Power Automate Setup (Recommended)

### Step 1: Create the Flow

1. Go to [Power Automate](https://make.powerautomate.com)
2. Click **+ Create** → **Automated cloud flow**
3. Name it: `Microsoft Copilot Documentation Updates`
4. Search for and select trigger: **When an HTTP request is received**
5. Click **Create**

### Step 2: Configure HTTP Trigger

1. In the HTTP trigger, set up the request body JSON schema:

```json
{
  "type": "object",
  "properties": {
    "report": {
      "type": "string",
      "description": "Markdown formatted validation report"
    },
    "results": {
      "type": "object",
      "description": "Detailed validation results"
    },
    "repository": {
      "type": "string",
      "description": "GitHub repository URL"
    },
    "workflowRun": {
      "type": "string",
      "description": "GitHub Actions workflow run URL"
    },
    "timestamp": {
      "type": "string",
      "description": "Timestamp of validation"
    }
  }
}
```

2. After saving, copy the **HTTP POST URL** (you'll need this for GitHub Secrets)

### Step 3: Add Email Action

1. Click **+ New step**
2. Search for **Send an email (V2)** (Office 365 Outlook)
3. Configure:
   - **To**: Your email or distribution list
   - **Subject**: `Microsoft Product Updates Detected - @{body('When_an_HTTP_request_is_received')?['timestamp']}`
   - **Body**: Use this HTML template:

```html
<h2>Microsoft Product Updates Validation Report</h2>

<p>The weekly validation has detected changes in Microsoft product documentation.</p>

<h3>Summary</h3>
<ul>
  <li><strong>Timestamp:</strong> @{body('When_an_HTTP_request_is_received')?['timestamp']}</li>
  <li>
    <strong>Total Changes:</strong>
    @{body('When_an_HTTP_request_is_received')?['results']?['totalChanges']}
  </li>
</ul>

<h3>Actions Required</h3>
<ol>
  <li>Review the validation report in GitHub</li>
  <li>Verify changes against official Microsoft sources</li>
  <li>Update documentation files as needed</li>
  <li>Approve and merge the auto-generated PR</li>
</ol>

<h3>Links</h3>
<ul>
  <li><a href="@{body('When_an_HTTP_request_is_received')?['repository']}">Repository</a></li>
  <li>
    <a href="@{body('When_an_HTTP_request_is_received')?['workflowRun']}">Workflow Run Details</a>
  </li>
  <li>
    <a href="@{body('When_an_HTTP_request_is_received')?['repository']}/issues">Review Issues</a>
  </li>
</ul>

<hr />

<h3>Detailed Report</h3>
<pre>@{body('When_an_HTTP_request_is_received')?['report']}</pre>

<hr />
<p>
  <em
    >This is an automated notification from the Microsoft Copilot Decision Guidance validation
    workflow.</em
  >
</p>
```

### Step 4: (Optional) Add Approval Step

To require approval before updates are applied:

1. After the HTTP trigger, add **Start and wait for an approval**
2. Configure:
   - **Approval type**: Approve/Reject - First to respond
   - **Title**: `Review Microsoft Product Updates`
   - **Assigned to**: Your email
   - **Details**: `@{body('When_an_HTTP_request_is_received')?['report']}`
   - **Item link**: `@{body('When_an_HTTP_request_is_received')?['workflowRun']}`

3. Add a **Condition** after the approval
4. **If Approved**, add an HTTP action to trigger GitHub Actions workflow (optional)
5. Then add the **Send an email** action

### Step 5: Add to GitHub Secrets

1. Copy the HTTP POST URL from your Power Automate trigger
2. Go to your GitHub repository
3. Navigate to **Settings** → **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `POWER_AUTOMATE_WEBHOOK_URL`
6. Value: Paste the HTTP POST URL
7. Click **Add secret**

---

## Option 2: Azure Logic Apps Setup

### Step 1: Create Logic App

```bash
# Using Azure CLI
az login
az group create --name rg-copilot-docs-validation --location eastus
az logic workflow create \
  --resource-group rg-copilot-docs-validation \
  --name logic-copilot-updates \
  --definition @logic-app-definition.json
```

### Step 2: Logic App Definition

Create `logic-app-definition.json`:

```json
{
  "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {},
  "triggers": {
    "manual": {
      "type": "Request",
      "kind": "Http",
      "inputs": {
        "schema": {
          "type": "object",
          "properties": {
            "emailSubject": { "type": "string" },
            "emailBody": { "type": "string" },
            "validationResults": { "type": "object" },
            "repositoryUrl": { "type": "string" },
            "workflowRunUrl": { "type": "string" },
            "requiresApproval": { "type": "boolean" }
          }
        }
      }
    }
  },
  "actions": {
    "Send_Email": {
      "type": "ApiConnection",
      "inputs": {
        "host": {
          "connection": {
            "name": "@parameters('$connections')['office365']['connectionId']"
          }
        },
        "method": "post",
        "body": {
          "To": "your-email@example.com",
          "Subject": "@{triggerBody()?['emailSubject']}",
          "Body": "<h2>Validation Report</h2><pre>@{triggerBody()?['emailBody']}</pre><p><a href='@{triggerBody()?['workflowRunUrl']}'>View Workflow Run</a></p>"
        },
        "path": "/v2/Mail"
      }
    }
  }
}
```

### Step 3: Get Callback URL

```bash
az logic workflow show \
  --resource-group rg-copilot-docs-validation \
  --name logic-copilot-updates \
  --query "accessEndpoint" -o tsv
```

### Step 4: Add to GitHub Secrets

Add the callback URL as `LOGIC_APP_WEBHOOK_URL` in GitHub Secrets.

---

## Email Notification Customization

### Customize Recipients

**Power Automate:**

- Edit the **To** field in the email action
- Use semicolons to separate multiple recipients
- Or create a distribution list in Exchange

**Logic Apps:**

- Update the `To` field in the Logic App definition
- Or use a parameter/app setting for the email address

### Customize Email Format

The email includes:

- Summary of detected changes
- Links to GitHub resources
- Full validation report
- Actionable next steps

You can modify the HTML template in the flow to match your organization's preferences.

---

## Testing

### Test with Manual Trigger

1. Go to your GitHub repository
2. Click **Actions** tab
3. Select **Validate Microsoft Product Updates**
4. Click **Run workflow**
5. Check **force_notification**
6. Click **Run workflow**

This will trigger the workflow and send a test email even if no changes are detected.

### Verify Power Automate Flow

1. Go to [Power Automate](https://make.powerautomate.com)
2. Select your flow
3. Check **Run history** to see if it was triggered
4. Review any errors in the run details

---

## Troubleshooting

### Flow Not Triggering

- Verify the GitHub Secret is set correctly
- Check the HTTP POST URL hasn't expired
- Review GitHub Actions logs for HTTP request errors

### Email Not Sending

- Verify Office 365 connection in Power Automate
- Check email address is valid
- Review flow run history for errors

### Invalid Schema Errors

- Ensure the JSON schema in the HTTP trigger matches the payload
- Update the flow if validation script output format changes

---

## Security Notes

1. **Webhook URLs are sensitive** - treat them like passwords
2. Consider using **Azure Key Vault** for production deployments
3. **Limit email recipients** to authorized personnel
4. **Review approval history** regularly
5. Enable **flow analytics** to monitor usage

---

## Advanced: Integrate with Teams

To post notifications in Microsoft Teams:

1. In Power Automate, add **Post message in a chat or channel** action
2. Select your Team and Channel
3. Set the message:

```
**Microsoft Product Updates Detected**

Timestamp: @{body('When_an_HTTP_request_is_received')?['timestamp']}
Changes: @{body('When_an_HTTP_request_is_received')?['results']?['totalChanges']}

[View Report](@{body('When_an_HTTP_request_is_received')?['workflowRun']})
```

---

## Cost Considerations

### Power Automate

- Enterprise licensing includes up to 10,000 runs per month
- Additional runs: $0.60 per 1,000 runs
- Free tier available for testing

### Azure Logic Apps

- Consumption plan: Pay per execution
- Standard plan: Flat rate with included executions
- Estimated cost: < $5/month for weekly runs

---

## Next Steps

1. Set up your preferred notification method (Power Automate or Logic Apps)
2. Add the webhook URL to GitHub Secrets
3. Test with a manual workflow run
4. Monitor the first few automated runs
5. Adjust email format and recipients as needed

For questions or issues, create a GitHub issue in the repository.
