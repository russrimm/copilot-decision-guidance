import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFoundryNews, type FoundryNewsResponse } from '../lib/api';

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600 dark:border-gray-600 dark:border-t-primary-400"
        aria-hidden="true"
      />
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-200">{label}</p>
    </div>
  );
}

export default function FoundryNews() {
  const [data, setData] = useState<FoundryNewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getFoundryNews()
      .then((resp) => {
        if (cancelled) return;
        setData(resp);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message || 'Failed to load Microsoft Foundry news');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const fetchedAt = useMemo(() => {
    if (!data?.fetchedAt) return null;
    try {
      return new Date(data.fetchedAt).toLocaleString();
    } catch {
      return data.fetchedAt;
    }
  }, [data?.fetchedAt]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Microsoft Foundry news
          </h1>
          <Link to="/" className="text-sm text-primary-700 dark:text-primary-300 hover:underline">
            Back to home
          </Link>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-100">
          Latest Microsoft Foundry announcements from the official blog feed, formatted for quick
          scanning.
        </p>
      </div>

      <div className="card mb-6">
        {loading && <LoadingSpinner label="Loading Microsoft Foundry news…" />}

        {!loading && error && <div className="text-sm text-red-700 dark:text-red-300">{error}</div>}

        {!loading && !error && data && (
          <div className="text-sm text-gray-700 dark:text-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="font-semibold">Articles:</span> {data.totalItems}
              </div>
              {fetchedAt && (
                <div>
                  <span className="font-semibold">Fetched:</span> {fetchedAt}
                </div>
              )}
              <a
                href={data.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary-700 dark:text-primary-300 hover:underline"
              >
                Source feed
              </a>
            </div>
          </div>
        )}
      </div>

      {!loading && !error && (
        <div className="grid gap-4">
          {data?.items.length ? (
            data.items.map((item, index) => (
              <article
                key={`${item.link}-${index}`}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {item.title}
                  </h2>
                  <span className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-300">
                    {item.pubDate}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                  {item.summary || 'No summary available.'}
                </p>
                <div className="mt-3">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300"
                  >
                    Read article
                    <svg
                      className="ml-1.5 h-4 w-4"
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
                  </a>
                </div>
              </article>
            ))
          ) : (
            <div className="card text-sm text-gray-600 dark:text-gray-200">No articles found.</div>
          )}
        </div>
      )}
    </div>
  );
}
