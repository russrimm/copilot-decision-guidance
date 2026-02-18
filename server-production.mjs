/**
 * Production Server (ES Modules - No TypeScript Transpilation Needed)
 * This is a compiled JavaScript version that doesn't require tsx
 * Integrates frontend serving and API routes in a single process
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ES Module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Dynamic import of decision engine (handles TypeScript via package exports)
let decisionModel, calculateRecommendation, generateRecommendation;

async function loadDecisionEngine() {
  const importCandidates = [
    '@copilot-guidance/decision-engine',
    './packages/decision-engine/dist/index.js',
  ];

  let engine = null;
  let loadedFrom = null;
  let lastError = null;

  for (const candidate of importCandidates) {
    try {
      console.log(`[STARTUP] Loading decision engine from ${candidate}`);
      engine = await import(candidate);
      loadedFrom = candidate;
      break;
    } catch (error) {
      lastError = error;
      console.warn(
        `[STARTUP] Unable to load decision engine from ${candidate}: ${error.code || error.message}`
      );
    }
  }

  try {
    if (!engine) {
      throw lastError || new Error('No decision engine import candidate succeeded');
    }

    decisionModel = engine.decisionModel;
    calculateRecommendation = engine.calculateRecommendation;
    generateRecommendation = engine.generateRecommendation;

    console.log('[STARTUP] ✅ Decision engine loaded successfully');
    console.log(`[STARTUP] ✅ Loaded from: ${loadedFrom}`);
    console.log(`[STARTUP] 📊 Decision model v${decisionModel.metadata?.version || 'unknown'}`);
    console.log(
      `[STARTUP] Decision model has ${decisionModel.questionGroups?.length || 0} question groups`
    );
    console.log(`[STARTUP] calculateRecommendation type: ${typeof calculateRecommendation}`);
    console.log(`[STARTUP] generateRecommendation type: ${typeof generateRecommendation}`);
  } catch (error) {
    console.error('[STARTUP] ❌ Failed to load decision engine:', error);
    console.error('[STARTUP] Error stack:', error.stack);
    process.exit(1);
  }
}

// API Routes

// Health check - Azure uses this to verify app is running
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    model: decisionModel?.metadata || null,
  });
});

// Root health check for Azure App Service
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Copilot Decision Guidance API',
    version: '2.0.0',
    endpoints: ['/api/health', '/api/model', '/api/score', '/api/sources'],
  });
});

// Get decision model
app.get('/api/model', (req, res) => {
  try {
    res.json(decisionModel);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load decision model' });
  }
});

// Calculate recommendation
app.post('/api/score', async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers) {
      return res.status(400).json({ error: 'Missing answers in request body' });
    }

    // Step 1: Calculate scores and determine recommendation type
    const scoringResult = calculateRecommendation(decisionModel, answers);

    // Step 2: Generate detailed recommendation text
    const recommendation = generateRecommendation(scoringResult);

    // Return both scoringResult and recommendation (matching API format)
    res.json({ recommendation, scoringResult });
  } catch (error) {
    console.error('[SCORE] Error calculating recommendation:', error.message);
    res.status(500).json({ error: 'Failed to calculate recommendation' });
  }
});

// Get AI explanation (if enabled)
// Note: This feature requires the full API server with Azure OpenAI integration
app.post('/api/explain', async (req, res) => {
  try {
    // This endpoint is not available in production mode
    // It requires Azure OpenAI configuration which is handled by the full API server
    res.status(501).json({
      error: 'AI explanation feature not available in this deployment mode',
      message: 'This feature requires the full API server with Azure OpenAI configuration',
    });
  } catch (error) {
    console.error('Error generating explanation:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// Get verified sources
app.get('/api/sources', (req, res) => {
  try {
    // Sources are embedded in the model metadata
    const sources = decisionModel.metadata?.sources || [];
    res.json({ sources });
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({ error: 'Failed to fetch sources' });
  }
});

// Copilot Agent Chat - AI-powered assistant
app.post('/api/copilot-agent/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message in request body' });
    }

    // Check if AI is enabled
    const azureKey = process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!azureKey || !azureEndpoint || !azureDeployment) {
      return res.status(501).json({
        error: 'AI not configured',
        message:
          'Azure OpenAI environment variables (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT) must be set to enable the Copilot Agent',
      });
    }

    // Build conversation history
    const conversationHistory = (history || []).slice(-5).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // System prompt with knowledge base
    const systemPrompt = `You are a helpful Microsoft Agentic Decision Assistant specializing in Microsoft 365 Copilot, Copilot Studio, Microsoft Foundry, and Agent Builder. Your role is to help users understand:

1. **Licensing & Pricing**
   - Microsoft 365 Copilot: $30/user/month
   - Copilot Studio Pay-as-you-go: $0.01/message
   - Copilot Studio Subscription: $200/month (includes 25,000 messages)
   - Microsoft Foundry: Usage-based pricing (Azure AI services, compute, storage)
   - Agent Builder: Included with Copilot Studio licensing

2. **Key Features**
   M365 Copilot:
   - Embedded in Microsoft 365 apps (Word, Excel, PowerPoint, Teams, Outlook)
   - Enterprise data grounding via Microsoft Graph
   - Premium license required
   - No custom agent building

   Copilot Studio:
   - Custom copilot and agent creation
   - Low-code/no-code platform
   - Power Automate integration
   - Deploy to multiple channels (Teams, web, WhatsApp, etc.)
   - Extend M365 Copilot with plugins

   Microsoft Foundry:
   - Full-stack AI development platform with SDKs (Python, .NET, JavaScript)
   - Custom model fine-tuning and deployment
   - Advanced Prompt Flow orchestration
   - Vector databases and RAG patterns
   - Enterprise MLOps and evaluation tools

   Agent Builder:
   - Lightweight guided experience for Q&A agents
   - Knowledge base from SharePoint, websites, files
   - No-code agent creation
   - Quick deployment to Teams, websites

3. **Decision Guidance**
   - Use M365 Copilot when: You need AI embedded in Microsoft 365 apps for productivity
   - Use Copilot Studio when: You need custom agents, multi-channel deployment, or low-code automation
   - Use Microsoft Foundry when: You need pro-code AI development, custom model fine-tuning, or full control
   - Use Agent Builder when: You need simple knowledge-base Q&A agents with no-code creation

**Guidelines:**
- Be conversational and helpful
- Provide specific, accurate information
- If asked about costs, calculate estimates when possible
- Clarify that organizations often use BOTH products
- Keep responses concise (2-4 paragraphs max)
- Include relevant links when helpful:
  - M365 Copilot: https://learn.microsoft.com/en-us/copilot/microsoft-365/
  - Copilot Studio: https://learn.microsoft.com/en-us/microsoft-copilot-studio/
  - Microsoft Foundry: https://learn.microsoft.com/en-us/azure/ai-studio/
  - Microsoft AI Decision Framework: https://microsoft.github.io/Microsoft-AI-Decision-Framework/

**Important:** Only provide information based on the knowledge above.`;

    // Call Azure OpenAI
    const apiUrl = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: message },
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[COPILOT] Azure OpenAI API error:', response.status);
      throw new Error('Failed to get response from AI service');
    }

    const data = await response.json();
    const responseText =
      data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    res.json({ response: responseText });
  } catch (error) {
    console.error('[COPILOT] Error:', error.message);
    res.status(500).json({
      error: 'Failed to process chat message',
    });
  }
});

// Serve static frontend files
const frontendPath = join(__dirname, 'apps', 'web', 'dist');
app.use(express.static(frontendPath));

// React Router fallback - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(frontendPath, 'index.html'));
});

// Global error handlers to prevent process crashes
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  console.error('[FATAL] Stack:', error.stack);
  // Don't exit immediately - log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise);
  console.error('[FATAL] Reason:', reason);
  // Don't exit immediately - log and continue
});

// Start server after loading decision engine
loadDecisionEngine()
  .then(() => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   Listening on 0.0.0.0:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`   Process ID: ${process.pid}`);
    });

    // Keep server reference to prevent garbage collection
    server.on('error', (error) => {
      console.error('[SERVER] Error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`[SERVER] Port ${PORT} is already in use`);
        process.exit(1);
      }
    });

    server.on('close', () => {
      console.log('[SERVER] Server closed');
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n[SHUTDOWN] ${signal} received, closing server gracefully...`);
      server.close(() => {
        console.log('[SHUTDOWN] Server closed, exiting process');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('[SHUTDOWN] Forcefully shutting down after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((error) => {
    console.error('[STARTUP] Failed to start server:', error);
    console.error('[STARTUP] Stack:', error.stack);
    process.exit(1);
  });
