import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Shield,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';

interface TenantMetrics {
  timestamp: string;
  tenantId: string;
  tenantName?: string;
  costReport?: {
    totalCost: number;
    currency: string;
    period: string;
    breakdown: { service: string; cost: number }[];
    copilotRelatedCosts?: number;
  };
  powerPlatform?: {
    totalEnvironments: number;
    environments: { name: string; type: string; region: string; copilotStudioAgents?: number }[];
    totalFlows: number;
    totalApps: number;
    totalCopilotStudioAgents: number;
  };
  licenses?: {
    totalLicenses: number;
    licenses: {
      skuName: string;
      enabled: number;
      assigned: number;
      available: number;
      relevant?: boolean;
    }[];
    copilotLicenses: {
      m365Copilot: number;
      copilotStudio: number;
      powerAutomateLicenses: number;
    };
  };
  secureScore?: {
    currentScore: number;
    maxScore: number;
    percentage: number;
    comparisonToAverage: number;
    recommendations: { title: string; impact: string; category: string }[];
  };
  readinessScore?: {
    overall: number;
    technical: number;
    security: number;
    financial: number;
  };
}

interface MetricsResponse {
  enabled: boolean;
  data: TenantMetrics;
  message?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      const data: MetricsResponse = await response.json();

      setMetrics(data.data);
      setIsDemo(!data.enabled);

