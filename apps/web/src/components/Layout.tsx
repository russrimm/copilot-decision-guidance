import { Outlet, Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <svg
                className="w-8 h-8 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Copilot Decision Guidance
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  Microsoft 365 Copilot vs Copilot Studio
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {!isAdmin && (
                <nav className="flex space-x-4">
                  <Link
                    to="/"
                    className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Home
                  </Link>
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                    title="Admin panel"
                  >
                    Admin
                  </Link>
                </nav>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500 dark:text-gray-200">
            Built with verified guidance from{' '}
            <a
              href="https://learn.microsoft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Microsoft Learn
            </a>
          </p>
          <p className="text-center text-xs text-gray-400 dark:text-gray-400 mt-2">
            v1.0 | Not official Microsoft guidance | For informational purposes only
          </p>
        </div>
      </footer>
    </div>
  );
}
