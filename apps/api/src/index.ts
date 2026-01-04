import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { readFile } from 'fs/promises';
import {
  calculateRecommendation,
  generateRecommendation,
  decisionModel,
  UserAnswersSchema,
  type DecisionModel,
  type UserAnswers,
} from '@copilot-guidance/decision-engine';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from web dist folder in production
const webDistPath = path.join(__dirname, '../../web/dist');
app.use(express.static(webDistPath));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiEnabled: !!(process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
    azureConfigured: !!process.env.AZURE_OPENAI_API_KEY,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
});

// Get decision model
app.get('/api/model', (_req: Request, res: Response) => {
  res.json(decisionModel);
});

// Calculate score and recommendation
app.post('/api/score', (req: Request, res: Response) => {
  try {
    // Validate request body
    if (!req.body || !req.body.answers) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Missing answers in request body. Expected format: { answers: {...} }',
      });
    }

    const userAnswers = UserAnswersSchema.parse(req.body.answers);

    const scoringResult = calculateRecommendation(decisionModel as DecisionModel, userAnswers);

    const recommendation = generateRecommendation(scoringResult);

    res.json({ recommendation, scoringResult });
  } catch (error) {
    console.error('Error calculating score:', error);
    res.status(400).json({
      error: 'Invalid request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Generate AI-enhanced explanation (LLM-assisted wording)
app.post('/api/explain', async (req: Request, res: Response) => {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message:
          'Missing request body. Expected format: { recommendation: {...}, userContext?: {...} }',
      });
    }

    const { recommendation, userContext } = req.body;

    if (!recommendation) {
      return res.status(400).json({
        error: 'Missing recommendation data',
        message: 'The recommendation object is required in the request body.',
      });
    }

    // Check if AI is enabled
    const aiEnabled = !!process.env.AZURE_OPENAI_API_KEY || !!process.env.OPENAI_API_KEY;

    if (!aiEnabled) {
      // No AI mode - return deterministic template
      return res.json({
        enhanced: false,
        explanation: {
          summary: recommendation.summary,
          reasons: recommendation.reasons,
          nextSteps: recommendation.nextSteps,
          complianceConsiderations: recommendation.complianceConsiderations,
        },
        message: 'AI explanation not available - using deterministic template',
      });
    }

    // AI-assisted explanation
    const enhancedExplanation = await generateAIExplanation(recommendation, userContext);

    res.json({
      enhanced: true,
      explanation: enhancedExplanation,
    });
  } catch (error) {
    console.error('Error generating explanation:', error);

    // Fallback to deterministic
    res.json({
      enhanced: false,
      explanation: req.body.recommendation?.summary || 'Unable to generate explanation',
      error: 'AI service unavailable, using fallback',
    });
  }
});

// Get curated sources
app.get('/api/sources', (_req: Request, res: Response) => {
  const sources = {
    m365Copilot: [
      {
        title: 'Microsoft 365 Copilot Overview',
        url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-overview',
        description:
          'Comprehensive overview of Microsoft 365 Copilot capabilities and architecture',
      },
      {
        title: 'Microsoft 365 Copilot Licensing',
        url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-licensing',
        description: 'Licensing requirements and options for Microsoft 365 Copilot',
      },
      {
        title: 'Data, Privacy, and Security',
        url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-privacy',
        description: 'Security, privacy, and compliance information for Microsoft 365 Copilot',
      },
    ],
    copilotStudio: [
      {
        title: 'Copilot Studio Overview',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio',
        description: 'Introduction to building custom agents with Copilot Studio',
      },
      {
        title: 'Power Platform Connectors',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-connectors',
        description: 'Using connectors to extend Copilot Studio agents',
      },
      {
        title: 'Copilot Studio Licensing',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/billing-licensing',
        description: 'Licensing options and Copilot Credits information',
      },
    ],
    comparison: [
      {
        title: 'Which Copilot is right for your organization?',
        url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/which-copilot-for-your-organization',
        description: 'Compare different Microsoft Copilot options and determine the best fit',
      },
      {
        title: 'Choose between Microsoft 365 Copilot and Copilot Studio',
        url: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/copilot-studio-experience',
        description: 'Decision guidance for selecting the right tool',
      },
      {
        title: 'Microsoft 365 Copilot Extensibility',
        url: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/',
        description: 'How to extend Microsoft 365 Copilot with custom capabilities',
      },
    ],
  };

  res.json(sources);
});

