import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/wizardStore';
import { getDecisionModel, calculateScore } from '../lib/api';
import { useForm } from 'react-hook-form';
import type { DecisionModel, UserAnswers, UserAnswerValue } from '../types';

/**
 * Returns the set of question IDs that should be hidden based on current answers.
 *
 * Rule 1 — Read-only path: when outcome_tasks = tasks_assist (read-only retrieval),
 *   skip proactive-action and destructive-action questions (they only apply when an
 *   agent can initiate or execute actions).
 *
 * Rule 2 — No Foundry signals: when none of the Foundry-relevant answer choices have
 *   been selected, skip the two Foundry-specific questions (AI customization level and
 *   scale/performance requirements) to keep the wizard focused.
 */
function computeSkippedQuestions(answers: UserAnswers): Set<string> {
  const skipped = new Set<string>();

  // Rule 1: read-only path → skip agentic-action questions
  const isReadOnly = answers['outcome_tasks'] === 'tasks_assist';
  if (isReadOnly) {
    skipped.add('data_proactive');
    skipped.add('data_actions');
  }

  // Rule 2: detect Foundry signals
  const foundrySignals: boolean[] = [
    // Taking actions (not read-only) is itself a signal
    answers['outcome_tasks'] === 'tasks_action' || answers['outcome_tasks'] === 'tasks_both',
    // Azure AI Search / BYO models
    answers['data_sources'] === 'data_azure_search',
    // Proactive/autonomous (only meaningful if not already skipped by rule 1)
    !isReadOnly && answers['data_proactive'] === 'proactive_yes',
    // High-risk autonomous actions (only meaningful if not already skipped)
    !isReadOnly &&
      (answers['data_actions'] === 'actions_approve' ||
        answers['data_actions'] === 'actions_autonomous'),
    // Complex orchestration patterns
    answers['integration_complexity'] === 'orchestration_deep_integration' ||
      answers['integration_complexity'] === 'orchestration_multiagent' ||
      answers['integration_complexity'] === 'orchestration_custom',
    // Custom API connectors
    answers['integration_connectors'] === 'connectors_custom_api',
    // Advanced card-based UI rendering
    answers['integration_response_experience'] === 'response_advanced_cards',
    // Enterprise/Azure-grade governance
    answers['governance_needs'] === 'governance_enterprise',
  ];

  const hasFoundrySignal = foundrySignals.some(Boolean);
  if (!hasFoundrySignal) {
    skipped.add('ttv_ai_requirements');
    skipped.add('cost_performance');
  }

  return skipped;
}

const PLATFORM_LABELS: Record<string, string> = {
  m365Copilot: 'Microsoft 365 Copilot',
  copilotStudio: 'Copilot Studio',
  foundry: 'Microsoft AI Foundry',
  agentBuilder: 'Microsoft 365 Agent Builder',
  hybrid: 'a hybrid approach (M365 Copilot + Copilot Studio)',
};

/**
 * Performs a lightweight client-side scoring pass over all answered questions and
 * returns a { platform, label } hint when a clear winner emerges (≥ 3 answers and
 * winning margin ≥ 5 points). Returns null when too few answers exist or when the
 * result is still too close to call.
 */
function computePreliminarySignal(
  answers: UserAnswers,
  model: DecisionModel
): { platform: string; label: string } | null {
  const scores: Record<string, number> = {
    m365Copilot: 0,
    copilotStudio: 0,
    foundry: 0,
    agentBuilder: 0,
    hybrid: 0,
  };
  let answeredCount = 0;

  for (const group of model.questionGroups) {
    for (const question of group.questions) {
      const selectedValue = answers[question.id];
      if (!selectedValue) continue;

      const selectedIds = Array.isArray(selectedValue) ? selectedValue : [selectedValue];
      for (const answerId of selectedIds) {
        const answerDef = question.answers.find((a) => a.id === answerId);
        if (!answerDef) continue;
        answeredCount++;
        for (const [platform, weight] of Object.entries(answerDef.weights)) {
          if (platform in scores) {
            scores[platform] += weight as number;
          }
        }
      }
    }
  }

  if (answeredCount < 3) return null;

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [topPlatform, topScore] = sorted[0];
  const [, secondScore] = sorted[1];

  if (topScore - secondScore < 5) return null;

  return { platform: topPlatform, label: PLATFORM_LABELS[topPlatform] ?? topPlatform };
}

export default function Wizard() {
  const navigate = useNavigate();
  const {
    answers,
    comments,
    currentStep,
    setAnswer,
    setComment,
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
  const skippedQuestions = computeSkippedQuestions(answers);
  const prelimSignal = currentStep >= 2 ? computePreliminarySignal(answers, model) : null;

  const onSubmit = async (data: any) => {
    // Save answers + comments for current group
    const nextAnswers: Partial<UserAnswers> = {};
    Object.keys(data).forEach((key) => {
      if (key.startsWith('comment__')) {
        const questionId = key.replace(/^comment__/, '');
        setComment(questionId, String(data[key] ?? ''));
        return;
      }

      if (data[key]) {
        nextAnswers[key] = data[key] as UserAnswerValue;
        setAnswer(key, data[key] as UserAnswerValue);
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
        const finalAnswers: UserAnswers = { ...answers, ...nextAnswers } as UserAnswers;
        // Exclude skipped questions so they don't affect scoring (contribute 0, same as unanswered)
        const scoringAnswers = Object.fromEntries(
          Object.entries(finalAnswers).filter(([k]) => !skippedQuestions.has(k))
        ) as UserAnswers;
        const result = await calculateScore(scoringAnswers);

        if (!result.recommendation || !result.scoringResult) {
          throw new Error('Invalid response from server - missing recommendation data');
        }

        setRecommendation(result.recommendation, result.scoringResult);
        navigate('/results');
      } catch {
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
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-100 mb-2">
          <span>
            Step {currentStep + 1} of {groups.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <svg
            className="h-2 w-full"
            viewBox="0 0 100 2"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <rect
              x="0"
              y="0"
              width="100"
              height="2"
              rx="1"
              className="fill-gray-200 dark:fill-gray-700"
            />
            <rect
              x="0"
              y="0"
              width={Math.max(0, Math.min(100, progress))}
              height="2"
              rx="1"
              className="fill-primary-600"
            />
          </svg>
        </div>
      </div>

      {/* Preliminary signal banner — shown from step 3 onward when a clear leader emerges */}
      {prelimSignal && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-700 dark:bg-blue-900/20">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Based on your answers so far, you may be a good fit for{' '}
            <strong>{prelimSignal.label}</strong>. Complete all steps for a confident
            recommendation.
          </p>
        </div>
      )}

      <div className="card">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            {currentGroup.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-200">{currentGroup.description}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {currentGroup.questions
            .filter((q) => !skippedQuestions.has(q.id))
            .map((question) => (
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
                        <span className="ml-3 text-gray-700 dark:text-gray-100">
                          {answer.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Comments (optional)
                  </label>
                  <textarea
                    {...register(`comment__${question.id}`)}
                    defaultValue={comments[question.id] ?? ''}
                    rows={3}
                    placeholder="Add any context, constraints, or notes..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
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
