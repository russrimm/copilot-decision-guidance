/**
 * Microsoft Metrics Service
 *
 * Provides optional integration with Microsoft APIs to display:
 * - Azure cost reports
 * - Power Platform inventory
 * - License counts
 * - Secure scores
 * - Tenant health metrics
 *
 * All integrations are OPTIONAL and configurable via environment variables.
 */
export class MetricsService {
    config;
    accessToken;
    tokenExpiry;
    constructor(config) {
        this.config = config;
    }
    /**
     * Check if metrics integration is enabled
     */
    isEnabled() {
        return !!(this.config.tenantId && this.config.clientId && this.config.clientSecret);
    }
    /**
     * Get OAuth token for Microsoft Graph and Azure APIs
     */
    async getAccessToken() {
        // Return cached token if still valid
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return this.accessToken;
        }
        const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
        const params = new URLSearchParams({
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            scope: 'https://graph.microsoft.com/.default https://management.azure.com/.default',
            grant_type: 'client_credentials',
        });
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        if (!response.ok) {
            throw new Error(`Failed to get access token: ${response.statusText}`);
        }
        const data = (await response.json());
        const accessToken = typeof data.access_token === 'string' ? data.access_token : undefined;
        if (!accessToken) {
            throw new Error('Failed to get access token: response missing access_token');
        }
        this.accessToken = accessToken;
        // Token expires in 1 hour, cache for 50 minutes to be safe
        this.tokenExpiry = new Date(Date.now() + 50 * 60 * 1000);
        return this.accessToken;
    }
    /**
     * Fetch Azure cost data
     */
    async getCostReport() {
        if (!this.config.enableCostReports || !this.config.subscriptionId) {
            return null;
        }
        try {
            const token = await this.getAccessToken();
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30); // Last 30 days
            const costApiUrl = `https://management.azure.com/subscriptions/${this.config.subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`;
            const queryBody = {
                type: 'Usage',
                timeframe: 'Custom',
                timePeriod: {
                    from: startDate.toISOString().split('T')[0],
                    to: endDate.toISOString().split('T')[0],
                },
                dataset: {
                    granularity: 'None',
                    aggregation: {
                        totalCost: {
                            name: 'Cost',
                            function: 'Sum',
                        },
                    },
                    grouping: [
                        {
                            type: 'Dimension',
                            name: 'ServiceName',
                        },
                    ],
                },
            };
            const response = await fetch(costApiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(queryBody),
            });
            if (!response.ok) {
                console.error(`Cost API error: ${response.statusText}`);
                return null;
            }
            const data = (await response.json());
            // Parse cost data
            const breakdown = data.properties?.rows?.map((row) => ({
                service: row[1] || 'Unknown',
                cost: parseFloat(row[0]) || 0,
            })) || [];
            const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
            // Try to identify Copilot-related costs
            const copilotRelatedCosts = breakdown
                .filter((item) => item.service.toLowerCase().includes('cognitive') ||
                item.service.toLowerCase().includes('openai') ||
                item.service.toLowerCase().includes('ai'))
                .reduce((sum, item) => sum + item.cost, 0);
            return {
                totalCost,
                currency: 'USD',
                period: `Last 30 days (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`,
                breakdown: breakdown.slice(0, 10), // Top 10 services
                copilotRelatedCosts,
            };
        }
        catch (error) {
            console.error('Error fetching cost report:', error);
            return null;
        }
    }
    /**
     * Fetch Power Platform inventory
     */
    async getPowerPlatformInventory() {
        if (!this.config.enablePowerPlatform) {
            return null;
        }
        try {
            const token = await this.getAccessToken();
            // Get environments
            const envResponse = await fetch('https://api.bap.microsoft.com/providers/Microsoft.BusinessAppPlatform/scopes/admin/environments?api-version=2020-10-01', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!envResponse.ok) {
                console.error(`Power Platform API error: ${envResponse.statusText}`);
                return null;
            }
            const envData = (await envResponse.json());
            const environments = envData.value?.map((env) => ({
                name: env.properties?.displayName || env.name,
                type: env.properties?.environmentType || 'Unknown',
                region: env.location || 'Unknown',
                copilotStudioAgents: 0, // Would need additional API call per environment
            })) || [];
            // Note: Getting exact counts for flows, apps, and Copilot Studio agents
            // requires additional API calls which may be rate-limited
            // For now, return environment count and basic info
            return {
                totalEnvironments: environments.length,
                environments: environments.slice(0, 10), // Top 10 environments
                totalFlows: 0, // Would require additional API calls
                totalApps: 0, // Would require additional API calls
                totalCopilotStudioAgents: 0, // Would require additional API calls
            };
        }
        catch (error) {
            console.error('Error fetching Power Platform inventory:', error);
            return null;
        }
    }
    /**
     * Fetch license counts from Microsoft Graph
     */
    async getLicenseCounts() {
        if (!this.config.enableLicenses) {
            return null;
        }
        try {
            const token = await this.getAccessToken();
            const response = await fetch('https://graph.microsoft.com/v1.0/subscribedSkus', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                console.error(`Graph API error: ${response.statusText}`);
                return null;
            }
            const data = (await response.json());
            const licenses = data.value?.map((sku) => ({
                skuName: sku.skuPartNumber || 'Unknown',
                enabled: sku.prepaidUnits?.enabled || 0,
                assigned: sku.consumedUnits || 0,
                available: (sku.prepaidUnits?.enabled || 0) - (sku.consumedUnits || 0),
                relevant: this.isCopilotRelatedLicense(sku.skuPartNumber),
            })) || [];
            // Identify Copilot-related licenses
            const m365CopilotCount = licenses
                .filter((l) => l.skuName.includes('M365_COPILOT') || l.skuName.includes('MICROSOFT_365_COPILOT'))
                .reduce((sum, l) => sum + l.assigned, 0);
            const copilotStudioCount = licenses
                .filter((l) => l.skuName.includes('COPILOT_STUDIO'))
                .reduce((sum, l) => sum + l.assigned, 0);
            const powerAutomateCount = licenses
                .filter((l) => l.skuName.includes('POWER_AUTOMATE') || l.skuName.includes('FLOW'))
                .reduce((sum, l) => sum + l.assigned, 0);
            return {
                totalLicenses: licenses.reduce((sum, l) => sum + l.assigned, 0),
                licenses: licenses.filter((l) => l.relevant).slice(0, 20),
                copilotLicenses: {
                    m365Copilot: m365CopilotCount,
                    copilotStudio: copilotStudioCount,
                    powerAutomateLicenses: powerAutomateCount,
                },
            };
        }
        catch (error) {
            console.error('Error fetching license counts:', error);
            return null;
        }
    }
    isCopilotRelatedLicense(skuName) {
        const copilotKeywords = [
            'COPILOT',
            'M365_COPILOT',
            'POWER_AUTOMATE',
            'FLOW',
            'POWER_APPS',
            'AI_BUILDER',
            'DYNAMICS_365',
            'POWER_PLATFORM',
        ];
        return copilotKeywords.some((keyword) => skuName?.includes(keyword));
    }
    /**
     * Fetch Microsoft Secure Score
     */
    async getSecureScore() {
        if (!this.config.enableSecureScore) {
            return null;
        }
        try {
            const token = await this.getAccessToken();
            const response = await fetch('https://graph.microsoft.com/v1.0/security/secureScores?$top=1', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                console.error(`Secure Score API error: ${response.statusText}`);
                return null;
            }
            const data = (await response.json());
            const score = data.value?.[0];
            if (!score) {
                return null;
            }
            // Get security recommendations
            const recResponse = await fetch("https://graph.microsoft.com/v1.0/security/secureScoreControlProfiles?$top=10&$filter=actionType eq 'Review'", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const recData = recResponse.ok ? (await recResponse.json()) : { value: [] };
            return {
                currentScore: score.currentScore || 0,
                maxScore: score.maxScore || 0,
                percentage: score.maxScore ? (score.currentScore / score.maxScore) * 100 : 0,
                comparisonToAverage: score.averageComparativeScores?.[0]?.averageScore || 0,
                recommendations: recData.value?.map((rec) => ({
                    title: rec.title,
                    impact: rec.maxScore?.toString() || '0',
                    category: rec.controlCategory || 'Unknown',
                })) || [],
            };
        }
        catch (error) {
            console.error('Error fetching secure score:', error);
            return null;
        }
    }
    /**
     * Calculate readiness score based on metrics
     */
    calculateReadinessScore(metrics) {
        let technical = 50; // Base score
        let security = 50;
        let financial = 50;
        // Adjust based on available metrics
        if (metrics.powerPlatform) {
            technical += 20; // Has Power Platform
            if (metrics.powerPlatform.totalEnvironments > 0)
                technical += 10;
        }
        if (metrics.secureScore) {
            security = metrics.secureScore.percentage;
        }
        if (metrics.licenses) {
            if (metrics.licenses.copilotLicenses.m365Copilot > 0)
                technical += 10;
            if (metrics.licenses.copilotLicenses.copilotStudio > 0)
                technical += 10;
        }
        if (metrics.costReport) {
            // Has cost visibility
            financial += 20;
            if (metrics.costReport.copilotRelatedCosts && metrics.costReport.copilotRelatedCosts > 0) {
                financial += 10; // Already using AI services
            }
        }
        const overall = Math.round((technical + security + financial) / 3);
        return {
            overall: Math.min(overall, 100),
            technical: Math.min(technical, 100),
            security: Math.min(security, 100),
            financial: Math.min(financial, 100),
        };
    }
    /**
     * Get all tenant metrics
     */
    async getAllMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            tenantId: this.config.tenantId || 'not-configured',
        };
        if (!this.isEnabled()) {
            return {
                ...metrics,
                readinessScore: { overall: 0, technical: 0, security: 0, financial: 0 },
            };
        }
        // Fetch all metrics in parallel
        const [costReport, powerPlatform, licenses, secureScore] = await Promise.all([
            this.getCostReport(),
            this.getPowerPlatformInventory(),
            this.getLicenseCounts(),
            this.getSecureScore(),
        ]);
        metrics.costReport = costReport || undefined;
        metrics.powerPlatform = powerPlatform || undefined;
        metrics.licenses = licenses || undefined;
        metrics.secureScore = secureScore || undefined;
        // Calculate readiness score
        metrics.readinessScore = this.calculateReadinessScore(metrics);
        return metrics;
    }
    /**
     * Get demo/sample data when metrics are not configured
     */
    static getSampleMetrics() {
        return {
            timestamp: new Date().toISOString(),
            tenantId: 'demo-tenant',
            tenantName: 'Demo Organization',
            costReport: {
                totalCost: 12450.75,
                currency: 'USD',
                period: 'Last 30 days',
                breakdown: [
                    { service: 'Azure OpenAI', cost: 3200.5 },
                    { service: 'Cognitive Services', cost: 1890.25 },
                    { service: 'App Service', cost: 2100.0 },
                    { service: 'SQL Database', cost: 1800.0 },
                    { service: 'Storage', cost: 850.0 },
                    { service: 'Virtual Machines', cost: 1500.0 },
                    { service: 'Other', cost: 1110.0 },
                ],
                copilotRelatedCosts: 5090.75,
            },
            powerPlatform: {
                totalEnvironments: 5,
                environments: [
                    {
                        name: 'Production',
                        type: 'Production',
                        region: 'United States',
                        copilotStudioAgents: 3,
                    },
                    { name: 'Development', type: 'Sandbox', region: 'United States', copilotStudioAgents: 5 },
                    { name: 'Test', type: 'Sandbox', region: 'United States', copilotStudioAgents: 2 },
                    { name: 'Demo', type: 'Sandbox', region: 'Europe', copilotStudioAgents: 1 },
                ],
                totalFlows: 47,
                totalApps: 23,
                totalCopilotStudioAgents: 11,
            },
            licenses: {
                totalLicenses: 850,
                licenses: [
                    {
                        skuName: 'Microsoft 365 Copilot',
                        enabled: 100,
                        assigned: 87,
                        available: 13,
                        relevant: true,
                    },
                    { skuName: 'Copilot Studio', enabled: 25, assigned: 18, available: 7, relevant: true },
                    {
                        skuName: 'Power Automate per User',
                        enabled: 200,
                        assigned: 165,
                        available: 35,
                        relevant: true,
                    },
                    {
                        skuName: 'Power Apps per User',
                        enabled: 150,
                        assigned: 98,
                        available: 52,
                        relevant: true,
                    },
                ],
                copilotLicenses: {
                    m365Copilot: 87,
                    copilotStudio: 18,
                    powerAutomateLicenses: 165,
                },
            },
            secureScore: {
                currentScore: 68,
                maxScore: 100,
                percentage: 68,
                comparisonToAverage: 12,
                recommendations: [
                    { title: 'Enable MFA for all users', impact: '10', category: 'Identity' },
                    { title: 'Configure conditional access policies', impact: '8', category: 'Access' },
                    { title: 'Enable Microsoft Defender', impact: '7', category: 'Security' },
                ],
            },
            readinessScore: {
                overall: 75,
                technical: 80,
                security: 68,
                financial: 77,
            },
        };
    }
}
