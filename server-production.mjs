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
let getCopilotStudioReleasePlannerData;
let useCasesRouter;
let generateExecutiveOverviewPPTX;
let azureCredential = null;

function getOpenAIChatCompletionsUrl() {
  const rawEndpoint = (process.env.OPENAI_ENDPOINT || '').trim();
  if (!rawEndpoint) {
    return 'https://api.openai.com/v1/chat/completions';
  }

  const normalized = rawEndpoint.replace(/\/+$/, '');
  if (normalized.includes('/chat/completions')) {
    return normalized;
  }

  if (normalized.includes('api.openai.com') && !normalized.includes('/v1')) {
    return `${normalized}/v1/chat/completions`;
  }

  return `${normalized}/chat/completions`;
}

async function getAzureOpenAIAccessToken() {
  if (!azureCredential) {
    const identity = await import('@azure/identity');
    azureCredential = new identity.DefaultAzureCredential({
      managedIdentityClientId: process.env.AZURE_CLIENT_ID,
    });
  }

  const token = await azureCredential.getToken('https://cognitiveservices.azure.com/.default');
  if (!token?.token) {
    throw new Error('Unable to acquire Microsoft Entra access token for Azure OpenAI');
  }

  return token.token;
}

const readinessDomains = [
  {
    id: 'identity',
    label: 'Identity',
    description: 'Authentication, access control, and identity posture',
  },
  {
    id: 'data',
    label: 'Data',
    description: 'Data quality, boundaries, and content readiness',
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Security controls, compliance readiness, and risk posture',
  },
  {
    id: 'platform',
    label: 'Platform',
    description: 'Technical platform prerequisites and integration readiness',
  },
  {
    id: 'operatingModel',
    label: 'Operating Model',
    description: 'Ownership, support model, and change management readiness',
  },
];

const readinessQuestions = [
  {
    id: 'identity-1',
    domain: 'identity',
    title: 'Microsoft Entra ID conditional access is enforced for target user groups.',
    helperText: 'Protects access to copilots and agents with baseline controls.',
    isBlocker: true,
  },
  {
    id: 'identity-2',
    domain: 'identity',
    title: 'Role-based access is defined for makers, admins, and reviewers.',
    helperText: 'Ensures least-privilege access across delivery teams.',
    isBlocker: false,
  },
  {
    id: 'data-1',
    domain: 'data',
    title: "Knowledge data source permissions align with agent's targeted users.",
    helperText:
      'Prevents overexposure and access gaps by ensuring the agent grounds only on sources that intended users are both authorized and able to access.',
    isBlocker: true,
  },
  {
    id: 'data-2',
    domain: 'data',
    title: 'Knowledge sources meet required data residency and security requirements.',
    helperText:
      'Reduces compliance and exposure risk by ensuring grounding sources stay in approved regions and security boundaries.',
    isBlocker: true,
  },
  {
    id: 'data-3',
    domain: 'data',
    title: 'Knowledge data is fresh enough for pilot workflows.',
    helperText: 'Improves first-pass answer quality and trust.',
    isBlocker: false,
  },
  {
    id: 'security-1',
    domain: 'security',
    title: 'DLP and data-sharing policies are in place for pilot scope.',
    helperText: 'Minimum guardrail before production rollout.',
    isBlocker: true,
  },
  {
    id: 'security-2',
    domain: 'security',
    title: 'Human-in-the-loop controls are defined for high-impact actions.',
    helperText: 'Prevents autonomous execution for sensitive decisions.',
    isBlocker: true,
  },
  {
    id: 'platform-1',
    domain: 'platform',
    title: 'Required connectors/integrations are validated in non-production.',
    helperText: 'Reduces implementation risk in first release wave.',
    isBlocker: false,
  },
  {
    id: 'platform-2',
    domain: 'platform',
    title: 'Environment strategy exists for dev/test/prod promotion.',
    helperText: 'Supports reliable releases and rollback posture.',
    isBlocker: true,
  },
  {
    id: 'operating-1',
    domain: 'operatingModel',
    title: 'An owner is assigned for each use case and KPI.',
    helperText: 'Clarifies accountability for value realization.',
    isBlocker: false,
  },
  {
    id: 'operating-2',
    domain: 'operatingModel',
    title: 'Support runbook exists for incidents and escalation paths.',
    helperText: 'Needed for stable operations post-launch.',
    isBlocker: true,
  },
];

