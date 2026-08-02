// Debug output at the very start
console.log('=== API Server Initialization Started ===');
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());
console.log('Script path:', import.meta.url);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('[1/10] Starting imports...');

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { DefaultAzureCredential } from '@azure/identity';
import useCasesRouter from './routes/use-cases.js';
import type { DecisionModel } from '@copilot-guidance/decision-engine';
import { generateExecutiveOverviewPPTX } from './services/executive-overview-pptx.js';
import { getCopilotStudioReleasePlannerData } from './services/release-planner.js';
import { getFoundryNews } from './services/foundry-news.js';
import {
  checkImplementationGuideUpdate,
  getImplementationGuideMetadata,
  getImplementationGuideUpdateHistory,
} from './services/implementation-guide-monitor.js';

console.log('[2/10] Core imports loaded successfully');

let decisionModel: any;
let calculateRecommendation: any;
let generateRecommendation: any;
let UserAnswersSchema: any;
let MetricsService: any;
let AIRecommendationService: any;

try {
  console.log('[3/10] Loading decision-engine package...');
  const decisionEngine = await import('@copilot-guidance/decision-engine');
  calculateRecommendation = decisionEngine.calculateRecommendation;
  generateRecommendation = decisionEngine.generateRecommendation;
  decisionModel = decisionEngine.decisionModel;
  UserAnswersSchema = decisionEngine.UserAnswersSchema;
  console.log('[3/10] ✅ Decision-engine loaded:', {
    hasModel: !!decisionModel,
    modelVersion: decisionModel?.version,
  });
} catch (error) {
  console.error('[3/10] ❌ Failed to load decision-engine:', error);
  process.exit(1);
}

try {
  console.log('[4/10] Loading service modules...');
  const metricsModule = await import('./services/metrics.js');
  const aiModule = await import('./services/ai-recommendations.js');
  MetricsService = metricsModule.MetricsService;
  AIRecommendationService = aiModule.AIRecommendationService;
  console.log('[4/10] ✅ Service modules loaded');
} catch (error) {
  console.error('[4/10] ❌ Failed to load service modules:', error);
  process.exit(1);
}

// Load environment variables from .env file
console.log('[5/10] Loading environment variables...');
const envCandidates = [
  // When running from apps/api (dev)
  path.resolve(process.cwd(), '.env'),
  // When using the repo-root .env from within apps/api
  path.resolve(process.cwd(), '..', '..', '.env'),
];

const resolvedEnvPath = envCandidates.find((p) => existsSync(p));
if (resolvedEnvPath) {
  console.log('Using .env at:', resolvedEnvPath);
  dotenv.config({ path: resolvedEnvPath });
} else {
  console.log('No .env found in expected locations; falling back to default dotenv behavior');
  dotenv.config();
}
console.log('[5/10] ✅ Environment loaded. PORT =', process.env.PORT || '3001 (default)');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const licensingDataPromise = readFile(
  path.join(__dirname, '../../../packages/decision-engine/dist/data/licensing-data.json'),
  'utf-8'
).then((content) => JSON.parse(content));

const getOpenAIChatCompletionsUrl = (): string => {
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
};

console.log('[6/10] Creating Express app...');
const app = express();
const PORT = process.env.PORT || 3001;
console.log('[6/10] ✅ Express app created. Will listen on port:', PORT);

type ReadinessDomain = 'identity' | 'data' | 'security' | 'platform' | 'operatingModel';

type ReadinessAnswer = 'yes' | 'partial' | 'no' | 'na-anonymous-agent';

type ReadinessQuestion = {
  id: string;
  domain: ReadinessDomain;
  title: string;
  helperText: string;
  isBlocker: boolean;
  examples: {
    good: string;
    watch: string;
    highRisk: string;
  };
  recommendedControls: string[];
  references: string[];
};

type PortfolioCriterion =
  | 'businessValue'
  | 'feasibility'
  | 'timeToValue'
  | 'risk'
  | 'dataSensitivity';

type PortfolioRatings = Record<PortfolioCriterion, number>;

type PortfolioUseCase = {
  id: string;
  name: string;
  description: string;
  ratings: PortfolioRatings;
};

type ChatHistoryEntry = {
  role: 'user' | 'assistant';
  content: string;
};

const isChatHistory = (value: unknown): value is ChatHistoryEntry[] =>
  Array.isArray(value) &&
  value.length <= 10 &&
  value.every(
    (entry: unknown) =>
      typeof entry === 'object' &&
      entry !== null &&
      'role' in entry &&
      (entry.role === 'user' || entry.role === 'assistant') &&
      'content' in entry &&
      typeof entry.content === 'string' &&
      entry.content.length <= 4000
  );

