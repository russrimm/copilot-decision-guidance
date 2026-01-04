import type { DecisionModel, UserAnswers, ScoringResult } from './types.js';
/**
 * Calculate the recommendation based on user answers
 * This is a deterministic scoring function - no AI/LLM involvement
 */
export declare function calculateRecommendation(model: DecisionModel, userAnswers: UserAnswers): ScoringResult;
/**
 * Get all questions flattened from the model
 */
export declare function getAllQuestions(model: DecisionModel): {
    id: string;
    title: string;
    helperText: string;
    answers: {
        id: string;
        label: string;
        weights: {
            m365Copilot: number;
            copilotStudio: number;
            foundry: number;
            agentBuilder: number;
            hybrid: number;
        };
    }[];
    groupId: string;
    groupTitle: string;
}[];
/**
 * Validate that all questions have been answered
 */
export declare function validateAnswers(model: DecisionModel, userAnswers: UserAnswers): {
    valid: boolean;
    missingQuestions: string[];
};
//# sourceMappingURL=scoring.d.ts.map