function isReadinessEquivalentToYes(questionId, answer) {
  return answer === 'yes' || (questionId === 'identity-1' && answer === 'na-anonymous-agent');
}

function scoreReadinessAnswer(questionId, answer) {
  if (questionId === 'identity-1' && answer === 'na-anonymous-agent') return 100;
  if (answer === 'yes') return 100;
  if (answer === 'partial') return 50;
  return 0;
}

const portfolioCriteria = [
  {
    id: 'businessValue',
    label: 'Business value',
    description: 'Expected measurable business impact',
    higherIsBetter: true,
  },
  {
    id: 'feasibility',
    label: 'Feasibility',
    description: 'Delivery feasibility based on current capabilities',
    higherIsBetter: true,
  },
  {
    id: 'timeToValue',
    label: 'Time to value',
    description: 'Speed to meaningful value realization',
    higherIsBetter: true,
  },
  {
    id: 'risk',
    label: 'Risk',
    description: 'Delivery and operational risk level',
    higherIsBetter: false,
  },
  {
    id: 'dataSensitivity',
    label: 'Data sensitivity',
    description: 'Data sensitivity and governance complexity',
    higherIsBetter: false,
  },
];

const portfolioDefaultWeights = {
  businessValue: 30,
  feasibility: 25,
  timeToValue: 20,
  risk: 15,
  dataSensitivity: 10,
};

const portfolioDefaultUseCases = [
  {
    id: 'uc-1',
    name: 'Executive meeting summarization copilot',
    description: 'Summarize Teams/Outlook/Docs context for leadership briefings.',
    ratings: {
      businessValue: 4,
      feasibility: 5,
      timeToValue: 5,
      risk: 2,
      dataSensitivity: 2,
    },
  },
  {
    id: 'uc-2',
    name: 'Employee helpdesk agent',
    description: 'Copilot Studio agent for HR/IT policy and ticket triage support.',
    ratings: {
      businessValue: 5,
      feasibility: 4,
      timeToValue: 4,
      risk: 3,
      dataSensitivity: 3,
    },
  },
  {
    id: 'uc-3',
    name: 'Sales proposal assistant with CRM grounding',
    description: 'RAG-powered drafting assistant with approved collateral and CRM context.',
    ratings: {
      businessValue: 5,
      feasibility: 3,
      timeToValue: 3,
      risk: 4,
      dataSensitivity: 4,
    },
  },
  {
    id: 'uc-4',
    name: 'Foundry document intelligence workflow',
    description: 'Custom Foundry workflow for complex extraction and decision support.',
    ratings: {
      businessValue: 4,
      feasibility: 2,
      timeToValue: 2,
      risk: 4,
      dataSensitivity: 4,
    },
  },
];

