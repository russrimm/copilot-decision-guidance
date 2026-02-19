import type { UserAnswers, Recommendation, ScoringResult } from '../types';

const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 10000; // 10 seconds for API calls

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

export async function getDecisionModel() {
  const response = await fetchWithTimeout(`${API_BASE_URL}/model`);
  if (!response.ok) {
    throw new Error('Failed to fetch decision model');
  }
  return response.json();
}

export async function calculateScore(answers: UserAnswers): Promise<{
  recommendation: Recommendation;
  scoringResult: ScoringResult;
}> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answers }),
  });

  if (!response.ok) {
    throw new Error('Failed to calculate score');
  }

  return response.json();
}

export async function getAIExplanation(
  recommendation: Recommendation,
  userContext?: any
): Promise<{ enhanced: boolean; explanation: string }> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/explain`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ recommendation, userContext }),
    },
    35000 // 35 seconds for AI explanation (longer timeout)
  );

  if (!response.ok) {
    throw new Error('Failed to get AI explanation');
  }

  return response.json();
}

export async function getSources() {
  const response = await fetch(`${API_BASE_URL}/sources`);
  if (!response.ok) {
    throw new Error('Failed to fetch sources');
  }
  return response.json();
}

export type ReleasePlannerMilestoneItem = {
  date: string; // YYYY-MM-DD
  featureName: string;
  releaseWave?: string;
  releasePlanId?: string;
};

export type CopilotStudioReleasePlannerResponse = {
  sourceUrl: string;
  fetchedAt: string;
  product: string;
  totalMatchingItems: number;
  upcomingPublicPreview: ReleasePlannerMilestoneItem[];
  upcomingGA: ReleasePlannerMilestoneItem[];
};

export type ReadinessDomain = {
  id: 'identity' | 'data' | 'security' | 'platform' | 'operatingModel';
  label: string;
  description: string;
};

export type ReadinessQuestion = {
  id: string;
  domain: ReadinessDomain['id'];
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

export type ReadinessModelResponse = {
  version: string;
  domains: ReadinessDomain[];
  questions: ReadinessQuestion[];
  answerOptions: Array<{ id: 'yes' | 'partial' | 'no'; label: string }>;
};

export type ReadinessAssessmentResponse = {
  status: 'ready' | 'needs-attention' | 'blocked';
  overallScore: number;
  domainScores: Array<{ domain: ReadinessDomain['id']; label: string; score: number }>;
  blockerCount: number;
  blockers: Array<{ id: string; domain: ReadinessDomain['id']; title: string; helperText: string }>;
  priorities: Array<{
    id: string;
    domain: ReadinessDomain['id'];
    title: string;
    status: 'partial' | 'no';
    priority: 'high' | 'medium';
  }>;
  actionItems: Array<{
    id: string;
    domain: ReadinessDomain['id'];
    title: string;
    priority: 'high' | 'medium';
    whyItMatters: string;
    currentState: 'partial' | 'no';
    highRiskExample: string;
    recommendedControls: string[];
    references: string[];
  }>;
  actionPlan: string[];
  assessedAt: string;
};

export type PortfolioCriterionId =
  | 'businessValue'
  | 'feasibility'
  | 'timeToValue'
  | 'risk'
  | 'dataSensitivity';

export type PortfolioWeights = Record<PortfolioCriterionId, number>;

export type PortfolioUseCase = {
  id: string;
  name: string;
  description: string;
  ratings: Record<PortfolioCriterionId, number>;
};

export type PortfolioModelResponse = {
  version: string;
  criteria: Array<{
    id: PortfolioCriterionId;
    label: string;
    description: string;
    higherIsBetter: boolean;
  }>;
  defaultWeights: PortfolioWeights;
  defaultUseCases: PortfolioUseCase[];
};

export type PortfolioPrioritizationResponse = {
  weights: PortfolioWeights;
  prioritized: Array<PortfolioUseCase & { score: number; tier: 'now' | 'next' | 'later' }>;
  roadmap: {
    days30: string[];
    days60: string[];
    days90: string[];
  };
  generatedAt: string;
};

export async function getCopilotStudioReleasePlanner(): Promise<CopilotStudioReleasePlannerResponse> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/release-planner/copilot-studio`,
    {},
    20000
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Copilot Studio release planner data (HTTP ${response.status})`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Release planner endpoint returned non-JSON response (HTTP ${response.status}, content-type: ${contentType || 'unknown'}). The backend deployment may be out of date; redeploy the API/server package.`
    );
  }

  return response.json();
}

export async function getReadinessModel(): Promise<ReadinessModelResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/readiness/model`, {}, 15000);
      if (!response.ok) {
        throw new Error(`Failed to fetch readiness model (HTTP ${response.status})`);
      }
      return response.json();
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error('Failed to fetch readiness model');
      if (attempt < 2) {
        await sleep(750);
      }
    }
  }

  throw lastError || new Error('Failed to fetch readiness model');
}

export async function assessReadiness(
  answers: Record<string, 'yes' | 'partial' | 'no'>
): Promise<ReadinessAssessmentResponse> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/readiness/assess`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    },
    20000
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Failed to assess readiness');
  }

  return response.json();
}

export async function getPortfolioModel(): Promise<PortfolioModelResponse> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/portfolio/model`, {}, 15000);
  if (!response.ok) {
    throw new Error('Failed to fetch portfolio model');
  }
  return response.json();
}

export async function prioritizePortfolio(payload: {
  useCases: PortfolioUseCase[];
  weights: Partial<PortfolioWeights>;
}): Promise<PortfolioPrioritizationResponse> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/portfolio/prioritize`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    20000
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Failed to prioritize portfolio');
  }

  return response.json();
}
