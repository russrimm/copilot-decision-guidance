import React, { useState } from 'react';
import { getFriendlyApiErrorMessage } from '../lib/errorMessages';

interface SearchResult {
  title: string;
  content: string;
  page: number;
  url: string;
  score?: number;
}

export function LicensingSearch() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/licensing/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        if (response.status === 501) {
          setError(
            'Azure AI Search is not configured. Using structured licensing data instead. ' +
              'Visit the Admin page to set up Azure AI Search for semantic PDF search.'
          );
          return;
        }
        const friendlyError = await getFriendlyApiErrorMessage(response, 'Search failed');
        throw new Error(friendlyError);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search licensing documentation');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="licensing-search max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          🔍 Search Licensing Documentation
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Semantic search across the Microsoft Copilot Studio Licensing Guide
        </p>
      </div>

      {/* Search Input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., 'What are Copilot Credits?' or 'Premium connectors pricing'"
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳' : '🔍'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 
                        dark:border-yellow-800 rounded-lg"
        >
          <div className="flex items-start">
            <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</span>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">{error}</div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </div>

          {results.map((result, i) => (
            <div
              key={i}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
                         dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 
                         transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {result.title}
                </h3>
                {result.score && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Score: {(result.score * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                {result.content}
              </p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Page {result.page}</span>
                <a
                  href={`https://go.microsoft.com/fwlink/?linkid=2320995#page=${result.page}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View in PDF →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && results.length === 0 && query && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🤷</div>
          <div className="text-gray-600 dark:text-gray-400">No results found for "{query}"</div>
          <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Try different keywords or check the{' '}
            <a
              href="https://go.microsoft.com/fwlink/?linkid=2320995"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              full PDF
            </a>
          </div>
        </div>
      )}

      {/* Example Queries */}
      {!loading && results.length === 0 && !query && (
        <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            💡 Example Queries
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'What are Copilot Credits?',
              'Premium connectors licensing',
              'Microsoft 365 Copilot entitlements',
              'Power Apps per user licensing',
              'Dynamics 365 Copilot Studio',
              'External channel deployment',
            ].map((example) => (
              <button
                key={example}
                onClick={() => {
                  setQuery(example);
                  setTimeout(handleSearch, 100);
                }}
                className="btn-secondary justify-start text-left"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Powered by Azure AI Search with semantic understanding
        </p>
        <a
          href="https://go.microsoft.com/fwlink/?linkid=2320995"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          📄 Download Full Licensing Guide (PDF)
        </a>
      </div>
    </div>
  );
}
