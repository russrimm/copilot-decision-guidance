import type { UserAnswers, Recommendation, ScoringResult } from '../types';

const API_BASE_URL = '/api';

export async function getDecisionModel() {
  const response = await fetch(`${API_BASE_URL}/model`);
  if (!response.ok) {
    throw new Error('Failed to fetch decision model');
  }
  return response.json();
}

export async function calculateScore(answers: UserAnswers): Promise<{
  recommendation: Recommendation;
  scoringResult: ScoringResult;
}> {
  const response = await fetch(`${API_BASE_URL}/score`, {
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
  const response = await fetch(`${API_BASE_URL}/explain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recommendation, userContext }),
  });

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
