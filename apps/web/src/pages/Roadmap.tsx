import { useState } from 'react';
import { Link } from 'react-router-dom';

interface UseCase {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'automation' | 'custom' | 'ai-development';
}

interface RoadmapPhase {
  phase: number;
  title: string;
  platform: 'M365 Copilot' | 'Copilot Studio' | 'Azure AI Foundry';
  timeline: string;
  useCases: string[];
  rationale: string;
  prerequisites: string[];
  deliverables: string[];
  successMetrics: string[];
}

const USE_CASES: UseCase[] = [
  {
    id: 'productivity',
    name: 'Enhance Employee Productivity',
    description: 'Summarize documents, draft emails, analyze data in Microsoft 365 apps',
    category: 'productivity',
  },
  {
    id: 'knowledge_qa',
    name: 'Knowledge Base Q&A',
    description: 'Answer questions from company documents and SharePoint content',
    category: 'productivity',
  },
  {
    id: 'meeting_summary',
    name: 'Meeting Summaries & Action Items',
    description: 'Automatically summarize Teams meetings and track action items',
    category: 'productivity',
  },
  {
    id: 'customer_support',
    name: 'Customer Support Chatbot',
    description: 'Automate customer inquiries with custom agent and escalation workflows',
    category: 'automation',
  },
  {
    id: 'hr_onboarding',
    name: 'HR Onboarding Assistant',
    description: 'Guide new employees through onboarding processes and answer HR questions',
    category: 'automation',
  },
  {
    id: 'sales_assistant',
    name: 'Sales Process Automation',
    description: 'Automate lead qualification, CRM updates, and sales documentation',
    category: 'automation',
  },
  {
    id: 'compliance_agent',
    name: 'Compliance & Policy Agent',
    description: 'Answer compliance questions and ensure policy adherence across workflows',
    category: 'automation',
  },
  {
    id: 'custom_workflow',
    name: 'Custom Business Process Agent',
    description: 'Build specialized agent for unique line-of-business processes',
    category: 'custom',
  },
  {
    id: 'data_integration',
    name: 'Multi-System Data Integration',
    description: 'Connect multiple enterprise systems with intelligent data orchestration',
    category: 'custom',
  },
  {
    id: 'advanced_ai',
    name: 'Advanced AI with Custom Models',
    description: 'Fine-tune models, implement RAG patterns, or multi-agent orchestration',
    category: 'ai-development',
  },
  {
    id: 'domain_specific',
    name: 'Domain-Specific AI Solution',
    description: 'Build industry-specific AI requiring custom training and specialized models',
    category: 'ai-development',
  },
];

