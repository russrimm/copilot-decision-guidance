import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/wizardStore';
import {
  downloadJSON,
  downloadMarkdown,
  generateMarkdownSummary,
  downloadPDF,
} from '../lib/export';
import type { DecisionModel, Question } from '../types';

export default function Results() {
  const navigate = useNavigate();
  const { recommendation, scoringResult, answers, reset } = useWizardStore();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [model, setModel] = useState<DecisionModel | null>(null);

  useEffect(() => {
    // Fetch model from API
    fetch('/api/model')
      .then((res) => res.json())
      .then((data) => setModel(data))
      .catch((err) => console.error('Failed to load model:', err));
  }, []);

  if (!recommendation || !scoringResult) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-200 mb-4">No recommendation available.</p>
        <Link to="/wizard" className="btn-primary">
          Start Questionnaire
        </Link>
      </div>
    );
  }

  const { type, title, summary, reasons, nextSteps, risks, complianceConsiderations, sources } =
    recommendation;
  const { confidenceLevel, scores, breakdown } = scoringResult;

  const handleExportJSON = () => {
    downloadJSON({ recommendation, scoringResult }, `copilot-recommendation-${Date.now()}.json`);
  };

  const handleExportMarkdown = () => {
    const markdown = generateMarkdownSummary(recommendation);
    downloadMarkdown(markdown, `copilot-recommendation-${Date.now()}.md`);
  };

  const handleExportPDF = () => {
    if (!model) return;

    // Get all questions from model
    const allQuestions: Question[] = [];
    model.categories.forEach((cat) => {
      cat.questions.forEach((q) => allQuestions.push(q));
    });

    const qaData = allQuestions.map((q) => {
      const answer = answers[q.id];
      let answerLabel = 'Not answered';
      if (typeof answer === 'boolean') {
        answerLabel = answer ? 'Yes' : 'No';
      } else if (Array.isArray(answer)) {
        answerLabel = answer.join(', ');
      } else if (answer) {
        answerLabel = String(answer);
      }
      return {
        question: q.text,
        answer: answerLabel,
      };
    });

    downloadPDF(recommendation, qaData, `copilot-recommendation-${Date.now()}.pdf`);
  };

  const handleStartOver = () => {
    reset();
    navigate('/wizard');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'M365_COPILOT':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'COPILOT_STUDIO':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'HYBRID':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-700';
      case 'medium':
        return 'text-yellow-700';
      case 'low':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div
              className={`inline-block px-4 py-2 rounded-lg border-2 font-semibold mb-3 ${getTypeColor(type)}`}
            >
              {title}
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-100">{summary}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-200 mt-4 pt-4 border-t dark:border-gray-700">
          <div>
            <span className="font-medium">Confidence: </span>
            <span className={`font-semibold capitalize ${getConfidenceColor(confidenceLevel)}`}>
              {confidenceLevel}
            </span>
          </div>
          <div>
            <span className="font-medium">Scores: </span>
            M365={scores.m365Copilot} | Studio={scores.copilotStudio} | Hybrid={scores.hybrid}
          </div>
        </div>
      </div>

      {/* Why This Recommendation */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4 dark:text-white">Why This Recommendation</h3>
        <ul className="space-y-2">
          {reasons.map((reason, idx) => (
            <li key={idx} className="flex items-start">
              <svg
                className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-700 dark:text-gray-100">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next Steps */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4 dark:text-white">What to Do Next</h3>
        <ol className="space-y-3">
          {nextSteps.map((step, idx) => (
            <li key={idx} className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 bg-primary-600 dark:bg-primary-500 text-white rounded-full text-sm font-medium flex-shrink-0 mr-3 mt-0.5">
                {idx + 1}
              </span>
              <span className="text-gray-700 dark:text-gray-100">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Risks & Watch-outs */}
      <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
        <h3 className="text-xl font-semibold mb-4 text-yellow-900 dark:text-yellow-100">
          Risks & Watch-outs
        </h3>
        <ul className="space-y-2">
          {risks.map((risk, idx) => (
            <li key={idx} className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-yellow-900 dark:text-yellow-100">{risk}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Compliance & Governance Considerations */}
      {complianceConsiderations && complianceConsiderations.length > 0 && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <h3 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Compliance & Governance Considerations
          </h3>
          <ul className="space-y-3">
            {complianceConsiderations.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-blue-900 dark:text-blue-100">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sources */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4 dark:text-white">Verified Sources</h3>
        <div className="space-y-2">
          {sources.map((source, idx) => (
            <a
              key={idx}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span className="font-medium text-primary-700 dark:text-primary-300">
                  {source.title}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* How We Scored This */}
      <div className="card">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-xl font-semibold dark:text-white">How We Scored This</h3>
          <svg
            className={`w-5 h-5 transition-transform ${showBreakdown ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showBreakdown && (
          <div className="mt-4 space-y-3">
            {breakdown.map((item, idx) => (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                <div className="font-medium text-gray-900 dark:text-gray-50 mb-1">
                  {item.questionTitle}
                </div>
                <div className="text-gray-600 dark:text-gray-200 mb-2">→ {item.answerLabel}</div>
                <div className="flex space-x-4 text-xs text-gray-500 dark:text-gray-300">
                  <span>M365: +{item.weights.m365Copilot}</span>
                  <span>Studio: +{item.weights.copilotStudio}</span>
                  <span>Hybrid: +{item.weights.hybrid}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center pt-4">
        <button onClick={handleExportJSON} className="btn-secondary">
          📥 Export JSON
        </button>
        <button onClick={handleExportMarkdown} className="btn-secondary">
          📄 Export Markdown
        </button>
        <button onClick={handleExportPDF} className="btn-secondary">
          📋 Export PDF
        </button>
        <button onClick={handleStartOver} className="btn-primary">
          🔄 Start Over
        </button>
        <Link to="/" className="btn-secondary">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
