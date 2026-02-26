# Quick Start Guide

## Running the Application

### 1. Prerequisites

- Node.js 24.0.0+ installed
- npm 10.0.0+ installed

### 2. First-Time Setup

```powershell
# From the project root
cd c:\repos\copilot-decision-guidance

# Install all dependencies (only needed once)
npm install

# Create .env file (already created, but you can edit it)
# The .env and .env.local files are the ONLY files you should edit manually
```

### 3. Start the Application

**Option A: Run both servers (recommended for development)**

Open two PowerShell terminals:

**Terminal 1 - API Server:**

```powershell
cd c:\repos\copilot-decision-guidance
npm run dev:api
```

**Terminal 2 - Web Server:**

```powershell
cd c:\repos\copilot-decision-guidance
npm run dev:web
```

The application will be available at:

- Frontend: http://localhost:3000
- API Backend: http://localhost:3001

### 4. Access the Application

Open your browser and navigate to: **http://localhost:3000**

## What You'll See

1. **Landing Page** - Overview and "Start Questionnaire" button
2. **Wizard** - 7-step questionnaire with progress bar
3. **Results** - Recommendation with rationale, next steps, risks, and sources
4. **Admin Panel** - Configuration view (access via header link)

## Features Implemented

✅ **Complete Decision Questionnaire**

- 7 question groups covering all decision dimensions
- Progress indicator
- Session storage (answers persist on refresh)

✅ **Deterministic Scoring Engine**

- 19 passing tests
- Transparent breakdown of how scores were calculated
- Confidence level calculation

✅ **Comprehensive Recommendations**

- Microsoft 365 Copilot option
- Copilot Studio option
- Hybrid approach option
- 5-8 reasons for each recommendation
- Step-by-step next actions
- Risk warnings
- Verified Microsoft Learn sources

✅ **Export Functionality**

- Download results as JSON
- Download results as Markdown

✅ **Admin Panel**

- View configuration
- Clear local storage
- Environment status

✅ **AI Integration (Optional)**

- LLM abstraction ready for Azure OpenAI or OpenAI
- Falls back to deterministic templates if no API keys configured
- Currently running in "No AI mode" (deterministic only)

## Testing

```powershell
# Run decision engine tests
cd c:\repos\copilot-decision-guidance\packages\decision-engine
npm test

# All 19 tests should pass
```

## Building for Production

```powershell
# Build frontend
cd c:\repos\copilot-decision-guidance\apps\web
npm run build
# Output: apps/web/dist/

# Build backend
cd c:\repos\copilot-decision-guidance\apps\api
npm run build
# Output: apps/api/dist/
```

## Modifying the Decision Model

To change questions or weights:

1. Edit: `packages/decision-engine/src/data/decision-model.v1.json`
2. Restart the dev servers
3. Changes will be reflected immediately

## Adding AI-Enhanced Explanations

To enable AI-enhanced wording:

1. Open `.env` file
2. Add your API keys:

   ```bash
   # Option 1: Azure OpenAI
   AZURE_OPENAI_API_KEY=your_key_here
   AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name

   # Option 2: OpenAI
   OPENAI_API_KEY=your_key_here
   ```

3. Restart the API server
4. The app will use LLM to enhance explanation wording (while keeping deterministic scoring)

## Troubleshooting

### Port Already in Use

Edit `.env` and change:

```bash
PORT=3002
```

### Module Not Found

Reinstall dependencies:

```powershell
npm install
```

### Tests Failing

Check that you're in the correct directory:

```powershell
cd c:\repos\copilot-decision-guidance\packages\decision-engine
npm test
```

## Project Structure

```
copilot-decision-guidance/
├── apps/
│   ├── web/               # React frontend (localhost:3000)
│   │   ├── src/
│   │   │   ├── pages/     # Landing, Wizard, Results, Admin
│   │   │   ├── components/
│   │   │   ├── store/     # Zustand state
│   │   │   └── lib/       # API client, export utils
│   │   └── dist/          # Build output
│   │
│   └── api/               # Express backend (localhost:3001)
│       ├── src/
│       │   └── index.ts   # API endpoints
│       └── dist/          # Build output
│
├── packages/
│   └── decision-engine/   # Shared scoring logic
│       ├── src/
│       │   ├── data/
│       │   │   └── decision-model.v1.json
│       │   ├── scoring.ts
│       │   ├── recommendations.ts
│       │   └── types.ts
│       └── src/scoring.test.ts  # 19 passing tests
│
├── docs/
│   ├── verified-notes.md  # Microsoft Learn verified facts
│   └── decision-model.md  # Methodology documentation
│
├── .env                   # Environment variables (YOU CAN EDIT)
├── .env.example           # Example env file
├── README.md              # Full documentation
└── package.json           # Workspace configuration
```

## Next Steps

1. ✅ App is running and fully functional
2. ⏭️ **Optional:** Configure AI API keys in `.env` for enhanced explanations
3. ⏭️ Test the questionnaire end-to-end
4. ⏭️ Review the decision model and adjust weights if needed
5. ⏭️ Deploy to production (see README.md for deployment options)

## Important Notes

- **No TODOs** - All core functionality is implemented
- **Verified Knowledge** - All content based on Microsoft Learn documentation
- **Deterministic Scoring** - Same answers always produce same recommendation
- **AI is Optional** - App works perfectly without AI keys (uses templates)
- **User Should Not Code** - You've built everything; user only edits `.env` if needed

## Support

For questions or modifications:

- Review [README.md](../README.md) for comprehensive documentation
- Check [docs/decision-model.md](decision-model.md) for methodology
- See [docs/verified-notes.md](verified-notes.md) for source references
- Training source: [Copilot and Agents Spotlight](https://adoption.microsoft.com/en-us/customer-hub/copilot-and-agents-spotlight/)