const readinessDomains: Array<{ id: ReadinessDomain; label: string; description: string }> = [
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

const readinessQuestions: ReadinessQuestion[] = [
  {
    id: 'identity-1',
    domain: 'identity',
    title: 'Microsoft Entra ID conditional access is enforced for target user groups.',
    helperText: 'Protects access to copilots and agents with baseline controls.',
    isBlocker: true,
    examples: {
      good: 'Conditional Access requires MFA and compliant devices for pilot users and blocks legacy authentication.',
      watch:
        'Conditional Access exists but excludes service accounts or pilot groups that can still sign in without MFA.',
      highRisk:
        'No Conditional Access policy protects pilot users, or broad exclusions allow unmanaged device sign-in.',
    },
    recommendedControls: [
      'Require MFA for all pilot identities and administrators.',
      'Require compliant or hybrid-joined devices for production access paths.',
      'Block legacy authentication protocols and remove broad policy exclusions.',
    ],
    references: [
      'https://learn.microsoft.com/entra/identity/conditional-access/overview',
      'https://learn.microsoft.com/entra/identity/conditional-access/concept-conditional-access-policies',
    ],
  },
  {
    id: 'identity-2',
    domain: 'identity',
    title: 'Role-based access is defined for makers, admins, and reviewers.',
    helperText: 'Ensures least-privilege access across delivery teams.',
    isBlocker: false,
    examples: {
      good: 'Makers, environment admins, and security reviewers are separated with least-privilege role assignments.',
      watch:
        'Roles are defined, but periodic access reviews and privileged role controls are not consistently enforced.',
      highRisk:
        'Makers or project users hold tenant-wide admin roles in production without separation of duties.',
    },
    recommendedControls: [
      'Define role boundaries for maker, approver, and admin duties.',
      'Use role assignment reviews for privileged access at a regular cadence.',
      'Restrict production environment admin access to a small operational group.',
    ],
    references: [
      'https://learn.microsoft.com/power-platform/admin/database-security',
      'https://learn.microsoft.com/entra/id-governance/access-reviews-overview',
    ],
  },
  {
    id: 'data-1',
    domain: 'data',
    title: "Knowledge data source permissions align with agent's targeted users.",
    helperText:
      'Prevents overexposure and access gaps by ensuring the agent grounds only on sources that intended users are both authorized and able to access.',
    isBlocker: true,
    examples: {
      good: 'Connected knowledge sources enforce user/group permissions that match the intended agent audience before go-live.',
      watch:
        'Most sources are permission-aligned, but some pilot connectors still expose broader access than intended.',
      highRisk:
        'The agent can retrieve content from sources that target users should not be able to access directly.',
    },
    recommendedControls: [
      'Validate source ACLs/security groups against target user personas before enabling grounding.',
      'Use least-privilege access for connectors and service identities while ensuring target users retain required read access.',
      'Block or remove sources with permission mismatches from pilot and production scope.',
    ],
    references: [
      'https://learn.microsoft.com/purview/sensitivity-labels',
      'https://learn.microsoft.com/power-platform/admin/wp-data-loss-prevention',
    ],
  },
  {
    id: 'data-2',
    domain: 'data',
    title: 'Knowledge sources meet required data residency and security requirements.',
    helperText:
      'Reduces compliance and exposure risk by ensuring grounding sources stay in approved regions and security boundaries.',
    isBlocker: true,
    examples: {
      good: 'All connected knowledge sources are hosted in approved regions, encryption is enabled, and access is governed by policy.',
      watch:
        'Most sources meet residency and security requirements, but one or more pilot sources still require policy exceptions or remediation.',
      highRisk:
        'Knowledge sources used for grounding violate required residency constraints or lack baseline security protections.',
    },
    recommendedControls: [
      'Document approved data residency regions and verify each source location before go-live.',
      'Apply required encryption, access controls, and security baselines to all connected knowledge sources.',
      'Block or remove sources that do not satisfy residency and security requirements.',
    ],
    references: [
      'https://learn.microsoft.com/azure/compliance/offerings/offering-data-residency',
      'https://learn.microsoft.com/azure/security/fundamentals/data-encryption-best-practices',
    ],
  },
  {
    id: 'data-3',
    domain: 'data',
    title: 'Knowledge data is fresh enough for pilot workflows.',
    helperText: 'Improves first-pass answer quality and trust.',
    isBlocker: false,
    examples: {
      good: 'Pilot content is current, deduplicated, and aligned to approved business terms and source-of-truth records.',
      watch:
        'Data is usable but includes stale pages, inconsistent metadata, or duplicate records that degrade response quality.',
      highRisk:
        'Grounding includes outdated or unreviewed content that can produce inaccurate answers in critical workflows.',
    },
    recommendedControls: [
      'Define freshness SLAs for pilot data sources.',
      'Remove duplicate or obsolete content from grounding sources.',
      'Create a quality gate checklist before adding new data to pilot scope.',
    ],
    references: [
      'https://learn.microsoft.com/microsoft-365-copilot/extensibility/overview',
      'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio',
    ],
  },
  {
    id: 'security-1',
    domain: 'security',
    title: 'DLP and data-sharing policies are in place for pilot scope.',
    helperText: 'Minimum guardrail before production rollout.',
    isBlocker: true,
    examples: {
      good: 'Power Platform DLP policies separate business and non-business connectors and block prohibited data movements in pilot environments.',
      watch:
        'DLP policies exist, but exceptions allow broad connector combinations or unmanaged sharing in pilot environments.',
      highRisk:
        'High-risk configuration: pilot environment allows anonymous/public access while DLP policies permit unrestricted connector data sharing.',
    },
    recommendedControls: [
      'Apply environment-scoped DLP with explicit blocked connector groups.',
      'Disable anonymous/public access paths unless explicitly required and approved.',
      'Review and approve DLP exceptions through a security governance process.',
    ],
    references: [
      'https://learn.microsoft.com/power-platform/admin/wp-data-loss-prevention',
      'https://learn.microsoft.com/microsoft-copilot-studio/publication-connect-bot-to-web-channels',
    ],
  },
  {
    id: 'security-2',
    domain: 'security',
    title: 'Human-in-the-loop controls are defined for high-impact actions.',
    helperText: 'Prevents autonomous execution for sensitive decisions.',
    isBlocker: true,
    examples: {
      good: 'High-impact actions require explicit approval workflows before updates, submissions, or external communications are executed.',
      watch:
        'Approval controls are defined for some actions, but destructive or compliance-sensitive flows still execute automatically.',
      highRisk:
        'Agents can trigger high-impact actions (such as account, financial, or records changes) without human approval gates.',
    },
    recommendedControls: [
      'Classify high-impact actions and require explicit approval for each class.',
      'Add approval checkpoints in Power Automate or equivalent orchestration paths.',
      'Log all high-impact action requests and approvals for auditability.',
    ],
    references: [
      'https://learn.microsoft.com/power-automate/guidance/coding-guidelines/error-handling',
      'https://learn.microsoft.com/microsoft-copilot-studio/authoring-generative-answers',
    ],
  },
  {
    id: 'platform-1',
    domain: 'platform',
    title: 'Required connectors/integrations are validated in non-production.',
    helperText: 'Reduces implementation risk in first release wave.',
    isBlocker: false,
    examples: {
      good: 'All required connectors are tested in non-production with least-privilege service identities and representative data.',
      watch:
        'Core connectors are tested, but edge-case integrations or throttling limits are not validated before rollout.',
      highRisk:
        'New connectors are first exercised in production using broad credentials and untested data paths.',
    },
    recommendedControls: [
      'Validate each connector in non-production with production-like test cases.',
      'Use dedicated service principals/accounts with least privilege.',
      'Document error handling and retry behavior for dependency outages.',
    ],
    references: [
      'https://learn.microsoft.com/microsoft-copilot-studio/advanced-connectors',
      'https://learn.microsoft.com/power-automate/limits-and-config',
    ],
  },
  {
    id: 'platform-2',
    domain: 'platform',
    title: 'Environment strategy exists for dev/test/prod promotion.',
    helperText: 'Supports reliable releases and rollback posture.',
    isBlocker: true,
    examples: {
      good: 'Separate dev, test, and production environments are used with controlled promotion and rollback procedures.',
      watch:
        'Environment separation exists, but release promotion criteria and rollback runbooks are incomplete.',
      highRisk:
        'A single shared/default environment is used for build, test, and production workloads without promotion controls.',
    },
    recommendedControls: [
      'Maintain separate environments for development, testing, and production.',
      'Define release gates and rollback criteria before production promotion.',
      'Track deployment artifacts and configuration changes for each promotion step.',
    ],
    references: [
      'https://learn.microsoft.com/power-platform/alm/overview-alm',
      'https://learn.microsoft.com/power-platform/admin/environments-overview',
    ],
  },
  {
    id: 'operating-1',
    domain: 'operatingModel',
    title: 'An owner is assigned for each use case and KPI.',
    helperText: 'Clarifies accountability for value realization.',
    isBlocker: false,
    examples: {
      good: 'Each use case has an accountable owner, target KPI baseline, and review cadence for value tracking.',
      watch:
        'Owners are named, but KPI baselines or review cadence are inconsistent across use cases.',
      highRisk:
        'No accountable owner is assigned, so KPI drift and unresolved issues accumulate after launch.',
    },
    recommendedControls: [
      'Assign a single accountable owner per use case and KPI set.',
      'Capture baseline KPI values before pilot launch.',
      'Establish a recurring value review meeting with action tracking.',
    ],
    references: [
      'https://learn.microsoft.com/power-platform/guidance/adoption/measure-success',
      'https://learn.microsoft.com/microsoft-365-copilot/microsoft-365-copilot-adoption',
    ],
  },
  {
    id: 'operating-2',
    domain: 'operatingModel',
    title: 'Support runbook exists for incidents and escalation paths.',
    helperText: 'Needed for stable operations post-launch.',
    isBlocker: true,
    examples: {
      good: 'Runbook defines severity, triage owner, escalation path, and communication templates for service incidents.',
      watch:
        'Runbook exists, but escalation ownership or response time expectations are not consistently defined.',
      highRisk:
        'No incident runbook or escalation path exists, causing delayed containment and recovery during outages.',
    },
    recommendedControls: [
      'Define severity levels and response targets for pilot and production incidents.',
      'Publish on-call and escalation contacts for operations and security teams.',
      'Run incident simulation drills and update the runbook based on findings.',
    ],
    references: [
      'https://learn.microsoft.com/azure/well-architected/operational-excellence/monitoring-analysis',
      'https://learn.microsoft.com/power-platform/admin/powerplatform-api-call-limits-allocations',
    ],
  },
];

const fallbackReadinessControlsByDomain: Record<ReadinessDomain, string[]> = {
  identity: [
    'Require MFA and conditional access for pilot and admin identities.',
    'Enforce least-privilege role assignments with periodic access reviews.',
  ],
  data: [
    'Validate source permissions and data boundaries before enabling grounding.',
    'Apply residency and encryption baselines to all connected knowledge sources.',
  ],
  security: [
    'Implement DLP policies and connector boundaries for pilot environments.',
    'Require human approval gates for high-impact actions.',
  ],
  platform: [
    'Validate integrations in non-production with least-privilege identities.',
    'Use controlled dev/test/prod promotion with rollback criteria.',
  ],
  operatingModel: [
    'Assign accountable owners and KPI review cadence for each use case.',
    'Maintain incident runbooks with escalation paths and simulation drills.',
  ],
};

const fallbackReadinessReferencesByDomain: Record<ReadinessDomain, string[]> = {
  identity: ['https://learn.microsoft.com/entra/identity/conditional-access/overview'],
  data: ['https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio'],
  security: ['https://learn.microsoft.com/power-platform/admin/wp-data-loss-prevention'],
  platform: ['https://learn.microsoft.com/power-platform/alm/overview-alm'],
  operatingModel: [
    'https://learn.microsoft.com/microsoft-365-copilot/microsoft-365-copilot-adoption',
  ],
};

function isMicrosoftLearnReference(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === 'learn.microsoft.com' || hostname.endsWith('.learn.microsoft.com');
  } catch {
    return false;
  }
}

