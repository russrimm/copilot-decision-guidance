// Shared types for the frontend (duplicated from decision-engine for browser compatibility)

export interface UserAnswers {
  [questionId: string]: string | boolean | number | string[];
}

export interface Recommendation {
  type: 'copilot' | 'copilot-studio' | 'hybrid';
  title: string;
  summary: string;
  reasons: string[];
  nextSteps: string[];
  risks: string[];
  complianceConsiderations: string[];
  sources: string[];
}

export interface CategoryScores {
  [category: string]: number;
}

export interface ScoringResult {
  scores: CategoryScores;
  confidenceLevel: 'high' | 'medium' | 'low';
  breakdown: string[];
}

export interface Question {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'boolean' | 'text';
  category: string;
  options?: string[];
  followUp?: { [key: string]: Question };
}

export interface QuestionCategory {
  name: string;
  questions: Question[];
}

export interface DecisionModel {
  version: string;
  categories: QuestionCategory[];
}
