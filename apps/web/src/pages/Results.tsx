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
  const [showResponses, setShowResponses] = useState(false);
  const [model, setModel] = useState<DecisionModel | null>(null);
  const [enhancedExplanation, setEnhancedExplanation] = useState<any>(null);
  const [loadingEnhancement, setLoadingEnhancement] = useState(true);

  useEffect(() => {
    // Fetch model from API
    fetch('/api/model')
      .then((res) => res.json())
      .then((data) => setModel(data))
      .catch((err) => console.error('Failed to load model:', err));

    // Fetch AI-enhanced explanation
    if (recommendation) {
      console.log('[Results] Fetching AI explanation for type:', recommendation.type);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('[Results] AI explanation request timed out after 35 seconds');
      }, 35000); // 35 second timeout (slightly longer than backend)
      
      fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation: { ...recommendation, scoringResult },
          userContext: { answers },
        }),
        signal: controller.signal,
      })
        .then((res) => {
          clearTimeout(timeoutId);
          return res.json();
        })
        .then((data) => {
          console.log('[Results] Received explanation data:', data);
          if (data.explanation) {
            console.log('[Results] Setting enhanced explanation:', {
              hasIntroduction: !!data.explanation.introduction,
              hasSummary: !!data.explanation.summary,
              enhanced: data.enhanced,
            });
            setEnhancedExplanation(data.explanation);
          } else {
            console.warn('[Results] No explanation in response data');
          }
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            console.error('[Results] Request timed out - using fallback explanation');
          } else {
            console.error('Failed to load enhanced explanation:', err);
          }
        })
        .finally(() => setLoadingEnhancement(false));
    }
  }, [recommendation, scoringResult, answers]);

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

  // Use enhanced explanation if available, otherwise fall back to original
  const displayIntroduction = enhancedExplanation?.introduction;
  const displaySummary = enhancedExplanation?.summary || summary;
  const displayReasons: string[] = enhancedExplanation?.reasons || reasons;
  const displayNextSteps: string[] = enhancedExplanation?.nextSteps || nextSteps;
  const displayCompliance: string[] =
    enhancedExplanation?.complianceConsiderations || complianceConsiderations;

  // Helper to add inline hyperlinks for source references
  const addInlineLinks = (text: string) => {
    if (!sources || sources.length === 0) return text;

    // Keywords to source URL mapping
    const linkMap: Record<string, { url: string; title: string }> = {};

    sources.forEach((source) => {
      const url = source.url.toLowerCase();
      if (url.includes('microsoft-365-copilot-overview')) {
        linkMap['Microsoft 365 Copilot'] = source;
        linkMap['M365 Copilot'] = source;
      } else if (url.includes('copilot-studio') || url.includes('microsoft-copilot-studio')) {
        linkMap['Copilot Studio'] = source;
      } else if (url.includes('copilotstudioimplementationguide')) {
        linkMap['implementation guide'] = source;
        linkMap['Implementation Guide'] = source;
      } else if (url.includes('licensing')) {
        linkMap['licensing'] = source;
      } else if (url.includes('privacy') || url.includes('security')) {
        linkMap['privacy'] = source;
        linkMap['security'] = source;
        linkMap['data privacy'] = source;
      } else if (url.includes('extensibility')) {
        linkMap['extensibility'] = source;
        linkMap['extend'] = source;
      }
    });

    // Split text into parts and identify where to add links
    const parts: Array<{ text: string; link?: { url: string; title: string } }> = [];
    let remainingText = text;

    Object.entries(linkMap).forEach(([keyword, source]) => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      const match = remainingText.match(regex);
      if (match) {
        const index = remainingText.search(regex);
        if (index > 0) {
          parts.push({ text: remainingText.substring(0, index) });
        }
        parts.push({ text: match[0], link: source });
        remainingText = remainingText.substring(index + match[0].length);
      }
    });

    if (remainingText) {
      parts.push({ text: remainingText });
    }

    return parts.length > 0 ? parts : [{ text }];
  };

  const handleExportJSON = () => {
    const exportData = {
      recommendation: {
        ...recommendation,
        enhancedExplanation: enhancedExplanation || null,
      },
      scoringResult,
    };
    downloadJSON(exportData, `copilot-recommendation-${Date.now()}.json`);
  };

  const handleExportMarkdown = () => {
    if (!model) return;

    // Get all questions and answers
    const allQuestions: Question[] = [];
    model.questionGroups.forEach((group) => {
      group.questions.forEach((q) => allQuestions.push(q));
    });

    const qaData = allQuestions.map((q) => {
      const answer = answers[q.id];
      const selectedAnswer = q.answers.find((a) => a.id === answer);
      const answerLabel = selectedAnswer?.label || 'Not answered';

      return {
        question: q.title,
        answer: answerLabel,
      };
    });

    const enhancedRecommendation = {
      ...recommendation,
      introduction: displayIntroduction,
      summary: displaySummary,
      reasons: displayReasons,
      nextSteps: displayNextSteps,
      complianceConsiderations: displayCompliance,
    };
    const markdown = generateMarkdownSummary(enhancedRecommendation, qaData);
    downloadMarkdown(markdown, `copilot-recommendation-${Date.now()}.md`);
  };

  const handleExportPDF = () => {
    if (!model) return;

    // Get all questions from model
    const allQuestions: Question[] = [];
    model.questionGroups.forEach((group) => {
      group.questions.forEach((q) => allQuestions.push(q));
    });

    const qaData = allQuestions.map((q) => {
      const answer = answers[q.id];
      const selectedAnswer = q.answers.find((a) => a.id === answer);
      const answerLabel = selectedAnswer?.label || 'Not answered';

      return {
        question: q.title,
        answer: answerLabel,
      };
    });

    const enhancedRecommendation = {
      ...recommendation,
      introduction: displayIntroduction,
      summary: displaySummary,
      reasons: displayReasons,
      nextSteps: displayNextSteps,
      complianceConsiderations: displayCompliance,
    };

    downloadPDF(enhancedRecommendation, qaData, `copilot-recommendation-${Date.now()}.pdf`);
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
      {/* Loading State - Show spinner while AI enhancement is loading */}
      {loadingEnhancement && (
        <div className="card text-center py-12">
          <div className="flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-12 w-12 text-primary-600 dark:text-primary-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Generating AI-Enhanced Analysis...
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This may take a few moments as we analyze your responses with AI
            </p>
          </div>
        </div>
      )}

      {/* Content - Only show when AI enhancement is complete */}
      {!loadingEnhancement && (
        <>
          {/* Introduction Section */}
          {displayIntroduction && (
            <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    About This Analysis
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 leading-relaxed">
                    {displayIntroduction}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Your Responses Section - Show all questions and answers */}
          {model && (
            <div className="card">
              <button
                onClick={() => setShowResponses(!showResponses)}
                className="flex items-center justify-between w-full text-left mb-4"
              >
                <h3 className="text-xl font-semibold dark:text-white flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Your Questionnaire Responses
                </h3>
                <svg
                  className={`w-5 h-5 transition-transform ${showResponses ? 'transform rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showResponses && (
                <div className="space-y-4">
                  {model.questionGroups.map((group, groupIdx) => (
                    <div
                      key={groupIdx}
                      className="border-l-4 border-primary-600 dark:border-primary-400 pl-4"
                    >
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-50 mb-3">
                        {group.title}
                      </h4>
                      <div className="space-y-3">
                        {group.questions.map((question) => {
                          const answerId = answers[question.id];
                          const selectedAnswer = question.answers.find((a) => a.id === answerId);

                          return (
                            <div
                              key={question.id}
                              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                            >
                              <div className="font-medium text-gray-900 dark:text-gray-50 mb-2">
                                Q: {question.title}
                              </div>
                              <div className="text-primary-700 dark:text-primary-300 flex items-start">
                                <svg
                                  className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span>A: {selectedAnswer?.label || 'Not answered'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Header */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div
                  className={`inline-block px-4 py-2 rounded-lg border-2 font-semibold mb-3 ${getTypeColor(type)}`}
                >
                  {title}
                </div>
                <p className="text-lg text-gray-700 dark:text-gray-100">{displaySummary}</p>
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
              {displayReasons.map((reason, idx) => {
                const parts = addInlineLinks(reason);
                return (
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
                    <span className="text-gray-700 dark:text-gray-100">
                      {Array.isArray(parts)
                        ? parts.map((part, i) =>
                            part.link ? (
                              <a
                                key={i}
                                href={part.link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 dark:text-primary-400 hover:underline"
                                title={part.link.title}
                              >
                                {part.text}
                              </a>
                            ) : (
                              <span key={i}>{part.text}</span>
                            )
                          )
                        : reason}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4 dark:text-white">What to Do Next</h3>
            <ol className="space-y-3">
              {displayNextSteps.map((step, idx) => {
                const parts = addInlineLinks(step);
                return (
                  <li key={idx} className="flex items-start">
                    <span className="flex items-center justify-center w-6 h-6 bg-primary-600 dark:bg-primary-500 text-white rounded-full text-sm font-medium flex-shrink-0 mr-3 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-100">
                      {Array.isArray(parts)
                        ? parts.map((part, i) =>
                            part.link ? (
                              <a
                                key={i}
                                href={part.link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 dark:text-primary-400 hover:underline"
                                title={part.link.title}
                              >
                                {part.text}
                              </a>
                            ) : (
                              <span key={i}>{part.text}</span>
                            )
                          )
                        : step}
                    </span>
                  </li>
                );
              })}
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
          {displayCompliance && displayCompliance.length > 0 && (
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
                {displayCompliance.map((item, idx) => {
                  const parts = addInlineLinks(item);
                  return (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-blue-900 dark:text-blue-100">
                        {Array.isArray(parts)
                          ? parts.map((part, i) =>
                              part.link ? (
                                <a
                                  key={i}
                                  href={part.link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary-600 dark:text-primary-400 hover:underline"
                                  title={part.link.title}
                                >
                                  {part.text}
                                </a>
                              ) : (
                                <span key={i}>{part.text}</span>
                              )
                            )
                          : item}
                      </span>
                    </li>
                  );
                })}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showBreakdown && (
              <div className="mt-4 space-y-3">
                {breakdown.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                    <div className="font-medium text-gray-900 dark:text-gray-50 mb-1">
                      {item.questionTitle}
                    </div>
                    <div className="text-gray-600 dark:text-gray-200 mb-2">
                      → {item.answerLabel}
                    </div>
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
        </>
      )}
    </div>
  );
}
