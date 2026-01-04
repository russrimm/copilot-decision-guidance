// Type definitions for the decision engine
// This file provides browser-compatible types without importing Node.js packages

export type UserAnswers = Record<string, string>;

export type RecommendationType =
  | 'M365_COPILOT'
  | 'COPILOT_STUDIO'
  | 'FOUNDRY'
  | 'AGENT_BUILDER'
  | 'HYBRID';

export interface Weights {
  m365Copilot: number;
  copilotStudio: number;
  foundry: number;
  agentBuilder: number;
  hybrid: number;
}

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

export interface Answer {
  id: string;
  label: string;
  weights: Weights;
}

export interface Question {
  id: string;
  title: string;
  helperText: string;
  answers: Answer[];
}

export interface QuestionGroup {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface Thresholds {
  winMargin: number;
  hybridThreshold: number;
}

export interface DecisionModel {
  version: string;
  metadata: {
    description: string;
    lastUpdated: string;
  };
  questionGroups: QuestionGroup[];
  thresholds: Thresholds;
}
