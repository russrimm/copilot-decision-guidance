# Configuration Guide

This guide explains how to configure the Microsoft Agentic Solution Advisor for different deployment scenarios.

## Table of Contents

- [Configuration Modes](#configuration-modes)
- [Azure Service Principal Setup](#azure-service-principal-setup)
- [Environment Variables Reference](#environment-variables-reference)
- [API Permissions Required](#api-permissions-required)
- [Testing Your Configuration](#testing-your-configuration)
- [Troubleshooting](#troubleshooting)

---

## Configuration Modes

The tool supports three configuration modes, each building on the previous:

### 1. Demo Mode (No Configuration Required)

**What you get:**

- Full questionnaire workflow
- Deterministic recommendations based on Microsoft AI Decision Framework
- Export functionality (JSON, Markdown, PDF)
- Sample dashboard data (realistic but not real)

**Setup:** None! Just run `npm run dev` and start using the tool.

**Best for:** Evaluating the tool, internal demos, or scenarios where you don't need live tenant data.

---

### 2. AI Mode (AI API Keys Only)

**What you get:**

- Everything from Demo Mode
- AI-enhanced explanations for recommendations
- AI-powered personalized insights after survey completion
- Contextual follow-up guidance

**Setup:** Add OpenAI or Azure OpenAI credentials to `.env`:

```bash
# Option 1: Azure OpenAI (Recommended for enterprise)
AZURE_OPENAI_API_KEY=sk-...
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Option 2: OpenAI
OPENAI_API_KEY=sk-...

# Enable AI features
ENABLE_AI_RECOMMENDATIONS=true
```

**Best for:** Organizations wanting enhanced recommendations without exposing tenant data.

---

### 3. Enterprise Mode (Full Azure Integration)

**What you get:**

- Everything from AI Mode
- Live organizational readiness scores
- Real-time Azure cost reports
- Microsoft 365 license counts
- Power Platform inventory
- Microsoft Secure Score monitoring
- Contextualized AI recommendations based on tenant data

**Setup:** Complete Azure Service Principal setup (see below) and add all credentials to `.env`.

**Best for:** Organizations wanting comprehensive decision guidance with full tenant context.

---

## Azure Service Principal Setup

To enable Enterprise Mode features, you need to create an Azure service principal with appropriate permissions.

### Step 1: Create a Service Principal

1. **Open Azure Portal**: [https://portal.azure.com](https://portal.azure.com)

2. **Navigate to Azure Active Directory** (now called Microsoft Entra ID):
   - Click "Azure Active Directory" in the left sidebar
   - Or search for "Entra" or "Azure Active Directory" in the top search bar

3. **Register a new application**:
   - Click **App registrations** in the left menu
   - Click **+ New registration**
   - Fill in the form:
     - **Name**: `Copilot-Decision-Tool` (or any name you prefer)
     - **Supported account types**: "Accounts in this organizational directory only"
     - **Redirect URI**: Leave blank
   - Click **Register**

4. **Copy the Application (client) ID and Tenant ID**:
   - On the Overview page, note:
     - **Application (client) ID** → This is your `AZURE_CLIENT_ID`
     - **Directory (tenant) ID** → This is your `AZURE_TENANT_ID`

5. **Create a client secret**:
   - Click **Certificates & secrets** in the left menu
   - Click **+ New client secret**
   - Add a description (e.g., "Decision Tool Secret")
   - Choose expiration (recommended: 12-24 months)
   - Click **Add**
   - **IMPORTANT**: Copy the **Value** immediately → This is your `AZURE_CLIENT_SECRET`
   - You cannot view this value again after leaving the page!

6. **Get your Subscription ID**:
   - Search for "Subscriptions" in the top search bar
   - Click on your subscription
   - Copy the **Subscription ID** → This is your `AZURE_SUBSCRIPTION_ID`

### Step 2: Assign API Permissions

1. **Go back to your App registration** (App registrations → `Copilot-Decision-Tool`)

2. **Click API permissions** in the left menu

3. **Add the following Microsoft Graph permissions**:
   - Click **+ Add a permission**
   - Select **Microsoft Graph**
   - Select **Application permissions** (not Delegated)
   - Add these permissions:
     - `Organization.Read.All` (read organization info)
     - `User.Read.All` (read license assignments)
     - `SecurityEvents.Read.All` (read Secure Score)
   - Click **Add permissions**

4. **Grant admin consent**:
   - Click **Grant admin consent for [Your Organization]**
   - Click **Yes** in the confirmation dialog
   - All permissions should now show green checkmarks

### Step 3: Assign Azure Role (for Cost Management)

1. **Navigate to Subscriptions**:
   - Search for "Subscriptions" in the top search bar
   - Click on your subscription

2. **Assign Reader role**:
   - Click **Access control (IAM)** in the left menu
   - Click **+ Add** → **Add role assignment**
   - Select the **Reader** role
   - Click **Next**
   - Click **+ Select members**
   - Search for your app name (`Copilot-Decision-Tool`)
   - Select it and click **Select**
   - Click **Review + assign**

**Why Reader?** The Reader role provides read access to Azure resources, which is sufficient for cost reporting and inventory queries.

### Step 4: Configure Power Platform API Access

Power Platform inventory uses the **Business Application Platform (BAP) API**, which automatically inherits permissions from Microsoft Graph.

**No additional configuration required** if you completed Step 2.

### Step 5: Add Credentials to `.env`

```bash
# Azure Authentication
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-secret-value
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Enable all dashboard features
ENABLE_COST_REPORTS=true
ENABLE_POWER_PLATFORM=true
ENABLE_LICENSES=true
ENABLE_SECURE_SCORE=true
```

---

## Environment Variables Reference

### Core Configuration

| Variable               | Required | Default       | Description                                                        |
| ---------------------- | -------- | ------------- | ------------------------------------------------------------------ |
| `PORT`                 | No       | `3001`        | API server port                                                    |
| `NODE_ENV`             | No       | `development` | Environment mode                                                   |
| `CORS_ALLOWED_ORIGINS` | No       | none          | Comma-separated allowlist for cross-origin browser API requests    |

### AI Features

| Variable                    | Required | Default | Description                       |
| --------------------------- | -------- | ------- | --------------------------------- |
| `AZURE_OPENAI_API_KEY`      | No       | -       | Azure OpenAI API key              |
| `AZURE_OPENAI_ENDPOINT`     | No       | -       | Azure OpenAI endpoint URL         |
| `AZURE_OPENAI_DEPLOYMENT`   | No       | -       | Azure OpenAI deployment name      |
| `OPENAI_API_KEY`            | No       | -       | OpenAI API key                    |
| `ENABLE_AI_RECOMMENDATIONS` | No       | `false` | Enable AI-powered recommendations |

### Azure Integration

| Variable                | Required | Default | Description                     |
| ----------------------- | -------- | ------- | ------------------------------- |
| `AZURE_TENANT_ID`       | No       | -       | Azure AD tenant ID              |
| `AZURE_CLIENT_ID`       | No       | -       | Service principal client ID     |
| `AZURE_CLIENT_SECRET`   | No       | -       | Service principal client secret |
| `AZURE_SUBSCRIPTION_ID` | No       | -       | Azure subscription ID           |

### Feature Flags

| Variable                | Required | Default | Description                              |
| ----------------------- | -------- | ------- | ---------------------------------------- |
| `ENABLE_COST_REPORTS`   | No       | `false` | Enable Azure Cost Management integration |
| `ENABLE_POWER_PLATFORM` | No       | `false` | Enable Power Platform inventory          |
| `ENABLE_LICENSES`       | No       | `false` | Enable Microsoft 365 license counts      |
| `ENABLE_SECURE_SCORE`   | No       | `false` | Enable Microsoft Secure Score            |

---

## API Permissions Required

### Microsoft Graph API Permissions

| Permission                | Type        | Purpose                               | Admin Consent Required |
| ------------------------- | ----------- | ------------------------------------- | ---------------------- |
| `Organization.Read.All`   | Application | Read tenant organization info         | Yes                    |
| `User.Read.All`           | Application | Read user license assignments         | Yes                    |
| `SecurityEvents.Read.All` | Application | Read Secure Score and recommendations | Yes                    |

### Azure Management API

| Permission                       | Purpose                                 | Admin Consent Required |
| -------------------------------- | --------------------------------------- | ---------------------- |
| Reader role (subscription-level) | Read cost reports and resource metadata | Yes (Role Assignment)  |

### Power Platform API

| Permission                     | Purpose                         | Admin Consent Required |
| ------------------------------ | ------------------------------- | ---------------------- |
| Inherited from Microsoft Graph | Query environments and capacity | No (implicit)          |

---

## Testing Your Configuration

### Test 1: Verify API Health

```powershell
# Start the application
npm run dev

# In another terminal, check health endpoint
curl http://localhost:3001/api/health
```

**Expected output:**

```json
{
  "status": "ok",
  "timestamp": "2026-08-02T00:00:00.000Z",
  "uptime": 42
}
```

Use `GET /api/ready` for readiness probes that should fail until the decision model and scoring services are loaded.

### Test 2: Check Configuration Status

```powershell
curl http://localhost:3001/api/metrics/config
```

**Expected output (Enterprise Mode):**

```json
{
  "configured": true,
  "features": {
    "costReports": true,
    "powerPlatform": true,
    "licenses": true,
    "secureScore": true
  }
}
```

### Test 3: Fetch Tenant Metrics

```powershell
curl http://localhost:3001/api/metrics
```

**Expected output:** JSON object with cost reports, license counts, Power Platform inventory, and Secure Score.

### Test 4: View Dashboard

Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) in your browser.

**Demo Mode:** Shows sample data banner  
**Enterprise Mode:** Shows live tenant metrics

---

## Troubleshooting

### Issue: "Configured: false" in `/api/metrics/config`

**Cause:** Missing or incorrect Azure credentials.

**Solution:**

1. Verify all four Azure environment variables are set in `.env`:
   - `AZURE_TENANT_ID`
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`
   - `AZURE_SUBSCRIPTION_ID`
2. Restart the API server: `npm run dev`
3. Check the server logs for authentication errors

### Issue: "Unauthorized" or "Forbidden" errors when fetching metrics

**Cause:** Service principal lacks required permissions.

**Solution:**

1. Verify Microsoft Graph permissions were granted admin consent
2. Verify service principal has Reader role on subscription
3. Check token acquisition in server logs
4. Wait 5-10 minutes after granting permissions (propagation delay)

### Issue: Cost reports show $0 or no data

**Cause:** No cost data available for the current billing period, or service principal lacks Cost Management permissions.

**Solution:**

1. Verify Reader role is assigned at subscription level (not resource group)
2. Check that subscription has usage data for current month
3. Try querying previous month's data (update API parameters)

### Issue: Power Platform inventory shows 0 environments

**Cause:** No Power Platform environments in tenant, or API permissions not propagated.

**Solution:**

1. Verify tenant has Power Platform environments: [https://admin.powerplatform.microsoft.com](https://admin.powerplatform.microsoft.com)
2. Wait 10-15 minutes after granting Microsoft Graph permissions
3. Check server logs for BAP API errors

### Issue: AI recommendations not appearing

**Cause:** OpenAI API keys missing or `ENABLE_AI_RECOMMENDATIONS=false`.

**Solution:**

1. Add OpenAI or Azure OpenAI credentials to `.env`
2. Set `ENABLE_AI_RECOMMENDATIONS=true`
3. Restart the API server
4. Click "Generate AI Insights" button on Results page

### Issue: Dashboard shows "Demo Mode" banner even with Azure credentials configured

**Cause:** One or more feature flags disabled, or credentials invalid.

**Solution:**

1. Verify all feature flags are set to `true`:
   ```bash
   ENABLE_COST_REPORTS=true
   ENABLE_POWER_PLATFORM=true
   ENABLE_LICENSES=true
   ENABLE_SECURE_SCORE=true
   ```
2. Check `/api/metrics/config` endpoint to see which features are disabled
3. Review server logs for authentication errors
4. Try re-creating the client secret if it expired

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use Azure Key Vault** for production secrets management
3. **Rotate client secrets** every 6-12 months
4. **Limit service principal permissions** to minimum required (follow principle of least privilege)
5. **Monitor service principal activity** in Azure AD sign-in logs
6. **Use managed identities** when deploying to Azure (eliminates need for client secrets)
7. **Enable conditional access policies** for service principals (Azure AD Premium feature)

---

## Next Steps

- **Demo Mode**: Just run `npm run dev` and explore
- **AI Mode**: Add OpenAI credentials and enable personalized recommendations
- **Enterprise Mode**: Complete Azure setup and unlock full dashboard

For customer deployment instructions, see [README.md](../README.md#deployment-options).

For automated validation setup, see [AUTOMATED_VALIDATION.md](./AUTOMATED_VALIDATION.md).
