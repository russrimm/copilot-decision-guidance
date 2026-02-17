import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserAnswers, UserAnswerValue, Recommendation, ScoringResult } from '../types';

interface WizardState {
  answers: UserAnswers;
  currentStep: number;
  recommendation: Recommendation | null;
  scoringResult: ScoringResult | null;
  csamEmail: string | null;

  // Actions
  setAnswer: (questionId: string, answerId: UserAnswerValue) => void;
  setAnswers: (answers: UserAnswers) => void;
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

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

      previousStep: () => set((state) => ({ currentStep: Math.max(0, state.currentStep - 1) })),

      setRecommendation: (recommendation, scoringResult) => set({ recommendation, scoringResult }),

      setCsamEmail: (email) => set({ csamEmail: email }),

      reset: () =>
        set({
          answers: {},
          currentStep: 0,
          recommendation: null,
          scoringResult: null,
          csamEmail: null,
        }),
    }),
    {
      name: 'copilot-wizard-storage',
      version: 4, // Incremented to support multi-select answers (e.g., ttv_skills)
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

        return persistedState;
      },
    }
  )
);