// Agentic Decision Assistant - Chat endpoint
app.post('/api/copilot-agent/chat', async (req: Request, res: Response) => {
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

    if (!azureKey && !openaiKey) {
      return res.status(501).json({
        error: 'AI not configured',
        message: 'Set AZURE_OPENAI_API_KEY or OPENAI_API_KEY to enable the Copilot Agent',
      });
    }

    // Load licensing data for context
    const licensingDataPath = path.join(
      __dirname,
      '../../../packages/decision-engine/src/data/licensing-data.json'
    );
    const licensingData = await readFile(licensingDataPath, 'utf-8');
    const licensing = JSON.parse(licensingData);

    // Build conversation history
    const conversationHistory = (history || []).slice(-5).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // System prompt with knowledge base
    const systemPrompt = `You are a helpful Microsoft Agentic Decision Assistant specializing in Microsoft 365 Copilot, Copilot Studio, Microsoft Foundry, and Agent Builder. Your role is to help users understand:

1. **Licensing & Pricing**
   - Microsoft 365 Copilot: $${licensing.licenses.m365Copilot.pricePerUserPerMonth}/user/month
   - Copilot Studio Pay-as-you-go: $${licensing.licenses.copilotStudioPayAsYouGo.pricePerMessage}/message
   - Copilot Studio Subscription: $${licensing.licenses.copilotStudioSubscription.pricePerTenant}/month (includes ${licensing.licenses.copilotStudioSubscription.messagesIncluded.toLocaleString()} messages)
   - Microsoft Foundry: Usage-based pricing (Azure AI services, compute, storage)
   - Agent Builder: Included with Copilot Studio licensing

2. **Key Features**
   M365 Copilot:
   ${licensing.licenses.m365Copilot.features.map((f: string) => `   - ${f}`).join('\n')}

   Copilot Studio:
   ${licensing.licenses.copilotStudioPayAsYouGo.features.map((f: string) => `   - ${f}`).join('\n')}

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
   ${licensing.decisionGuide.useM365CopilotWhen.map((w: string) => `   - Use M365 Copilot when: ${w}`).join('\n')}
   
   ${licensing.decisionGuide.useCopilotStudioWhen.map((w: string) => `   - Use Copilot Studio when: ${w}`).join('\n')}

   - Use Microsoft Foundry when: You need pro-code AI development, custom model fine-tuning, advanced orchestration, or full control over AI workflows
   - Use Agent Builder when: You need simple knowledge-base Q&A agents with no-code creation and quick deployment

4. **Deployment Channels**
   - M365 Copilot: ${Object.entries(licensing.featureComparison.deploymentChannels)
     .filter(([_, v]: any) => v.m365Copilot)
     .map(([k, _]: any) => k)
     .join(', ')}
   - Copilot Studio: ${Object.entries(licensing.featureComparison.deploymentChannels)
     .filter(([_, v]: any) => v.copilotStudio)
     .map(([k, _]: any) => k)
     .join(', ')}

**Guidelines:**
- Be conversational and helpful
- Provide specific, accurate information from the knowledge base above
- If asked about costs, calculate estimates when possible
- Clarify that most organizations use BOTH products for different scenarios
- Keep responses concise (2-4 paragraphs max)
- Include relevant links when helpful:
  - Licensing Guide: https://go.microsoft.com/fwlink/?linkid=2320995
  - M365 Copilot Docs: https://learn.microsoft.com/en-us/copilot/microsoft-365/
  - Copilot Studio Docs: https://learn.microsoft.com/en-us/microsoft-copilot-studio/

**Important:** Only provide information based on the knowledge above. If you don't know something, say so.`;

    let responseText: string;

    if (azureKey && azureEndpoint && azureDeployment) {
      // Azure OpenAI
      const response = await fetch(
        `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`,
        {
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
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Azure OpenAI API error: ${response.status} - ${errorBody}`);
      }

      const data = (await response.json()) as any;
      responseText =
        data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } else if (openaiKey) {
      // OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = (await response.json()) as any;
      responseText =
        data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } else {
      throw new Error('No valid API configuration');
    }

    res.json({ response: responseText });
  } catch (error) {
    console.error('Copilot Agent error:', error);
    res.status(500).json({
      error: 'Failed to process chat message',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get licensing data
app.get('/api/licensing', async (_req: Request, res: Response) => {
  try {
    const licensingDataPath = path.join(
      __dirname,
      '../../../packages/decision-engine/src/data/licensing-data.json'
    );
    const data = await readFile(licensingDataPath, 'utf-8');
    const licensingData = JSON.parse(data);
    res.json(licensingData);
  } catch (error) {
    console.error('Error reading licensing data:', error);
    res.status(500).json({ error: 'Failed to load licensing data' });
  }
});

// Calculate cost estimate
app.post('/api/licensing/calculate', async (req: Request, res: Response) => {
  try {
    const { users, messagesPerMonth, licenseType } = req.body;

    if (!users || !messagesPerMonth) {
      return res
        .status(400)
        .json({ error: 'Missing required parameters: users, messagesPerMonth' });
    }

    const licensingDataPath = path.join(
      __dirname,
      '../../../packages/decision-engine/src/data/licensing-data.json'
    );
    const data = await readFile(licensingDataPath, 'utf-8');
    const licensingData = JSON.parse(data);

    let m365Cost = 0;
    let copilotStudioCost = 0;
    let recommendation = '';

    // M365 Copilot cost
    m365Cost = users * licensingData.licenses.m365Copilot.pricePerUserPerMonth;

    // Copilot Studio cost calculations
    const totalMessages = messagesPerMonth;

    // Pay-as-you-go
    const payAsYouGoCost =
      totalMessages * licensingData.licenses.copilotStudioPayAsYouGo.pricePerMessage;

    // Subscription model
    const subscriptionBase = licensingData.licenses.copilotStudioSubscription.pricePerTenant;
    const includedMessages = licensingData.licenses.copilotStudioSubscription.messagesIncluded;
    const overageMessages = Math.max(0, totalMessages - includedMessages);
    const subscriptionCost =
      subscriptionBase +
      overageMessages * licensingData.licenses.copilotStudioSubscription.pricePerAdditionalMessage;

    // Choose better Copilot Studio option
    copilotStudioCost = Math.min(payAsYouGoCost, subscriptionCost);
    const recommendedModel = payAsYouGoCost <= subscriptionCost ? 'Pay-as-you-go' : 'Subscription';

    // Recommendation logic
    if (licenseType === 'm365' || licenseType === 'hybrid') {
      recommendation = `For ${users} users with Microsoft 365 Copilot: $${m365Cost.toFixed(2)}/month`;
    }
    if (licenseType === 'studio' || licenseType === 'hybrid') {
      recommendation +=
        (recommendation ? ' + ' : '') +
        `Copilot Studio (${recommendedModel}): $${copilotStudioCost.toFixed(2)}/month for ${messagesPerMonth.toLocaleString()} messages`;
    }

    const totalCost =
      licenseType === 'hybrid'
        ? m365Cost + copilotStudioCost
        : licenseType === 'm365'
          ? m365Cost
          : copilotStudioCost;

    res.json({
      users,
      messagesPerMonth,
      breakdown: {
        m365Copilot: licenseType === 'm365' || licenseType === 'hybrid' ? m365Cost : 0,
        copilotStudio: licenseType === 'studio' || licenseType === 'hybrid' ? copilotStudioCost : 0,
        copilotStudioModel: recommendedModel,
        payAsYouGoCost,
        subscriptionCost,
      },
      totalCost,
      recommendation,
      notes: [
        `M365 Copilot includes unlimited Copilot Studio messages within Teams, SharePoint, and Office apps`,
        `Copilot Studio subscription ($${subscriptionBase}/month) becomes cost-effective above ${licensingData.licenses.copilotStudioSubscription.messagesIncluded.toLocaleString()} messages/month`,
        `External channels (web, WhatsApp, mobile) require separate Copilot Studio licensing`,
      ],
    });
  } catch (error) {
    console.error('Error calculating cost:', error);
    res.status(500).json({ error: 'Failed to calculate cost estimate' });
  }
});

// Search licensing PDF via Azure AI Search (placeholder for future implementation)
app.post('/api/licensing/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing required parameter: query' });
    }

    // Check if Azure AI Search is configured
    const searchEndpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const searchKey = process.env.AZURE_SEARCH_KEY;
    const searchIndex = process.env.AZURE_SEARCH_INDEX || 'licensing-docs';

    if (!searchEndpoint || !searchKey) {
      return res.status(501).json({
        error: 'Azure AI Search not configured',
        message:
          'Set AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_KEY environment variables to enable semantic search',
        fallback: 'Use /api/licensing endpoint for structured licensing data',
      });
    }

    // Call Azure AI Search
    const response = await fetch(
      `${searchEndpoint}/indexes/${searchIndex}/docs/search?api-version=2024-07-01`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': searchKey,
        },
        body: JSON.stringify({
          search: query,
          queryType: 'semantic',
          semanticConfiguration: 'default',
          top: 5,
          select: 'content,title,page,url',
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI Search error: ${response.status}`);
    }

    const data = (await response.json()) as { value: any[]; '@odata.count': number };
    res.json({
      results: data.value,
      count: data['@odata.count'],
      query,
    });
  } catch (error) {
    console.error('Error searching licensing docs:', error);
    res.status(500).json({
      error: 'Failed to search licensing documentation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper to fetch real-time Microsoft Learn documentation
// Uses Microsoft Learn MCP API at https://learn.microsoft.com/api/mcp
async function fetchMicrosoftLearnContext(recommendationType: string): Promise<string> {
  console.log(
    `[MS Learn MCP] Starting documentation fetch for recommendation type: ${recommendationType}`
  );

  try {
    // Define queries based on recommendation type
    const searchQueries: string[] = [];
    const recType = recommendationType.toUpperCase();

    if (recType === 'M365_COPILOT' || recType === 'HYBRID') {
      searchQueries.push('Microsoft 365 Copilot extensibility declarative agents plugins');
      searchQueries.push('Microsoft 365 Copilot security compliance data residency GDPR');
    }

    if (recType === 'COPILOT_STUDIO' || recType === 'HYBRID') {
      searchQueries.push('Copilot Studio agents Power Platform connectors governance');
      searchQueries.push('Copilot Studio publish to Microsoft 365 Copilot Teams channels');
    }

    console.log(`[MS Learn MCP] Queries to execute:`, searchQueries);
    const docsResults: string[] = [];

    // Fetch documentation from Microsoft Learn MCP API
    for (const query of searchQueries) {
      try {
        console.log(`[MS Learn MCP] Fetching docs for query: "${query}"`);
        const response = await fetch('https://learn.microsoft.com/api/mcp/docs-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query, maxResults: 2 }),
        });

        console.log(`[MS Learn MCP] Response status: ${response.status} for query: "${query}"`);

        if (response.ok) {
          const data = (await response.json()) as {
            results?: Array<{
              title: string;
              url: string;
              content?: string;
              description?: string;
            }>;
          };
          console.log(`[MS Learn MCP] Received data:`, JSON.stringify(data).substring(0, 200));

          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            console.log(
              `[MS Learn MCP] Found ${data.results.length} results for query: "${query}"`
            );
            for (const result of data.results) {
              docsResults.push(
                `**${result.title}**\n${result.url}\n${result.content || result.description || ''}`
              );
            }
          } else {
            console.warn(`[MS Learn MCP] No results found for query: "${query}"`);
          }
        } else {
          console.warn(`[MS Learn MCP] API returned ${response.status} for query: ${query}`);
        }
      } catch (err) {
        console.error(`[MS Learn MCP] Failed to fetch docs for query "${query}":`, err);
      }
    }

    console.log(`[MS Learn MCP] Total documentation results collected: ${docsResults.length}`);

    if (docsResults.length > 0) {
      console.log(`[MS Learn MCP] ✅ Successfully integrated Microsoft Learn documentation`);
      return `\n\n**REAL-TIME MICROSOFT LEARN DOCUMENTATION:**\n\n${docsResults.join('\n\n---\n\n')}\n\n**ANALYSIS METHOD:** This recommendation combines deterministic scoring with the Microsoft AI Decision Framework, enhanced with real-time Microsoft Learn documentation.`;
    }

    // Fallback if no results
    console.log(`[MS Learn MCP] ⚠️ No results from MCP API, using static framework`);
    return '\n\n**ANALYSIS METHOD:** This recommendation combines deterministic scoring (based on your answers) with the comprehensive Microsoft AI Decision Framework. The framework content is verified against Microsoft Learn documentation.';
  } catch (error) {
    console.error('[MS Learn MCP] ❌ Integration error:', error);
    return '\n\n**ANALYSIS METHOD:** This recommendation uses deterministic scoring with the Microsoft AI Decision Framework (static framework knowledge).';
  }
}

// AI explanation helper with comprehensive compliance-aware LLM integration
async function generateAIExplanation(recommendation: any, userContext?: any): Promise<any> {
  console.log(`[AI Explanation] Starting for recommendation type: ${recommendation.type}`);

  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const openaiKey = process.env.OPENAI_API_KEY;

  const aiConfigured = !!(azureKey || openaiKey);
  console.log(
    `[AI Explanation] AI configured: ${aiConfigured} (Azure: ${!!azureKey}, OpenAI: ${!!openaiKey})`
  );

  // Helper function to generate detailed introduction based on context
  const generateDetailedIntroduction = (rec: any, ctx?: any) => {
    const answers = ctx?.answers || {};
    const recType = rec.type || 'UNKNOWN';

    // Extract key scenario details from answers (filter out empty/undefined)
    const experienceLocation = answers['experience-location'];
    const buildStyle = answers['build-style'];
    const teamSize = answers['team-size'];
    const complexity = answers['complexity'];
    const budget = answers['budget-band'];

    // Build personalized introduction
    let intro = `This recommendation is generated using a deterministic scoring algorithm that evaluates your specific scenario against weighted decision criteria. `;

    // Add scenario-specific details only if available
    const scenarioDetails: string[] = [];
    if (experienceLocation) scenarioDetails.push(`${experienceLocation.toLowerCase()} deployment`);
    if (buildStyle) scenarioDetails.push(`${buildStyle.toLowerCase()} development approach`);

    if (scenarioDetails.length > 0) {
      intro += `Based on your requirements for ${scenarioDetails.join(' with ')}, `;
    } else {
      intro += `Based on your specific scenario requirements, `;
    }

    if (recType === 'M365_COPILOT') {
      intro += `the analysis indicates Microsoft 365 Copilot aligns best with your immediate needs. `;
    } else if (recType === 'COPILOT_STUDIO') {
      intro += `the analysis indicates Copilot Studio provides the optimal platform for your scenario. `;
    } else if (recType === 'HYBRID') {
      intro += `the analysis recommends a hybrid approach combining both Microsoft 365 Copilot and Copilot Studio. `;
    }

    // Add methodology with available context factors
    const contextFactors: string[] = [];
    if (teamSize) contextFactors.push(`team size (${teamSize.toLowerCase()})`);
    if (complexity) contextFactors.push(`technical complexity (${complexity.toLowerCase()})`);
    if (budget) contextFactors.push(`budget constraints (${budget.toLowerCase()})`);

    if (contextFactors.length > 0) {
      intro += `The methodology follows the Microsoft AI Decision Framework (BXT + CAF principles), considering your ${contextFactors.join(', ')}. `;
    } else {
      intro += `The methodology follows the Microsoft AI Decision Framework (BXT + CAF principles). `;
    }

    intro += `This is a scenario-specific recommendation—most organizations successfully deploy multiple Microsoft AI tools across different use cases, and this guidance helps optimize for your particular requirements.`;

    return intro;
  };

  if (!azureKey && !openaiKey) {
    console.log(`[AI Explanation] No AI keys configured, returning deterministic template`);
    return {
      introduction: generateDetailedIntroduction(recommendation, userContext),
      summary: recommendation.summary,
      reasons: recommendation.reasons,
      nextSteps: recommendation.nextSteps,
      complianceConsiderations: recommendation.complianceConsiderations,
    };
  }

  try {
    const answers = userContext?.answers || {};

    // Fetch real-time Microsoft Learn documentation
    // Temporarily disabled due to MS Learn MCP API returning 500 errors
    console.log(`[AI Explanation] Skipping Microsoft Learn MCP (API currently unavailable)`);
    const learnContext = ''; // await fetchMicrosoftLearnContext(recommendation.type);
    console.log(
      `[AI Explanation] Microsoft Learn context length: ${learnContext.length} characters`
    );
    const prompt = `You are a Microsoft AI solutions advisor helping enterprise customers evaluate Microsoft 365 Copilot and Copilot Studio for specific scenarios. Your guidance must be technically accurate, compliance-aware, and based solely on verified Microsoft documentation and the Microsoft AI Decision Framework.

FRAMEWORK METHODOLOGY:
This analysis follows the Microsoft AI Decision Framework (https://github.com/microsoft/Microsoft-AI-Decision-Framework), which provides systematic guidance for selecting Microsoft AI technologies.

**FIVE-LAYER CAPABILITY MODEL - Adopt → Extend → Build:**
- Layer 1 (Consumption): Microsoft 365 Copilot Chat (free/included), Microsoft 365 Copilot (paid add-on), built-in agents
- Layer 2 (Extensibility): Copilot connectors, declarative agents, API plugins, Teams message extensions
- Layer 3 (Development Platforms): Copilot Studio (low-code/pro-code SaaS), M365 Agents SDK, Microsoft Foundry (Azure), Foundry Agent Service
- Layer 4 (Infrastructure): Azure OpenAI, Azure AI Search, Azure services, Power Platform services
- Layer 5 (Specialized): GitHub Copilot, Security Copilot, Dynamics 365 Copilots, domain-specific copilots

**THREE-PHASE DECISION METHODOLOGY:**

Phase 1 - Business Impact Assessment (BXT Framework):
1. Viability (Business): ROI, cost savings, strategic alignment, TCO analysis
2. Desirability (Experience): User motivation, problem fit, adoption potential, workflow integration
3. Feasibility (Technology): Team skills, data accessibility, infrastructure readiness, compliance preparedness

Phase 2 - Technology Groupings (9 Critical Questions):
1. User Experience Location: M365 apps vs custom/multi-channel vs API/headless
2. Build Style & Control: Low-code/managed (Copilot Studio) vs Pro-code/customizable (M365 SDK, Foundry) vs Hybrid
3. Data Grounding Pattern: Grounding (RAG), Memory (conversation persistence), Analytics (retention/telemetry)
4. Orchestration Complexity: Simple Q&A → Deterministic workflows → Centralized multi-agent → Decentralized mesh
5. Compliance & Trust Boundary: M365 tenant boundary → Power Platform boundary → Azure landing zone → Hybrid
6. Scale and Cost: Predictable spend (M365 licenses, Copilot Studio prepaid) → Variable with guardrails (Azure PAYG) → Custom throttling
7. Action Safety: Draft-only (M365) → Configurable execution (Studio) → Autonomous execution (Foundry/SDK)
8. Team Skills: Makers/fusion teams → Professional developers → AI/ML engineers → Integration architects
9. Proactive Capability: Reactive only (M365, Studio declarative) → Proactive capable (Studio custom, Logic Apps, Foundry)

Phase 3 - Scenario-Specific Selection:
- Time to Market: Days (M365 Copilot, Studio templates) → Weeks (Studio custom, SDK with Teams AI) → Months (Foundry + custom dev)
- Managed vs Self-Managed: SaaS (M365, Studio) → PaaS (Foundry Agent Service) → Self-hosted (SDK, Foundry)
- Complexity: Low (declarative agents, Graph connectors) → Medium (Studio + workflows) → High (multi-agent, custom orchestration)
- Budget: Per-user (M365), Usage-based (Studio PAYG, Foundry serverless), Prepaid (Studio packs, PTU), Azure consumption
- Integration: Need 1000+ connectors (Studio, Power Platform), Enterprise connectors (Logic Apps), Multi-channel (M365 SDK), Document processing (AI Builder)

**KEY EVALUATION CRITERIA:**

Technical Complexity Assessment:
- Low: Simple Q&A, single data source → M365 Copilot, Graph Connectors, Declarative Agents
- Medium: Multiple data sources, workflow automation → Copilot Studio, AI Builder, Power Automate
- High: Custom models, multi-agent orchestration → Azure AI Foundry, M365 Agents SDK, Agent Framework
- Very High: Multi-step reasoning, complex state management → Foundry + Agent Framework, custom pipelines

Skills & Resources:
- Makers (no devs, 1-3 people, 10-20 hrs/week): Copilot Studio, AI Builder
- Makers + Dev (occasional dev help, 20-30 hrs/week): Studio + custom actions
- Pro Developers (full team, 40+ hrs/week): M365 SDK, Azure AI Foundry
- Data Scientists (ML expertise, 40+ hrs/week): Azure AI Foundry, custom models

Budget Bands:
- Free/Included/<$500/mo: M365 Copilot Chat + Graph Connectors + declarative agents (zero incremental license cost)
- $500-$2K/mo: M365 Copilot pilots, Copilot Studio Lite/Full, AI Builder
- $2K-$10K/mo: Studio front door + Azure AI Foundry/Agent Service, M365 SDK pilots
- $10K+/mo: Full Azure AI stack with enterprise data plane

Time to Production:
- Days: M365 Copilot Chat + Graph Connectors (no incremental spend)
- 1-2 Weeks: M365 Copilot add-on pilots, Studio templates with approvals
- 1-2 Months: Studio + custom actions/BYOM, Foundry orchestration (hybrid stacks)
- 3-6 Months: Production pro-code agents (SDK, Framework) with enterprise landing zone

Governance & Compliance:
- High (M365 tenant only): M365 Copilot - data NEVER leaves tenant, no training on data, Purview DLP, strictest governance
- Medium-High (data sovereignty, RBAC): Copilot Studio + DLP, external connectors inherit compliance posture
- High (Azure): Foundry/Agent Service - VNet isolation, private endpoints, CMK, sovereign data, no public egress
- High (Custom): M365 Agents SDK - self-hosted, customer controls networking, supports air-gapped

Action Safety & Content Safety:
- M365 Copilot: ✅ User-in-the-loop always (drafts only), cannot take destructive actions, content moderation built-in
- Copilot Studio: ⚠️ Actions can execute via Power Automate/custom connectors, ADD approval workflows for destructive actions
- Azure AI Foundry/Agent Service: ⚠️ Tool calling with autonomous planning, IMPLEMENT human-in-the-loop + OpenTelemetry tracing
- M365 Agents SDK: ⚠️ Custom design (developer responsibility), implement custom guardrails

**IMPLEMENTATION PATTERNS:**

Pattern 1 - Start in Studio, Scale with Azure:
- Launch in Copilot Studio (low-code, fast)
- Publish to M365 channel (Teams, Outlook, Copilot Chat)
- Add child/connected agents for specialization
- Break out to Foundry Agent Service + Agent Framework when needed
- Keep Studio as front door while Azure handles orchestration
- Strengths: Fastest time-to-value, reuses Power Platform, built-in governance
- Trade-offs: Advanced orchestration requires Azure, connected agents in Preview

Pattern 2 - Pro-Code First, Surface in Copilot:
- Design in Azure AI Foundry/Foundry Agent Service
- Implement RAG with Azure AI Search, Cosmos DB, or SQL Server 2025
- Host in Azure (Container Apps, App Service, AKS)
- Expose via API plugins or M365 Agents SDK
- Strengths: Full control, reuses Azure investments, flexible channels
- Trade-offs: Requires pro-code teams, longer lead time, Azure consumption costs

Pattern 3 - Microsoft 365 Knowledge Grounding:
- Add SharePoint/OneDrive/Teams sources in Copilot Studio
- Configure declarative agent with knowledge sources
- Extend with Graph connectors for external content
- Attach API plugins for light actions
- Publish to M365 Copilot or Teams
- Strengths: Safest for read-only, inherits M365 compliance, minimal effort
- Trade-offs: Limited to supported sources, declarative only

**"START SIMPLE, SCALE SMART" PRINCIPLE:**
- Default to SaaS (M365 Copilot, Copilot Studio) when it meets needs
- Move to PaaS (Foundry) when extensibility required
- Use IaaS only when full-stack control necessary
- Favor MCP-friendly choices for portable integrations
- Prototype with simplest option first (days/weeks), add complexity only when proven necessary

IMPORTANT FRAMING:
- Most organizations use BOTH M365 Copilot (for productivity) AND Copilot Studio (for custom agents) based on different requirements
- This recommendation is for a SPECIFIC SCENARIO, not an either-or organization-wide decision
- Copilot Studio agents can be published to Microsoft 365 Copilot and Teams, creating integrated experiences
- Emphasize deployment channels and integration points when recommending Copilot Studio

CONTEXT:
The user answered questions about their specific scenario. Our deterministic scoring system calculated this recommendation:

**Recommendation:** ${recommendation.type}
**Confidence:** ${recommendation.scoringResult?.confidenceLevel || 'medium'}
**Summary:** ${recommendation.summary}

**Top Reasons (from scoring):**
${recommendation.reasons.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}

**Next Steps (from template):**
${recommendation.nextSteps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

**Compliance Considerations (from template):**
${recommendation.complianceConsiderations.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

**User's Key Answers:**
${Object.entries(answers)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

VERIFIED FACTS YOU MUST INCORPORATE:

**Microsoft 365 Copilot:**
- Integrated with M365 apps (Word, Excel, PowerPoint, Outlook, Teams, Loop)
- Uses Microsoft Graph with permission-based access to user data
- Enterprise-grade security: GDPR compliant, EU Data Boundary compliant
- Prompts/responses/Graph data are NOT used to train foundation LLMs
- Requires M365 Copilot license (add-on to Business/Enterprise plans)
- Can be extended via connectors, declarative agents, and APIs
- Typically deployed organization-wide for productivity use cases

**Copilot Studio:**
- Low-code platform for building custom agents with advanced workflows
- 1000+ Power Platform connectors for integrations
- Advanced governance: ALM, DLP policies, role-based access, audit trails
- Environment-level controls (dev/test/prod separation)
- Included with M365 Copilot license when used in M365/Teams/SharePoint
- Can deploy to MULTIPLE CHANNELS: Microsoft 365 Copilot, Microsoft Teams, websites, custom endpoints
- Agents published to M365 Copilot integrate seamlessly with the native experience
- Typically used for specialized, process-specific scenarios

**INTEGRATION & COEXISTENCE:**
- Organizations typically deploy M365 Copilot broadly AND build targeted Copilot Studio agents
- Copilot Studio agents can be published to M365 Copilot as declarative agents (extending the native experience)
- Publishing to Teams allows agents to be used in chat, channels, and meetings
- Both products can coexist and complement each other

**CRITICAL COMPLIANCE & DATA RESIDENCY CONSIDERATIONS:**

**Web Search/Bing Integration:**
- If Copilot Studio agents enable "web search fallback" in settings, connections route to Bing API endpoints
- Bing API is currently hosted ONLY in US data centers
- Organizations with strict data residency requirements (GDPR, data sovereignty mandates) must:
  - Disable web search fallback in Copilot Studio agent settings, OR
  - Accept that web queries will transit to US-based infrastructure
- Microsoft 365 Copilot Search respects tenant data residency boundaries

**Regulated Industry Implications:**
- Healthcare (HIPAA): Both products support HIPAA compliance via Business Associate Agreement (BAA)
  - M365 Copilot: Covered under M365 HIPAA compliance
  - Copilot Studio: Covered under Power Platform HIPAA compliance
  - PHI data should only flow through compliant connectors and storage
- Financial Services: Both support financial services compliance controls
- Government: GCC, GCC-High, DoD environments have specific availability and feature sets

**Data Processing Locations:**
- M365 Copilot: Respects tenant's Microsoft 365 data residency commitments
- Copilot Studio: Respects Power Platform environment regions
- Cross-region considerations: Custom connectors may call APIs in other regions
- EU Data Boundary: M365 Copilot committed; verify Copilot Studio environment configuration

**Licensing & Cost Implications:**
- M365 Copilot: Per-user subscription model (~$30/user/month for Enterprise)
- Copilot Studio: 
  - Zero-rated for M365 Copilot licensed users (when using Graph grounding in M365/Teams/SharePoint)
  - Consumption-based for standalone use (measured in Copilot Credits)
  - Premium connectors may require additional Power Platform licenses
${learnContext}

YOUR TASK:
Rewrite the summary, reasons, next steps, AND compliance considerations that:
1. Maintain 100% factual accuracy (only use verified facts above)
2. Personalize based on user's specific scenario answers
3. Frame as a per-scenario recommendation (acknowledge organizations typically use both products)
4. If recommending Copilot Studio, emphasize deployment channel options (M365 Copilot, Teams, web, custom)
5. Explicitly call out data residency risks if web search is mentioned
6. Include relevant compliance frameworks (HIPAA, GDPR, etc.) based on user context
7. Use professional, advisory tone (not marketing language)
8. Provide actionable detail on compliance implications

CONSTRAINTS:
- Do NOT hallucinate capabilities, features, or compliance certifications
- Do NOT change the recommendation type
- Do NOT frame as either-or decision (most organizations use both products)
- Do NOT minimize compliance risks (be transparent about Bing US datacenter limitation)
- Do NOT use vague phrases like "enterprise-grade" without specifics
- If recommending Copilot Studio, MUST mention deployment channels including M365 Copilot and Teams
- If uncertain about a compliance detail, note "verify with Microsoft documentation"
- Keep technical accuracy aligned with Microsoft Learn sources

Return ONLY valid JSON (no markdown, no code blocks):
{
  "introduction": "3-5 sentence paragraph explaining the analysis methodology (deterministic scoring based on user answers + weighted questions), the Microsoft AI Decision Framework foundation (BXT + CAF principles), and that this recommendation is scenario-specific (organizations typically use multiple tools)",
  "summary": "enhanced summary for THIS SCENARIO (2-3 sentences, acknowledge coexistence)",
  "reasons": ["reason 1 with specific technical details and 'why this matters' context", "reason 2 with implementation implications", "reason 3...", ...provide 4-6 detailed reasons],
  "nextSteps": ["step 1 with concrete actions, tools, and timelines", "step 2 with specific Microsoft Learn links or resources", "step 3 with measurable outcomes", ...provide 5-7 actionable steps],
  "complianceConsiderations": [
    "Data residency: [specific guidance]",
    "Regulatory compliance: [specific frameworks]",
    "Governance controls: [specific recommendations]"
  ]
}`;

    let responseText: string;

    if (azureKey && azureEndpoint && azureDeployment) {
      // Azure OpenAI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch(
          `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': azureKey,
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content:
                    'You are a Microsoft AI solutions advisor. Provide accurate, compliance-aware guidance. Return only valid JSON.',
                },
                { role: 'user', content: prompt },
              ],
              max_completion_tokens: 16000,
              response_format: { type: 'json_object' },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[AI Explanation] Azure OpenAI API error details:`, errorBody);
          throw new Error(
            `Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`
          );
        }

        const data = (await response.json()) as any;
        console.log(
          `[AI Explanation] Azure OpenAI response structure:`,
          JSON.stringify(data, null, 2)
        );

        responseText = data.choices?.[0]?.message?.content || '';

        if (!responseText || responseText.trim().length === 0) {
          console.error(`[AI Explanation] Empty response from Azure OpenAI`);
          console.error(`[AI Explanation] Full response data:`, data);
          console.error(`[AI Explanation] Choices array:`, data.choices);
          console.error(`[AI Explanation] First choice:`, data.choices?.[0]);
          throw new Error('Azure OpenAI returned empty response');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('[AI Explanation] Azure OpenAI request timed out after 30 seconds');
          throw new Error('Azure OpenAI request timed out. Please try again.');
        }
        throw fetchError;
      }
    } else if (openaiKey) {
      // OpenAI
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content:
                  'You are a Microsoft AI solutions advisor. Provide accurate, compliance-aware guidance. Return only valid JSON.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 2000,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as any;
        responseText = data.choices?.[0]?.message?.content || '';

        if (!responseText || responseText.trim().length === 0) {
          console.error(`[AI Explanation] Empty response from OpenAI`);
          throw new Error('OpenAI returned empty response');
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('[AI Explanation] OpenAI request timed out after 30 seconds');
          throw new Error('OpenAI request timed out. Please try again.');
        }
        throw fetchError;
      }
    } else {
      throw new Error('No valid API configuration');
    }

    console.log(`[AI Explanation] Raw LLM response length: ${responseText.length} characters`);
    console.log(`[AI Explanation] Response preview: ${responseText.substring(0, 200)}...`);

    // Validate response before parsing
    if (!responseText || responseText.trim().length === 0) {
      console.error(`[AI Explanation] Empty response text, cannot parse JSON`);
      throw new Error('Received empty response from LLM');
    }

    let enhanced;
    try {
      enhanced = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`[AI Explanation] JSON parse error:`, parseError);
      console.error(`[AI Explanation] Response that failed to parse:`, responseText);
      throw parseError;
    }

    console.log(`[AI Explanation] ✅ Successfully parsed enhanced explanation with fields:`, {
      hasIntroduction: !!enhanced.introduction,
      hasSummary: !!enhanced.summary,
      hasReasons: !!enhanced.reasons,
      hasNextSteps: !!enhanced.nextSteps,
      hasCompliance: !!enhanced.complianceConsiderations,
    });

    return enhanced;
  } catch (error) {
    console.error('[AI Explanation] ❌ LLM call failed:', error);
    return {
      introduction: generateDetailedIntroduction(recommendation, userContext),
      summary: recommendation.summary,
      reasons: recommendation.reasons,
      nextSteps: recommendation.nextSteps,
      complianceConsiderations: recommendation.complianceConsiderations,
    };
  }
}

// Catch-all route to serve index.html for client-side routing
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📊 Decision model loaded: v${decisionModel.version}`);

  // Check AI configuration
  const hasAzureKey = !!process.env.AZURE_OPENAI_API_KEY;
  const hasAzureEndpoint = !!process.env.AZURE_OPENAI_ENDPOINT;
  const hasAzureDeployment = !!process.env.AZURE_OPENAI_DEPLOYMENT;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  console.log(`🔑 Azure OpenAI Key: ${hasAzureKey ? '✅ Present' : '❌ Missing'}`);
  console.log(`🌐 Azure OpenAI Endpoint: ${hasAzureEndpoint ? '✅ Present' : '❌ Missing'}`);
  console.log(`🚀 Azure OpenAI Deployment: ${hasAzureDeployment ? '✅ Present' : '❌ Missing'}`);
  console.log(`🔑 OpenAI Key: ${hasOpenAIKey ? '✅ Present' : '❌ Missing'}`);
  console.log(
    `🤖 AI mode: ${hasAzureKey || hasOpenAIKey ? 'ENABLED' : 'DISABLED (No AI keys configured)'}`
  );
});

export default app;