function clampRating(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function normalizeWeights(weights) {
  const merged = {
    businessValue: Math.max(
      0,
      Number(weights?.businessValue ?? portfolioDefaultWeights.businessValue)
    ),
    feasibility: Math.max(0, Number(weights?.feasibility ?? portfolioDefaultWeights.feasibility)),
    timeToValue: Math.max(0, Number(weights?.timeToValue ?? portfolioDefaultWeights.timeToValue)),
    risk: Math.max(0, Number(weights?.risk ?? portfolioDefaultWeights.risk)),
    dataSensitivity: Math.max(
      0,
      Number(weights?.dataSensitivity ?? portfolioDefaultWeights.dataSensitivity)
    ),
  };

  const total = Object.values(merged).reduce((sum, value) => sum + value, 0);
  if (!total) return portfolioDefaultWeights;

  return {
    businessValue: Math.round((merged.businessValue / total) * 100),
    feasibility: Math.round((merged.feasibility / total) * 100),
    timeToValue: Math.round((merged.timeToValue / total) * 100),
    risk: Math.round((merged.risk / total) * 100),
    dataSensitivity: Math.round((merged.dataSensitivity / total) * 100),
  };
}

function scorePortfolioUseCase(useCase, weights) {
  const positiveWeight = weights.businessValue + weights.feasibility + weights.timeToValue;
  const negativeWeight = weights.risk + weights.dataSensitivity;

  const positiveRaw =
    useCase.ratings.businessValue * weights.businessValue +
    useCase.ratings.feasibility * weights.feasibility +
    useCase.ratings.timeToValue * weights.timeToValue;

  const negativeRaw =
    useCase.ratings.risk * weights.risk + useCase.ratings.dataSensitivity * weights.dataSensitivity;

  const positiveScore = positiveWeight ? positiveRaw / (5 * positiveWeight) : 0;
  const riskAdjustedScore = negativeWeight ? 1 - negativeRaw / (5 * negativeWeight) : 1;

  const score = Math.round((positiveScore * 0.7 + riskAdjustedScore * 0.3) * 100);
  const tier = score >= 75 ? 'now' : score >= 55 ? 'next' : 'later';
  return { score, tier };
}

async function loadDecisionEngine() {
  const importCandidates = [
    './packages/decision-engine/dist/index.js',
    '@copilot-guidance/decision-engine',
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

async function loadReleasePlannerService() {
  const importCandidates = ['./apps/api/dist/services/release-planner.js'];

  let serviceModule = null;
  let loadedFrom = null;
  let lastError = null;

  for (const candidate of importCandidates) {
    try {
      console.log(`[STARTUP] Loading release planner service from ${candidate}`);
      serviceModule = await import(candidate);
      loadedFrom = candidate;
      break;
    } catch (error) {
      lastError = error;
      console.warn(
        `[STARTUP] Unable to load release planner service from ${candidate}: ${error.code || error.message}`
      );
    }
  }

  if (!serviceModule?.getCopilotStudioReleasePlannerData) {
    throw lastError || new Error('No release planner service import candidate succeeded');
  }

  getCopilotStudioReleasePlannerData = serviceModule.getCopilotStudioReleasePlannerData;
  console.log(`[STARTUP] ✅ Release planner service loaded from: ${loadedFrom}`);
}

async function loadUseCasesRouter() {
  const importCandidates = ['./apps/api/dist/routes/use-cases.js'];

  let routerModule = null;
  let loadedFrom = null;
  let lastError = null;

  for (const candidate of importCandidates) {
    try {
      console.log(`[STARTUP] Loading use-cases router from ${candidate}`);
      routerModule = await import(candidate);
      loadedFrom = candidate;
      break;
    } catch (error) {
      lastError = error;
      console.warn(
        `[STARTUP] Unable to load use-cases router from ${candidate}: ${error.code || error.message}`
      );
    }
  }

  if (!routerModule?.default) {
    throw lastError || new Error('No use-cases router import candidate succeeded');
  }

  useCasesRouter = routerModule.default;
  console.log(`[STARTUP] ✅ Use-cases router loaded from: ${loadedFrom}`);
}

async function loadExecutiveOverviewPptxService() {
  const importCandidates = ['./apps/api/dist/services/executive-overview-pptx.js'];

  let serviceModule = null;
  let loadedFrom = null;
  let lastError = null;

  for (const candidate of importCandidates) {
    try {
      console.log(`[STARTUP] Loading executive overview PPTX service from ${candidate}`);
      serviceModule = await import(candidate);
      loadedFrom = candidate;
      break;
    } catch (error) {
      lastError = error;
      console.warn(
        `[STARTUP] Unable to load executive overview PPTX service from ${candidate}: ${error.code || error.message}`
      );
    }
  }

  if (!serviceModule?.generateExecutiveOverviewPPTX) {
    throw lastError || new Error('No executive overview PPTX service import candidate succeeded');
  }

  generateExecutiveOverviewPPTX = serviceModule.generateExecutiveOverviewPPTX;
  console.log(`[STARTUP] ✅ Executive overview PPTX service loaded from: ${loadedFrom}`);
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
    endpoints: [
      '/api/health',
      '/api/model',
      '/api/score',
      '/api/sources',
      '/api/export/executive-overview/pptx',
      '/api/use-cases/verticals',
      '/api/use-cases/departments',
      '/api/use-cases/data-sources',
      '/api/readiness/model',
      '/api/readiness/assess',
      '/api/release-planner/copilot-studio',
    ],
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

// Use Cases Assistant routes
app.use('/api/use-cases', (req, res, next) => {
  if (!useCasesRouter) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Use Cases routes are not loaded on this deployment instance',
    });
  }

  return useCasesRouter(req, res, next);
});

// Readiness Assessment model
app.get('/api/readiness/model', (req, res) => {
  res.json({
    version: '2.0.0',
    domains: readinessDomains,
    questions: readinessQuestions,
    answerOptions: [
      { id: 'yes', label: 'Yes' },
      { id: 'partial', label: 'Partially' },
      { id: 'no', label: 'No' },
    ],
  });
});

// Readiness Assessment scoring
app.post('/api/readiness/assess', (req, res) => {
  try {
    const answers = req.body?.answers;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message:
          'Missing answers. Expected: { answers: { [questionId]: yes|partial|no } } (identity-1 also supports na-anonymous-agent).',
      });
    }

    const missingQuestions = readinessQuestions.map((q) => q.id).filter((id) => !answers[id]);

    if (missingQuestions.length > 0) {
      return res.status(400).json({
        error: 'Incomplete assessment',
        message: 'All readiness questions must be answered.',
        missingQuestions,
      });
    }

    const domainScores = readinessDomains.map((domain) => {
      const domainQuestions = readinessQuestions.filter((q) => q.domain === domain.id);
      const total = domainQuestions.reduce(
        (sum, q) => sum + scoreReadinessAnswer(q.id, answers[q.id]),
        0
      );
      const score = Math.round(total / domainQuestions.length);
      return {
        domain: domain.id,
        label: domain.label,
        score,
      };
    });

    const overallScore = Math.round(
      domainScores.reduce((sum, item) => sum + item.score, 0) / domainScores.length
    );

    const blockers = readinessQuestions
      .filter((q) => q.isBlocker && answers[q.id] === 'no')
      .map((q) => ({
        id: q.id,
        domain: q.domain,
        title: q.title,
        helperText: q.helperText,
      }));

    const priorities = readinessQuestions
      .filter((q) => !isReadinessEquivalentToYes(q.id, answers[q.id]))
      .map((q) => ({
        id: q.id,
        domain: q.domain,
        title: q.title,
        status: answers[q.id],
        priority: answers[q.id] === 'no' ? 'high' : 'medium',
      }));

    const status =
      blockers.length > 0 ? 'blocked' : overallScore >= 75 ? 'ready' : 'needs-attention';

    const actionPlan = [
      'Address high-priority blockers before production deployment.',
      'Define owners and deadlines for each medium/high readiness gap.',
      'Re-run readiness assessment after control implementation.',
    ];

    return res.json({
      status,
      overallScore,
      domainScores,
      blockerCount: blockers.length,
      blockers,
      priorities,
      actionPlan,
      assessedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Readiness assessment error:', error);
    return res.status(500).json({
      error: 'Readiness assessment failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Power Platform Release Planner (Copilot Studio only)
app.get('/api/release-planner/copilot-studio', async (req, res) => {
  try {
    if (typeof getCopilotStudioReleasePlannerData !== 'function') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Release planner service is not loaded on this deployment instance',
      });
    }

    const data = await getCopilotStudioReleasePlannerData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching Copilot Studio release planner data:', error);
    res.status(502).json({
      error: 'Bad Gateway',
      message: error instanceof Error ? error.message : 'Failed to fetch release planner data',
    });
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
    const openaiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const hasAzureConfig = !!(azureEndpoint && azureDeployment);
    const hasAzureKeyConfig = !!(azureKey && azureEndpoint && azureDeployment);
    const hasOpenAIConfig = !!openaiKey;
    const allowAzureKeyFallback = process.env.ALLOW_AZURE_OPENAI_API_KEY_AUTH === 'true';

    if (!hasAzureConfig && !hasOpenAIConfig) {
      return res.status(501).json({
        error: 'AI not configured',
        message:
          'Set either Azure OpenAI settings (AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, and Entra identity access) or OPENAI_API_KEY (+ optional OPENAI_ENDPOINT/OPENAI_MODEL) to enable the Copilot Agent',
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

    let response;
    let provider = 'openai';

    if (hasAzureConfig) {
      provider = 'azure-openai';
      const apiUrl = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`;
      const entraToken = await getAzureOpenAIAccessToken();

      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${entraToken}`,
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

      if (!response.ok && allowAzureKeyFallback && hasAzureKeyConfig) {
        const initialErrorBody = await response.text();
        console.warn(
          `[COPILOT] azure-openai token auth failed (${response.status}), attempting key fallback because ALLOW_AZURE_OPENAI_API_KEY_AUTH=true.`,
          initialErrorBody
        );

        response = await fetch(apiUrl, {
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
      }
    } else {
      provider = 'openai-compatible';
      const apiUrl = getOpenAIChatCompletionsUrl();
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[COPILOT] ${provider} API error:`, response.status, errorBody);
      return res.status(response.status === 401 || response.status === 403 ? 502 : 500).json({
        error: 'Failed to get response from AI service',
        message:
          response.status === 401 || response.status === 403
            ? `Authentication/authorization failed for ${provider}. Verify App Service settings for the selected provider.`
            : `Provider request failed (${provider}, HTTP ${response.status}).`,
      });
    }

    const data = await response.json();
    const responseText =
      data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';

    res.json({ response: responseText });
  } catch (error) {
    console.error('[COPILOT] Error:', error.message || error);
    res.status(500).json({
      error: 'Failed to process chat message',
    });
  }
});

// Export Executive Overview as PPTX
app.post('/api/export/executive-overview/pptx', async (req, res) => {
  try {
    if (typeof generateExecutiveOverviewPPTX !== 'function') {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Executive overview PPTX service is not loaded on this deployment instance',
      });
    }

    const { timestamp, scoringResult, recommendation, qaData, aiRecommendation } = req.body;

    if (!timestamp || !scoringResult || !recommendation || !Array.isArray(qaData)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'timestamp, scoringResult, recommendation, and qaData[] are required',
      });
    }

    const pptxBuffer = await generateExecutiveOverviewPPTX({
      timestamp,
      scoringResult,
      recommendation,
      qaData,
      aiRecommendation,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="executive-overview.pptx"');
    res.send(pptxBuffer);
  } catch (error) {
    console.error('Executive overview PPTX generation error:', error);
    res.status(500).json({
      error: 'Failed to generate PowerPoint',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Ensure unknown API routes return JSON (never SPA HTML)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API route not found: ${req.originalUrl}`,
  });
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
Promise.all([
  loadDecisionEngine(),
  loadReleasePlannerService(),
  loadUseCasesRouter(),
  loadExecutiveOverviewPptxService(),
])
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