export default function Roadmap() {
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const toggleUseCase = (id: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(id) ? prev.filter((caseId) => caseId !== id) : [...prev, id]
    );
  };

  const generateRoadmap = () => {
    setGenerating(true);

    // Analyze selected use cases and generate phased roadmap
    const phases: RoadmapPhase[] = [];
    const selectedCases = USE_CASES.filter((uc) => selectedUseCases.includes(uc.id));

    let currentPhase = 1;

    // Phase 1: Microsoft 365 Copilot (if productivity use cases selected)
    const productivityCases = selectedCases.filter((uc) => uc.category === 'productivity');
    if (productivityCases.length > 0) {
      phases.push({
        phase: currentPhase++,
        title: 'Foundation - Microsoft 365 Copilot',
        platform: 'M365 Copilot',
        timeline: '1-2 months',
        useCases: productivityCases.map((uc) => uc.name),
        rationale:
          'Start with M365 Copilot to deliver immediate productivity value with minimal setup. This builds AI literacy and demonstrates ROI quickly.',
        prerequisites: [
          'Microsoft 365 E3 or E5 licenses',
          'Azure Active Directory configured',
          'Data governance policies established',
          'Change management and training plan',
        ],
        deliverables: [
          'M365 Copilot licenses assigned to pilot group',
          'User training sessions completed',
          'Adoption metrics dashboard',
          'Feedback collection process',
        ],
        successMetrics: [
          'User adoption rate >60% in pilot group',
          'Average 30min/week time savings per user',
          'User satisfaction score >4/5',
          'Document drafting time reduced by 25%',
        ],
      });
    }

    // Phase 2: Copilot Studio (if automation or custom cases selected)
    const automationCases = selectedCases.filter(
      (uc) => uc.category === 'automation' || uc.category === 'custom'
    );
    if (automationCases.length > 0) {
      phases.push({
        phase: currentPhase++,
        title: 'Expansion - Copilot Studio',
        platform: 'Copilot Studio',
        timeline: '2-4 months',
        useCases: automationCases.map((uc) => uc.name),
        rationale:
          'Build on M365 Copilot foundation with custom agents for business-specific processes. Leverage low-code platform for faster development.',
        prerequisites: [
          'Power Platform environment configured',
          'Copilot Studio licenses acquired',
          'Developer/citizen developer team identified',
          'Line-of-business data connectors mapped',
          'API access to required systems',
        ],
        deliverables: [
          'Custom agents deployed for each use case',
          'Integration with line-of-business systems',
          'User acceptance testing completed',
          'Support documentation and runbooks',
        ],
        successMetrics: [
          'Process automation reducing manual effort by 40%',
          'Average response time <2 minutes for common queries',
          'Agent accuracy >85%',
          'Successful escalation rate <10%',
        ],
      });
    }

    // Phase 3: Azure AI Foundry (if advanced AI cases selected)
    const aiDevCases = selectedCases.filter((uc) => uc.category === 'ai-development');
    if (aiDevCases.length > 0) {
      phases.push({
        phase: currentPhase++,
        title: 'Advanced AI - Azure AI Foundry',
        platform: 'Azure AI Foundry',
        timeline: '4-6 months',
        useCases: aiDevCases.map((uc) => uc.name),
        rationale:
          'Implement advanced AI capabilities requiring custom models, fine-tuning, or multi-agent orchestration. Provides full control and customization.',
        prerequisites: [
          'Azure subscription with AI services enabled',
          'Data science/ML engineering team',
          'Training data prepared and validated',
          'MLOps infrastructure established',
          'Model governance framework',
        ],
        deliverables: [
          'Custom AI models trained and deployed',
          'RAG patterns implemented with vector search',
          'Multi-agent orchestration framework',
          'Monitoring and observability dashboards',
          'Model versioning and rollback procedures',
        ],
        successMetrics: [
          'Model accuracy >90% on validation set',
          'Response latency <500ms at p95',
          'Cost per inference <$0.01',
          'Model drift detection and retraining automated',
        ],
      });
    }

    // If no use cases selected, provide guidance
    if (phases.length === 0) {
      phases.push({
        phase: 1,
        title: 'Getting Started - Discovery Phase',
        platform: 'M365 Copilot',
        timeline: '1 month',
        useCases: ['Evaluate organizational readiness and identify priority use cases'],
        rationale:
          'Begin with discovery to understand specific needs and build a tailored roadmap.',
        prerequisites: [
          'Executive sponsorship',
          'Budget allocated for pilot',
          'IT infrastructure assessment',
        ],
        deliverables: [
          'Use case prioritization matrix',
          'Technical readiness assessment',
          'License and cost estimates',
          'Project charter and timeline',
        ],
        successMetrics: [
          'Stakeholder alignment achieved',
          'Priority use cases identified',
          'Pilot plan approved',
        ],
      });
    }

    setTimeout(() => {
      setRoadmap(phases);
      setGenerating(false);
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }, 1000);
  };

  const categoryLabels = {
    productivity: 'Productivity & Knowledge',
    automation: 'Process Automation',
    custom: 'Custom Business Processes',
    'ai-development': 'Advanced AI Development',
  };

  const categoryColors = {
    productivity: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
    automation: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
    custom: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
    'ai-development': 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
  };

  const groupedUseCases = USE_CASES.reduce(
    (acc, useCase) => {
      if (!acc[useCase.category]) {
        acc[useCase.category] = [];
      }
      acc[useCase.category].push(useCase);
      return acc;
    },
    {} as Record<string, UseCase[]>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Link
          to="/"
          className="text-primary-600 dark:text-primary-400 hover:underline mb-4 inline-block"
        >
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Microsoft Copilot Deployment Roadmap Generator
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-100">
          Select your organization's use cases to generate a phased implementation roadmap starting
          with Microsoft 365 Copilot, expanding to Copilot Studio, and advancing to Azure AI Foundry
          when needed.
        </p>
      </div>

      {!roadmap && (
        <>
          <div className="card mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Select Your Use Cases
            </h2>
            <p className="text-gray-600 dark:text-gray-100 mb-6">
              Choose one or more use cases that align with your organization's goals. The roadmap
              will recommend the optimal platform(s) and implementation sequence.
            </p>

            <div className="space-y-6">
              {Object.entries(groupedUseCases).map(([category, cases]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {cases.map((useCase) => (
                      <label
                        key={useCase.id}
                        className={`card cursor-pointer border-2 transition-all hover:shadow-md ${
                          selectedUseCases.includes(useCase.id)
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : categoryColors[category as keyof typeof categoryColors]
                        }`}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={selectedUseCases.includes(useCase.id)}
                            onChange={() => toggleUseCase(useCase.id)}
                            className="mt-1 h-5 w-5 text-primary-600 focus:ring-primary-500 rounded"
                          />
                          <div className="ml-3">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {useCase.name}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-200 mt-1">
                              {useCase.description}
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={generateRoadmap}
              disabled={generating}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 text-lg"
            >
              {generating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
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
                  Generating Roadmap...
                </>
              ) : (
                <>
                  Generate Deployment Roadmap
                  <svg
                    className="ml-2 w-5 h-5 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </button>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
              {selectedUseCases.length === 0
                ? 'Select at least one use case to generate a roadmap'
                : `${selectedUseCases.length} use case${selectedUseCases.length > 1 ? 's' : ''} selected`}
            </p>
          </div>
        </>
      )}

      {roadmap && (
        <div className="space-y-8">
          <div className="card bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700">
            <h2 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
              ✓ Roadmap Generated
            </h2>
            <p className="text-green-700 dark:text-green-300">
              Based on your selected use cases, here's your phased implementation roadmap with clear
              rationale for each platform choice.
            </p>
          </div>

          {roadmap.map((phase) => (
            <div
              key={phase.phase}
              className="card border-l-4 border-primary-500 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-850"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    PHASE {phase.phase}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {phase.title}
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                    Timeline: {phase.timeline}
                  </div>
                </div>
                <div className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-700 dark:text-primary-300 font-semibold">
                  {phase.platform}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Use Cases</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-200">
                    {phase.useCases.map((uc, idx) => (
                      <li key={idx}>{uc}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Why {phase.platform}?
                  </h4>
                  <p className="text-gray-700 dark:text-gray-200">{phase.rationale}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Prerequisites
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {phase.prerequisites.map((prereq, idx) => (
                        <li key={idx}>{prereq}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Key Deliverables
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {phase.deliverables.map((deliverable, idx) => (
                        <li key={idx}>{deliverable}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Success Metrics
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {phase.successMetrics.map((metric, idx) => (
                      <li key={idx}>{metric}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Implementation Best Practices
            </h3>
            <ul className="space-y-2 text-blue-800 dark:text-blue-200">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>
                  <strong>Start small, prove value:</strong> Begin with pilot groups to demonstrate
                  ROI before enterprise-wide rollout
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>
                  <strong>Build on success:</strong> Each phase leverages learnings from the
                  previous, reducing risk and technical debt
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>
                  <strong>Governance first:</strong> Establish data policies and security controls
                  before deploying AI tools
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>
                  <strong>Change management:</strong> Invest in training and adoption support to
                  maximize value realization
                </span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setRoadmap(null);
                setSelectedUseCases([]);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn-secondary"
            >
              ← Generate New Roadmap
            </button>
            <button onClick={() => window.print()} className="btn-secondary">
              🖨️ Print Roadmap
            </button>
            <Link to="/wizard" className="btn-primary">
              Take Full Assessment →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
