import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface LicenseType {
  name: string;
  pricePerUserPerMonth?: number;
  pricePerMessage?: number;
  pricePerTenant?: number;
  messagesIncluded?: number;
  currency: string;
  billingModel: string;
  features: string[];
}

interface CostBreakdown {
  users: number;
  messagesPerMonth: number;
  breakdown: {
    m365Copilot: number;
    copilotStudio: number;
    copilotStudioModel: string;
    payAsYouGoCost: number;
    subscriptionCost: number;
  };
  totalCost: number;
  recommendation: string;
  notes: string[];
}

export function LicensingCalculator() {
  const [users, setUsers] = useState<number>(10);
  const [messagesPerMonth, setMessagesPerMonth] = useState<number>(10000);
  const [licenseType, setLicenseType] = useState<'m365' | 'studio' | 'hybrid'>('hybrid');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<CostBreakdown | null>(null);
  const [licensingData, setLicensingData] = useState<any>(null);

  useEffect(() => {
    // Load licensing data on mount
    api.get('/licensing').then(setLicensingData).catch(console.error);
  }, []);

  const calculateCost = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/licensing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users, messagesPerMonth, licenseType }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to calculate cost:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="licensing-calculator max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        💰 Licensing Cost Calculator
      </h2>

      <div className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Number of Users
            </label>
            <input
              type="number"
              value={users}
              onChange={(e) => setUsers(Number(e.target.value))}
              min={1}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Messages Per Month
            </label>
            <input
              type="number"
              value={messagesPerMonth}
              onChange={(e) => setMessagesPerMonth(Number(e.target.value))}
              min={0}
              step={1000}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* License Type */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            License Scenario
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: 'm365', label: 'Microsoft 365 Copilot Only', icon: '📄' },
              { value: 'studio', label: 'Copilot Studio Only', icon: '🤖' },
              { value: 'hybrid', label: 'Hybrid (Both)', icon: '🔀' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setLicenseType(option.value as any)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  licenseType === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">{option.icon}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateCost}
          disabled={loading}
          className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium 
                     rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Calculate Cost'}
        </button>

        {/* Results */}
        {result && (
          <div
            className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 
                          dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 
                          dark:border-blue-800"
          >
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              💡 Cost Estimate
            </h3>

            <div className="space-y-4">
              {/* Total Cost */}
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  ${result.totalCost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">per month</div>
              </div>

              {/* Breakdown */}
              {result.breakdown && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.breakdown.m365Copilot > 0 && (
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Microsoft 365 Copilot
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${result.breakdown.m365Copilot.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {users} users × $30/month
                      </div>
                    </div>
                  )}

                  {result.breakdown.copilotStudio > 0 && (
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Copilot Studio ({result.breakdown.copilotStudioModel})
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${result.breakdown.copilotStudio.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {messagesPerMonth.toLocaleString()} messages
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendation */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  💡 Recommendation
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{result.recommendation}</p>
              </div>

              {/* Cost Comparison */}
              {result.breakdown && result.breakdown.copilotStudio > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                    📊 Copilot Studio Pricing Comparison
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Pay-as-you-go:</span>
                      <span className="font-bold ml-2 text-gray-900 dark:text-white">
                        ${result.breakdown.payAsYouGoCost.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Subscription:</span>
                      <span className="font-bold ml-2 text-gray-900 dark:text-white">
                        ${result.breakdown.subscriptionCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {result.notes && result.notes.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {result.notes.map((note, i) => (
                    <div key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Link to full guide */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <a
                  href="https://go.microsoft.com/fwlink/?linkid=2320995"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  📄 Download Full Licensing Guide (PDF) →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Quick Reference */}
        {licensingData && (
          <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              📚 Quick Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900 dark:text-white mb-1">M365 Copilot</div>
                <div className="text-gray-600 dark:text-gray-400">$30/user/month</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Includes unlimited Copilot Studio in Teams
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  Studio Pay-as-you-go
                </div>
                <div className="text-gray-600 dark:text-gray-400">$0.01/message</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Best for variable usage
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  Studio Subscription
                </div>
                <div className="text-gray-600 dark:text-gray-400">$200/month</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Includes 25K messages
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