function ensureRecommendedControls(
  controls: string[] | undefined,
  domain: ReadinessDomain
): string[] {
  const normalized = Array.from(new Set((controls || []).map((c) => c.trim()).filter(Boolean)));

  if (normalized.length > 0) {
    return normalized;
  }

  return fallbackReadinessControlsByDomain[domain];
}

function prioritizeMicrosoftLearnReferences(
  references: string[] | undefined,
  domain: ReadinessDomain
): string[] {
  const normalized = Array.from(new Set((references || []).map((r) => r.trim()).filter(Boolean)));

  const learn = normalized.filter((r) => isMicrosoftLearnReference(r));
  const nonLearn = normalized.filter((r) => !isMicrosoftLearnReference(r));
  const combined = [...learn, ...nonLearn];

  if (learn.length > 0) {
    return combined;
  }

  return [...fallbackReadinessReferencesByDomain[domain], ...combined];
}

function normalizeReadinessQuestion(q: ReadinessQuestion): ReadinessQuestion {
  return {
    ...q,
    recommendedControls: ensureRecommendedControls(q.recommendedControls, q.domain),
    references: prioritizeMicrosoftLearnReferences(q.references, q.domain),
  };
}

function isReadinessEquivalentToYes(questionId: string, answer: ReadinessAnswer): boolean {
  return answer === 'yes' || (questionId === 'identity-1' && answer === 'na-anonymous-agent');
}

