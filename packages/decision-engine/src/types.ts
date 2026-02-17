import { z } from 'zod';

// Zod schemas for type-safe validation
export const WeightsSchema = z.object({
  m365Copilot: z.number(),
  copilotStudio: z.number(),
  foundry: z.number(),
  agentBuilder: z.number(),
  hybrid: z.number(),
});

export const AnswerSchema = z.object({
  id: z.string(),
  label: z.string(),
  weights: WeightsSchema,
});

export const QuestionSchema = z.object({
  id: z.string(),
  title: z.string(),
  helperText: z.string(),
  answers: z.array(AnswerSchema),
});

export const QuestionGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  questions: z.array(QuestionSchema),
});

export const ThresholdsSchema = z.object({
  winMargin: z.number(),
  hybridThreshold: z.number(),
  foundryThreshold: z.number().optional(),
  agentBuilderThreshold: z.number().optional(),
});

export const DecisionModelSchema = z.object({
  version: z.string(),
  metadata: z.object({
    description: z.string(),
    lastUpdated: z.string(),
  }),
  questionGroups: z.array(QuestionGroupSchema),
  thresholds: ThresholdsSchema,
});

// Infer TypeScript types from schemas
export type Weights = z.infer<typeof WeightsSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionGroup = z.infer<typeof QuestionGroupSchema>;
export type Thresholds = z.infer<typeof ThresholdsSchema>;
export type DecisionModel = z.infer<typeof DecisionModelSchema>;

// User answers
export const UserAnswersSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()).min(1)])
);
export type UserAnswers = z.infer<typeof UserAnswersSchema>;

// Recommendation types
export type RecommendationType =
  | 'M365_COPILOT'
  | 'COPILOT_STUDIO'
  | 'FOUNDRY'
  | 'AGENT_BUILDER'
  | 'HYBRID';

export interface ScoringResult {
  recommendation: RecommendationType;
  scores: Weights;
  confidenceLevel: 'high' | 'medium' | 'low';
  breakdown: Array<{
    questionId: string;
    questionTitle: string;
    answerId: string;
    answerLabel: string;
    weights: Weights;
  }>;
}

export interface Recommendation {
  type: RecommendationType;
  title: string;
  summary: string;
  reasons: string[];
  nextSteps: string[];
  risks: string[];
  complianceConsiderations: string[];
  keyDecisionPoints?: Array<{
    question: string;
    context: string;
    factors: Array<{
      factor: string;
      studio: string;
      foundry: string;
    }>;
    recommendation: string;
  }>;
  licensingBreakdown?: {
    description: string;
    platforms: Array<{
      platform: string;
      model: string;
      cost: string;
      notes: string;
      example: string;
    } | null>;
    totalCostExample: string;
  };
  sources: Array<{
    title: string;
    url: string;
  }>;
  scoringResult: ScoringResult;
}
