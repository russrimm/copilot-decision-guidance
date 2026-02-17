/**
 * AI Recommendation Service
 *
 * Generates personalized, contextual recommendations based on:
 * - Survey responses
 * - Tenant metrics (if available)
 * - Current Microsoft product landscape
 */

import type { RecommendationType, ScoringResult, Weights } from '@copilot-guidance/decision-engine';
import type { TenantMetrics } from './metrics';

const getOpenAIChatCompletionsUrl = (endpoint?: string): string => {
  const rawEndpoint = (endpoint || '').trim();
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
};

interface AIRecommendationRequest {
  surveyResponses: Record<string, unknown>;
  comments?: Record<string, string>;
  scoringResult: ScoringResult;
  tenantMetrics?: TenantMetrics;
  timestamp: string;
}

interface AIRecommendation {
  summary: string;
  detailedAnalysis: string;
  strategicGuidance: string;
  implementationRoadmap: string[];
  riskMitigation: string[];
  costConsiderations: string;
  timelineEstimate: string;
  nextSteps: string[];
  personalizationFactors: string[];
}

export class AIRecommendationService {
  private apiKey?: string;
  private endpoint?: string;
  private model?: string;

  constructor(apiKey?: string, endpoint?: string, model?: string) {
    this.apiKey = apiKey;
    this.endpoint = getOpenAIChatCompletionsUrl(endpoint);
    this.model = model || 'gpt-4o';
  }

  /**
   * Check if AI recommendations are enabled
   */
  isEnabled(): boolean {
    return !!(this.apiKey && this.endpoint);
  }

  /**
   * Generate AI-powered recommendation
   */
  async generateRecommendation(request: AIRecommendationRequest): Promise<AIRecommendation> {
    if (!this.isEnabled()) {
      return this.generateFallbackRecommendation(request);
    }

    try {
      const prompt = this.buildPrompt(request);

      const response = await fetch(this.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert Microsoft solutions architect specializing in AI and agentic platforms. You provide strategic, actionable recommendations for organizations evaluating Microsoft Copilot products.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        console.error(`AI API error: ${response.statusText}`);
        return this.generateFallbackRecommendation(request);
      }

      const data = (await response.json()) as any;
      const aiResponse = data.choices?.[0]?.message?.content;

      if (!aiResponse) {
        return this.generateFallbackRecommendation(request);
      }

      return this.parseAIResponse(aiResponse, request);
    } catch (error) {
      console.error('Error generating AI recommendation:', error);
      return this.generateFallbackRecommendation(request);
    }
  }

