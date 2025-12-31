import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/wizardStore';
import { getDecisionModel, calculateScore } from '../lib/api';
import { useForm } from 'react-hook-form';
import type { DecisionModel } from '../types';

export default function Wizard() {
  const navigate = useNavigate();
  const { answers, currentStep, setAnswer, nextStep, previousStep, setRecommendation } =
    useWizardStore();
  const [model, setModel] = useState<DecisionModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const { register, handleSubmit } = useForm();

  useEffect(() => {
    getDecisionModel()
      .then(setModel)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !model) {
    return <div className="text-center py-12">Loading questionnaire...</div>;
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

    if (isLastStep) {
      // Calculate and navigate to results
      setCalculating(true);
      try {
        const result = await calculateScore({ ...answers, ...data });
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
                {question.answers.map((answer) => (
                  <label
                    key={answer.id}
                    className="flex items-start p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="radio"
                      {...register(question.id, { required: true })}
                      value={answer.id}
                      defaultChecked={answers[question.id] === answer.id}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-gray-700 dark:text-gray-100">{answer.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

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
