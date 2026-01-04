/**
 * Calculate the recommendation based on user answers
 * This is a deterministic scoring function - no AI/LLM involvement
 */
export function calculateRecommendation(model, userAnswers) {
    // Initialize scores
    const scores = {
        m365Copilot: 0,
        copilotStudio: 0,
        foundry: 0,
        agentBuilder: 0,
        hybrid: 0,
    };
    const breakdown = [];
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
            scores.foundry += selectedAnswer.weights.foundry || 0;
            scores.agentBuilder += selectedAnswer.weights.agentBuilder || 0;
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
function determineRecommendation(scores, thresholds) {
    const { winMargin, hybridThreshold } = thresholds;
    // Sort scores to find highest
    const sortedScores = [
        { type: 'M365_COPILOT', score: scores.m365Copilot },
        { type: 'COPILOT_STUDIO', score: scores.copilotStudio },
        { type: 'FOUNDRY', score: scores.foundry },
        { type: 'AGENT_BUILDER', score: scores.agentBuilder },
        { type: 'HYBRID', score: scores.hybrid },
    ].sort((a, b) => b.score - a.score);
    const [highest, secondHighest, thirdHighest] = sortedScores;
    // If hybrid score is within threshold of the top, recommend hybrid
    if (highest.type !== 'HYBRID' && scores.hybrid >= highest.score - hybridThreshold) {
        return 'HYBRID';
    }
    // If multiple platforms score close to each other (3+ platforms competitive), recommend hybrid
    // This catches scenarios where M365 + Studio + Foundry are all viable options
    const competitiveScores = sortedScores.filter((s) => s.type !== 'HYBRID' && s.score >= highest.score - winMargin * 2);
    if (competitiveScores.length >= 3) {
        return 'HYBRID';
    }
    // If the difference between top two is small, recommend hybrid
    if (highest.score - secondHighest.score < winMargin) {
        return 'HYBRID';
    }
    // If Foundry and Copilot Studio are both strong (indicates overlapping capabilities), recommend hybrid
    if ((highest.type === 'FOUNDRY' || secondHighest.type === 'FOUNDRY') &&
        (highest.type === 'COPILOT_STUDIO' || secondHighest.type === 'COPILOT_STUDIO')) {
        const foundryScore = scores.foundry;
        const studioScore = scores.copilotStudio;
        if (Math.abs(foundryScore - studioScore) < winMargin * 1.5) {
            return 'HYBRID';
        }
    }
    // Otherwise, recommend the highest scoring option
    return highest.type;
}
/**
 * Calculate confidence level based on score distribution
 */
function calculateConfidence(scores, recommendation) {
    const totalScore = scores.m365Copilot + scores.copilotStudio + scores.hybrid;
    if (totalScore === 0) {
        return 'low';
    }
    const recommendedScore = scores[recommendation === 'M365_COPILOT'
        ? 'm365Copilot'
        : recommendation === 'COPILOT_STUDIO'
            ? 'copilotStudio'
            : 'hybrid'];
    const percentage = (recommendedScore / totalScore) * 100;
    if (percentage >= 50) {
        return 'high';
    }
    else if (percentage >= 35) {
        return 'medium';
    }
    else {
        return 'low';
    }
}
/**
 * Get all questions flattened from the model
 */
export function getAllQuestions(model) {
    return model.questionGroups.flatMap((group) => group.questions.map((question) => ({
        groupId: group.id,
        groupTitle: group.title,
        ...question,
    })));
}
/**
 * Validate that all questions have been answered
 */
export function validateAnswers(model, userAnswers) {
    const allQuestions = getAllQuestions(model);
    const missingQuestions = [];
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
