import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { calculateRecommendation, generateRecommendation, decisionModel, UserAnswersSchema, } from '@copilot-guidance/decision-engine';
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
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        aiEnabled: !!(process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY),
        azureConfigured: !!process.env.AZURE_OPENAI_API_KEY,
        openaiConfigured: !!process.env.OPENAI_API_KEY,
    });
});
// Get decision model
app.get('/api/model', (_req, res) => {
    res.json(decisionModel);
});
// Calculate score and recommendation
app.post('/api/score', (req, res) => {
    try {
        // Validate request body
        if (!req.body || !req.body.answers) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Missing answers in request body. Expected format: { answers: {...} }',
            });
        }
        const userAnswers = UserAnswersSchema.parse(req.body.answers);
        const scoringResult = calculateRecommendation(decisionModel, userAnswers);
        const recommendation = generateRecommendation(scoringResult);
        res.json({ recommendation, scoringResult });
    }
    catch (error) {
        console.error('Error calculating score:', error);
        res.status(400).json({
            error: 'Invalid request',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Generate AI-enhanced explanation (LLM-assisted wording)
app.post('/api/explain', async (req, res) => {
    try {
        // Validate request body
        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Missing request body. Expected format: { recommendation: {...}, userContext?: {...} }',
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
    }
    catch (error) {
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
app.get('/api/sources', (_req, res) => {
    const sources = {
        m365Copilot: [
            {
                title: 'Microsoft 365 Copilot Overview',
                url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-overview',
                description: 'Comprehensive overview of Microsoft 365 Copilot capabilities and architecture',
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
// Helper to fetch real-time Microsoft Learn documentation
// Uses Microsoft Learn MCP API at https://learn.microsoft.com/api/mcp
async function fetchMicrosoftLearnContext(recommendationType) {
    console.log(`[MS Learn MCP] Starting documentation fetch for recommendation type: ${recommendationType}`);
    try {
        // Define queries based on recommendation type
        const searchQueries = [];
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
        const docsResults = [];
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
                    const data = (await response.json());
                    console.log(`[MS Learn MCP] Received data:`, JSON.stringify(data).substring(0, 200));
                    if (data.results && Array.isArray(data.results) && data.results.length > 0) {
                        console.log(`[MS Learn MCP] Found ${data.results.length} results for query: "${query}"`);
                        for (const result of data.results) {
                            docsResults.push(`**${result.title}**\n${result.url}\n${result.content || result.description || ''}`);
                        }
                    }
                    else {
                        console.warn(`[MS Learn MCP] No results found for query: "${query}"`);
                    }
                }
                else {
                    console.warn(`[MS Learn MCP] API returned ${response.status} for query: ${query}`);
                }
            }
            catch (err) {
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
    }
    catch (error) {
        console.error('[MS Learn MCP] ❌ Integration error:', error);
        return '\n\n**ANALYSIS METHOD:** This recommendation uses deterministic scoring with the Microsoft AI Decision Framework (static framework knowledge).';
    }
}
// AI explanation helper with comprehensive compliance-aware LLM integration
async function generateAIExplanation(recommendation, userContext) {
    console.log(`[AI Explanation] Starting for recommendation type: ${recommendation.type}`);
    const azureKey = process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const openaiKey = process.env.OPENAI_API_KEY;
    const aiConfigured = !!(azureKey || openaiKey);
    console.log(`[AI Explanation] AI configured: ${aiConfigured} (Azure: ${!!azureKey}, OpenAI: ${!!openaiKey})`);
    // Helper function to generate detailed introduction based on context
    const generateDetailedIntroduction = (rec, ctx) => {
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
        const scenarioDetails = [];
        if (experienceLocation)
            scenarioDetails.push(`${experienceLocation.toLowerCase()} deployment`);
        if (buildStyle)
            scenarioDetails.push(`${buildStyle.toLowerCase()} development approach`);
        if (scenarioDetails.length > 0) {
            intro += `Based on your requirements for ${scenarioDetails.join(' with ')}, `;
        }
        else {
            intro += `Based on your specific scenario requirements, `;
        }
        if (recType === 'M365_COPILOT') {
            intro += `the analysis indicates Microsoft 365 Copilot aligns best with your immediate needs. `;
        }
        else if (recType === 'COPILOT_STUDIO') {
            intro += `the analysis indicates Copilot Studio provides the optimal platform for your scenario. `;
        }
        else if (recType === 'HYBRID') {
            intro += `the analysis recommends a hybrid approach combining both Microsoft 365 Copilot and Copilot Studio. `;
        }
        // Add methodology with available context factors
        const contextFactors = [];
        if (teamSize)
            contextFactors.push(`team size (${teamSize.toLowerCase()})`);
        if (complexity)
            contextFactors.push(`technical complexity (${complexity.toLowerCase()})`);
        if (budget)
            contextFactors.push(`budget constraints (${budget.toLowerCase()})`);
        if (contextFactors.length > 0) {
            intro += `The methodology follows the Microsoft AI Decision Framework (BXT + CAF principles), considering your ${contextFactors.join(', ')}. `;
        }
        else {
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
        console.log(`[AI Explanation] Fetching Microsoft Learn context...`);
        const learnContext = await fetchMicrosoftLearnContext(recommendation.type);
        console.log(`[AI Explanation] Microsoft Learn context length: ${learnContext.length} characters`);
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
${recommendation.reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}

**Next Steps (from template):**
${recommendation.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

**Compliance Considerations (from template):**
${recommendation.complianceConsiderations.map((c, i) => `${i + 1}. ${c}`).join('\n')}

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
        let responseText;
        if (azureKey && azureEndpoint && azureDeployment) {
            // Azure OpenAI
            const response = await fetch(`${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': azureKey,
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a Microsoft AI solutions advisor. Provide accurate, compliance-aware guidance. Return only valid JSON.',
                        },
                        { role: 'user', content: prompt },
                    ],
                    max_completion_tokens: 2000,
                    response_format: { type: 'json_object' },
                }),
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[AI Explanation] Azure OpenAI API error details:`, errorBody);
                throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            const data = (await response.json());
            responseText = data.choices[0].message.content;
        }
        else if (openaiKey) {
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
                        {
                            role: 'system',
                            content: 'You are a Microsoft AI solutions advisor. Provide accurate, compliance-aware guidance. Return only valid JSON.',
                        },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 2000,
                    response_format: { type: 'json_object' },
                }),
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
            }
            const data = (await response.json());
            responseText = data.choices[0].message.content;
        }
        else {
            throw new Error('No valid API configuration');
        }
        console.log(`[AI Explanation] Raw LLM response length: ${responseText.length} characters`);
        console.log(`[AI Explanation] Response preview: ${responseText.substring(0, 200)}...`);
        const enhanced = JSON.parse(responseText);
        console.log(`[AI Explanation] ✅ Successfully parsed enhanced explanation with fields:`, {
            hasIntroduction: !!enhanced.introduction,
            hasSummary: !!enhanced.summary,
            hasReasons: !!enhanced.reasons,
            hasNextSteps: !!enhanced.nextSteps,
            hasCompliance: !!enhanced.complianceConsiderations,
        });
        return enhanced;
    }
    catch (error) {
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
app.get('*', (_req, res) => {
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
    console.log(`🤖 AI mode: ${hasAzureKey || hasOpenAIKey ? 'ENABLED' : 'DISABLED (No AI keys configured)'}`);
});
export default app;
