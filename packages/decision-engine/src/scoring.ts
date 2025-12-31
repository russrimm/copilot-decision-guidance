import type {
  DecisionModel,
  UserAnswers,
  ScoringResult,
  Weights,
  RecommendationType,
} from './types.js';

/**
 * Calculate the recommendation based on user answers
 * This is a deterministic scoring function - no AI/LLM involvement
 */
export function calculateRecommendation(
  model: DecisionModel,
  userAnswers: UserAnswers
): ScoringResult {
  // Initialize scores
  const scores: Weights = {
    m365Copilot: 0,
    copilotStudio: 0,
    hybrid: 0,
  };

  const breakdown: ScoringResult['breakdown'] = [];

  // Iterate through all question groups
  for (const group of model.questionGroups) {
    for (const question of group.questions) {
      const selectedAnswerId = userAnswers[question.id];

      if (!selectedAnswerId) {
        // Skip unanswered questions
        continue;
      }

      const selectedAnswer = question.answers.find((a) => a.id === selectedAnswerId);

      if (!selectedAnswer) {
        // Invalid answer ID
        continue;
      }

      // Add weights to scores
      scores.m365Copilot += selectedAnswer.weights.m365Copilot;
      scores.copilotStudio += selectedAnswer.weights.copilotStudio;
      scores.hybrid += selectedAnswer.weights.hybrid;

      // Track breakdown for transparency
      breakdown.push({
        questionId: question.id,
        questionTitle: question.title,
        answerId: selectedAnswer.id,
        answerLabel: selectedAnswer.label,
        weights: selectedAnswer.weights,
      });
    }
  }

  // Determine recommendation based on scores and thresholds
  const recommendation = determineRecommendation(scores, model.thresholds);

  // Calculate confidence level
  const confidenceLevel = calculateConfidence(scores, recommendation);

  return {
    recommendation,
    scores,
    confidenceLevel,
    breakdown,
  };
}

/**
 * Determine the recommendation type based on scores and thresholds
 */
function determineRecommendation(
  scores: Weights,
  thresholds: { winMargin: number; hybridThreshold: number }
): RecommendationType {
  const { winMargin, hybridThreshold } = thresholds;

  // Sort scores to find highest
  const sortedScores = [
    { type: 'M365_COPILOT' as RecommendationType, score: scores.m365Copilot },
    { type: 'COPILOT_STUDIO' as RecommendationType, score: scores.copilotStudio },
    { type: 'HYBRID' as RecommendationType, score: scores.hybrid },
  ].sort((a, b) => b.score - a.score);

  const [highest, secondHighest] = sortedScores;

  // If hybrid score is within threshold of the top, recommend hybrid
  if (highest.type !== 'HYBRID' && scores.hybrid >= highest.score - hybridThreshold) {
    return 'HYBRID';
  }

  // If the difference between top two is small, recommend hybrid
  if (highest.score - secondHighest.score < winMargin) {
    return 'HYBRID';
  }

  // Otherwise, recommend the highest scoring option
  return highest.type;
}

/**
 * Calculate confidence level based on score distribution
 */
function calculateConfidence(
  scores: Weights,
  recommendation: RecommendationType
): 'high' | 'medium' | 'low' {
  const totalScore = scores.m365Copilot + scores.copilotStudio + scores.hybrid;

  if (totalScore === 0) {
    return 'low';
  }

  const recommendedScore =
    scores[
      recommendation === 'M365_COPILOT'
        ? 'm365Copilot'
        : recommendation === 'COPILOT_STUDIO'
          ? 'copilotStudio'
          : 'hybrid'
    ];

  const percentage = (recommendedScore / totalScore) * 100;

  if (percentage >= 50) {
    return 'high';
  } else if (percentage >= 35) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Get all questions flattened from the model
 */
export function getAllQuestions(model: DecisionModel) {
  return model.questionGroups.flatMap((group) =>
    group.questions.map((question) => ({
      groupId: group.id,
      groupTitle: group.title,
      ...question,
    }))
  );
}

/**
 * Validate that all questions have been answered
 */
export function validateAnswers(
  model: DecisionModel,
  userAnswers: UserAnswers
): { valid: boolean; missingQuestions: string[] } {
  const allQuestions = getAllQuestions(model);
  const missingQuestions: string[] = [];

  for (const question of allQuestions) {
    if (!userAnswers[question.id]) {
      missingQuestions.push(question.id);
    }
  }

  return {
    valid: missingQuestions.length === 0,
    missingQuestions,
  };
}
