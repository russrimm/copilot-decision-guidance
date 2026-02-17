import type { UserAnswers, Recommendation, ScoringResult } from '../types';

const API_BASE_URL = '/api';
const DEFAULT_TIMEOUT = 10000; // 10 seconds for API calls

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

export async function getCopilotStudioReleasePlanner(): Promise<CopilotStudioReleasePlannerResponse> {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/release-planner/copilot-studio`,
    {},
    20000
  );
  if (!response.ok) {
    throw new Error('Failed to fetch Copilot Studio release planner data');
  }
  return response.json();
}
