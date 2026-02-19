import { Link } from 'react-router-dom';
import { useWizardStore } from '../store/wizardStore';

export default function Landing() {
  const { reset, recommendation } = useWizardStore();

  const handleStartNew = () => {
    reset();
  };

  const hasResults = recommendation !== null;
  const ctaButtonClass =
    'inline-flex h-12 w-full max-w-full items-center justify-center rounded-xl px-5 text-base font-semibold transition-all duration-200 sm:w-auto sm:min-w-[12rem]';
  const sectionCtaButtonClass =
    'inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-base font-semibold transition-all duration-200 sm:w-[22rem]';
  const ctaButtonToneClass =
    'border border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30';

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-primary-50 px-6 py-10 text-center shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-primary-900/20 md:px-10">
        <div className="text-right mb-3">
          <span className="inline-flex rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
            v2.0.0
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
          Microsoft Agentic Solution Advisor
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-100 max-w-3xl mx-auto leading-relaxed">
          Expert guidance to help you determine which Microsoft agentic platform—Microsoft 365
          Copilot, Copilot Studio, Microsoft Foundry, or Microsoft Agent Framework—fits each
          specific use case in your organization.
        </p>
      </div>

      {/* Menu Options */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Link
          to="/wizard"
          onClick={handleStartNew}
          className="group h-full rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-blue-50 p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-lg dark:border-primary-700 dark:from-primary-900/20 dark:to-blue-900/20 dark:hover:border-primary-400"
        >
          <div className="flex h-full flex-col text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-800 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-primary-600 dark:text-primary-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Take Assessment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
              Answer guided questions to get a personalized platform recommendation for your
              specific scenario
            </p>
            <div
              className={`${ctaButtonClass} ${ctaButtonToneClass} mt-auto self-center shadow-sm`}
            >
              Start Now
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          to={hasResults ? '/results' : '#'}
          className={`group h-full rounded-2xl p-6 shadow-sm transition-all duration-200 ${
            hasResults
              ? 'border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 hover:-translate-y-0.5 hover:border-green-400 hover:shadow-lg dark:border-green-700 dark:from-green-900/20 dark:to-emerald-900/20 dark:hover:border-green-400'
              : 'border border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800'
          }`}
          onClick={(e) => {
            if (!hasResults) {
              e.preventDefault();
            }
          }}
        >
          <div className="flex h-full flex-col text-center">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                hasResults ? 'bg-green-100 dark:bg-green-800' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <svg
                className={`w-8 h-8 ${
                  hasResults
                    ? 'text-green-600 dark:text-green-300'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              View Last Results
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
              {hasResults
                ? 'See your previous assessment results and recommendation report'
                : 'Complete an assessment first to view results'}
            </p>
            {hasResults && (
              <div
                className={`${ctaButtonClass} ${ctaButtonToneClass} mt-auto self-center shadow-sm`}
              >
                View Report
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
            )}
            {!hasResults && (
              <div
                className={`${ctaButtonClass} mt-auto self-center border border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400`}
              >
                Not available
              </div>
            )}
          </div>
        </Link>

        <Link
          to="/use-cases"
          className="group h-full rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-lg dark:border-orange-700 dark:from-orange-900/20 dark:to-amber-900/20 dark:hover:border-orange-400"
        >
          <div className="flex h-full flex-col text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-800 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-orange-600 dark:text-orange-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Use Case Assistant + Roadmap
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
              Select industry, departments, and data sources to generate recommended use cases and a
              phased deployment roadmap in one flow
            </p>
            <div
              className={`${ctaButtonClass} ${ctaButtonToneClass} mt-auto self-center shadow-sm`}
            >
              Open assistant
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/30">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Readiness Assessment
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Score identity, data, security, platform, and operating model readiness before
              rollout.
            </p>
          </div>
          <Link to="/readiness" className={`${sectionCtaButtonClass} ${ctaButtonToneClass}`}>
            Run Readiness Assessment
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/30">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Microsoft Agentic Product Updates
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Latest Copilot Studio release milestones and Microsoft Foundry product news.
            </p>
          </div>

          <div className="flex h-full flex-col gap-3 md:w-auto md:items-end">
            <Link
              to="/copilot-studio-release-dates"
              className={`${sectionCtaButtonClass} ${ctaButtonToneClass} md:self-end`}
            >
              Copilot Studio Release Dates
            </Link>
            <Link
              to="/foundry-news"
              className={`${sectionCtaButtonClass} ${ctaButtonToneClass} md:self-end`}
            >
              Microsoft Foundry News
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/30">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Scoring Weights Diagram
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Visualize how each answer contributes weighted scores and how the final recommendation
              is selected.
            </p>
          </div>
          <a
            href="/scoring-weights-diagram.html"
            target="_blank"
            rel="noopener noreferrer"
            className={`${sectionCtaButtonClass} ${ctaButtonToneClass}`}
          >
            View diagram
          </a>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
          What This Tool Does
        </h2>
        <ul className="space-y-3 text-gray-700 dark:text-gray-100">
          <li className="flex items-start">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Guided Questionnaire:</strong> Answer questions about your specific scenario,
              including use case, audience, data, integrations, and governance needs.
            </span>
          </li>
          <li className="flex items-start">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Clear Recommendation:</strong> Get a data-driven recommendation for this
              specific scenario—whether to use Microsoft 365 Copilot, Copilot Studio, Microsoft
              Foundry, Agent Builder, or a hybrid combination of platforms.
            </span>
          </li>
          <li className="flex items-start">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Rationale & Next Steps:</strong> Understand why the recommendation fits and
              what to do next.
            </span>
          </li>
          <li className="flex items-start">
            <svg
              className="w-6 h-6 text-primary-600 dark:text-primary-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>
              <strong>Verified Sources:</strong> All guidance is based on official Microsoft Learn
              documentation.
            </span>
          </li>
        </ul>
      </div>

      <div className="card mb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
              Executive Overview (CxO)
            </h2>
            <p className="text-gray-600 dark:text-gray-200">
              Agentic AI changes how work gets done: teams shift from executing tasks to owning and
              steering outcomes. This section highlights what top management should prioritize to
              scale agentic implementations safely and measurably.
            </p>
          </div>
        </div>

        <div className="mt-5 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p className="text-sm text-gray-800 dark:text-gray-100">
            <strong>Principle:</strong> AI doesn’t replace humans; it amplifies human creativity,
            judgement, and collaboration.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Mindset & Behavior Shifts
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-100">
              <li>
                <strong>Understand the role of agentic AI:</strong> treat agents as collaborators
                that can perceive, plan, and act within defined boundaries.
              </li>
              <li>
                <strong>Adopt a co-creator mindset:</strong> move from “app operator” to
                “orchestrator”—define goals, constraints, and escalation paths.
              </li>
              <li>
                <strong>Workforce transformation:</strong> evolve roles into agent orchestrators,
                supervisors, and quality partners.
              </li>
              <li>
                <strong>Capability building & AI fluency:</strong> invest in skills so teams can
                safely review, refine, and integrate agent outputs.
              </li>
            </ul>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Top Management Priorities
            </h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-100">
              <li>
                <strong>Value creation focus:</strong> prioritize measurable business outcomes over
                “automation for automation’s sake.”
              </li>
              <li>
                <strong>Ethical & responsible use:</strong> enforce fairness, transparency, and
                accountability in design and operations.
              </li>
              <li>
                <strong>Validation & oversight:</strong> require quality gates, auditability, and
                human-in-the-loop controls for high-impact actions.
              </li>
              <li>
                <strong>Operating model:</strong> clarify ownership (product, risk, IT, security),
                and define how agents are built, approved, deployed, and monitored.
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-3">
              <img
                src="https://microsoft.github.io/powercat/images/m365-copilot-logo.png"
                alt="Microsoft 365 Copilot"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
              Microsoft 365 Copilot
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-100">
              AI-powered productivity in Word, Excel, PowerPoint, Outlook, Teams
            </p>
          </div>
        </div>

        <div className="card bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-3">
              <img
                src="https://microsoft.github.io/powercat/images/copilot-studio.png"
                alt="Copilot Studio"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Copilot Studio</h3>
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Build custom agents with workflows, connectors, and integrations
            </p>
          </div>
        </div>

        <div className="card bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-3">
              <img
                src="https://microsoft.github.io/powercat/images/ai-foundry.png"
                alt="Microsoft Foundry"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Microsoft Foundry</h3>
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Full-stack AI development with custom models, fine-tuning, and orchestration
            </p>
          </div>
        </div>

        <div className="card bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 bg-violet-100 dark:bg-violet-800">
              <svg
                className="w-8 h-8 text-violet-600 dark:text-violet-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 3v2.25M14.25 3v2.25M9.75 18.75V21M14.25 18.75V21M3 9.75h2.25M18.75 9.75H21M3 14.25h2.25M18.75 14.25H21"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7.5 6.75h9a.75.75 0 01.75.75v9a.75.75 0 01-.75.75h-9a.75.75 0 01-.75-.75v-9a.75.75 0 01.75-.75zm2.25 3h4.5m-4.5 2.25h4.5m-4.5 2.25h2.25"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
              Microsoft Agent Framework
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-100 mb-3">
              Framework-first option for building agentic apps and orchestration with developer
              control over tools, memory, and execution flow.
            </p>
            <a
              href="https://learn.microsoft.com/en-us/agent-framework/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-semibold text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
            >
              Learn more
              <svg className="ml-1.5 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>

      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 shadow-sm dark:border-blue-700 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Strategic Comparison Infographic
            </h2>
            <p className="text-gray-600 dark:text-gray-100 text-sm">
              View a one-page visual summary of all Microsoft AI solutions, licensing, best-fit
              scenarios, and a phased hybrid adoption strategy.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-infographic-modal'))}
            className={`${ctaButtonClass} ${ctaButtonToneClass} ml-4 flex-shrink-0`}
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
          </button>
        </div>
      </div>

      <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <div className="flex">
          <svg
            className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
              Important Note
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              This tool provides informational guidance based on official Microsoft Learn
              documentation. It is not official Microsoft guidance. Always consult with Microsoft
              representatives and your IT leadership for final architecture and licensing decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
