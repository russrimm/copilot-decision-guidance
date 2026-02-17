// Type definitions for the decision engine
// This file provides browser-compatible types without importing Node.js packages

export type UserAnswerValue = string | string[];
export type UserAnswers = Record<string, UserAnswerValue>;

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

// Enterprise Dashboard Types
export interface TenantMetrics {
  configured: boolean;
  timestamp: string;
  costs?: {
    totalCost: number;
    currency: string;
    billingPeriod: string;
    aiCopilotCosts: number;
    breakdown: Array<{
      category: string;
      cost: number;
    }>;
  };
  licenses?: {
    totalUsers: number;
    m365CopilotLicenses: number;
    copilotStudioLicenses: number;
    breakdown: Array<{
      skuName: string;
      assignedCount: number;
    }>;
  };
  powerPlatform?: {
    environmentCount: number;
    totalCapacityUsed: number;
    environments: Array<{
      displayName: string;
      type: string;
      region: string;
    }>;
  };
  secureScore?: {
    currentScore: number;
    maxScore: number;
    percentage: number;
    topRecommendations: Array<{
      title: string;
      impact: string;
      implementationCost: string;
    }>;
  };
  readinessScore?: {
    overall: number;
    technical: number;
    security: number;
    financial: number;
  };
}

// AI-Powered Recommendation Types
export interface AIRecommendation {
  summary: string;
  detailedAnalysis?: string;
  strategicGuidance?: string;
  implementationRoadmap?: string[];
  riskMitigation?: string;
  costConsiderations?: string;
  timelineEstimate?: string;
  nextSteps?: string;
  personalizationFactors?: string[];
}
