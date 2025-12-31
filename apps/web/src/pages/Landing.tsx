import { Link } from 'react-router-dom';
import { useWizardStore } from '../store/wizardStore';

export default function Landing() {
  const reset = useWizardStore((state) => state.reset);

  const handleStartNew = () => {
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="text-right mb-2">
          <span className="text-[10px] text-gray-400 dark:text-gray-500">v1.2.1</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Choose Your Copilot Path
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-100 max-w-2xl mx-auto">
          A guided decision tool to help you determine the best approach for your specific scenario:
          Microsoft 365 Copilot for productivity, Copilot Studio for custom agents, or both working
          together.
        </p>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg max-w-3xl mx-auto">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> Most organizations use both products. This tool provides
            per-scenario guidance to help you decide which approach fits each use case.
          </p>
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
              specific scenario—whether to use Microsoft 365 Copilot, build a custom Copilot Studio
              agent, or combine both approaches.
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

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-full mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
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
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 dark:bg-green-500 text-white rounded-full mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Copilot Studio</h3>
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Build custom agents with workflows, connectors, and integrations
            </p>
          </div>
        </div>

        <div className="card bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-600 dark:bg-purple-500 text-white rounded-full mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                />
              </svg>
            </div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Hybrid Approach</h3>
            <p className="text-sm text-gray-600 dark:text-gray-100">
              Combine both for comprehensive productivity and custom automation
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/wizard"
          onClick={handleStartNew}
          className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-primary-600 dark:bg-primary-500 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
        >
          Start the Questionnaire
          <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-300">
          Takes approximately 5 minutes to complete
        </p>
      </div>

      <div className="mt-12 p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
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
