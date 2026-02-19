import React, { useEffect, useState } from 'react';
import type { UseCase } from '../types/use-cases';
import { getFriendlyApiErrorMessage } from '../lib/errorMessages';

function RightChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function PresentationIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4h18v10H3V4zm7 10v6m4-6v6M8 20h8"
      />
    </svg>
  );
}

interface Vertical {
  id: string;
  label: string;
  icon: string;
}

interface Department {
  id: string;
  label: string;
  icon: string;
}

interface DataSource {
  id: string;
  label: string;
  icon: string;
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

export default function UseCaseAssistant() {
  const [step, setStep] = useState<'vertical' | 'departments' | 'datasources' | 'results'>(
    'vertical'
  );
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);

  const [selectedVertical, setSelectedVertical] = useState<string>('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [expandedUseCase, setExpandedUseCase] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [vertRes, deptRes, dsRes] = await Promise.all([
          fetch('/api/use-cases/verticals'),
          fetch('/api/use-cases/departments'),
          fetch('/api/use-cases/data-sources'),
        ]);

        if (vertRes.ok) setVerticals(await vertRes.json());
        if (deptRes.ok) setDepartments(await deptRes.json());
        if (dsRes.ok) setDataSources(await dsRes.json());
      } catch (error) {
        console.error('Failed to load use case options:', error);
      }
    };

    loadData();
  }, []);

  const handleVerticalSelect = (verticalId: string) => {
    setSelectedVertical(verticalId);
    setStep('departments');
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  };

  const toggleDataSource = (dsId: string) => {
    setSelectedDataSources((prev) =>
      prev.includes(dsId) ? prev.filter((d) => d !== dsId) : [...prev, dsId]
    );
  };

  const generateRoadmap = (generatedUseCases: UseCase[]): RoadmapPhase[] => {
    const selectedDepartmentIds = new Set(selectedDepartments);
    const selectedDataSourceIds = new Set(selectedDataSources);

    const advancedDataSources = new Set([
      'fabric',
      'snowflake',
      'azure-datalake',
      'scada',
      'historian',
    ]);
    const advancedDepartments = new Set([
      'engineering',
      'it',
      'operations',
      'production',
      'geosciences',
      'maintenance',
    ]);

    const hasAdvancedSignals =
      [...selectedDataSourceIds].some((id) => advancedDataSources.has(id)) ||
      [...selectedDepartmentIds].some((id) => advancedDepartments.has(id)) ||
      generatedUseCases.length >= 4;

    const useCaseTitles = generatedUseCases.map((entry) => entry.title);
    const phase1UseCases = useCaseTitles.slice(0, 2);
    const phase2UseCases = useCaseTitles.slice(2, 4);
    const phase3UseCases = useCaseTitles.slice(4);

    const selectedVerticalLabel =
      verticals.find((vertical) => vertical.id === selectedVertical)?.label || 'selected industry';
    const selectedDepartmentLabels = departments
      .filter((department) => selectedDepartments.includes(department.id))
      .map((department) => department.label);
    const selectedDataSourceLabels = dataSources
      .filter((source) => selectedDataSources.includes(source.id))
      .map((source) => source.label);

    const departmentScopeText =
      selectedDepartmentLabels.length > 0
        ? selectedDepartmentLabels.join(', ')
        : 'Enterprise-wide (all core departments)';

    const phases: RoadmapPhase[] = [
      {
        phase: 1,
        title: 'Foundation & Adoption',
        platform: 'M365 Copilot',
        timeline: '0-30 days',
        useCases:
          phase1UseCases.length > 0
            ? phase1UseCases
            : ['Pilot high-impact productivity and knowledge scenarios'],
        rationale: `Establish quick wins for ${selectedVerticalLabel} teams and build user adoption with low-friction, high-visibility scenarios across ${departmentScopeText}.`,
        prerequisites: [
          'Pilot user cohort and business owner alignment',
          'Content access controls and compliance review',
          'Success metrics baseline and adoption plan',
        ],
        deliverables: [
          'Pilot rollout and enablement sessions completed',
          'Top use cases validated with business stakeholders',
          'Adoption dashboard and feedback loop active',
        ],
        successMetrics: [
          'Pilot adoption rate above 60%',
          'Documented weekly time savings per user',
          'Positive stakeholder feedback on usability and relevance',
        ],
      },
      {
        phase: 2,
        title: 'Process Automation & Scale',
        platform: 'Copilot Studio',
        timeline: '31-60 days',
        useCases:
          phase2UseCases.length > 0
            ? phase2UseCases
            : useCaseTitles.slice(0, Math.min(3, useCaseTitles.length)),
        rationale:
          'Convert validated scenarios into governed copilots with business process automation, approvals, and integrations.',
        prerequisites: [
          'Copilot Studio environment and governance controls configured',
          'Process owners identified for each selected department',
          `Source systems connected${selectedDataSourceLabels.length > 0 ? ` (${selectedDataSourceLabels.join(', ')})` : ''}`,
        ],
        deliverables: [
          'Department-ready copilots deployed with testing sign-off',
          'Escalation paths and monitoring dashboards implemented',
          'Runbook and ownership model published',
        ],
        successMetrics: [
          'Reduced manual effort in prioritized workflows',
          'Improved response/turnaround time for key requests',
          'Stable run-time quality with low escalation rate',
        ],
      },
    ];

    if (hasAdvancedSignals) {
      phases.push({
        phase: 3,
        title: 'Advanced Intelligence & Optimization',
        platform: 'Azure AI Foundry',
        timeline: '61-90 days',
        useCases:
          phase3UseCases.length > 0
            ? phase3UseCases
            : ['Advanced analytics, orchestration, and optimization scenarios'],
        rationale:
          'Introduce advanced AI patterns (RAG, specialized models, multi-agent orchestration) for complex or data-intensive operations.',
        prerequisites: [
          'Data architecture and model governance approved',
          'Telemetry and evaluation framework in place',
          'Engineering ownership for advanced AI lifecycle management',
        ],
        deliverables: [
          'Advanced AI workflows deployed with observability',
          'Performance/cost guardrails and quality checks enabled',
          'Iterative optimization backlog established',
        ],
        successMetrics: [
          'Improved decision quality and automation depth',
          'Target latency/cost thresholds maintained',
          'Repeatable model and prompt improvement cycle active',
        ],
      });
    }

    return phases;
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/use-cases/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vertical: selectedVertical,
          departments: selectedDepartments,
          dataSources: selectedDataSources,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setUseCases(result.useCases);
        setRoadmap(generateRoadmap(result.useCases));
        setStep('results');
      } else {
        const friendlyError = await getFriendlyApiErrorMessage(
          response,
          'Failed to generate use cases'
        );
        console.error('Failed to generate use cases:', friendlyError);
      }
    } catch (error) {
      console.error('Failed to generate use cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (useCase: UseCase) => {
    try {
      window.location.href = `/api/use-cases/export/pdf/${useCase.id}`;
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleExportPPTX = async (useCase: UseCase) => {
    try {
      window.location.href = `/api/use-cases/export/pptx/${useCase.id}`;
    } catch (error) {
      console.error('Failed to export PPTX:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Use Case Assistant
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Discover AI-powered solutions tailored to your organization
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {['vertical', 'departments', 'datasources', 'results'].map((s, idx) => (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                    ['vertical', 'departments', 'datasources', 'results'].indexOf(step) >= idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ['vertical', 'departments', 'datasources', 'results'].indexOf(step) > idx
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-400">
            <span>Industry</span>
            <span>Departments</span>
            <span>Data Sources</span>
            <span>Results</span>
          </div>
        </div>

        {/* Step 1: Vertical Selection */}
        {step === 'vertical' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Select Your Industry
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {verticals.map((vertical) => (
                <button
                  key={vertical.id}
                  onClick={() => handleVerticalSelect(vertical.id)}
                  className="p-6 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                >
                  <div className="text-3xl mb-2">{vertical.icon}</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{vertical.label}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Department Selection */}
        {step === 'departments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Select Departments (Optional)
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose the departments you want to focus on. Leave empty to see all use cases.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => toggleDepartment(dept.id)}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    selectedDepartments.includes(dept.id)
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{dept.icon}</div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {dept.label}
                  </h3>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep('vertical')} className="btn-secondary">
                Back
              </button>
              <button onClick={() => setStep('datasources')} className="btn-primary">
                Continue <RightChevronIcon className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Data Source Selection */}
        {step === 'datasources' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Select Data Sources (Optional)
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Choose the data sources you're working with. Leave empty to see all use cases.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {dataSources.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => toggleDataSource(ds.id)}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    selectedDataSources.includes(ds.id)
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{ds.icon}</div>
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">{ds.label}</h3>
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep('departments')} className="btn-secondary">
                Back
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary w-full md:w-auto md:ml-auto disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Generating...' : 'Generate Use Cases'}
                <RightChevronIcon className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && (
          <div>
            <div className="mb-6 flex gap-4">
              <button onClick={() => setStep('datasources')} className="btn-secondary">
                Back
              </button>
              <button onClick={() => setStep('vertical')} className="btn-secondary">
                Start Over
              </button>
            </div>

            {useCases.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No use cases found for your selection. Please try different criteria.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {roadmap.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Recommended Deployment Roadmap
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      Built from your selected industry, intended departments, data sources, and
                      generated use cases.
                    </p>

                    <div className="grid gap-4 md:grid-cols-3">
                      {roadmap.map((phase) => (
                        <div
                          key={phase.phase}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Phase {phase.phase}: {phase.title}
                            </h3>
                          </div>
                          <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">
                            {phase.platform} • {phase.timeline}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {phase.rationale}
                          </p>

                          <div className="space-y-3 text-sm">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                                Use Cases
                              </p>
                              <ul className="space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                                {phase.useCases.map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white mb-1">
                                Prerequisites
                              </p>
                              <ul className="space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                                {phase.prerequisites.map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {useCases.length} Recommended Use Cases
                </h2>

                {useCases.map((useCase) => (
                  <div
                    key={useCase.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <button
                      onClick={() =>
                        setExpandedUseCase(expandedUseCase === useCase.id ? null : useCase.id)
                      }
                      className="w-full p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {useCase.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">{useCase.description}</p>
                        </div>
                        <RightChevronIcon
                          className={`w-6 h-6 text-gray-400 transition-transform ${
                            expandedUseCase === useCase.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </button>

                    {expandedUseCase === useCase.id && (
                      <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 p-6">
                        {/* Agent Architecture */}
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Agent Architecture
                          </h4>
                          <div className="bg-white dark:bg-gray-800 rounded p-4 mb-3">
                            <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {useCase.agentArchitecture.name}
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                              {useCase.agentArchitecture.overview}
                            </p>
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Components:
                              </p>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                                {useCase.agentArchitecture.components.map((comp, idx) => (
                                  <li key={idx}>• {comp}</li>
                                ))}
                              </ul>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                              <span className="font-medium">Data Flow:</span>{' '}
                              {useCase.agentArchitecture.dataFlow}
                            </p>
                          </div>
                        </div>

                        {/* Implementation */}
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Implementation Roadmap
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white dark:bg-gray-800 rounded p-4">
                              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Phase 1
                              </h5>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {useCase.implementation.phase1.map((item, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-blue-600">✓</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded p-4">
                              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Phase 2
                              </h5>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {useCase.implementation.phase2.map((item, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-blue-600">✓</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded p-4">
                              <h5 className="font-semibold text-gray-900 dark:text-white mb-2">
                                Phase 3
                              </h5>
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {useCase.implementation.phase3.map((item, idx) => (
                                  <li key={idx} className="flex gap-2">
                                    <span className="text-blue-600">✓</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded p-4">
                            <p className="text-sm">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                Estimated Timeline:
                              </span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">
                                {useCase.implementation.estimatedTimelineWeeks} weeks
                              </span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                Skills Required:
                              </span>
                            </p>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 mt-1">
                              {useCase.implementation.skillsRequired.map((skill, idx) => (
                                <li key={idx}>• {skill}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* ROI */}
                        <div className="mb-8">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Business Impact & ROI
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                            <div className="bg-white dark:bg-gray-800 rounded p-4 text-center">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {useCase.roi.timeSavingsPercentage}%
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Time Savings
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded p-4 text-center">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {useCase.roi.costReductionPercentage}%
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Cost Reduction
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded p-4 text-center">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {useCase.roi.productivityGainPercentage}%
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Productivity
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded p-4 text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {useCase.roi.paybackPeriodMonths}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Payback (months)
                              </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded p-4 text-center">
                              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {useCase.roi.estimatedAnnualValue}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Annual Value
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Export Options */}
                        <div className="flex gap-4">
                          <button
                            onClick={() => handleExportPDF(useCase)}
                            className="btn-primary flex-1"
                          >
                            <FileIcon className="w-5 h-5" />
                            Export PDF
                          </button>
                          <button
                            onClick={() => handleExportPPTX(useCase)}
                            className="btn-secondary flex-1"
                          >
                            <PresentationIcon className="w-5 h-5" />
                            Export PowerPoint
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
