# Copilot Decision Guidance Tool

A production-quality web application that guides users through a structured questionnaire to recommend the best Microsoft Copilot solution: **Microsoft 365 Copilot**, **Copilot Studio**, or a **Hybrid approach**.

## Features

✅ **Guided Decision Flow** - Multi-step questionnaire covering use cases, audience, data, integrations, governance, and more  
✅ **Deterministic Scoring** - Transparent, test-covered recommendation engine  
✅ **Comprehensive Results** - Rationale, next steps, risks, and verified Microsoft Learn sources  
✅ **Export Functionality** - Download results as JSON or Markdown  
✅ **Admin Panel** - Local configuration and telemetry viewing  
✅ **AI-Enhanced Explanations** - Optional LLM-assisted wording (with fallback)  
✅ **Verified Knowledge** - All guidance based on official Microsoft Learn documentation

## Tech Stack

### Frontend

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form management
- **Zod** for schema validation
- **Zustand** for state management

### Backend

- **Node.js 24+** + **TypeScript** + **Express**
- RESTful API endpoints
- AI/LLM abstraction layer (Azure OpenAI or OpenAI-compatible)

### Monorepo Structure

```
copilot-decision-guidance/
├── apps/
│   ├── web/          # Vite + React frontend
│   └── api/          # Node + Express backend
├── packages/
│   └── decision-engine/  # Shared scoring logic + tests
└── docs/             # Documentation
```

## Prerequisites

- **Node.js** 24.0.0 or higher (LTS recommended)
- **npm** 10.0.0 or higher

## Quick Start

### 1. Install Dependencies

```powershell
npm install
```

This will install dependencies for all workspaces (apps/web, apps/api, packages/decision-engine).

### 2. Configure Environment Variables

Create a `.env` file in the **root** directory:

```bash
# Optional: AI-enhanced explanations (Azure OpenAI or OpenAI)
# If not provided, app runs in "No AI mode" with deterministic templates

# Option 1: Azure OpenAI
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=your-deployment-name

# Option 2: OpenAI
OPENAI_API_KEY=your_openai_key

# API Server Port (optional, defaults to 3001)
PORT=3001
```

**Note:** The `.env` and `.env.local` files are the **ONLY files you may edit manually**. All other work must be done via this agent.

### 3. Run in Development Mode

```powershell
npm run dev
```

This starts:

- Frontend dev server on `http://localhost:3000`
- Backend API server on `http://localhost:3001`

### 4. Open the Application

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

### Build All Workspaces

```powershell
npm run build
```

This compiles:

- Frontend to `apps/web/dist/`
- Backend to `apps/api/dist/`
- Decision engine package

### Run Tests

```powershell
npm test
```

Runs Vitest tests for the decision engine scoring logic.

## How It Works

### Decision Model

The questionnaire and scoring logic are defined in:

```
packages/decision-engine/src/data/decision-model.v1.json
```

**Structure:**

- **Question Groups** (7 groups covering outcome, audience, data, integration, governance, time-to-value, cost)
- **Questions** with multiple-choice answers
- **Weights** for each answer (m365Copilot, copilotStudio, hybrid)
- **Thresholds** for determining final recommendation

### Scoring Algorithm

1. User answers questions
2. Each answer contributes weighted points to three categories
3. Totals are compared with thresholds
4. Recommendation is determined:
   - **M365 Copilot**: Productivity focus, M365 data, immediate value
   - **Copilot Studio**: Custom agents, line-of-business integration, workflows
   - **Hybrid**: Mixed signals, both broad and custom needs

### AI Integration (Optional)

When API keys are configured:

- LLM **ONLY** rewrites explanations for clarity
- LLM **NEVER** changes the recommendation or decision logic

**Microsoft Learn MCP Integration (v1.2.0+)**:
- Infrastructure added for real-time Microsoft Learn documentation fetching
- Uses `mcp_microsoft-lea_microsoft_docs_search` for documentation queries
- Uses `mcp_microsoft-lea_microsoft_code_sample_search` for code examples
- Queries are recommendation-specific:
  - **M365 Copilot**: Extensibility, security, compliance, data residency
  - **Copilot Studio**: Agents, connectors, governance, deployment channels
  - **Hybrid**: Combined queries from both
