import { Link } from 'react-router-dom';
import { useWizardStore } from '../store/wizardStore';
import { CopilotAgent } from '../components/CopilotAgent';

export default function Landing() {
  const { reset, recommendation } = useWizardStore();

  const handleStartNew = () => {
    reset();
  };

  const hasResults = recommendation !== null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="text-right mb-2">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">v2.0.0</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Microsoft Agentic Solution Advisor
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-100 max-w-2xl mx-auto">
          Expert guidance to help you determine which Microsoft agentic platform—Microsoft 365
          Copilot, Copilot Studio, or Microsoft Foundry—fits each specific use case in your
          organization.
        </p>
      </div>

      {/* Menu Options */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Link
          to="/wizard"
          onClick={handleStartNew}
          className="card hover:shadow-xl transition-all border-2 border-primary-200 dark:border-primary-700 hover:border-primary-500 dark:hover:border-primary-400 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20"
        >
          <div className="text-center">
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
            <div className="text-primary-600 dark:text-primary-400 font-semibold inline-flex items-center">
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
          className={`card transition-all border-2 ${
            hasResults
              ? 'hover:shadow-xl border-green-200 dark:border-green-700 hover:border-green-500 dark:hover:border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-60 cursor-not-allowed'
          }`}
          onClick={(e) => {
            if (!hasResults) {
              e.preventDefault();
            }
          }}
        >
          <div className="text-center">
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
              <div className="text-green-600 dark:text-green-400 font-semibold inline-flex items-center">
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
              <div className="text-gray-400 dark:text-gray-500 text-sm italic">Not available</div>
            )}
          </div>
        </Link>

        <Link
          to="/roadmap"
          className="card hover:shadow-xl transition-all border-2 border-orange-200 dark:border-orange-700 hover:border-orange-500 dark:hover:border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20"
        >
          <div className="text-center">
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
              Generate Roadmap
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
              Create a phased deployment roadmap with M365 Copilot, Copilot Studio, and Azure AI
              Foundry
            </p>
            <div className="text-orange-600 dark:text-orange-400 font-semibold inline-flex items-center">
              Build Roadmap
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

      <div className="card mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Copilot Studio release dates
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-100">
              View upcoming Public Preview and GA dates from the Power Platform Release Planner.
            </p>
          </div>
          <Link
            to="/copilot-studio-release-dates"
            className="btn btn-primary w-full md:w-auto text-center"
          >
            View dates
          </Link>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
      </div>

      <div className="card mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700">
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
          <a
            href="/infographic.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors flex-shrink-0 ml-4"
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

      <div className="mt-12 mb-8">
        <CopilotAgent variant="inline" />
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
