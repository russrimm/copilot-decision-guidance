import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { ImplementationGuideUpdateBanner } from './ImplementationGuideUpdateBanner';

export default function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';
  const [isInfographicOpen, setIsInfographicOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setIsInfographicOpen(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsInfographicOpen(false);
      }
    };

    window.addEventListener('open-infographic-modal', onOpen);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('open-infographic-modal', onOpen);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm transition-colors">
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
                  Microsoft Agentic Solution Advisor
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  Platform Decision & Planning
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
                    to="/use-cases"
                    className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Use Case Assistant
                  </Link>
                  <Link
                    to="/readiness"
                    className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Readiness
                  </Link>
                  <Link
                    to="/implementation-guide"
                    className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Implementation Guide
                  </Link>
                  <Link
                    to="/mind-maps"
                    className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Mind Maps
                  </Link>
                  <Link
                    to="/executive-overview"
                    className="text-sm font-medium text-gray-700 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Executive Overview
                  </Link>
                </nav>
              )}
              <a
                href="https://www.linkedin.com/in/russrimm/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 dark:border-gray-600 text-[#0A66C2] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="LinkedIn"
                aria-label="LinkedIn"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                  <path d="M20.45 20.45h-3.56v-5.58c0-1.33-.02-3.03-1.84-3.03-1.84 0-2.12 1.44-2.12 2.93v5.68H9.37V9h3.42v1.56h.05c.48-.9 1.63-1.84 3.35-1.84 3.59 0 4.26 2.36 4.26 5.43v6.3ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.56V9h3.56v11.45Z" />
                </svg>
              </a>

              <Link
                to="/profile-summary"
                className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="About"
                aria-label="About"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 10v6" />
                  <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
                </svg>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ImplementationGuideUpdateBanner />
        <Outlet />
      </main>

      {isInfographicOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Strategic Comparison Infographic
              </h2>
              <button
                type="button"
                onClick={() => setIsInfographicOpen(false)}
                className="btn btn-secondary !h-9 px-3"
              >
                Close
              </button>
            </div>
            <iframe
              src="/infographic.html"
              title="Strategic Comparison Infographic"
              className="h-[80vh] w-full bg-white"
            />
          </div>
        </div>
      )}

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
            </a>{' '}
            and the{' '}
            <a
              href="https://microsoft.github.io/Microsoft-AI-Decision-Framework/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Microsoft AI Decision Framework
            </a>
          </p>
          <p className="text-center text-xs text-gray-400 dark:text-gray-400 mt-2">
            v2.0.0 | Not official Microsoft guidance | For informational purposes only
          </p>
        </div>
      </footer>
    </div>
  );
}
