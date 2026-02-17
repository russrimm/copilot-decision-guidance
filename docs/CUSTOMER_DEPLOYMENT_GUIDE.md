# Customer Deployment Guide

Welcome! This document will help you deploy and customize the **Microsoft Agentic Solution Advisor** for your organization.

## What Is This Tool?

The Microsoft Agentic Solution Advisor is a **self-hostable decision guidance tool** that helps organizations:

1. **Evaluate Microsoft Agentic platforms** through a structured questionnaire
2. **Receive personalized recommendations** for Microsoft 365 Copilot, Copilot Studio, Microsoft Foundry, Agent Builder, or Hybrid approaches
3. **View organizational readiness** through optional enterprise dashboards (Azure integration)
4. **Get AI-powered insights** tailored to survey responses and tenant context

### Key Benefits

✅ **100% Open Source** - Clone, modify, and deploy on your own infrastructure  
✅ **Framework-Aligned** - Based on the [Microsoft AI Decision Framework](https://microsoft.github.io/Microsoft-AI-Decision-Framework/)  
✅ **Flexible Configuration** - Works in Demo Mode (no setup), AI Mode (with OpenAI), or Enterprise Mode (full Azure integration)  
✅ **No Vendor Lock-In** - Deploy to Azure, AWS, GCP, or on-premises  
✅ **Optional Telemetry** - Enterprise dashboard features only activate when configured

---

## Quick Start (5 Minutes)

### 1. Clone the Repository

```powershell
git clone https://github.com/your-org/copilot-decision-guidance.git
cd copilot-decision-guidance
```

### 2. Install Dependencies

```powershell
npm install
```

### 3. Start the Application (Demo Mode)

```powershell
npm run dev
```

**That's it!** Open [http://localhost:3000](http://localhost:3000) and start using the tool.

In **Demo Mode**, you get:

- Full questionnaire workflow
- Deterministic recommendations based on the Microsoft AI Decision Framework
- Export functionality (JSON, Markdown, PDF)
- Sample enterprise dashboard (realistic but not real data)

---

## Configuration Options

### Option 1: Add AI-Enhanced Recommendations (5 minutes)

**What you gain:** AI-powered explanations and personalized insights after survey completion.

1. **Get an API key**:
   - **Azure OpenAI** (recommended for enterprise): [Create resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesOpenAI)
   - **OpenAI**: [Get API key](https://platform.openai.com/api-keys)

2. **Create `.env` file** in the root directory:

   ```bash
   # Option 1: Azure OpenAI
   AZURE_OPENAI_API_KEY=your-key
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT=gpt-4

   # Option 2: OpenAI-compatible (OpenAI, GitHub Models)
   OPENAI_API_KEY=your-openai-or-github-key
   OPENAI_ENDPOINT=https://models.github.ai
   OPENAI_MODEL=openai/gpt-4.1

   # Enable AI features
   ENABLE_AI_RECOMMENDATIONS=true
   ```

3. **Restart the application**:

   ```powershell
   npm run dev
   ```

4. **Test AI recommendations**: Complete the survey and click "Generate AI Insights" on the Results page.

---

### Option 2: Enable Enterprise Dashboard (30 minutes)

**What you gain:** Live organizational metrics including Azure costs, Power Platform inventory, license counts, and Secure Score.

**Prerequisites:**

- Azure subscription with admin access
- Azure Active Directory (Entra ID) admin privileges

**Setup Steps:**

1. **Create Azure service principal** and grant permissions:
   - Follow the detailed guide: [Configuration Guide - Azure Service Principal Setup](./docs/CONFIGURATION_GUIDE.md#azure-service-principal-setup)
   - Requires: Microsoft Graph API permissions + subscription Reader role
   - Takes ~15-20 minutes

2. **Add Azure credentials to `.env`**:

   ```bash
   # Azure Authentication
   AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   AZURE_CLIENT_SECRET=your-secret
   AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

   # Enable dashboard features
   ENABLE_COST_REPORTS=true
   ENABLE_POWER_PLATFORM=true
   ENABLE_LICENSES=true
   ENABLE_SECURE_SCORE=true
   ```

3. **Restart and verify**:
   ```powershell
   npm run dev
   # Navigate to http://localhost:3000/dashboard
   ```

**Full instructions:** [Configuration Guide](./docs/CONFIGURATION_GUIDE.md)

---

## Deployment to Production

### Deployment Option 1: Azure App Service (Recommended)

**Best for:** Organizations with Azure subscriptions.

**Steps:**

1. **Build the application**:

   ```powershell
   npm run build
   ```

2. **Deploy using Azure App Service extension in VS Code**:
   - Install [Azure App Service extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azureappservice)
   - Right-click "App Services" → "Create New Web App (Advanced)"
   - Choose: Node 20 LTS, Linux, Basic (B1) or higher
   - Right-click the web app → "Deploy to Web App"

3. **Configure environment variables in Azure Portal**:
   - Navigate to App Service → Configuration → Application settings
   - Add all `.env` variables (OpenAI keys, Azure credentials, feature flags)
   - Set Startup Command: `node server-production.js`
   - Click **Save** → **Restart**

**Full guide:** [README.md - Azure App Service Deployment](../README.md#azure-app-service-deployment)

---

### Deployment Option 2: Azure Static Web Apps + Azure Functions

**Best for:** Serverless architecture with automatic scaling.

**Steps:**

1. **Create Azure Static Web App**:
   - Azure Portal → Create Resource → Static Web App
   - Connect to your GitHub repository
   - Set build configuration:
     - **App location**: `apps/web`
     - **API location**: `apps/api`
     - **Output location**: `dist`

2. **Configure environment variables**:
   - Static Web App → Configuration → Application settings
   - Add OpenAI keys and Azure credentials

**Estimated cost:** Free tier available, production ~$10-20/month

---

### Deployment Option 3: AWS, GCP, or On-Premises

**Best for:** Organizations with existing cloud infrastructure or on-premises requirements.

**Container deployment (Docker):**

1. **Build Docker image** (create `Dockerfile`):

   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["node", "server-production.js"]
   ```

2. **Build and run**:

   ```powershell
   docker build -t copilot-decision-tool .
   docker run -p 3000:3000 --env-file .env copilot-decision-tool
   ```

3. **Deploy to container platform**:
   - **AWS**: Elastic Container Service (ECS) or App Runner
   - **GCP**: Cloud Run or Google Kubernetes Engine (GKE)
   - **On-premises**: Kubernetes, Docker Swarm, or standalone Docker

---

## Customization Options

### Modify Questions or Weights

**File:** `packages/decision-engine/src/data/decision-model.v1.json`

**What you can change:**

- Add/remove questions
- Adjust scoring weights for different platforms
- Modify recommendation thresholds

**Example:**

```json
{
  "id": "custom_question",
  "title": "What is your budget range?",
  "answers": [
    {
      "id": "low_budget",
      "label": "Under $50k",
      "weights": { "m365Copilot": 10, "copilotStudio": 5, "hybrid": 3 }
    }
  ]
}
```

**After editing:** Restart the dev server (`npm run dev`)

---

### Customize Branding

**Frontend styling:** `apps/web/src/index.css` (Tailwind CSS)

**Logo/favicon:** Place files in `apps/web/public/` and update `apps/web/index.html`

**Colors:** Modify Tailwind config in `apps/web/tailwind.config.js`

---

### Add Custom Dashboard Widgets

**File:** `apps/web/src/pages/Dashboard.tsx`

**How to add a widget:**

1. Create a new component in `apps/web/src/components/`:

   ```typescript
   export function MyCustomWidget() {
     return (
       <div className="card">
         <h3 className="text-lg font-semibold mb-2">Custom Metric</h3>
         <p>Your custom data here</p>
       </div>
     );
   }
   ```

2. Import and add to Dashboard.tsx:

   ```typescript
   import { MyCustomWidget } from '../components/MyCustomWidget';

   // Inside Dashboard component:
   return (
     <div className="space-y-6">
       {/* Existing widgets */}
       <MyCustomWidget />
     </div>
   );
   ```

---

## Security Considerations

### For Development

✅ **Never commit `.env` files** to version control (already in `.gitignore`)  
✅ **Use separate API keys** for development and production  
✅ **Test with sample data** before connecting production tenant

### For Production

✅ **Use Azure Key Vault** or AWS Secrets Manager for secrets management  
✅ **Enable HTTPS** (required for production)  
✅ **Configure CORS** properly in `apps/api/src/index.ts`  
✅ **Add authentication** for admin routes (currently local-only)  
✅ **Rotate secrets** every 6-12 months  
✅ **Monitor service principal activity** in Azure AD logs

**Recommended Azure setup:**

- Use **Managed Identity** instead of client secrets when deployed to Azure
- Enable **Azure AD authentication** for the App Service
- Store secrets in **Azure Key Vault** and reference via App Service configuration

---

## Automated Documentation Updates

The tool includes automated validation to keep Microsoft documentation up-to-date.

**How it works:**

- GitHub Actions workflow runs weekly (every Monday at 9 AM UTC)
- Checks 5+ Microsoft sources for product updates
- Sends email notification via Power Automate when changes detected
- Creates automatic pull requests with proposed updates

**Setup time:** 30 minutes

**Full guide:** [Automated Validation Setup](./docs/AUTOMATED_VALIDATION.md)

---

## Testing Your Deployment

### Test Checklist

- [ ] **Questionnaire flow works** (complete all 21 questions)
- [ ] **Results page displays** recommendation and scoring breakdown
- [ ] **Export functionality works** (JSON, Markdown, PDF downloads)
- [ ] **AI recommendations generate** (if OpenAI configured)
- [ ] **Dashboard displays** sample data (Demo Mode) or live metrics (Enterprise Mode)
- [ ] **API health check** returns 200 OK at `/api/health`
- [ ] **Configuration status** shows correct setup at `/api/metrics/config`

### Verify API Endpoints

```powershell
# Health check
curl http://localhost:3001/api/health

# Configuration status
curl http://localhost:3001/api/metrics/config

# Tenant metrics (Enterprise Mode only)
curl http://localhost:3001/api/metrics
```

---

## Support and Documentation

### Core Documentation

- **[README.md](../README.md)**: Complete technical documentation
- **[Configuration Guide](./docs/CONFIGURATION_GUIDE.md)**: Detailed Azure setup
- **[Automated Validation](./docs/AUTOMATED_VALIDATION.md)**: Weekly update automation
- **[Microsoft AI Decision Framework](https://microsoft.github.io/Microsoft-AI-Decision-Framework/)**: Official Microsoft guidance

### Common Issues

**Issue:** Dashboard shows "Demo Mode" even with Azure credentials configured

- **Solution**: Verify all 4 Azure credentials are set and feature flags are `true`
- **Check**: `/api/metrics/config` endpoint

**Issue:** AI recommendations not appearing

- **Solution**: Add OpenAI API key to `.env` and set `ENABLE_AI_RECOMMENDATIONS=true`

**Issue:** "Cannot find module" error on Azure deployment

- **Solution**: See [Azure Deployment Troubleshooting](../AZURE_DEPLOYMENT_TROUBLESHOOTING.md)

**Full troubleshooting:** [Configuration Guide - Troubleshooting](./docs/CONFIGURATION_GUIDE.md#troubleshooting)

---

## Cost Estimates

### Demo Mode

**Cost:** $0 (runs entirely locally)

### AI Mode (OpenAI)

- **OpenAI GPT-4**: ~$0.03-0.10 per survey completion
- **Azure OpenAI**: Same rates, billed through Azure subscription
- **Estimated monthly cost (100 surveys)**: $3-10

### Enterprise Mode (Full Azure Integration)

- **API calls (Cost Management, Graph, Security)**: Free (included in Azure subscription)
- **App Service hosting**: $13-55/month (Basic B1-B2 tier)
- **OpenAI + App Service total**: $16-65/month

### Production at Scale (1000 surveys/month)

- **Azure Static Web App**: Free tier or ~$10/month (Standard)
- **Azure Functions**: ~$5-20/month (Consumption plan)
- **OpenAI API**: ~$30-100/month
- **Total**: $35-130/month

---

## Next Steps

1. **Try Demo Mode** - No setup required, just run `npm run dev`
2. **Add AI features** - Get OpenAI API key and enable AI recommendations
3. **Enable enterprise dashboard** - Complete Azure service principal setup
4. **Deploy to production** - Choose deployment platform and follow guide
5. **Customize branding** - Update colors, logo, and styling
6. **Set up automated updates** - Enable weekly validation workflow

---

## Getting Help

- **Configuration issues**: [Configuration Guide](./docs/CONFIGURATION_GUIDE.md#troubleshooting)
- **Deployment problems**: [Azure Deployment Troubleshooting](../AZURE_DEPLOYMENT_TROUBLESHOOTING.md)
- **Microsoft Learn content**: [Microsoft Documentation](https://learn.microsoft.com/en-us/microsoft-365-copilot/)
- **AI Decision Framework**: [Official Framework](https://microsoft.github.io/Microsoft-AI-Decision-Framework/)

---

**Ready to get started?** Run `npm run dev` and explore the tool! 🚀