  /**
   * Build comprehensive prompt for AI
   */
  private buildPrompt(request: AIRecommendationRequest): string {
    const { surveyResponses, comments, scoringResult, tenantMetrics } = request;

    let prompt = `Generate a comprehensive recommendation for an organization evaluating Microsoft Copilot products.\n\n`;

    // Add survey context
    prompt += `## Survey Results\n`;
    prompt += `**Recommended Product:** ${formatRecommendationType(scoringResult.recommendation)}\n`;
    prompt += `**Match Score:** ${calculateMatchScore(scoringResult)}%\n`;
    prompt += `**Confidence:** ${scoringResult.confidenceLevel}\n\n`;

    // Add key answers (generic, supports both strings and arrays)
    prompt += `## Key Inputs (Raw)\n`;
    const entries = Object.entries(surveyResponses);
    if (entries.length === 0) {
      prompt += `- No survey inputs provided.\n`;
    } else {
      for (const [key, value] of entries) {
        if (value == null) continue;
        const rendered = Array.isArray(value) ? value.join(', ') : String(value);
        prompt += `- **${key}:** ${rendered}\n`;
      }
    }

    // Add optional per-question comments
    if (comments && Object.keys(comments).length > 0) {
      prompt += `\n## User Comments (Per Question)\n`;
      for (const [questionId, comment] of Object.entries(comments)) {
        const trimmed = String(comment ?? '').trim();
        if (!trimmed) continue;
        prompt += `- **${questionId}:** ${trimmed}\n`;
      }
      prompt += `\nUse these comments to adjust assumptions, highlight constraints, and propose governance decisions (for example Power Platform DLP boundaries, environment strategy, and automation for environment requests) that align with the organization’s intent.\n`;
    }

    // Add tenant metrics if available
    if (tenantMetrics && tenantMetrics.tenantId !== 'demo-tenant') {
      prompt += `\n## Current Environment\n`;

      if (tenantMetrics.licenses) {
        prompt += `- **M365 Copilot Licenses:** ${tenantMetrics.licenses.copilotLicenses.m365Copilot}\n`;
        prompt += `- **Copilot Studio Licenses:** ${tenantMetrics.licenses.copilotLicenses.copilotStudio}\n`;
        prompt += `- **Power Automate Licenses:** ${tenantMetrics.licenses.copilotLicenses.powerAutomateLicenses}\n`;
      }

      if (tenantMetrics.powerPlatform) {
        prompt += `- **Power Platform Environments:** ${tenantMetrics.powerPlatform.totalEnvironments}\n`;
        prompt += `- **Copilot Studio Agents:** ${tenantMetrics.powerPlatform.totalCopilotStudioAgents}\n`;
      }

      if (tenantMetrics.secureScore) {
        prompt += `- **Secure Score:** ${tenantMetrics.secureScore.percentage.toFixed(0)}%\n`;
      }

      if (tenantMetrics.costReport) {
        prompt += `- **Monthly AI/Copilot Costs:** $${tenantMetrics.costReport.copilotRelatedCosts?.toFixed(2) || '0'}\n`;
      }

      if (tenantMetrics.readinessScore) {
        prompt += `- **Overall Readiness:** ${tenantMetrics.readinessScore.overall}%\n`;
      }
    }

    prompt += `\n## Request\n`;
    prompt += `Provide a personalized recommendation in the following structure:\n\n`;
    prompt += `1. **EXECUTIVE SUMMARY** (2-3 sentences)\n`;
    prompt += `2. **DETAILED ANALYSIS** (1 paragraph explaining why this is the right choice)\n`;
    prompt += `3. **STRATEGIC GUIDANCE** (1 paragraph on how to approach implementation)\n`;
    prompt += `4. **IMPLEMENTATION ROADMAP** (5-7 bullet points)\n`;
    prompt += `5. **RISK MITIGATION** (3-5 bullet points)\n`;
    prompt += `6. **COST CONSIDERATIONS** (1 paragraph)\n`;
    prompt += `7. **TIMELINE ESTIMATE** (realistic timeframe)\n`;
    prompt += `8. **NEXT STEPS** (3-5 actionable items)\n\n`;
    prompt += `Be specific, actionable, and reference actual Microsoft products and services. Consider the organization's current state and capabilities.`;

    return prompt;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(aiResponse: string, request: AIRecommendationRequest): AIRecommendation {
    // Simple parsing - in production, you might want more sophisticated parsing
    const sections = aiResponse.split('\n\n');

    const recommendation: AIRecommendation = {
      summary: '',
      detailedAnalysis: '',
      strategicGuidance: '',
      implementationRoadmap: [],
      riskMitigation: [],
      costConsiderations: '',
      timelineEstimate: '',
      nextSteps: [],
      personalizationFactors: this.extractPersonalizationFactors(request),
    };

    // Extract sections (this is a simple implementation)
    for (const section of sections) {
      if (section.includes('EXECUTIVE SUMMARY') || section.includes('Executive Summary')) {
        recommendation.summary = section.replace(/.*?SUMMARY.*?\n/i, '').trim();
      } else if (section.includes('DETAILED ANALYSIS') || section.includes('Detailed Analysis')) {
        recommendation.detailedAnalysis = section.replace(/.*?ANALYSIS.*?\n/i, '').trim();
      } else if (section.includes('STRATEGIC GUIDANCE') || section.includes('Strategic Guidance')) {
        recommendation.strategicGuidance = section.replace(/.*?GUIDANCE.*?\n/i, '').trim();
      } else if (
        section.includes('IMPLEMENTATION ROADMAP') ||
        section.includes('Implementation Roadmap')
      ) {
        const lines = section.split('\n').filter((l) => l.trim().match(/^[-*•]/));
        recommendation.implementationRoadmap = lines.map((l) => l.replace(/^[-*•]\s*/, '').trim());
      } else if (section.includes('RISK MITIGATION') || section.includes('Risk Mitigation')) {
        const lines = section.split('\n').filter((l) => l.trim().match(/^[-*•]/));
        recommendation.riskMitigation = lines.map((l) => l.replace(/^[-*•]\s*/, '').trim());
      } else if (
        section.includes('COST CONSIDERATIONS') ||
        section.includes('Cost Considerations')
      ) {
        recommendation.costConsiderations = section.replace(/.*?CONSIDERATIONS.*?\n/i, '').trim();
      } else if (section.includes('TIMELINE') || section.includes('Timeline')) {
        recommendation.timelineEstimate = section.replace(/.*?TIMELINE.*?\n/i, '').trim();
      } else if (section.includes('NEXT STEPS') || section.includes('Next Steps')) {
        const lines = section.split('\n').filter((l) => l.trim().match(/^[-*•\d]/));
        recommendation.nextSteps = lines.map((l) => l.replace(/^[-*•\d.)\s]*/, '').trim());
      }
    }

    // Fill in any empty sections with fallback content
    if (!recommendation.summary) {
      recommendation.summary = this.generateFallbackRecommendation(request).summary;
    }

    return recommendation;
  }

