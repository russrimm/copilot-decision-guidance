import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getPortfolioModel,
  prioritizePortfolio,
  type PortfolioCriterionId,
  type PortfolioModelResponse,
  type PortfolioPrioritizationResponse,
  type PortfolioUseCase,
  type PortfolioWeights,
} from '../lib/api';

const criteriaOrder: PortfolioCriterionId[] = [
  'businessValue',
  'feasibility',
  'timeToValue',
  'risk',
  'dataSensitivity',
];

function toWeightPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

export default function PortfolioPrioritizer() {
  const [model, setModel] = useState<PortfolioModelResponse | null>(null);
  const [useCases, setUseCases] = useState<PortfolioUseCase[]>([]);
  const [weights, setWeights] = useState<PortfolioWeights | null>(null);
  const [result, setResult] = useState<PortfolioPrioritizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getPortfolioModel()
      .then((payload) => {
        if (cancelled) return;
        setModel(payload);
        setUseCases(payload.defaultUseCases);
        setWeights(payload.defaultWeights);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message || 'Failed to load portfolio model');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalWeight = useMemo(() => {
    if (!weights) return 0;
    return criteriaOrder.reduce((sum, id) => sum + toWeightPercent(weights[id]), 0);
  }, [weights]);

  const updateWeight = (id: PortfolioCriterionId, nextPercent: number) => {
    setWeights((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [id]: Math.max(0, Math.min(1, nextPercent / 100)),
      };
    });
  };

  const updateRating = (useCaseId: string, criterionId: PortfolioCriterionId, value: number) => {
    const rating = Math.max(1, Math.min(5, value));
    setUseCases((prev) =>
      prev.map((entry) =>
        entry.id === useCaseId
          ? {
              ...entry,
              ratings: {
                ...entry.ratings,
                [criterionId]: rating,
              },
            }
          : entry
      )
    );
  };

  const onPrioritize = async () => {
    if (!weights) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = await prioritizePortfolio({ useCases, weights });
      setResult(payload);
    } catch (e: any) {
      setError(e?.message || 'Failed to prioritize portfolio');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600 dark:text-gray-200">Loading portfolio model...</div>;
  }

  if (error && !model) {
    return <div className="text-red-600 dark:text-red-300">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              Use Case Portfolio Prioritizer
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Score and rank candidate use cases using weighted business value, feasibility, and
              risk criteria.
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

      <div className="card space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Criteria Weights</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(model?.criteria || []).map((criterion) => (
            <div
              key={criterion.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">{criterion.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
                {criterion.description}
              </p>
              <div className="mt-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weights ? toWeightPercent(weights[criterion.id]) : 0}
                  onChange={(e) => updateWeight(criterion.id, Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 dark:text-gray-200 mt-1">
                  Weight: {weights ? toWeightPercent(weights[criterion.id]) : 0}%
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-300">
          Current total: {totalWeight}% (normalization is applied automatically in scoring)
        </p>
      </div>

      <div className="card space-y-4 overflow-x-auto">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Use Case Ratings</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-3 text-gray-900 dark:text-white">Use case</th>
              {(model?.criteria || []).map((criterion) => (
                <th key={criterion.id} className="py-2 pr-3 text-gray-900 dark:text-white">
                  {criterion.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {useCases.map((useCase) => (
              <tr key={useCase.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 pr-3 align-top">
                  <p className="font-medium text-gray-900 dark:text-white">{useCase.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">{useCase.description}</p>
                </td>
                {(model?.criteria || []).map((criterion) => (
                  <td key={criterion.id} className="py-3 pr-3 align-top">
                    <select
                      value={useCase.ratings[criterion.id]}
                      onChange={(e) =>
                        updateRating(useCase.id, criterion.id, Number.parseInt(e.target.value, 10))
                      }
                      className="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-2 py-1"
                    >
                      {[1, 2, 3, 4, 5].map((score) => (
                        <option key={score} value={score}>
                          {score}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <button onClick={onPrioritize} disabled={submitting} className="btn btn-primary">
          {submitting ? 'Prioritizing...' : 'Run Portfolio Prioritization'}
        </button>
      </div>

      {result && (
        <div className="card space-y-5">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              Prioritized Portfolio
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Generated at {new Date(result.generatedAt).toLocaleString()}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-3 text-gray-900 dark:text-white">Rank</th>
                  <th className="py-2 pr-3 text-gray-900 dark:text-white">Use case</th>
                  <th className="py-2 pr-3 text-gray-900 dark:text-white">Tier</th>
                  <th className="py-2 pr-3 text-gray-900 dark:text-white">Score</th>
                </tr>
              </thead>
              <tbody>
                {result.prioritized.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-100">{index + 1}</td>
                    <td className="py-2 pr-3 text-gray-900 dark:text-white">{item.name}</td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-100 uppercase">
                      {item.tier}
                    </td>
                    <td className="py-2 pr-3 text-gray-700 dark:text-gray-100">
                      {item.score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">30 days</h4>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-100 space-y-1">
                {result.roadmap.days30.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">60 days</h4>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-100 space-y-1">
                {result.roadmap.days60.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">90 days</h4>
              <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-100 space-y-1">
                {result.roadmap.days90.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
