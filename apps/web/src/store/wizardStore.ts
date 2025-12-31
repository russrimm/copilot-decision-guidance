import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserAnswers, Recommendation, ScoringResult } from '@copilot-guidance/decision-engine';

interface WizardState {
  answers: UserAnswers;
  currentStep: number;
  recommendation: Recommendation | null;
  scoringResult: ScoringResult | null;

  // Actions
  setAnswer: (questionId: string, answerId: string) => void;
  setAnswers: (answers: UserAnswers) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setRecommendation: (recommendation: Recommendation, scoringResult: ScoringResult) => void;
  reset: () => void;
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      answers: {},
      currentStep: 0,
      recommendation: null,
      scoringResult: null,

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

      reset: () =>
        set({
          answers: {},
          currentStep: 0,
          recommendation: null,
          scoringResult: null,
        }),
    }),
    {
      name: 'copilot-wizard-storage',
    }
  )
);
