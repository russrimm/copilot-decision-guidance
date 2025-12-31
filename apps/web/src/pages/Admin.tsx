import { Link } from 'react-router-dom';

export default function Admin() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-primary-600 hover:underline text-sm">
          ← Back to Home
        </Link>
      </div>

      <div className="card">
        <h1 className="text-3xl font-bold mb-4 dark:text-white">Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-200 mb-6">
          Configuration and monitoring dashboard (local-only, not for production use)
        </p>

        <div className="space-y-6">
          <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex">
              <svg
                className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                  Local Use Only
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This admin panel is for local development and testing. In a production deployment,
                  admin features should be properly secured with authentication and authorization.
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3 dark:text-white">
              Decision Model Configuration
            </h2>
            <div className="card bg-gray-50 dark:bg-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
                The decision model (questions, weights, thresholds) is stored in:
              </p>
              <code className="block p-3 bg-white dark:bg-gray-800 dark:text-gray-100 rounded text-sm font-mono">
                packages/decision-engine/src/data/decision-model.v1.json
              </code>
              <p className="text-sm text-gray-600 dark:text-gray-200 mt-4">
                To modify questions or weights, edit this file and restart the application.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3 dark:text-white">Telemetry & Analytics</h2>
            <div className="card bg-gray-50 dark:bg-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-200">
                In a production implementation, this section would display:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-200 mt-2 space-y-1">
                <li>Number of questionnaires completed</li>
                <li>Distribution of recommendations (M365 vs Studio vs Hybrid)</li>
                <li>Average confidence levels</li>
                <li>Question answer patterns</li>
              </ul>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-4 italic">
                For MVP, telemetry is stored in browser local storage only.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3 dark:text-white">Environment Status</h2>
            <div className="card bg-gray-50 dark:bg-gray-700">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-200">Decision Model Version:</span>
                  <span className="font-mono dark:text-gray-100">v1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-200">API Backend:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-200">AI Mode:</span>
                  <span className="font-mono text-gray-600 dark:text-gray-200">
                    Deterministic (No AI keys configured)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3 dark:text-white">Quick Actions</h2>
            <div className="flex gap-3">
              <button onClick={() => localStorage.clear()} className="btn-secondary">
                Clear Local Storage
              </button>
              <button onClick={() => window.location.reload()} className="btn-secondary">
                Reload App
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