function scoreReadinessAnswer(questionId: string, answer: ReadinessAnswer): number {
  if (questionId === 'identity-1' && answer === 'na-anonymous-agent') return 100;
  if (answer === 'yes') return 100;
  if (answer === 'partial') return 50;
  return 0;
}

const portfolioCriteria: Array<{
  id: PortfolioCriterion;
  label: string;
  description: string;
  higherIsBetter: boolean;
}> = [
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

const portfolioDefaultWeights: Record<PortfolioCriterion, number> = {
  businessValue: 30,
  feasibility: 25,
  timeToValue: 20,
  risk: 15,
  dataSensitivity: 10,
};

const portfolioDefaultUseCases: PortfolioUseCase[] = [
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

function clampRating(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function normalizeWeights(
  weights: Partial<Record<PortfolioCriterion, number>> | undefined
): Record<PortfolioCriterion, number> {
  const merged: Record<PortfolioCriterion, number> = {
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

function scorePortfolioUseCase(
  useCase: PortfolioUseCase,
  weights: Record<PortfolioCriterion, number>
): { score: number; tier: 'now' | 'next' | 'later' } {
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

// Initialize services with error handling
console.log('[7/10] Initializing services...');
let metricsService: any;
let aiRecommendationService: any;

try {
  metricsService = new MetricsService({
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
    enableCostReports: process.env.ENABLE_COST_REPORTS === 'true',
    enablePowerPlatform: process.env.ENABLE_POWER_PLATFORM === 'true',
    enableLicenses: process.env.ENABLE_LICENSES === 'true',
    enableSecureScore: process.env.ENABLE_SECURE_SCORE === 'true',
  });
  console.log('[7/10] ✅ MetricsService initialized');
} catch (error) {
  console.error('[7/10] ⚠️  MetricsService initialization failed:', error);
  // Continue anyway - metrics are optional
  metricsService = { isEnabled: () => false };
}

try {
  aiRecommendationService = new AIRecommendationService(
    process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.GITHUB_TOKEN,
    process.env.AZURE_OPENAI_ENDPOINT || process.env.OPENAI_ENDPOINT,
    process.env.AZURE_OPENAI_DEPLOYMENT || process.env.OPENAI_MODEL
  );
  console.log('[7/10] ✅ AIRecommendationService initialized');
} catch (error) {
  console.error('[7/10] ⚠️  AIRecommendationService initialization failed:', error);
  // Continue anyway - AI is optional
  aiRecommendationService = { isEnabled: () => false };
}

console.log('[8/10] Configuring middleware...');

// Middleware
app.disable('x-powered-by');

const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://localhost:5173');
}

app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; img-src 'self' data: https:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'"
  );
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin denied'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '256kb' }));

app.use((error: any, _req: Request, res: Response, next: NextFunction) => {
  if (error?.message === 'CORS origin denied') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'The request origin is not allowed.',
    });
  }

  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload too large',
      message: 'Request bodies must not exceed 256 KB.',
    });
  }

  if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
    return res.status(400).json({
      error: 'Invalid JSON payload',
      message:
        'Request body contains malformed JSON. Check for invalid escape sequences (for example bad Unicode escapes like \\u).',
      details: error?.message || 'Malformed JSON request body.',
    });
  }

  return next(error);
});
console.log('[8/10] ✅ Middleware configured');

