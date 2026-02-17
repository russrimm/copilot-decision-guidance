import { z } from 'zod';
export declare const WeightsSchema: z.ZodObject<{
    m365Copilot: z.ZodNumber;
    copilotStudio: z.ZodNumber;
    foundry: z.ZodNumber;
    agentBuilder: z.ZodNumber;
    hybrid: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    m365Copilot: number;
    copilotStudio: number;
    foundry: number;
    agentBuilder: number;
    hybrid: number;
}, {
    m365Copilot: number;
    copilotStudio: number;
    foundry: number;
    agentBuilder: number;
    hybrid: number;
}>;
export declare const AnswerSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    weights: z.ZodObject<{
        m365Copilot: z.ZodNumber;
        copilotStudio: z.ZodNumber;
        foundry: z.ZodNumber;
        agentBuilder: z.ZodNumber;
        hybrid: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        m365Copilot: number;
        copilotStudio: number;
        foundry: number;
        agentBuilder: number;
        hybrid: number;
    }, {
        m365Copilot: number;
        copilotStudio: number;
        foundry: number;
        agentBuilder: number;
        hybrid: number;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    label: string;
    weights: {
        m365Copilot: number;
        copilotStudio: number;
        foundry: number;
        agentBuilder: number;
        hybrid: number;
    };
}, {
    id: string;
    label: string;
    weights: {
        m365Copilot: number;
        copilotStudio: number;
        foundry: number;
        agentBuilder: number;
        hybrid: number;
    };
}>;
export declare const QuestionSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    helperText: z.ZodString;
    answers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        weights: z.ZodObject<{
            m365Copilot: z.ZodNumber;
            copilotStudio: z.ZodNumber;
            foundry: z.ZodNumber;
            agentBuilder: z.ZodNumber;
            hybrid: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            m365Copilot: number;
            copilotStudio: number;
            foundry: number;
            agentBuilder: number;
            hybrid: number;
        }, {
            m365Copilot: number;
            copilotStudio: number;
            foundry: number;
            agentBuilder: number;
            hybrid: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        weights: {
            m365Copilot: number;
            copilotStudio: number;
            foundry: number;
            agentBuilder: number;
            hybrid: number;
        };
    }, {
        id: string;
        label: string;
        weights: {
            m365Copilot: number;
            copilotStudio: number;
            foundry: number;
            agentBuilder: number;
            hybrid: number;
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
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
}, {
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
}>;
export declare const QuestionGroupSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    questions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        helperText: z.ZodString;
        answers: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            label: z.ZodString;
            weights: z.ZodObject<{
                m365Copilot: z.ZodNumber;
                copilotStudio: z.ZodNumber;
                foundry: z.ZodNumber;
                agentBuilder: z.ZodNumber;
                hybrid: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                m365Copilot: number;
                copilotStudio: number;
                foundry: number;
                agentBuilder: number;
                hybrid: number;
            }, {
                m365Copilot: number;
                copilotStudio: number;
                foundry: number;
                agentBuilder: number;
                hybrid: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            label: string;
            weights: {
                m365Copilot: number;
                copilotStudio: number;
                foundry: number;
                agentBuilder: number;
                hybrid: number;
            };
        }, {
            id: string;
            label: string;
            weights: {
                m365Copilot: number;
                copilotStudio: number;
                foundry: number;
                agentBuilder: number;
                hybrid: number;
            };
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
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
    }, {
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
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    description: string;
    questions: {
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
    }[];
}, {
    id: string;
    title: string;
    description: string;
    questions: {
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
    }[];
}>;
export declare const ThresholdsSchema: z.ZodObject<{
    winMargin: z.ZodNumber;
    hybridThreshold: z.ZodNumber;
    foundryThreshold: z.ZodOptional<z.ZodNumber>;
    agentBuilderThreshold: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    winMargin: number;
    hybridThreshold: number;
    foundryThreshold?: number | undefined;
    agentBuilderThreshold?: number | undefined;
}, {
    winMargin: number;
    hybridThreshold: number;
    foundryThreshold?: number | undefined;
    agentBuilderThreshold?: number | undefined;
}>;
export declare const DecisionModelSchema: z.ZodObject<{
    version: z.ZodString;
    metadata: z.ZodObject<{
        description: z.ZodString;
        lastUpdated: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        lastUpdated: string;
    }, {
        description: string;
        lastUpdated: string;
    }>;
    questionGroups: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        questions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            helperText: z.ZodString;
            answers: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                label: z.ZodString;
                weights: z.ZodObject<{
                    m365Copilot: z.ZodNumber;
                    copilotStudio: z.ZodNumber;
                    foundry: z.ZodNumber;
                    agentBuilder: z.ZodNumber;
                    hybrid: z.ZodNumber;
                }, "strip", z.ZodTypeAny, {
                    m365Copilot: number;
                    copilotStudio: number;
                    foundry: number;
                    agentBuilder: number;
                    hybrid: number;
                }, {
                    m365Copilot: number;
                    copilotStudio: number;
                    foundry: number;
                    agentBuilder: number;
                    hybrid: number;
                }>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                label: string;
                weights: {
                    m365Copilot: number;
                    copilotStudio: number;
                    foundry: number;
                    agentBuilder: number;
                    hybrid: number;
                };
            }, {
                id: string;
                label: string;
                weights: {
                    m365Copilot: number;
                    copilotStudio: number;
                    foundry: number;
                    agentBuilder: number;
                    hybrid: number;
                };
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
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
        }, {
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
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
        description: string;
        questions: {
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
        }[];
    }, {
        id: string;
        title: string;
        description: string;
        questions: {
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
        }[];
    }>, "many">;
    thresholds: z.ZodObject<{
        winMargin: z.ZodNumber;
        hybridThreshold: z.ZodNumber;
        foundryThreshold: z.ZodOptional<z.ZodNumber>;
        agentBuilderThreshold: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        winMargin: number;
        hybridThreshold: number;
        foundryThreshold?: number | undefined;
        agentBuilderThreshold?: number | undefined;
    }, {
        winMargin: number;
        hybridThreshold: number;
        foundryThreshold?: number | undefined;
        agentBuilderThreshold?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    version: string;
    metadata: {
        description: string;
        lastUpdated: string;
    };
    questionGroups: {
        id: string;
        title: string;
        description: string;
        questions: {
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
        }[];
    }[];
    thresholds: {
        winMargin: number;
        hybridThreshold: number;
        foundryThreshold?: number | undefined;
        agentBuilderThreshold?: number | undefined;
    };
}, {
    version: string;
    metadata: {
        description: string;
        lastUpdated: string;
    };
    questionGroups: {
        id: string;
        title: string;
        description: string;
        questions: {
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
        }[];
    }[];
    thresholds: {
        winMargin: number;
        hybridThreshold: number;
        foundryThreshold?: number | undefined;
        agentBuilderThreshold?: number | undefined;
    };
}>;
export type Weights = z.infer<typeof WeightsSchema>;
export type Answer = z.infer<typeof AnswerSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionGroup = z.infer<typeof QuestionGroupSchema>;
export type Thresholds = z.infer<typeof ThresholdsSchema>;
export type DecisionModel = z.infer<typeof DecisionModelSchema>;
export declare const UserAnswersSchema: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
export type UserAnswers = z.infer<typeof UserAnswersSchema>;
export type RecommendationType = 'M365_COPILOT' | 'COPILOT_STUDIO' | 'FOUNDRY' | 'AGENT_BUILDER' | 'HYBRID';
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
//# sourceMappingURL=types.d.ts.map