- Integration point currently logs queries and uses comprehensive static framework knowledge
- Ready for future enhancement to fetch live documentation when MCP server available
- Maintains graceful fallback to static content
- Falls back to deterministic templates if AI unavailable

## API Endpoints

### `GET /api/health`

Health check endpoint

### `GET /api/model`

Returns the decision model (questions and weights)

### `POST /api/score`

**Body:** `{ "answers": { "questionId": "answerId", ... } }`  
**Returns:** `{ "recommendation": {...}, "scoringResult": {...} }`

### `POST /api/explain`

**Body:** `{ "recommendation": {...}, "userContext": {...} }`  
**Returns:** AI-enhanced explanation (or fallback)

### `GET /api/sources`

Returns curated Microsoft Learn source URLs

## Project Structure

```
apps/web/
├── src/
│   ├── pages/         # React pages (Landing, Wizard, Results, Admin)
│   ├── components/    # Reusable components (Layout)
│   ├── store/         # Zustand state management
│   ├── lib/           # API client, export utilities
│   ├── App.tsx        # Router setup
│   └── main.tsx       # Entry point

apps/api/
└── src/
    └── index.ts       # Express server with endpoints

packages/decision-engine/
├── src/
│   ├── types.ts       # Zod schemas and TypeScript types
│   ├── scoring.ts     # Deterministic scoring logic
│   ├── recommendations.ts  # Recommendation content generation
│   ├── data/
│   │   └── decision-model.v1.json  # Question model
│   └── index.ts       # Public API
└── src/scoring.test.ts  # Vitest tests
```

## Modifying Questions or Weights

To add or edit questions:

1. Edit `packages/decision-engine/src/data/decision-model.v1.json`
2. Follow the existing schema (see `types.ts` for Zod validation)
3. Adjust weights to influence scoring
4. Restart the dev server

**Example Question:**

```json
{
  "id": "my_new_question",
  "title": "What is your primary goal?",
  "helperText": "Select the option that best describes your needs",
  "answers": [
    {
      "id": "answer_1",
      "label": "Enhance productivity",
      "weights": { "m365Copilot": 10, "copilotStudio": 2, "hybrid": 5 }
    }
  ]
}
```

## Thresholds

Located in `decision-model.v1.json`:

```json
{
  "thresholds": {
    "winMargin": 15,
    "hybridThreshold": 10
  }
}
```

- **winMargin**: Minimum score difference for a clear winner
- **hybridThreshold**: How close hybrid score must be to top score

## Knowledge Sources

All product information is verified using **Microsoft Learn MCP Server** and documented in:

```
docs/verified-notes.md
```

Each recommendation includes links to official Microsoft Learn pages.

## Admin Panel

