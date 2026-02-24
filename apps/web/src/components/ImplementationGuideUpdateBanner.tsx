/**
 * Implementation Guide Update Banner
 *
 * Displays a notification when a new version of the Microsoft Copilot Studio
 * Implementation Guide has been detected by the monitoring system.
 */

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, X, ExternalLink, Calendar, FileText } from 'lucide-react';

interface UpdateInfo {
  updateAvailable: boolean;
  version?: string;
  detectedAt?: string;
  sha?: string;
  message?: string;
  extractedContent?: {
    slideCount: number;
    chapters: string[];
    keyTopics: string[];
  };
}

export function ImplementationGuideUpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    checkForUpdates();

    // Check every hour for updates
    const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const checkForUpdates = async () => {
    try {
      const response = await fetch('/api/implementation-guide/update-check');
      if (response.ok) {
        const data = await response.json();
        setUpdateInfo(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      const response = await fetch('/api/implementation-guide/acknowledge-update', {
        method: 'POST',
      });

      if (response.ok) {
        setUpdateInfo({ updateAvailable: false });
        setDismissed(true);
      }
    } catch {
    } finally {
      setAcknowledging(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (loading || !updateInfo?.updateAvailable || dismissed) {
    return null;
  }

  const formattedDate = updateInfo.detectedAt
    ? new Date(updateInfo.detectedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500 p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <AlertCircle className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              🎉 Implementation Guide Updated
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              A new version of the <strong>Microsoft Copilot Studio Implementation Guide</strong>{' '}
              has been detected.
              {updateInfo.version && (
                <span className="ml-1 font-medium">Version {updateInfo.version}</span>
              )}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>Detected: {formattedDate}</span>
              </div>

              {updateInfo.extractedContent && (
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FileText className="h-4 w-4" />
                  <span>{updateInfo.extractedContent.slideCount} slides</span>
                </div>
              )}
            </div>

            {updateInfo.message && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">
                {updateInfo.message}
              </p>
            )}

            {updateInfo.extractedContent && updateInfo.extractedContent.chapters.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chapters Detected:
                </p>
                <div className="flex flex-wrap gap-2">
                  {updateInfo.extractedContent.chapters.slice(0, 6).map((chapter, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded"
                    >
                      {chapter}
                    </span>
                  ))}
                  {updateInfo.extractedContent.chapters.length > 6 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                      +{updateInfo.extractedContent.chapters.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <a
                href="https://aka.ms/CopilotStudioImplementationGuide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                View Guide
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>

              <a
                href="/docs/IMPLEMENTATION_GUIDE_ALIGNMENT.md"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Review Alignment Plan
              </a>

              <button
                onClick={handleAcknowledge}
                disabled={acknowledging}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                {acknowledging ? 'Acknowledging...' : 'Mark as Reviewed'}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="ml-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