// Serve static files from web dist folder in production
console.log('[9/10] Configuring static file serving...');
const webDistPath = path.join(__dirname, '../../web/dist');
app.use(express.static(webDistPath));
console.log('[9/10] ✅ Static files configured:', webDistPath);

console.log('[10/10] Registering routes...');

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    features: {
      aiEnabled: !!(
        process.env.AZURE_OPENAI_ENDPOINT ||
        process.env.OPENAI_API_KEY ||
        process.env.GITHUB_TOKEN
      ),
      metricsEnabled: metricsService.isEnabled(),
      aiRecommendationsEnabled: aiRecommendationService.isEnabled(),
    },
    azureConfigured: !!process.env.AZURE_OPENAI_ENDPOINT,
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    authMethod: process.env.AZURE_OPENAI_ENDPOINT ? 'entra' : 'none',
  });
});

app.get('/api/ready', (_req: Request, res: Response) => {
  const ready = Boolean(decisionModel?.version && calculateRecommendation && generateRecommendation);
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not-ready',
    timestamp: new Date().toISOString(),
  });
});

// Readiness Assessment model
app.get('/api/readiness/model', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  res.json({
    version: '2.0.0',
    domains: readinessDomains,
    questions: readinessQuestions.map(normalizeReadinessQuestion),
    answerOptions: [
      { id: 'yes', label: 'Yes' },
      { id: 'partial', label: 'Partially' },
      { id: 'no', label: 'No' },
    ],
  });
});

app.get('/api/portfolio/model', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
  res.json({
    version: '1.0.0',
    criteria: portfolioCriteria,
    defaultWeights: portfolioDefaultWeights,
    defaultUseCases: portfolioDefaultUseCases,
  });
});

app.post('/api/portfolio/prioritize', (req: Request, res: Response) => {
  const useCases = req.body?.useCases ?? portfolioDefaultUseCases;
  const requestedWeights = req.body?.weights;

  if (!Array.isArray(useCases) || useCases.length === 0 || useCases.length > 100) {
    return res.status(400).json({
      error: 'Invalid use cases',
      message: 'useCases must contain between 1 and 100 items.',
    });
  }

  const valid = useCases.every(
    (item) =>
      item &&
      typeof item.id === 'string' &&
      item.id.length <= 100 &&
      typeof item.name === 'string' &&
      item.name.length <= 200 &&
      typeof item.description === 'string' &&
      item.description.length <= 2000 &&
      item.ratings &&
      portfolioCriteria.every((criterion) =>
        Number.isFinite(Number(item.ratings[criterion.id]))
      )
  );

  if (!valid) {
    return res.status(400).json({
      error: 'Invalid use cases',
      message: 'Each use case must include id, name, description, and numeric ratings.',
    });
  }

  if (
    requestedWeights !== undefined &&
    (typeof requestedWeights !== 'object' ||
      requestedWeights === null ||
      portfolioCriteria.some((criterion) => {
        const value = requestedWeights[criterion.id];
        return value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0);
      }))
  ) {
    return res.status(400).json({
      error: 'Invalid weights',
      message: 'weights must contain finite, non-negative numbers.',
    });
  }

  const weights = normalizeWeights(requestedWeights);
  const prioritized = (useCases as PortfolioUseCase[])
    .map((item) => {
      const normalized: PortfolioUseCase = {
        ...item,
        ratings: Object.fromEntries(
          portfolioCriteria.map((criterion) => [
            criterion.id,
            clampRating(Number(item.ratings[criterion.id])),
          ])
        ) as PortfolioRatings,
      };
      return { ...normalized, ...scorePortfolioUseCase(normalized, weights) };
    })
    .sort((left, right) => right.score - left.score);

  return res.json({ weights, prioritized, scoredAt: new Date().toISOString() });
});