Access at [http://localhost:3000/admin](http://localhost:3000/admin)

Features:

- View decision model version
- Check API connection status
- Clear local storage
- View environment configuration

**⚠️ Local use only** - Not intended for production without authentication/authorization.

## Deployment Options

### Option 1: Static Frontend + Serverless Backend

- Deploy frontend to **Azure Static Web Apps**, **Vercel**, or **Netlify**
- Deploy backend API to **Azure Functions** or **AWS Lambda**

### Option 2: Container Deployment

- Build Docker images for frontend and backend
- Deploy to **Azure Container Apps**, **AWS ECS**, or **Kubernetes**

### Option 3: Full-Stack Platform (Recommended for Azure)

- Deploy to **Azure App Service** with Node.js runtime
- Serve frontend build from backend Express server

#### Azure App Service Deployment

**⚠️ IMPORTANT: If you get "Cannot find module" errors, see [AZURE_DEPLOYMENT_TROUBLESHOOTING.md](./AZURE_DEPLOYMENT_TROUBLESHOOTING.md)**

**Prerequisites:**

- Azure subscription
- VS Code with Azure App Service extension installed
- Git repository initialized
- Application built (`npm run build`)

**Deployment Steps:**

1. **Initialize Git (if not done):**

   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Build the application:**

   ```powershell
   npm run build
   ```

3. **Configure Azure App Service Settings (CRITICAL):**
   - In Azure Portal → Your App Service → Configuration
   - **General Settings** → **Startup Command:**
     ```
     node server-production.js
     ```
   - **Application Settings** → Add:
     ```
     SCM_DO_BUILD_DURING_DEPLOYMENT = true
     WEBSITE_NODE_DEFAULT_VERSION = 20-lts
     ```
   - Click **Save**, then **Restart** the app

   > **Note**: No special flags needed - pure JavaScript runtime!
   > No tsx, no NPM_CONFIG_PRODUCTION=false - everything just works!

4. **Deploy via VS Code:**
   - Open Azure extension (Azure icon in sidebar)
   - Sign in to Azure
   - Right-click "App Services" → "Create New Web App (Advanced)"
   - Choose: Node 20+ LTS, Linux, Basic (B1) or higher
   - After creation, right-click the web app → "Deploy to Web App"
   - Select this workspace folder

5. **Configure Environment Variables (Optional - for AI features):**
   - In Azure Portal → Configuration → Application settings
   - Add:
     ```
     AZURE_OPENAI_API_KEY=your-key
     AZURE_OPENAI_ENDPOINT=your-endpoint
     AZURE_OPENAI_DEPLOYMENT=your-deployment
     ENABLE_AI_EXPLANATIONS=true
     NODE_ENV=production
     ```

6. **Verify Deployment:**
   - Navigate to your App Service URL
   - Check `/api/health` endpoint: `https://<your-app>.azurewebsites.net/api/health`
   - Test the questionnaire flow

**Troubleshooting:**
If deployment fails with "Cannot find module" error:

1. See [AZURE_DEPLOYMENT_TROUBLESHOOTING.md](./AZURE_DEPLOYMENT_TROUBLESHOOTING.md) for detailed steps
2. Verify Startup Command is set to: `node --import tsx server-production.js`
3. Check Deployment Center logs in Azure Portal
4. Clear Azure cache and redeploy if needed

**Files for Azure Deployment:**

- `server-production.js` - Production server with integrated API
- `package.json` - With "main": "server-production.js"
- `.deployment` - Azure deployment config with custom build script
- `.azure/deploy.sh` - Custom deployment script
- `web.config` - IIS configuration (for Windows App Service)
- `apps/web/dist/` - Built frontend (committed or built during deployment)

**Default Ports:**

- Azure automatically assigns the PORT environment variable
- Local development uses PORT from `.env` (default: 3001)

## Security Considerations

1. **Never commit API keys** - Use environment variables
2. **Validate all inputs** - Zod schemas enforce type safety
3. **Secrets management** - Use Azure Key Vault, AWS Secrets Manager, etc. in production
4. **Authentication** - Add auth middleware for admin routes in production
5. **CORS** - Configure CORS properly for production domains

## Contributing

This tool is built to be extended:

- Add new question groups in `decision-model.v1.json`
- Extend recommendation logic in `recommendations.ts`
- Add new export formats in `export.ts`
- Enhance UI components in `apps/web/src/components/`

## Troubleshooting

### Port Already in Use

Change the port in `.env`:

```bash
PORT=3002
```

### Module Not Found

Reinstall dependencies:

```powershell
npm install
```

### Tests Failing

Run tests with verbose output:

```powershell
npm test -- --reporter=verbose
```

## License

This tool is provided as-is for informational purposes. It is **not official Microsoft guidance**.

## Support

For questions or issues:

- Review [docs/decision-model.md](docs/decision-model.md) for methodology
- Check [docs/verified-notes.md](docs/verified-notes.md) for source references
- Refer to official Microsoft Learn documentation for product details

---

**Built with verified guidance from [Microsoft Learn](https://learn.microsoft.com)**
