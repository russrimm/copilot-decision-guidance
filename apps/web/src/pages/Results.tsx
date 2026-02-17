import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWizardStore } from '../store/wizardStore';
import {
  downloadJSON,
  downloadMarkdown,
  generateMarkdownSummary,
  downloadPDF,
} from '../lib/export';
import type { DecisionModel, Question, AIRecommendation } from '../types';

export default function Results() {
  const navigate = useNavigate();
  const { recommendation, scoringResult, answers, comments, reset, csamEmail } = useWizardStore();
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [model, setModel] = useState<DecisionModel | null>(null);
  const [enhancedExplanation, setEnhancedExplanation] = useState<any>(null);
  const [loadingEnhancement, setLoadingEnhancement] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null);
  const [loadingAiRec, setLoadingAiRec] = useState(false);
  const [completionTimestamp] = useState(new Date().toISOString());

  const resolveAnswerLabel = (question: Question, answerValue: any): string => {
    if (answerValue == null) return 'Not answered';
    if (Array.isArray(answerValue)) {
      const labels = answerValue
        .map((id) => question.answers.find((a) => a.id === id)?.label)
        .filter(Boolean) as string[];
      return labels.length > 0 ? labels.join(', ') : 'Not answered';
    }
    const selectedAnswer = question.answers.find((a) => a.id === answerValue);
    return selectedAnswer?.label || 'Not answered';
  };

  const getAllQuestions = (decisionModel: DecisionModel): Question[] => {
    const allQuestions: Question[] = [];
    decisionModel.questionGroups.forEach((group) => {
      group.questions.forEach((q) => allQuestions.push(q));
    });
    return allQuestions;
  };

  const buildQaData = (decisionModel: DecisionModel) => {
    const allQuestions = getAllQuestions(decisionModel);
    return allQuestions.map((q) => {
      const answerValue = answers[q.id];
      const answerLabel = resolveAnswerLabel(q, answerValue);
      const comment = (comments?.[q.id] ?? '').trim();
      return {
        questionId: q.id,
        question: q.title,
        answer: answerLabel,
        comment,
      };
    });
  };

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

    // First, detect and extract URLs from the text
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlMatches = text.match(urlRegex);

    // Create parts array with URLs as clickable links
    if (urlMatches && urlMatches.length > 0) {
      const parts: Array<{ text: string; link?: { url: string; title: string } }> = [];
      let lastIndex = 0;
      urlMatches.forEach((url) => {
        const urlIndex = text.indexOf(url, lastIndex);

        // Add text before the URL
        if (urlIndex > lastIndex) {
          parts.push({ text: text.substring(lastIndex, urlIndex) });
        }

        // Add the URL as a link
        parts.push({
          text: url,
          link: { url: url, title: url },
        });

        lastIndex = urlIndex + url.length;
      });

      // Add remaining text after last URL
      if (lastIndex < text.length) {
        parts.push({ text: text.substring(lastIndex) });
      }

      return parts;
    }

    // Keywords to source URL mapping (fallback for keyword-based linking)
    const linkMap: Record<string, { url: string; title: string }> = {};

    sources.forEach((source) => {
      const url = source.url.toLowerCase();
      const title = source.title.toLowerCase();

      // Microsoft 365 Copilot
      if (url.includes('microsoft-365-copilot') || title.includes('microsoft 365 copilot')) {
        linkMap['Microsoft 365 Copilot'] = source;
        linkMap['M365 Copilot'] = source;
        linkMap['Copilot for Microsoft 365'] = source;
      }

      // Copilot Studio
      if (
        url.includes('copilot-studio') ||
        url.includes('microsoft-copilot-studio') ||
        title.includes('copilot studio')
      ) {
        linkMap['Copilot Studio'] = source;
        linkMap['Microsoft Copilot Studio'] = source;
      }

      // Microsoft Foundry / Azure AI Foundry
      if (
        url.includes('azure-ai-foundry') ||
        url.includes('ai-foundry') ||
        url.includes('/foundry') ||
        title.includes('foundry')
      ) {
        linkMap['Microsoft Foundry'] = source;
        linkMap['Azure AI Foundry'] = source;
        linkMap['Foundry'] = source;
      }

      // Agent Builder
      if (url.includes('agent-builder') || title.includes('agent builder')) {
        linkMap['Agent Builder'] = source;
        linkMap['Copilot Agent Builder'] = source;
      }

      // Power Platform
      if (url.includes('power-platform') || title.includes('power platform')) {
        linkMap['Power Platform'] = source;
      }

      // Power Automate
      if (url.includes('power-automate') || title.includes('power automate')) {
        linkMap['Power Automate'] = source;
      }

      // Azure
      if (url.includes('/azure/') && !url.includes('foundry')) {
        linkMap['Azure'] = source;
      }

      // Licensing
      if (url.includes('licensing') || title.includes('licensing')) {
        linkMap['licensing'] = source;
        linkMap['Licensing'] = source;
        linkMap['license'] = source;
      }

      // Privacy & Security
      if (url.includes('privacy') || title.includes('privacy')) {
        linkMap['privacy'] = source;
        linkMap['data privacy'] = source;
        linkMap['Privacy'] = source;
      }
      if (url.includes('security') || title.includes('security')) {
        linkMap['security'] = source;
        linkMap['Security'] = source;
      }

      // Compliance
      if (url.includes('compliance') || title.includes('compliance')) {
        linkMap['compliance'] = source;
        linkMap['Compliance'] = source;
      }

      // HIPAA / Healthcare
      if (url.includes('hipaa') || title.includes('hipaa')) {
        linkMap['HIPAA'] = source;
        linkMap['BAA'] = source;
      }

      // GDPR
      if (url.includes('gdpr') || title.includes('gdpr')) {
        linkMap['GDPR'] = source;
      }

      // Data residency
      if (
        url.includes('data-residency') ||
        url.includes('residency') ||
        title.includes('residency')
      ) {
        linkMap['data residency'] = source;
        linkMap['Data Residency'] = source;
      }

      // Governance
      if (url.includes('governance') || title.includes('governance')) {
        linkMap['governance'] = source;
        linkMap['Governance'] = source;
      }

      // DLP (Data Loss Prevention)
      if (url.includes('dlp') || url.includes('data-loss-prevention') || title.includes('dlp')) {
        linkMap['DLP'] = source;
        linkMap['data loss prevention'] = source;
      }

      // Microsoft Graph
      if (url.includes('graph') || title.includes('graph')) {
        linkMap['Microsoft Graph'] = source;
        linkMap['Graph'] = source;
      }

      // Connectors
      if (url.includes('connector') || title.includes('connector')) {
        linkMap['connectors'] = source;
        linkMap['Connectors'] = source;
      }

      // Extensibility
      if (
        url.includes('extensibility') ||
        url.includes('extend') ||
        title.includes('extensibility')
      ) {
        linkMap['extensibility'] = source;
        linkMap['extend'] = source;
      }

      // Implementation Guide
      if (url.includes('implementation') || title.includes('implementation')) {
        linkMap['implementation guide'] = source;
        linkMap['Implementation Guide'] = source;
      }

      // Getting Started / Setup
      if (
        url.includes('get-started') ||
        url.includes('getting-started') ||
        title.includes('get started')
      ) {
        linkMap['Get Started'] = source;
        linkMap['getting started'] = source;
      }

      // Adoption
      if (url.includes('adoption') || title.includes('adoption')) {
        linkMap['adoption'] = source;
        linkMap['Adoption'] = source;
      }

      // Microsoft Teams
      if (url.includes('teams') || title.includes('teams')) {
        linkMap['Microsoft Teams'] = source;
        linkMap['Teams'] = source;
      }

      // SharePoint
      if (url.includes('sharepoint') || title.includes('sharepoint')) {
        linkMap['SharePoint'] = source;
      }

      // Azure OpenAI
      if (
        url.includes('azure-openai') ||
        url.includes('openai') ||
        title.includes('azure openai')
      ) {
        linkMap['Azure OpenAI'] = source;
        linkMap['OpenAI'] = source;
      }
    });

    // Split text into parts and identify where to add links (keyword-based)
    const keywordParts: Array<{ text: string; link?: { url: string; title: string } }> = [];
    let remainingText = text;

    Object.entries(linkMap).forEach(([keyword, source]) => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      const match = remainingText.match(regex);
      if (match) {
        const index = remainingText.search(regex);
        if (index > 0) {
          keywordParts.push({ text: remainingText.substring(0, index) });
        }
        keywordParts.push({ text: match[0], link: source });
        remainingText = remainingText.substring(index + match[0].length);
      }
    });

    if (remainingText) {
      keywordParts.push({ text: remainingText });
    }

    return keywordParts.length > 0 ? keywordParts : [{ text }];
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

    const qaData = buildQaData(model).map((qa) => ({ question: qa.question, answer: qa.answer }));

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

  const handleEmailToCSAM = () => {
    if (!model || !csamEmail) return;

    const qaData = buildQaData(model).map((qa) => ({ question: qa.question, answer: qa.answer }));

    const enhancedRecommendation = {
      ...recommendation,
      introduction: displayIntroduction,
      summary: displaySummary,
      reasons: displayReasons,
      nextSteps: displayNextSteps,
      complianceConsiderations: displayCompliance,
    };
    const markdown = generateMarkdownSummary(enhancedRecommendation, qaData);

    // Create mailto link
    const subject = encodeURIComponent(
      `Microsoft Agentic Solution Assessment - ${recommendation.title}`
    );
    const body = encodeURIComponent(
      `Hi,\n\nI've completed a Microsoft Agentic Solution assessment and wanted to share the results with you.\n\n` +
        `Recommendation: ${recommendation.title}\n` +
        `Confidence Level: ${scoringResult.confidenceLevel}\n\n` +
        `Please find the detailed report below:\n\n` +
        `---\n\n${markdown}\n\n` +
        `Best regards`
    );

    const mailtoLink = `mailto:${csamEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
  };

  const handleExportPDF = () => {
    if (!model) return;

    const qaData = buildQaData(model).map((qa) => ({ question: qa.question, answer: qa.answer }));

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

  const handleExportExecutiveOverviewPPTX = async () => {
    if (!model) return;

    try {
      const qaData = buildQaData(model);
      const payload = {
        timestamp: completionTimestamp,
        scoringResult,
        recommendation: {
          type: recommendation.type,
          title: recommendation.title,
          summary: displaySummary,
          reasons: displayReasons,
          nextSteps: displayNextSteps,
        },
        qaData,
        aiRecommendation: aiRecommendation || undefined,
      };

      const res = await fetch('/api/export/executive-overview/pptx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `executive-overview-${Date.now()}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export Executive Overview PPTX:', error);
      alert('Failed to export Executive Overview PPTX. Please try again.');
    }
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

  // Function to fetch AI-powered recommendation
  const fetchAiRecommendation = async () => {
    if (loadingAiRec || aiRecommendation) return;

    setLoadingAiRec(true);
    try {
      const response = await fetch('/api/recommendation/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyResponses: answers,
          comments,
          scoringResult,
          includeMetrics: true,
        }),
      });
      const data = await response.json();
      setAiRecommendation(data.recommendation);
    } catch (error) {
      console.error('Failed to fetch AI recommendation:', error);
    } finally {
      setLoadingAiRec(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Timestamp Banner */}
      <div className="card bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
              Assessment Completed
            </h3>
            <p className="text-green-700 dark:text-green-300 text-sm">
              {new Date(completionTimestamp).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(() => {
                const scores = scoringResult.scores;
                const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
                const recommendedScore =
                  scoringResult.recommendation === 'M365_COPILOT'
                    ? scores.m365Copilot
                    : scoringResult.recommendation === 'COPILOT_STUDIO'
                      ? scores.copilotStudio
                      : scoringResult.recommendation === 'FOUNDRY'
                        ? scores.foundry
                        : scoringResult.recommendation === 'AGENT_BUILDER'
                          ? scores.agentBuilder
                          : scores.hybrid;

                return total > 0 ? Math.round((recommendedScore / total) * 100) : 0;
              })()}
              %
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">Match Score</div>
          </div>
        </div>
      </div>

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
          {/* AI-Powered Personalized Recommendation */}
          <div className="card bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 border-2 border-purple-300 dark:border-purple-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
                <div>
                  <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100">
                    AI-Powered Analysis
                  </h3>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Personalized recommendation based on your responses
                  </p>
                </div>
              </div>
              {!aiRecommendation && !loadingAiRec && (
                <button
                  onClick={fetchAiRecommendation}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Generate AI Insights
                </button>
              )}
            </div>

            {loadingAiRec && (
              <div className="flex items-center justify-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-purple-600 dark:text-purple-400 mr-3"
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
                <span className="text-purple-700 dark:text-purple-300">
                  Generating personalized insights...
                </span>
              </div>
            )}

            {aiRecommendation && (
              <div className="space-y-4">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Executive Summary
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300">{aiRecommendation.summary}</p>
                </div>

                {aiRecommendation.detailedAnalysis && (
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      Detailed Analysis
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {aiRecommendation.detailedAnalysis}
                    </p>
                  </div>
                )}

                {aiRecommendation.implementationRoadmap &&
                  aiRecommendation.implementationRoadmap.length > 0 && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        Implementation Roadmap
                      </h4>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        {aiRecommendation.implementationRoadmap.map(
                          (step: string, index: number) => (
                            <li key={index}>{step}</li>
                          )
                        )}
                      </ol>
                    </div>
                  )}

                {aiRecommendation.timelineEstimate && (
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      Timeline Estimate
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {aiRecommendation.timelineEstimate}
                    </p>
                  </div>
                )}

                {aiRecommendation.costConsiderations && (
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      Cost Considerations
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300">
                      {aiRecommendation.costConsiderations}
                    </p>
                  </div>
                )}

                {aiRecommendation.personalizationFactors &&
                  aiRecommendation.personalizationFactors.length > 0 && (
                    <div className="bg-purple-100/50 dark:bg-purple-900/30 rounded-lg p-3">
                      <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        Personalization Factors
                      </h5>
                      <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                        {aiRecommendation.personalizationFactors.map(
                          (factor: string, index: number) => (
                            <li key={index}>• {factor}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>

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
                M365={scores.m365Copilot} | Studio={scores.copilotStudio} | Foundry={scores.foundry}{' '}
                | Agent={scores.agentBuilder} | Hybrid={scores.hybrid}
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

          {/* Key Decision Points (Platform Overlap Guidance) */}
          {recommendation.keyDecisionPoints && recommendation.keyDecisionPoints.length > 0 && (
            <div className="card bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
              <h3 className="text-xl font-semibold mb-4 text-purple-900 dark:text-purple-100 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Key Decision Points
              </h3>
              {recommendation.keyDecisionPoints.map((decisionPoint, dpIdx) => (
                <div key={dpIdx} className="mb-6 last:mb-0">
                  <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    {decisionPoint.question}
                  </h4>
                  <p className="text-purple-800 dark:text-purple-200 mb-4">
                    {decisionPoint.context}
                  </p>

                  {/* Comparison Table */}
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                      <thead className="bg-purple-100 dark:bg-purple-800">
                        <tr>
                          <th className="px-4 py-2 text-left text-purple-900 dark:text-purple-100 font-semibold">
                            Factor
                          </th>
                          <th className="px-4 py-2 text-left text-purple-900 dark:text-purple-100 font-semibold">
                            Copilot Studio
                          </th>
                          <th className="px-4 py-2 text-left text-purple-900 dark:text-purple-100 font-semibold">
                            Microsoft Foundry
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {decisionPoint.factors.map((factor, fIdx) => (
                          <tr
                            key={fIdx}
                            className="border-t border-purple-200 dark:border-purple-700"
                          >
                            <td className="px-4 py-3 font-medium text-purple-900 dark:text-purple-100">
                              {factor.factor}
                            </td>
                            <td className="px-4 py-3 text-purple-800 dark:text-purple-200">
                              {factor.studio}
                            </td>
                            <td className="px-4 py-3 text-purple-800 dark:text-purple-200">
                              {factor.foundry}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Recommendation Text */}
                  <div className="bg-purple-100 dark:bg-purple-800 rounded-lg p-4">
                    <p className="text-purple-900 dark:text-purple-100 whitespace-pre-line">
                      {decisionPoint.recommendation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Licensing Breakdown */}
          {recommendation.licensingBreakdown && (
            <div className="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
              <h3 className="text-xl font-semibold mb-4 text-green-900 dark:text-green-100 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
                Licensing & Cost Breakdown
              </h3>
              <p className="text-green-900 dark:text-green-100 mb-4">
                {recommendation.licensingBreakdown.description}
              </p>

              <div className="space-y-4 mb-6">
                {recommendation.licensingBreakdown.platforms
                  .filter(Boolean)
                  .map((platform, pIdx) => (
                    <div
                      key={pIdx}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-300 dark:border-green-600"
                    >
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        {platform!.platform}
                      </h4>
                      <div className="space-y-1 text-sm">
                        <div className="text-green-800 dark:text-green-200">
                          <span className="font-medium">Model:</span> {platform!.model}
                        </div>
                        <div className="text-green-800 dark:text-green-200">
                          <span className="font-medium">Cost:</span> {platform!.cost}
                        </div>
                        <div className="text-green-800 dark:text-green-200">
                          <span className="font-medium">Notes:</span> {platform!.notes}
                        </div>
                        <div className="text-green-700 dark:text-green-300 italic mt-2">
                          <span className="font-medium">Example:</span> {platform!.example}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="bg-green-100 dark:bg-green-800 rounded-lg p-4">
                <p className="text-green-900 dark:text-green-100 whitespace-pre-line">
                  {recommendation.licensingBreakdown.totalCostExample}
                </p>
              </div>
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

          {/* Strategic Comparison Infographic */}
          <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  Want the full picture?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-100">
                  View a one-page strategic comparison of all Microsoft AI solutions, licensing, and
                  a phased hybrid adoption strategy.
                </p>
              </div>
              <a
                href="/infographic.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-4"
              >
                View Infographic
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
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
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-300">
                      <span>M365: +{item.weights.m365Copilot}</span>
                      <span>Studio: +{item.weights.copilotStudio}</span>
                      <span>Foundry: +{item.weights.foundry}</span>
                      <span>Agent: +{item.weights.agentBuilder}</span>
                      <span>Hybrid: +{item.weights.hybrid}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center pt-4">
            {csamEmail && (
              <button onClick={handleEmailToCSAM} className="btn-primary">
                ✉️ Email to CSAM
              </button>
            )}
            <button onClick={handleExportJSON} className="btn-secondary">
              📥 Export JSON
            </button>
            <button onClick={handleExportMarkdown} className="btn-secondary">
              📄 Export Markdown
            </button>
            <button onClick={handleExportPDF} className="btn-secondary">
              📋 Export PDF
            </button>
            <button onClick={handleExportExecutiveOverviewPPTX} className="btn-secondary">
              📊 Executive Overview PPTX
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
