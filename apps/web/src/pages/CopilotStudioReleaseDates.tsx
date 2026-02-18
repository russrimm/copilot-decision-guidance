import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCopilotStudioReleasePlanner,
  type CopilotStudioReleasePlannerResponse,
  type ReleasePlannerMilestoneItem,
} from '../lib/api';

function MilestoneTable({ items }: { items: ReleasePlannerMilestoneItem[] }) {
  if (items.length === 0) {
    return <div className="text-sm text-gray-600 dark:text-gray-200">No upcoming items found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-gray-500 dark:text-gray-300">
          <tr>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Feature</th>
            <th className="py-2 pr-4">Release wave</th>
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-gray-100">
          {items.map((item, idx) => (
            <tr
              key={`${item.date}-${idx}`}
              className="border-t border-gray-200 dark:border-gray-700"
            >
              <td className="py-2 pr-4 whitespace-nowrap font-medium">{item.date}</td>
              <td className="py-2 pr-4">
                {item.featureName}
              </td>
              <td className="py-2 pr-4 whitespace-nowrap">{item.releaseWave || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CopilotStudioReleaseDates() {
  const [data, setData] = useState<CopilotStudioReleasePlannerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getCopilotStudioReleasePlanner()
      .then((resp) => {
        if (cancelled) return;
        setData(resp);
      })
      .catch((e: any) => {
        if (cancelled) return;
        setError(e?.message || 'Failed to load release planner data');
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
            Copilot Studio release dates
          </h1>
          <Link to="/" className="text-sm text-primary-700 dark:text-primary-300 hover:underline">
            Back to home
          </Link>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-100">
          Upcoming <strong>Public Preview</strong> and <strong>GA</strong> dates from the Power
          Platform Release Planner.
        </p>
      </div>

      <div className="card mb-6">
        {loading && (
          <div className="text-sm text-gray-600 dark:text-gray-200">
            Loading release planner data…
          </div>
        )}

        {!loading && error && <div className="text-sm text-red-700 dark:text-red-300">{error}</div>}

        {!loading && !error && data && (
          <div className="text-sm text-gray-700 dark:text-gray-100">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="font-semibold">Product:</span> {data.product}
              </div>
              <div>
                <span className="font-semibold">Matching items:</span> {data.totalMatchingItems}
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
                Source
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Upcoming Public Preview
          </h2>
          <MilestoneTable items={data?.upcomingPublicPreview ?? []} />
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming GA</h2>
          <MilestoneTable items={data?.upcomingGA ?? []} />
        </div>
      </div>
    </div>
  );
}
