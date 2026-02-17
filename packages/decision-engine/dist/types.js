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
// User answers
export const UserAnswersSchema = z.record(z.string(), z.union([z.string(), z.array(z.string()).min(1)]));
