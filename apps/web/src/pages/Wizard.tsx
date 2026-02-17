import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/wizardStore';
import { getDecisionModel, calculateScore } from '../lib/api';
import { useForm } from 'react-hook-form';
import type { DecisionModel } from '../types';

export default function Wizard() {
  const navigate = useNavigate();
  const {
    answers,
    currentStep,
    setAnswer,
    nextStep,
    previousStep,
    setRecommendation,
    setCsamEmail,
  } = useWizardStore();
  const [model, setModel] = useState<DecisionModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [csamEmailInput, setCsamEmailInput] = useState<string>('');
  const { register, handleSubmit, watch } = useForm();

  const isMultiSelectQuestion = (questionId: string) => questionId === 'ttv_skills';

  useEffect(() => {
    getDecisionModel()
      .then(setModel)
      .catch((err) => {
        console.error('Failed to load decision model:', err);
        setError(err.message || 'Failed to load questionnaire. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading questionnaire...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400 mb-4">
          <p className="font-semibold">Error loading questionnaire</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-200 mb-4">Unable to load questionnaire.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Reload
        </button>
      </div>
    );
  }

  const groups = model.questionGroups;
  const currentGroup = groups[currentStep];
  const isLastStep = currentStep === groups.length - 1;

  const onSubmit = async (data: any) => {
    // Save answers for current group
    Object.keys(data).forEach((questionId) => {
      if (data[questionId]) {
        setAnswer(questionId, data[questionId]);
      }
    });

    // If on support questions step and user has CSAM, save email
    if (
      currentGroup.id === 'support' &&
      (data.support_unified_agreement === 'support_yes_csam' ||
        answers.support_unified_agreement === 'support_yes_csam')
    ) {
      setCsamEmail(csamEmailInput || null);
    }

    if (isLastStep) {
      // Calculate and navigate to results
      setCalculating(true);
      try {
        const finalAnswers = { ...answers, ...data };
        console.log('[Wizard] Submitting answers:', finalAnswers);
        const result = await calculateScore(finalAnswers);
        console.log('[Wizard] Received result:', result);

        if (!result.recommendation || !result.scoringResult) {
          console.error(
            '[Wizard] Invalid result - missing recommendation or scoringResult:',
            result
          );
          throw new Error('Invalid response from server - missing recommendation data');
        }

        setRecommendation(result.recommendation, result.scoringResult);
        navigate('/results');
      } catch (error) {
        console.error('Error calculating recommendation:', error);
        alert('Failed to calculate recommendation. Please try again.');
      } finally {
        setCalculating(false);
      }
    } else {
      nextStep();
      // Scroll to top of page when moving to next step
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const progress = ((currentStep + 1) / groups.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-100 mb-2">
          <span>
            Step {currentStep + 1} of {groups.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            {currentGroup.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-200">{currentGroup.description}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {currentGroup.questions.map((question) => (
            <div key={question.id} className="space-y-3">
              <label className="block">
                <span className="text-lg font-medium text-gray-900 dark:text-gray-50">
                  {question.title}
                </span>
                {question.helperText && (
                  <span className="block text-sm text-gray-500 dark:text-gray-300 mt-1">
                    {question.helperText}
                  </span>
                )}
              </label>

              <div className="space-y-2">
                {question.answers.map((answer) => {
                  const multiSelect = isMultiSelectQuestion(question.id);
                  const storedValue = answers[question.id];
                  const isChecked = multiSelect
                    ? Array.isArray(storedValue)
                      ? storedValue.includes(answer.id)
                      : false
                    : storedValue === answer.id;

                  return (
                    <label
                      key={answer.id}
                      className="flex items-start p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type={multiSelect ? 'checkbox' : 'radio'}
                        {...register(question.id, {
                          required: !multiSelect,
                          validate: multiSelect
                            ? (value) => (Array.isArray(value) ? value.length > 0 : !!value)
                            : undefined,
                        })}
                        value={answer.id}
                        defaultChecked={isChecked}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-gray-700 dark:text-gray-100">{answer.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* CSAM Email Input - Show only on support group when user has a CSAM */}
          {currentGroup.id === 'support' &&
            (watch('support_unified_agreement') === 'support_yes_csam' ||
              answers.support_unified_agreement === 'support_yes_csam') && (
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <label className="block">
                  <span className="text-lg font-medium text-gray-900 dark:text-gray-50">
                    CSAM Email Address (Optional)
                  </span>
                  <span className="block text-sm text-gray-500 dark:text-gray-300 mt-1">
                    If you'd like to share this report with your CSAM, provide their email address
                  </span>
                </label>
                <input
                  type="email"
                  value={csamEmailInput}
                  onChange={(e) => setCsamEmailInput(e.target.value)}
                  placeholder="csam@example.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={previousStep}
              disabled={currentStep === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>

            <button
              type="submit"
              disabled={calculating}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculating ? 'Calculating...' : isLastStep ? 'Get Recommendation' : 'Next →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
