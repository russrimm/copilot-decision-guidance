import { Link } from 'react-router-dom';

export default function ProfileSummary() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              About This Tool
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              Microsoft Agentic Solution Advisor - Platform Decision & Planning
            </p>
          </div>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>

      <div className="card">
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

      <div className="card space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          About Russ Rimmerman
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-200 mb-4">
          Summary based on publicly visible LinkedIn profile highlights.
        </p>

        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Short Bio</h3>
          <p className="text-sm text-gray-700 dark:text-gray-100 leading-6">
            Russ Rimmerman is a Principal Cloud Solution Architect at Microsoft with more than 30
            years of technology experience. He has a background that spans infrastructure,
            architecture, customer delivery, and technical leadership across enterprise scenarios.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Agentic Development Focus
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-100 leading-6">
            His work emphasizes agentic-powered development from early prototypes through
            production-ready solutions. That includes practical experimentation, validation,
            integration patterns, and operational readiness so teams can move from idea to reliable
            enterprise deployment.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Featured Video
          </h3>
          <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-black pt-[56.25%]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/cAX0YSmuazs?autoplay=1&mute=1&loop=1&playlist=cAX0YSmuazs&rel=0"
              title="Agentic development video"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>

        <section className="text-sm text-gray-700 dark:text-gray-100">
          <a
            href="https://www.linkedin.com/in/russrimm/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 dark:text-primary-300 hover:underline"
          >
            View LinkedIn Profile
          </a>
        </section>
      </div>
    </div>
  );
}
