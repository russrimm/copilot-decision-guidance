import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UserAnswers,
  UserAnswerValue,
  UserComments,
  Recommendation,
  ScoringResult,
} from '../types';

interface WizardState {
  answers: UserAnswers;
  comments: UserComments;
  currentStep: number;
  recommendation: Recommendation | null;
  scoringResult: ScoringResult | null;
  csamEmail: string | null;

  // Actions
  setAnswer: (questionId: string, answerId: UserAnswerValue) => void;
  setAnswers: (answers: UserAnswers) => void;
  setComment: (questionId: string, comment: string) => void;
  setComments: (comments: UserComments) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setRecommendation: (recommendation: Recommendation, scoringResult: ScoringResult) => void;
  setCsamEmail: (email: string | null) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      answers: {},
      comments: {},
      currentStep: 0,
      recommendation: null,
      scoringResult: null,
      csamEmail: null,

      setAnswer: (questionId, answerId) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [questionId]: answerId,
          },
        })),

      setAnswers: (answers) => set({ answers }),

      setComment: (questionId, comment) =>
        set((state) => {
          const next = { ...state.comments };
          const trimmed = (comment ?? '').trim();
          if (!trimmed) {
            delete next[questionId];
          } else {
            next[questionId] = trimmed;
          }
          return { comments: next };
        }),

      setComments: (comments) => set({ comments }),

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

      previousStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

      setRecommendation: (recommendation, scoringResult) => set({ recommendation, scoringResult }),

      setCsamEmail: (email) => set({ csamEmail: email }),

      reset: () =>
        set({
          answers: {},
          comments: {},
          currentStep: 0,
          recommendation: null,
          scoringResult: null,
          csamEmail: null,
        }),
    }),
    {
      name: 'copilot-wizard-storage',
      version: 5, // v5 adds per-question comments
      migrate: (persistedState: any, version: number) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState;
        }

        // v3 -> v4: convert ttv_skills from string to string[] if present
        if (version < 4 && persistedState.answers?.ttv_skills) {
          const value = persistedState.answers.ttv_skills;
          if (typeof value === 'string') {
            return {
              ...persistedState,
              answers: {
                ...persistedState.answers,
                ttv_skills: [value],
              },
            };
          }
        }

        // v4 -> v5: add comments map
        if (version < 5 && !persistedState.comments) {
          return {
            ...persistedState,
            comments: {},
          };
        }

        return persistedState;
      },
    }
  )
);