  /**
   * Extract personalization factors from request
   */
  private extractPersonalizationFactors(request: AIRecommendationRequest): string[] {
    const factors: string[] = [];
    const { tenantMetrics } = request;

    if (tenantMetrics?.licenses) {
      const copilotCount = tenantMetrics.licenses.copilotLicenses.m365Copilot;
      if (copilotCount > 0) {
        factors.push(`Already deployed ${copilotCount} M365 Copilot licenses`);
      }
    }

    if (tenantMetrics?.powerPlatform) {
      if (tenantMetrics.powerPlatform.totalCopilotStudioAgents > 0) {
        factors.push(
          `${tenantMetrics.powerPlatform.totalCopilotStudioAgents} Copilot Studio agents in use`
        );
      }
      if (tenantMetrics.powerPlatform.totalEnvironments > 3) {
        factors.push('Mature Power Platform deployment');
      }
    }

    if (tenantMetrics?.secureScore) {
      if (tenantMetrics.secureScore.percentage >= 70) {
        factors.push('Strong security posture');
      } else if (tenantMetrics.secureScore.percentage < 50) {
        factors.push('Security improvements recommended before deployment');
      }
    }

    return factors;
  }

  /**
   * Generate fallback recommendation without AI
   */
  private generateFallbackRecommendation(request: AIRecommendationRequest): AIRecommendation {
    const { scoringResult, tenantMetrics } = request;
    const recommended = scoringResult.recommendation;

    let summary = `Based on your inputs, we recommend ${formatRecommendationType(recommended)}. `;

    if (recommended === 'M365_COPILOT') {
      summary +=
        'This solution provides immediate productivity gains with minimal setup, leveraging AI directly within Microsoft 365 applications your team already uses.';
    } else if (recommended === 'COPILOT_STUDIO') {
      summary +=
        'This platform enables you to build custom AI agents and chatbots tailored to your specific business processes and workflows.';
    } else if (recommended === 'HYBRID') {
      summary +=
        'A combined approach gives you the productivity benefits of M365 Copilot along with the customization capabilities of Copilot Studio.';
    } else if (recommended === 'FOUNDRY') {
      summary +=
        'This enterprise platform provides the infrastructure and tools needed for large-scale, custom AI development and deployment.';
    } else {
      summary +=
        'This Microsoft solution provides the AI capabilities you need to transform your business operations.';
    }

    const detailedAnalysis = `Your scoring indicates ${formatRecommendationType(recommended)} is the best fit. ${tenantMetrics?.readinessScore ? `Your organization's overall readiness score of ${tenantMetrics.readinessScore.overall}% suggests you are well-positioned to implement this solution.` : ''}`;

    const strategicGuidance = `To maximize success, start with a pilot program in a specific department or use case. Focus on demonstrating quick wins and measurable ROI to build organizational buy-in. Ensure proper change management and user training are prioritized alongside technical implementation.`;

    const implementationRoadmap = [
      'Conduct stakeholder workshops to define success criteria and KPIs',
      'Set up pilot environment and select initial user group (10-50 users)',
      'Implement core functionality and integrate with existing systems',
      'Conduct user training sessions and gather feedback',
      'Iterate and refine based on pilot learnings',
      'Plan phased rollout to remaining organization',
      'Establish governance and ongoing support model',
    ];

    const riskMitigation = [
      'Start small with a contained pilot to minimize organizational impact',
      'Secure executive sponsorship early to ensure sustained support',
      'Plan for adequate change management and user adoption resources',
      'Establish clear data governance and security policies before deployment',
      'Create feedback loops to address issues quickly during rollout',
    ];

    let costConsiderations = `For ${formatRecommendationType(recommended)}, expect licensing costs plus implementation services. `;
    if (recommended === 'M365_COPILOT') {
      costConsiderations +=
        'M365 Copilot is $30/user/month. For a 100-user pilot, budget ~$3,000/month for licenses plus ~$50,000 for initial setup and training.';
    } else if (recommended === 'COPILOT_STUDIO') {
      costConsiderations +=
        'Copilot Studio offers flexible pricing from $0.01/message (pay-as-you-go) to $200/month subscriptions. Budget for development resources and integration work.';
    } else {
      costConsiderations +=
        'Contact Microsoft or a partner for detailed pricing based on your specific requirements.';
    }

    if (tenantMetrics?.costReport?.copilotRelatedCosts) {
      costConsiderations += ` Note: You're currently spending ~$${tenantMetrics.costReport.copilotRelatedCosts.toFixed(2)}/month on AI services.`;
    }

    const timelineEstimate = `Typical implementation timeline: 2-4 months for a pilot, 6-12 months for broader rollout (varies by integrations, governance, and change management).`;

    const nextSteps = [
      'Schedule kickoff meeting with key stakeholders and decision makers',
      'Define pilot scope, success criteria, and measurement approach',
      'Secure necessary licenses and set up pilot environment',
      'Identify and recruit pilot users representing target personas',
      'Begin user training and start collecting feedback immediately',
    ];

    return {
      summary,
      detailedAnalysis,
      strategicGuidance,
      implementationRoadmap,
      riskMitigation,
      costConsiderations,
      timelineEstimate,
      nextSteps,
      personalizationFactors: this.extractPersonalizationFactors(request),
    };
  }
}

export type { AIRecommendation, AIRecommendationRequest };

function calculateMatchScore(scoringResult: ScoringResult): number {
  const scores: Weights = scoringResult.scores;
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;

  const recommendedScore =
    scoringResult.recommendation === 'M365_COPILOT'
      ? scores.m365Copilot
      : scoringResult.recommendation === 'COPILOT_STUDIO'
        ? scores.copilotStudio
        : scoringResult.recommendation === 'FOUNDRY'
          ? scores.foundry
          : scoringResult.recommendation === 'AGENT_BUILDER'
            ? scores.agentBuilder
            : scores.hybrid;

  return Math.round((recommendedScore / total) * 100);
}

function formatRecommendationType(type: RecommendationType): string {
  switch (type) {
    case 'M365_COPILOT':
      return 'Microsoft 365 Copilot';
    case 'COPILOT_STUDIO':
      return 'Copilot Studio';
    case 'FOUNDRY':
      return 'Microsoft Foundry';
    case 'AGENT_BUILDER':
      return 'Agent Builder';
    case 'HYBRID':
      return 'Hybrid';
    default:
      return type;
  }
}