      if (data.message) {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to load metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading metrics...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/')} className="btn-secondary mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </button>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-2">
              Failed to Load Metrics
            </h2>
            <p className="text-red-700 dark:text-red-300">
              {error || 'An unexpected error occurred'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const readinessScore = metrics.readinessScore || {
    overall: 0,
    technical: 0,
    security: 0,
    financial: 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/')} className="btn-secondary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Organization Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive view of your Microsoft environment and readiness
              </p>
            </div>
            <div className="text-right text-sm text-gray-500 dark:text-gray-400">
              <div>Last Updated</div>
              <div className="font-mono">{new Date(metrics.timestamp).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Demo Banner */}
        {isDemo && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Demo Mode:</strong> Showing sample data. To view your actual tenant metrics,
              configure Azure credentials in your environment variables.
            </div>
          </div>
        )}

        {/* Readiness Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ScoreCard
            title="Overall Readiness"
            score={readinessScore.overall}
            icon={<TrendingUp className="h-6 w-6" />}
            color="blue"
          />
          <ScoreCard
            title="Technical"
            score={readinessScore.technical}
            icon={<Zap className="h-6 w-6" />}
            color="purple"
          />
          <ScoreCard
            title="Security"
            score={readinessScore.security}
            icon={<Shield className="h-6 w-6" />}
            color="green"
          />
          <ScoreCard
            title="Financial"
            score={readinessScore.financial}
            icon={<DollarSign className="h-6 w-6" />}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Report */}
          {metrics.costReport && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
                Cost Analysis
              </h2>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  $
                  {metrics.costReport.totalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {metrics.costReport.period}
                </div>
              </div>

              {metrics.costReport.copilotRelatedCosts !== undefined && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    AI/Copilot-related costs
                  </div>
                  <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    $
                    {metrics.costReport.copilotRelatedCosts.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Top Services
                </div>
                {metrics.costReport.breakdown.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.service}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      $
                      {item.cost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Licenses */}
          {metrics.licenses && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                License Overview
              </h2>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.licenses.totalLicenses.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Assigned Licenses
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <LicenseItem
                  label="M365 Copilot"
                  count={metrics.licenses.copilotLicenses.m365Copilot}
                  color="blue"
                />
                <LicenseItem
                  label="Copilot Studio"
                  count={metrics.licenses.copilotLicenses.copilotStudio}
                  color="purple"
                />
                <LicenseItem
                  label="Power Automate"
                  count={metrics.licenses.copilotLicenses.powerAutomateLicenses}
                  color="green"
                />
              </div>

              {metrics.licenses.licenses.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Relevant Licenses
                  </div>
                  <div className="space-y-2">
                    {metrics.licenses.licenses.slice(0, 4).map((license, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400 truncate mr-2">
                          {license.skuName}
                        </span>
                        <span className="text-gray-900 dark:text-white font-medium whitespace-nowrap">
                          {license.assigned}/{license.enabled}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Power Platform */}
          {metrics.powerPlatform && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-purple-600" />
                Power Platform
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.powerPlatform.totalEnvironments}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Environments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.powerPlatform.totalCopilotStudioAgents}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Copilot Agents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.powerPlatform.totalFlows}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Flows</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.powerPlatform.totalApps}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Apps</div>
                </div>
              </div>

              {metrics.powerPlatform.environments.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Environments
                  </div>
                  <div className="space-y-2">
                    {metrics.powerPlatform.environments.slice(0, 4).map((env, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <div className="text-gray-900 dark:text-white font-medium">
                            {env.name}
                          </div>
                          <div className="text-gray-500 dark:text-gray-500 text-xs">
                            {env.type} • {env.region}
                          </div>
                        </div>
                        {env.copilotStudioAgents !== undefined && env.copilotStudioAgents > 0 && (
                          <span className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                            {env.copilotStudioAgents} agents
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Secure Score */}
          {metrics.secureScore && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                Security Posture
              </h2>

              <div className="mb-4">
                <div className="flex items-baseline">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {metrics.secureScore.currentScore}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 ml-2">
                    / {metrics.secureScore.maxScore}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Microsoft Secure Score
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Score</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {metrics.secureScore.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.secureScore.percentage}%` }}
                  ></div>
                </div>
              </div>

              {metrics.secureScore.comparisonToAverage > 0 && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-sm text-green-800 dark:text-green-200">
                    {metrics.secureScore.comparisonToAverage.toFixed(0)} points above industry
                    average
                  </div>
                </div>
              )}

              {metrics.secureScore.recommendations.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Top Recommendations
                  </div>
                  <div className="space-y-2">
                    {metrics.secureScore.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="text-sm">
                        <div className="text-gray-900 dark:text-white font-medium">{rec.title}</div>
                        <div className="text-gray-500 dark:text-gray-500 text-xs">
                          {rec.category} • Impact: {rec.impact}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to Get Personalized Recommendations?</h2>
          <p className="mb-6 text-blue-100">
            Take our interactive questionnaire to discover which Microsoft AI solution best fits
            your organization
          </p>
          <button onClick={() => navigate('/wizard')} className="btn-secondary">
            Start Questionnaire
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ScoreCard({
  title,
  score,
  icon,
  color,
}: {
  title: string;
  score: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 text-blue-600',
    purple: 'from-purple-500 to-purple-600 text-purple-600',
    green: 'from-green-500 to-green-600 text-green-600',
    orange: 'from-orange-500 to-orange-600 text-orange-600',
  };

  const gradientClass = colorClasses[color as keyof typeof colorClasses];
  const textClass = colorClasses[color as keyof typeof colorClasses].split(' ').pop();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div
        className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${gradientClass.split(' ')[0]} ${gradientClass.split(' ')[1]} mb-4`}
      >
        <div className="text-white">{icon}</div>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</div>
      <div className="flex items-baseline">
        <div className={`text-3xl font-bold ${textClass} dark:${textClass}`}>{score}</div>
        <div className="text-gray-500 dark:text-gray-500 ml-2">/100</div>
      </div>
      <div className="mt-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`bg-gradient-to-r ${gradientClass.split(' ')[0]} ${gradientClass.split(' ')[1]} h-2 rounded-full transition-all`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

function LicenseItem({ label, count, color }: { label: string; count: number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  const badgeClass = colorClasses[color as keyof typeof colorClasses];

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}>
        {count.toLocaleString()}
      </span>
    </div>
  );
}