// Readiness Assessment scoring
app.post('/api/readiness/assess', (req: Request, res: Response) => {
  try {
    const answers = req.body?.answers as Record<string, ReadinessAnswer> | undefined;
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

    const actionItems = readinessQuestions
      .filter((q) => !isReadinessEquivalentToYes(q.id, answers[q.id]))
      .map((rawQuestion) => {
        const q = normalizeReadinessQuestion(rawQuestion);
        return {
          id: q.id,
          domain: q.domain,
          title: q.title,
          priority: answers[q.id] === 'no' ? 'high' : 'medium',
          whyItMatters: q.helperText,
          currentState: answers[q.id],
          highRiskExample: q.examples.highRisk,
          recommendedControls: q.recommendedControls,
          references: q.references,
        };
      });

    const actionPlan = actionItems.length
      ? actionItems.slice(0, 5).map((item, index) => {
          const controlsPreview = item.recommendedControls.slice(0, 2).join(' | ');
          return `${index + 1}. [${item.priority.toUpperCase()}] ${item.title} — ${controlsPreview}`;
        })
      : [
          'No immediate remediation actions required.',
          'Maintain current controls and monitor readiness indicators.',
          'Re-run readiness assessment periodically or after major changes.',
        ];

    return res.json({
      status,
      overallScore,
      domainScores,
      blockerCount: blockers.length,
      blockers,
      priorities,
      actionItems,
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

// Get decision model
app.get('/api/model', (_req: Request, res: Response) => {
  res.json(decisionModel);
});

// Use Cases Assistant routes
app.use('/api/use-cases', useCasesRouter);

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
    const aiEnabled =
      !!process.env.AZURE_OPENAI_ENDPOINT ||
      !!process.env.OPENAI_API_KEY ||
      !!process.env.GITHUB_TOKEN;

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

// Power Platform Release Planner (Copilot Studio only)
app.get('/api/release-planner/copilot-studio', async (_req: Request, res: Response) => {
  try {
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

app.get('/api/foundry/news', async (_req: Request, res: Response) => {
  try {
    const data = await getFoundryNews();
    res.json(data);
  } catch (error) {
    console.error('Error fetching Microsoft Foundry news feed:', error);
    res.status(502).json({
      error: 'Bad Gateway',
      message: error instanceof Error ? error.message : 'Failed to fetch Foundry news feed',
    });
  }
});

// Implementation Guide Update Monitoring
app.get('/api/implementation-guide/update-check', async (_req: Request, res: Response) => {
  try {
    const updateInfo = await checkImplementationGuideUpdate();
    res.json(updateInfo);
  } catch (error) {
    console.error('Error checking for Implementation Guide updates:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to check for updates',
    });
  }
});

app.get('/api/implementation-guide/metadata', async (_req: Request, res: Response) => {
  try {
    const metadata = await getImplementationGuideMetadata();
    if (!metadata) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Implementation Guide metadata not available',
      });
    }
    res.json(metadata);
  } catch (error) {
    console.error('Error retrieving Implementation Guide metadata:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to retrieve metadata',
    });
  }
});

app.get('/api/implementation-guide/update-history', async (_req: Request, res: Response) => {
  try {
    const history = await getImplementationGuideUpdateHistory();
    res.json(history);
  } catch (error) {
    console.error('Error retrieving Implementation Guide update history:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Failed to retrieve update history',
    });
  }
});

// Agentic Decision Assistant - Chat endpoint
app.post('/api/copilot-agent/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (typeof message !== 'string' || message.trim().length === 0 || message.length > 4000) {
      return res.status(400).json({
        error: 'Invalid message',
        message: 'message must be a non-empty string no longer than 4,000 characters.',
      });
    }

    if (
      history !== undefined &&
      !isChatHistory(history)
    ) {
      return res.status(400).json({
        error: 'Invalid history',
        message:
          'history must contain at most 10 user or assistant messages of up to 4,000 characters each.',
      });
    }

    // Check if AI is enabled
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!azureEndpoint && !openaiKey) {
      return res.status(501).json({
        error: 'AI not configured',
        message: 'Set AZURE_OPENAI_ENDPOINT or OPENAI_API_KEY to enable the Copilot Agent',
      });
    }

    const licensing = await licensingDataPromise;

    // Build conversation history
    const conversationHistory = (isChatHistory(history) ? history : []).slice(-5).map((msg) => ({
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

    if (azureEndpoint && azureDeployment) {
      // Azure OpenAI with Entra authentication
      const credential = new DefaultAzureCredential();
      const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

      const response = await fetch(
        `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.token}`,
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
        throw new Error(`Azure OpenAI API request failed with HTTP ${response.status}`);
      }

      const data = (await response.json()) as any;
      responseText =
        data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } else if (openaiKey) {
      // OpenAI
      const openaiEndpoint = getOpenAIChatCompletionsUrl();
      const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';
      const response = await fetch(openaiEndpoint, {
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
        `M365 Copilot can include eligible employee-facing Copilot Studio usage in internal M365 contexts (subject to fair usage limits)`,
        `Copilot Studio License capacity pack includes ${licensingData.licenses.copilotStudioSubscription.messagesIncluded.toLocaleString()} Copilot Credits per pack; compare with Pay-As-You-Go and P3 options for your usage profile`,
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

const microsoftLearnSourcingNote = `

**MICROSOFT LEARN SOURCING APPROACH:**
- Microsoft Learn lookups are performed via MCP tools in the agent layer (not via this API service).
- Use MCP search/fetch tools against the Microsoft Learn MCP server to gather current documentation.
- This API keeps recommendation generation deterministic and resilient even when external documentation services are unavailable.`;

// AI explanation helper with comprehensive compliance-aware LLM integration
async function generateAIExplanation(recommendation: any, userContext?: any): Promise<any> {
  console.log(`[AI Explanation] Starting for recommendation type: ${recommendation.type}`);

  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const openaiKey = process.env.OPENAI_API_KEY || process.env.GITHUB_TOKEN;
  const aiConfigured = !!(azureEndpoint || openaiKey);
  console.log(
    `[AI Explanation] AI configured: ${aiConfigured} (Azure: ${!!azureEndpoint}, OpenAI/GitHub: ${!!openaiKey})`
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
      intro += `The methodology follows the Microsoft AI Decision Framework, applying the BXT model (Business viability, Experience desirability, Technology feasibility) and the Microsoft Cloud Adoption Framework (CAF) — a structured approach covering strategy, planning, readiness, and governance for cloud and AI adoption — considering your ${contextFactors.join(', ')}. `;
    } else {
      intro += `The methodology follows the Microsoft AI Decision Framework, applying the BXT model (Business viability, Experience desirability, Technology feasibility) and the Microsoft Cloud Adoption Framework (CAF) — a structured approach covering strategy, planning, readiness, and governance for cloud and AI adoption. `;
    }

    intro += `This is a scenario-specific recommendation—most organizations successfully deploy multiple Microsoft AI tools across different use cases, and this guidance helps optimize for your particular requirements.`;

    return intro;
  };

  if (!azureEndpoint && !openaiKey) {
    console.log(`[AI Explanation] No AI configuration found, returning deterministic template`);
    return {
      introduction: generateDetailedIntroduction(recommendation, userContext),
      summary: recommendation.summary,
      reasons: recommendation.reasons,
      nextSteps: recommendation.nextSteps,
      complianceConsiderations: recommendation.complianceConsiderations,
    };
  }

  try {
    console.log(
      '[AI Explanation] Microsoft Learn lookups are handled by MCP tools in the agent layer'
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
${
  recommendation.scoringResult?.breakdown
    ? recommendation.scoringResult.breakdown
        .map((item: any) => `- ${item.questionTitle}: ${item.answerLabel}`)
        .join('\n')
    : 'No detailed breakdown available'
}

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
${microsoftLearnSourcingNote}

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
9. Add KEY CLARIFICATIONS: identify 2-3 common misconceptions customers have about the recommended platform and correct them clearly. Explain what the recommendation does NOT cover so customers do not misapply it.
10. Add SOURCES: cite 5-8 real, verified Microsoft Learn or Microsoft documentation URLs that are directly relevant to this recommendation. Prefer learn.microsoft.com and aka.ms links. Include licensing, governance, and getting-started pages.
11. Expand NEXT STEPS with: specific named Microsoft tools/portals, estimated effort, and where applicable include real Microsoft Learn URL references inline (e.g. "See https://learn.microsoft.com/...").
12. Expand COST CONSIDERATIONS: include current licensing model specifics (per-user vs Copilot Credits vs consumption), and link to the relevant pricing or licensing page.

CONSTRAINTS:
- Do NOT hallucinate capabilities, features, or compliance certifications
- Do NOT change the recommendation type
- Do NOT frame as either-or decision (most organizations use both products)
- Do NOT minimize compliance risks (be transparent about Bing US datacenter limitation)
- Do NOT use vague phrases like "enterprise-grade" without specifics
- If recommending Copilot Studio, MUST mention deployment channels including M365 Copilot and Teams
- If uncertain about a compliance detail, note "verify with Microsoft documentation"
- Keep technical accuracy aligned with Microsoft Learn sources
- Sources MUST be real Microsoft documentation URLs — do NOT invent or guess URLs
- Clarifications must be factual corrections aimed at common customer misconceptions

Return ONLY valid JSON (no markdown, no code blocks):
{
  "introduction": "3-5 sentence paragraph explaining the analysis methodology (deterministic scoring based on user answers + weighted questions), the Microsoft AI Decision Framework foundation — which applies the BXT model (Business viability, Experience desirability, Technology feasibility) and the Microsoft Cloud Adoption Framework (CAF, a structured approach covering strategy, planning, readiness, and governance) — and that this recommendation is scenario-specific (organizations typically use multiple tools)",
  "summary": "enhanced summary for THIS SCENARIO (2-3 sentences, acknowledge coexistence)",
  "reasons": ["reason 1 with specific technical details and 'why this matters' context", "reason 2 with implementation implications", "reason 3...", "provide 4-6 detailed reasons"],
  "nextSteps": ["step 1 with concrete actions, named tools/portals, and timelines — include a real https://learn.microsoft.com/... URL where relevant", "step 2 with measurable outcomes", "provide 5-7 actionable steps"],
  "complianceConsiderations": [
    "Data residency: [specific guidance]",
    "Regulatory compliance: [specific frameworks and certifications]",
    "Governance controls: [specific policy and tooling recommendations]",
    "provide 3-5 items"
  ],
  "clarifications": [
    "Misconception 1: [what customers often wrongly assume] — Fact: [the accurate clarification with specifics]",
    "Misconception 2: [what customers often wrongly assume] — Fact: [the accurate clarification]",
    "provide 2-3 items"
  ],
  "sources": [
    { "title": "Descriptive title of the resource", "url": "https://learn.microsoft.com/..." },
    { "title": "Another source title", "url": "https://learn.microsoft.com/..." },
    "provide 5-8 real Microsoft documentation URLs relevant to this specific recommendation"
  ]
}`;

    let responseText: string;

    if (azureEndpoint && azureDeployment) {
      // Azure OpenAI with Entra authentication
      const credential = new DefaultAzureCredential();
      const token = await credential.getToken('https://cognitiveservices.azure.com/.default');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch(
          `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token.token}`,
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
        const openaiEndpoint = getOpenAIChatCompletionsUrl();
        const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o';
        const response = await fetch(openaiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: openaiModel,
            messages: [
              {
                role: 'system',
                content:
                  'You are a Microsoft AI solutions advisor. Provide accurate, compliance-aware guidance. Return only valid JSON.',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            max_tokens: 4000,
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
      hasClarifications: !!enhanced.clarifications?.length,
      hasSources: !!enhanced.sources?.length,
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

// Get tenant metrics (optional feature)
app.get('/api/metrics', async (_req: Request, res: Response) => {
  try {
    if (!metricsService.isEnabled()) {
      // Return sample data if not configured
      return res.json({
        enabled: false,
        data: MetricsService.getSampleMetrics(),
        message:
          'Metrics integration not configured. Showing sample data. To enable, set AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET environment variables.',
      });
    }

    const metrics = await metricsService.getAllMetrics();
    res.json({
      enabled: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: MetricsService.getSampleMetrics(),
    });
  }
});

// Get metrics configuration status
app.get('/api/metrics/config', (_req: Request, res: Response) => {
  res.json({
    enabled: metricsService.isEnabled(),
    features: {
      costReports: process.env.ENABLE_COST_REPORTS === 'true',
      powerPlatform: process.env.ENABLE_POWER_PLATFORM === 'true',
      licenses: process.env.ENABLE_LICENSES === 'true',
      secureScore: process.env.ENABLE_SECURE_SCORE === 'true',
    },
    configured: {
      tenantId: !!process.env.AZURE_TENANT_ID,
      clientId: !!process.env.AZURE_CLIENT_ID,
      clientSecret: !!process.env.AZURE_CLIENT_SECRET,
      subscriptionId: !!process.env.AZURE_SUBSCRIPTION_ID,
    },
  });
});

// Generate AI-powered recommendation
app.post('/api/recommendation/ai', async (req: Request, res: Response) => {
  try {
    const { surveyResponses, scoringResult, includeMetrics, comments } = req.body;

    if (!surveyResponses || !scoringResult) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'surveyResponses and scoringResult are required',
      });
    }

    // Optionally include tenant metrics
    let tenantMetrics;
    if (includeMetrics && metricsService.isEnabled()) {
      try {
        tenantMetrics = await metricsService.getAllMetrics();
      } catch (error) {
        console.error('Failed to fetch metrics for AI recommendation:', error);
        // Continue without metrics
      }
    }

    const recommendation = await aiRecommendationService.generateRecommendation({
      surveyResponses,
      comments,
      scoringResult,
      tenantMetrics,
      timestamp: new Date().toISOString(),
    });

    res.json({
      recommendation,
      timestamp: new Date().toISOString(),
      aiEnabled: aiRecommendationService.isEnabled(),
      metricsIncluded: !!tenantMetrics,
    });
  } catch (error) {
    console.error('Error generating AI recommendation:', error);
    res.status(500).json({
      error: 'Failed to generate recommendation',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Export Executive Overview as PPTX
app.post('/api/export/executive-overview/pptx', async (req: Request, res: Response) => {
  try {
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

// Ensure unknown API routes return JSON instead of SPA HTML
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API route not found: ${req.originalUrl}`,
  });
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(webDistPath, 'index.html'));
});

console.log('[10/10] ✅ All routes registered');
console.log('\n=== Starting HTTP Server ===');
console.log('Attempting to listen on port:', PORT);

// Start server with error handling
const server = app.listen(PORT, () => {
  console.log('\n✅✅✅ SERVER STARTED SUCCESSFULLY ✅✅✅');
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
  console.log('\n=== Ready to accept connections ===\n');
});

server.on('error', (error: any) => {
  console.error('\n💥 SERVER ERROR:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please free the port or change PORT in .env`);
  } else if (error.code === 'EACCES') {
    console.error(`❌ Permission denied to bind to port ${PORT}`);
  }
  process.exit(1);
});

server.on('listening', () => {
  const addr = server.address();
  console.log('Server address:', addr);
});

let isShuttingDown = false;
const shutdown = (signal: NodeJS.Signals) => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`[SHUTDOWN] ${signal} received; closing HTTP server`);

  server.close((error) => {
    if (error) {
      console.error('[SHUTDOWN] Failed to close HTTP server:', error);
      process.exit(1);
    }
    console.log('[SHUTDOWN] HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('[SHUTDOWN] Timed out waiting for connections to close');
    process.exit(1);
  }, 10000).unref();
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

export default app;
