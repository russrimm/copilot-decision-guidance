import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  assessReadiness,
  getReadinessModel,
  type ReadinessAssessmentResponse,
  type ReadinessModelResponse,
} from '../lib/api';

type AnswerValue = 'yes' | 'partial' | 'no';

const answerStyles: Record<AnswerValue, string> = {
  yes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  no: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const statusStyles: Record<ReadinessAssessmentResponse['status'], string> = {
  ready: 'text-green-700 dark:text-green-300',
  'needs-attention': 'text-yellow-700 dark:text-yellow-300',
  blocked: 'text-red-700 dark:text-red-300',
};

export default function ReadinessAssessment() {
  const [model, setModel] = useState<ReadinessModelResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [result, setResult] = useState<ReadinessAssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getReadinessModel()
      .then((payload) => {
        if (cancelled) return;
        setModel(payload);

        const initialAnswers = payload.questions.reduce<Record<string, AnswerValue>>((acc, q) => {
          acc[q.id] = 'partial';
          return acc;
        }, {});
        setAnswers(initialAnswers);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message || 'Failed to load readiness model');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const groupedQuestions = useMemo(() => {
    if (!model) return [];
    return model.domains.map((domain) => ({
      domain,
      questions: model.questions.filter((q) => q.domain === domain.id),
    }));
  }, [model]);

  const onChangeAnswer = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const onAssess = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = await assessReadiness(answers);
      setResult(payload);
    } catch (e: any) {
      setError(e?.message || 'Failed to assess readiness');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600 dark:text-gray-200">Loading readiness model...</div>;
  }

  if (error && !model) {
    return <div className="text-red-600 dark:text-red-300">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Readiness Assessment 2.0
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Assess identity, data, security, platform, and operating model readiness before
              deployment.
            </p>
          </div>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>

      {error && (
        <div className="card border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {groupedQuestions.map(({ domain, questions }) => (
        <div key={domain.id} className="card">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            {domain.label}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">{domain.description}</p>

          <div className="space-y-4">
            {questions.map((question) => (
              <div
                key={question.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {question.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                  {question.helperText}
                </p>
                {question.isBlocker && (
                  <span className="inline-flex mt-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                    Production blocker if unanswered
                  </span>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {(model?.answerOptions || []).map((option) => {
                    const selected = answers[question.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onChangeAnswer(question.id, option.id)}
                        className={`px-3 py-1.5 rounded text-sm border transition-colors ${
                          selected
                            ? `${answerStyles[option.id]} border-transparent`
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card">
        <button onClick={onAssess} disabled={submitting} className="btn btn-primary">
          {submitting ? 'Assessing...' : 'Run Readiness Assessment'}
        </button>
      </div>

      {result && (
        <div className="card space-y-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Assessment Result
            </h3>
            <p className={`text-sm font-medium ${statusStyles[result.status]}`}>
              Status: {result.status.replace('-', ' ')} · Overall Score: {result.overallScore}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {result.domainScores.map((item) => (
              <div
                key={item.domain}
                className="border border-gray-200 dark:border-gray-700 rounded p-3"
              >
                <p className="text-xs text-gray-500 dark:text-gray-300">{item.label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.score}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Blockers ({result.blockerCount})
            </h4>
            {result.blockers.length === 0 ? (
              <p className="text-sm text-green-700 dark:text-green-300">
                No production blockers detected.
              </p>
            ) : (
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-100 space-y-1">
                {result.blockers.map((blocker) => (
                  <li key={blocker.id}>{blocker.title}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              Action Plan
            </h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-100 space-y-1">
              {result.actionPlan.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
