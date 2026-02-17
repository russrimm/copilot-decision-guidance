/**
 * Microsoft Product Updates Validation Script
 * 
 * This script checks various Microsoft sources for updates to:
 * - Microsoft 365 Copilot capabilities
 * - Microsoft Copilot Studio features
 * - Pricing information
 * - Licensing terms
 * - Release announcements
 * 
 * It compares the latest information with the current data in the repository
 * and generates a report of any changes detected.
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  source: string;
  hasChanges: boolean;
  changes: Change[];
  lastChecked: string;
  confidence: 'high' | 'medium' | 'low';
}

interface Change {
  category: string;
  field: string;
  oldValue: any;
  newValue: any;
  description: string;
  severity: 'critical' | 'major' | 'minor';
  source: string;
}

interface MicrosoftSource {
  name: string;
  url: string;
  type: 'api' | 'web' | 'rss';
  parser: (data: any) => Partial<ValidationResult>;
}

class MicrosoftUpdatesValidator {
  private sources: MicrosoftSource[] = [
    {
      name: 'Microsoft 365 Copilot Documentation Hub (Primary Source)',
      url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/',
      type: 'web',
      parser: this.parseM365CopilotDocs.bind(this)
    },
    {
      name: 'Microsoft 365 Copilot Enablement Resources (Primary Source)',
      url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources',
      type: 'web',
      parser: this.parseM365CopilotEnablementResources.bind(this)
    },
    {
      name: 'Microsoft 365 Copilot Release Notes (Official)',
      url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/release-notes',
      type: 'web',
      parser: this.parseM365CopilotReleaseNotes.bind(this)
    },
    {
      name: 'Copilot Studio What\'s New (Official)',
      url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/whats-new',
      type: 'web',
      parser: this.parseCopilotStudioWhatsNew.bind(this)
    },
    {
      name: 'Azure AI Foundry Release Notes',
      url: 'https://learn.microsoft.com/en-us/azure/ai-studio/what-is-ai-studio',
      type: 'web',
      parser: this.parseAzureAIFoundryDocs.bind(this)
    },
    {
      name: 'Microsoft 365 Roadmap - Copilot',
      url: 'https://www.microsoft.com/en-us/microsoft-365/roadmap?filters=Microsoft%20Copilot',
      type: 'web',
      parser: this.parseRoadmap.bind(this)
    },
    {
      name: 'Power Platform Release Planner',
      url: 'https://learn.microsoft.com/en-us/power-platform/release-plan/',
      type: 'web',
      parser: this.parseReleasePlan.bind(this)
    },
    {
      name: 'Microsoft Learn - Copilot Studio',
      url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-whats-new',
      type: 'web',
      parser: this.parseCopilotStudioDocs.bind(this)
    },
    {
      name: 'Power Platform Pricing',
      url: 'https://www.microsoft.com/en-us/power-platform/products/power-apps/pricing',
      type: 'web',
      parser: this.parsePricing.bind(this)
    }
  ];

  private currentData: any;
  private decisionModel: any;
  private results: ValidationResult[] = [];

  constructor() {
    this.loadCurrentData();
    this.loadDecisionModel();
  }

  private loadCurrentData(): void {
    try {
      const licensingDataPath = path.join(__dirname, '../packages/decision-engine/src/data/licensing-data.json');
      this.currentData = JSON.parse(fs.readFileSync(licensingDataPath, 'utf-8'));
      console.log('✅ Loaded current licensing data');
    } catch (error) {
      console.error('❌ Failed to load current data:', error);
      this.currentData = {};
    }
  }

  private loadDecisionModel(): void {
    try {
      const modelPath = path.join(__dirname, '../packages/decision-engine/src/data/decision-model.v1.json');
      this.decisionModel = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      console.log('✅ Loaded decision model');
    } catch (error) {
      console.error('❌ Failed to load decision model:', error);
      this.decisionModel = {};
    }
  }

  private async fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  private parseM365CopilotReleaseNotes(html: string): Partial<ValidationResult> {
    // Parse official M365 Copilot release notes for new features, changes, and deprecations
    const changes: Change[] = [];
    
    // Extract release date to check if content is newer than our last update
    const lastUpdated = new Date(this.decisionModel.metadata?.lastUpdated || '2026-01-01');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Look for recent releases (2025-2026)
    for (const year of [2026, 2025]) {
      for (const month of monthNames) {
        const datePattern = `${month} ${year}`;
        if (html.includes(datePattern)) {
          const releaseDate = new Date(`${month} 1, ${year}`);
          if (releaseDate > lastUpdated) {
            changes.push({
              category: 'release',
              field: 'metadata.lastUpdated',
              oldValue: this.decisionModel.metadata?.lastUpdated,
              newValue: datePattern,
              description: `New M365 Copilot release notes found for ${datePattern}`,
              severity: 'major',
              source: 'M365 Copilot Release Notes'
            });
          }
        }
      }
    }
    
    // Check for new app integrations
    const appKeywords = [
      'Word', 'Excel', 'PowerPoint', 'Outlook', 'Teams', 'OneNote', 
      'Loop', 'Whiteboard', 'SharePoint', 'OneDrive', 'Viva'
    ];
    
    for (const app of appKeywords) {
      const patterns = [
        new RegExp(`Copilot in ${app}.*?(new|available|launched|released)`, 'i'),
        new RegExp(`${app}.*?Copilot.*?(new|available|launched|released)`, 'i'),
        new RegExp(`(new|available|launched|released).*?${app}.*?Copilot`, 'i')
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(html)) {
          changes.push({
            category: 'features',
            field: `m365Copilot.apps.${app.toLowerCase()}`,
            oldValue: null,
            newValue: `New feature in ${app}`,
            description: `New Copilot capability detected for ${app}`,
            severity: 'minor',
            source: 'M365 Copilot Release Notes'
          });
          break;
        }
      }
    }
    
    // Check for pricing mentions
    const pricingPatterns = [
      /\$\s*(\d+)\s*per\s*user\s*per\s*month/gi,
      /\$\s*(\d+)\/user\/month/gi,
      /pricing.*?\$\s*(\d+)/gi
    ];
    
    for (const pattern of pricingPatterns) {
      const matches = [...html.matchAll(pattern)];
      if (matches.length > 0) {
        const prices = matches.map(m => parseInt(m[1]));
        const expectedPrice = 30;
        if (prices.some(p => p !== expectedPrice && p >= 25 && p <= 50)) {
          changes.push({
            category: 'pricing',
            field: 'm365Copilot.pricing',
            oldValue: `$${expectedPrice}/user/month`,
            newValue: `$${prices[0]}/user/month`,
            description: 'M365 Copilot pricing may have changed',
            severity: 'critical',
            source: 'M365 Copilot Release Notes'
          });
        }
      }
    }
    
    // Check for deprecation warnings
    const deprecationKeywords = ['deprecated', 'retiring', 'end of support', 'discontinued', 'sunset'];
    for (const keyword of deprecationKeywords) {
      if (html.toLowerCase().includes(keyword)) {
        changes.push({
          category: 'deprecation',
          field: 'm365Copilot.features',
          oldValue: null,
          newValue: `Deprecation notice: ${keyword}`,
          description: `Deprecation warning found in M365 Copilot release notes`,
          severity: 'major',
          source: 'M365 Copilot Release Notes'
        });
        break;
      }
    }
    
    return {
      changes,
      confidence: 'high'
    };
  }

  private parseCopilotStudioWhatsNew(html: string): Partial<ValidationResult> {
    // Parse official Copilot Studio What's New for features, updates, and changes
    const changes: Change[] = [];
    
    // Check release dates
    const lastUpdated = new Date(this.decisionModel.metadata?.lastUpdated || '2026-01-01');
    const dateRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/g;
    const dateMatches = [...html.matchAll(dateRegex)];
    
    for (const match of dateMatches) {
      const releaseDate = new Date(`${match[1]} 1, ${match[2]}`);
      if (releaseDate > lastUpdated) {
        changes.push({
          category: 'release',
          field: 'metadata.lastUpdated',
          oldValue: this.decisionModel.metadata?.lastUpdated,
          newValue: `${match[1]} ${match[2]}`,
          description: `New Copilot Studio features released in ${match[1]} ${match[2]}`,
          severity: 'major',
          source: 'Copilot Studio What\'s New'
        });
      }
    }
    
    // Check for new connector capabilities
    const connectorKeywords = [
      'connector', 'integration', 'API', 'webhook', 'Power Automate', 
      'Dynamics 365', 'Salesforce', 'ServiceNow', 'SAP', 'Oracle'
    ];
    
    for (const keyword of connectorKeywords) {
      const Pattern = new RegExp(`(new|available|added|support for).*?${keyword}`, 'i');
      if (Pattern.test(html)) {
        changes.push({
          category: 'features',
          field: `copilotStudio.connectors.${keyword.toLowerCase().replace(/\s+/g, '_')}`,
          oldValue: null,
          newValue: `New ${keyword} capability`,
          description: `New connector or integration capability for ${keyword}`,
          severity: 'minor',
          source: 'Copilot Studio What\'s New'
        });
      }
    }
    
    // Check for AI model updates
    const aiModelKeywords = ['GPT-4', 'GPT-3.5', 'Azure OpenAI', 'model', 'LLM', 'generative AI'];
    for (const keyword of aiModelKeywords) {
      const pattern = new RegExp(`(update|upgrade|new|support).*?${keyword}`, 'i');
      if (pattern.test(html)) {
        changes.push({
          category: 'ai_capabilities',
          field: 'copilotStudio.aiModels',
          oldValue: null,
          newValue: `AI model update: ${keyword}`,
          description: `AI model or capability update related to ${keyword}`,
          severity: 'major',
          source: 'Copilot Studio What\'s New'
        });
        break;
      }
    }
    
    // Check pricing changes
    const pricingPatterns = [
      /\$\s*([0-9.]+)\s*per\s*message/gi,
      /\$\s*([0-9.]+)\/message/gi,
      /\$\s*([0-9]+).*?messages/gi
    ];
    
    for (const pattern of pricingPatterns) {
      const matches = [...html.matchAll(pattern)];
      if (matches.length > 0) {
        changes.push({
          category: 'pricing',
          field: 'copilotStudio.pricing',
          oldValue: 'Current message pricing',
          newValue: `Pricing mention found: $${matches[0][1]}`,
          description: 'Copilot Studio pricing information detected in release notes',
          severity: 'major',
          source: 'Copilot Studio What\'s New'
        });
      }
    }
    
    // Check for capability changes that affect survey questions
    const capabilityKeywords = [
      { keyword: 'low-code', surveyRelevant: true },
      { keyword: 'no-code', surveyRelevant: true },
      { keyword: 'pro-code', surveyRelevant: true },
      { keyword: 'external channel', surveyRelevant: true },
      { keyword: 'custom data', surveyRelevant: true },
      { keyword: 'knowledge base', surveyRelevant: true }
    ];
    
    for (const { keyword, surveyRelevant } of capabilityKeywords) {
      if (html.toLowerCase().includes(keyword) && surveyRelevant) {
        const pattern = new RegExp(`(new|enhanced|improved|updated).*?${keyword}`, 'i');
        if (pattern.test(html)) {
          changes.push({
            category: 'survey_validation',
            field: 'decisionModel.questions',
            oldValue: null,
            newValue: `Capability update: ${keyword}`,
            description: `Survey questions may need review for ${keyword} capability changes`,
            severity: 'minor',
            source: 'Copilot Studio What\'s New'
          });
        }
      }
    }
    
    return {
      changes,
      confidence: 'high'
    };
  }

  private parseAzureAIFoundryDocs(html: string): Partial<ValidationResult> {
    // Parse Azure AI Foundry documentation for new features and capabilities
    const changes: Change[] = [];
    
    // Check for new Azure AI services
    const aiServices = [
      'Azure OpenAI Service', 'Azure AI Search', 'Document Intelligence',
      'Speech', 'Vision', 'Language', 'Content Safety', 'Prompt Flow'
    ];
    
    for (const service of aiServices) {
      const pattern = new RegExp(`(new|available|preview|GA).*?${service}`, 'i');
      if (pattern.test(html)) {
        changes.push({
          category: 'features',
          field: `foundry.services.${service.toLowerCase().replace(/\s+/g, '_')}`,
          oldValue: null,
          newValue: `Update for ${service}`,
          description: `Azure AI Foundry update detected for ${service}`,
          severity: 'minor',
          source: 'Azure AI Foundry Documentation'
        });
      }
    }
    
    // Check for model updates
    const modelPatterns = [
      /GPT-4[\w\s-]*/gi,
      /GPT-3\.5[\w\s-]*/gi,
      /DALL-E[\w\s-]*/gi,
      /embeddings?[\w\s-]*/gi
    ];
    
    for (const pattern of modelPatterns) {
      const matches = [...html.matchAll(pattern)];
      if (matches.length > 0) {
        const models = [...new Set(matches.map(m => m[0].trim()))];
        changes.push({
          category: 'ai_models',
          field: 'foundry.models',
          oldValue: null,
          newValue: models.join(', '),
          description: `AI models detected in Azure AI Foundry documentation`,
          severity: 'minor',
          source: 'Azure AI Foundry Documentation'
        });
        break;
      }
    }
    
    // Check for RAG and vector search capabilities
    const ragKeywords = ['RAG', 'vector search', 'retrieval', 'embeddings', 'semantic search'];
    for (const keyword of ragKeywords) {
      if (html.toLowerCase().includes(keyword.toLowerCase())) {
        changes.push({
          category: 'capabilities',
          field: 'foundry.rag',
          oldValue: null,
          newValue: `${keyword} capability confirmed`,
          description: `Azure AI Foundry ${keyword} capability validated`,
          severity: 'minor',
          source: 'Azure AI Foundry Documentation'
        });
        break;
      }
    }
    
    return {
      changes,
      confidence: 'medium'
    };
  }

  private parseRoadmap(html: string): Partial<ValidationResult> {
    // Parse Microsoft 365 Roadmap for Copilot features
    const changes: Change[] = [];
    
    // Look for new feature announcements
    const featureRegex = /<div class="card-title">([^<]+)<\/div>/g;
    const features = [...html.matchAll(featureRegex)].map(m => m[1]);
    
    // Check for pricing mentions
    if (html.includes('$30') && !html.includes('$30/user/month')) {
      changes.push({
        category: 'pricing',
        field: 'm365Copilot.pricePerUserPerMonth',
        oldValue: this.currentData.licenses?.m365Copilot?.pricePerUserPerMonth || 30,
        newValue: 'Unknown - verify manually',
        description: 'Pricing format changed on Microsoft 365 Roadmap',
        severity: 'major',
        source: 'Microsoft 365 Roadmap'
      });
    }

    return {
      changes,
      confidence: 'medium'
    };
  }

  private parseReleasePlan(html: string): Partial<ValidationResult> {
    const changes: Change[] = [];
    
    // Look for Power Platform release information
    const releaseRegex = /Copilot Studio.*?(\d{4})/g;
    const matches = [...html.matchAll(releaseRegex)];
    
    if (matches.length > 0) {
      const latestYear = Math.max(...matches.map(m => parseInt(m[1])));
      const currentYear = new Date(this.currentData.metadata?.lastUpdated || '2025-01-01').getFullYear();
      
      if (latestYear > currentYear) {
        changes.push({
          category: 'metadata',
          field: 'lastUpdated',
          oldValue: this.currentData.metadata?.lastUpdated,
          newValue: `${latestYear}-12-31`,
          description: `New release plan available for ${latestYear}`,
          severity: 'major',
          source: 'Power Platform Release Planner'
        });
      }
    }

    return {
      changes,
      confidence: 'high'
    };
  }

  private parseCopilotStudioDocs(html: string): Partial<ValidationResult> {
    const changes: Change[] = [];
    
    // Check for new features in What's New
    const newFeatureKeywords = [
      'new capability',
      'now available',
      'introducing',
      'announcement',
      'generally available'
    ];

    for (const keyword of newFeatureKeywords) {
      if (html.toLowerCase().includes(keyword)) {
        changes.push({
          category: 'features',
          field: 'copilotStudio.features',
          oldValue: null,
          newValue: `New feature detected with keyword: ${keyword}`,
          description: 'New Copilot Studio feature detected in documentation',
          severity: 'minor',
          source: 'Microsoft Learn - Copilot Studio'
        });
        break; // Only report once
      }
    }

    return {
      changes,
      confidence: 'low'
    };
  }

  private parsePricing(html: string): Partial<ValidationResult> {
    const changes: Change[] = [];
    
    // Check for pricing changes
    const pricePatterns = [
      /\$(\d+)\/user\/month/g,
      /\$(\d+\.\d+)\/message/g,
      /\$(\d+)\/month/g
    ];

    pricePatterns.forEach(pattern => {
      const matches = [...html.matchAll(pattern)];
      if (matches.length > 0) {
        const prices = matches.map(m => parseFloat(m[1]));
        
        // Check M365 Copilot pricing
        if (prices.includes(30) || (prices.some(p => p >= 25 && p <= 35))) {
          const newPrice = prices.find(p => p >= 25 && p <= 35);
          if (newPrice && newPrice !== this.currentData.licenses?.m365Copilot?.pricePerUserPerMonth) {
            changes.push({
              category: 'pricing',
              field: 'm365Copilot.pricePerUserPerMonth',
              oldValue: this.currentData.licenses?.m365Copilot?.pricePerUserPerMonth,
              newValue: newPrice,
              description: 'Microsoft 365 Copilot pricing may have changed',
              severity: 'critical',
              source: 'Power Platform Pricing Page'
            });
          }
        }
      }
    });

    return {
      changes,
      confidence: 'medium'
    };
  }

  private parseM365CopilotDocs(html: string): Partial<ValidationResult> {
    const changes: Change[] = [];
    
    // Check for new integrations or capabilities
    const appIntegrations = ['Word', 'Excel', 'PowerPoint', 'Outlook', 'Teams', 'OneNote', 'Loop'];
    const currentFeatures = this.currentData.licenses?.m365Copilot?.features || [];
    
    appIntegrations.forEach(app => {
      const hasIntegration = html.includes(`${app} Copilot`) || html.includes(`Copilot in ${app}`);
      const isDocumented = currentFeatures.some((f: string) => f.includes(app));
      
      if (hasIntegration && !isDocumented) {
        changes.push({
          category: 'features',
          field: 'm365Copilot.features',
          oldValue: currentFeatures,
          newValue: `${app} integration detected`,
          description: `New ${app} integration for Microsoft 365 Copilot`,
          severity: 'minor',
          source: 'Microsoft 365 Copilot Documentation'
        });
      }
    });

    return {
      changes,
      confidence: 'medium'
    };
  }

  private parseM365CopilotEnablementResources(html: string): Partial<ValidationResult> {
    const changes: Change[] = [];
    
    // This is a PRIMARY SOURCE for M365 Copilot - high confidence for survey question validation
    // Check for adoption guidance, readiness assessments, and deployment recommendations
    
    // Check for role-specific guidance (affects survey questions about audience)
    const roles = [
      'knowledge workers', 'executives', 'IT admins', 'developers', 
      'business users', 'frontline workers', 'sales', 'marketing', 'support'
    ];
    
    roles.forEach(role => {
      if (html.toLowerCase().includes(role)) {
        // Log for survey question review - these should be reflected in audience questions
        console.log(`  📋 Found role guidance: ${role}`);
      }
    });
    
    // Check for licensing and entitlement information
    const licensingKeywords = [
      'license requirements', 'prerequisites', 'subscription', 
      'included with', 'requires', 'entitlement'
    ];
    
    licensingKeywords.forEach(keyword => {
      if (html.toLowerCase().includes(keyword)) {
        const context = this.extractContext(html, keyword, 200);
        if (context.includes('$') || context.includes('license') || context.includes('subscription')) {
          changes.push({
            category: 'licensing',
            field: 'm365Copilot.licensing',
            oldValue: null,
            newValue: context,
            description: `Licensing information update detected: ${keyword}`,
            severity: 'major',
            source: 'M365 Copilot Enablement Resources'
          });
        }
      }
    });
    
    // Check for new deployment patterns or architectures (affects governance questions)
    const architectureKeywords = [
      'deployment', 'architecture', 'data residency', 'compliance', 
      'security', 'governance', 'administration', 'tenant setup'
    ];
    
    architectureKeywords.forEach(keyword => {
      if (html.toLowerCase().includes(keyword)) {
        console.log(`  🏗️  Found architecture guidance: ${keyword}`);
      }
    });
    
    // Check for integration patterns (affects integration complexity questions)
    const integrationKeywords = [
      'Graph connectors', 'plugins', 'extensions', 'API', 
      'custom data', 'line of business', 'third-party'
    ];
    
    integrationKeywords.forEach(keyword => {
      if (html.toLowerCase().includes(keyword)) {
        console.log(`  🔌 Found integration guidance: ${keyword}`);
      }
    });
    
    // Check for success metrics and measurement (could inform survey improvements)
    const metricsKeywords = [
      'ROI', 'adoption rate', 'productivity gains', 'user satisfaction', 
      'success metrics', 'KPIs', 'measurement'
    ];
    
    metricsKeywords.forEach(keyword => {
      if (html.toLowerCase().includes(keyword)) {
        console.log(`  📊 Found success metrics: ${keyword}`);
      }
    });
    
    // Check for common pitfalls or challenges (could inform survey design)
    const challengeKeywords = [
      'common challenges', 'pitfalls', 'lessons learned', 
      'best practices', 'recommendations', 'considerations'
    ];
    
    challengeKeywords.forEach(keyword => {
      if (html.toLowerCase().includes(keyword)) {
        console.log(`  ⚠️  Found guidance: ${keyword}`);
      }
    });

    return {
      changes,
      confidence: 'high' // Primary source - high confidence
    };
  }

  // Helper method to extract context around a keyword
  private extractContext(text: string, keyword: string, chars: number): string {
    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(keyword.toLowerCase());
    if (index === -1) return '';
    
    const start = Math.max(0, index - chars);
    const end = Math.min(text.length, index + keyword.length + chars);
    return text.substring(start, end).trim();
  }

  async validateAll(): Promise<ValidationResult[]> {
    console.log('🔍 Starting validation of Microsoft sources...\n');
    
    for (const source of this.sources) {
      console.log(`Checking: ${source.name}...`);
      
      try {
        const html = await this.fetchUrl(source.url);
        const partial = source.parser(html);
        
        this.results.push({
          source: source.name,
          hasChanges: (partial.changes?.length || 0) > 0,
          changes: partial.changes || [],
          lastChecked: new Date().toISOString(),
          confidence: partial.confidence || 'low'
        });
        
        console.log(`  ✅ Checked (${partial.changes?.length || 0} potential changes detected)\n`);
      } catch (error) {
        console.error(`  ❌ Failed to check ${source.name}:`, error);
        this.results.push({
          source: source.name,
          hasChanges: false,
          changes: [{
            category: 'error',
            field: 'validation',
            oldValue: null,
            newValue: null,
            description: `Failed to validate: ${error}`,
            severity: 'minor',
            source: source.name
          }],
          lastChecked: new Date().toISOString(),
          confidence: 'low'
        });
      }
    }

    return this.results;
  }

  generateReport(): string {
    const totalChanges = this.results.reduce((sum, r) => sum + r.changes.length, 0);
    const criticalChanges = this.results.flatMap(r => r.changes).filter(c => c.severity === 'critical');
    const majorChanges = this.results.flatMap(r => r.changes).filter(c => c.severity === 'major');

    let report = `# Microsoft Product Updates Validation Report\n\n`;
    report += `**Date:** ${new Date().toISOString()}\n`;
    report += `**Total Changes Detected:** ${totalChanges}\n`;
    report += `**Critical:** ${criticalChanges.length} | **Major:** ${majorChanges.length} | **Minor:** ${totalChanges - criticalChanges.length - majorChanges.length}\n\n`;

    report += `---\n\n`;

    if (totalChanges === 0) {
      report += `✅ **No changes detected.** All documentation is up to date.\n\n`;
    } else {
      report += `## Summary of Changes\n\n`;
      
      // Critical changes
      if (criticalChanges.length > 0) {
        report += `### 🚨 Critical Changes\n\n`;
        criticalChanges.forEach(change => {
          report += `- **${change.category}** - ${change.field}\n`;
          report += `  - ${change.description}\n`;
          report += `  - Old Value: \`${JSON.stringify(change.oldValue)}\`\n`;
          report += `  - New Value: \`${JSON.stringify(change.newValue)}\`\n`;
          report += `  - Source: ${change.source}\n\n`;
        });
      }

      // Major changes
      if (majorChanges.length > 0) {
        report += `### ⚠️ Major Changes\n\n`;
        majorChanges.forEach(change => {
          report += `- **${change.category}** - ${change.field}\n`;
          report += `  - ${change.description}\n`;
          report += `  - Source: ${change.source}\n\n`;
        });
      }

      // All changes by source
      report += `## Detailed Results by Source\n\n`;
      this.results.forEach(result => {
        report += `### ${result.source}\n`;
        report += `- **Status:** ${result.hasChanges ? '⚠️ Changes Detected' : '✅ No Changes'}\n`;
        report += `- **Confidence:** ${result.confidence}\n`;
        report += `- **Last Checked:** ${result.lastChecked}\n\n`;
        
        if (result.changes.length > 0) {
          result.changes.forEach(change => {
            report += `- [${change.severity.toUpperCase()}] ${change.description}\n`;
          });
          report += `\n`;
        }
      });
    }

    report += `---\n\n`;
    report += `## Next Steps\n\n`;
    
    if (totalChanges > 0) {
      report += `1. **Review the changes above**\n`;
      report += `   - Verify changes manually at the source URLs\n`;
      report += `   - Confirm accuracy against official Microsoft documentation\n\n`;
      
      report += `2. **Update Repository Files**\n`;
      report += `   - \`packages/decision-engine/src/data/licensing-data.json\` - Update pricing, features, capabilities\n`;
      report += `   - \`packages/decision-engine/src/data/decision-model.v1.json\` - Update survey questions if new capabilities detected\n`;
      report += `   - \`.github/copilot-instructions.md\` - Update guidance with latest information\n`;
      report += `   - \`README.md\` - Update feature lists and capabilities\n`;
      report += `   - \`apps/web/src/pages/Landing.tsx\` - Update platform descriptions if needed\n`;
      report += `   - \`apps/web/src/pages/Roadmap.tsx\` - Update use cases and phased recommendations\n\n`;
      
      report += `3. **Validate Survey Questions**\n`;
      report += `   - Review all questions in decision-model.v1.json\n`;
      report += `   - Ensure answer options reflect current platform capabilities\n`;
      report += `   - Update weights if new features change platform suitability\n`;
      report += `   - Add new questions if major capabilities were added\n\n`;
      
      report += `4. **Test Changes**\n`;
      report += `   - Run the decision engine with updated data\n`;
      report += `   - Test various scenarios through the wizard\n`;
      report += `   - Verify recommendations are still accurate\n`;
      report += `   - Check roadmap generator with new capabilities\n\n`;
      
      report += `5. **Documentation Updates**\n`;
      report += `   - Update any deployment documentation\n`;
      report += `   - Refresh CSAM communication templates if pricing changed\n`;
      report += `   - Update infographic if major changes detected\n\n`;
      
      report += `6. **Create Pull Request**\n`;
      report += `   - Include all updated files\n`;
      report += `   - Reference this validation report\n`;
      report += `   - Tag relevant reviewers\n\n`;
      
      // Add specific actions based on change categories
      const categories = [...new Set(this.results.flatMap(r => r.changes).map(c => c.category))];\n      
      if (categories.includes('pricing')) {\n        report += `⚠️ **PRICING CHANGES DETECTED** - This requires immediate attention and validation.\n\n`;
      }\n      
      if (categories.includes('deprecation')) {\n        report += `⚠️ **DEPRECATION WARNINGS** - Review affected features and plan migration path.\n\n`;
      }\n      
      if (categories.includes('survey_validation')) {\n        report += `📝 **SURVEY QUESTIONS** - Review and update questionnaire to reflect new capabilities.\n\n`;
      }\n    } else {
      report += `✅ No action required. All data is current.\n\n`;
      report += `The repository documentation, survey questions, and licensing information are aligned with the latest Microsoft product updates.\n`;
    }

    return report;
  }

  saveReport(outputPath: string): void {
    const report = this.generateReport();
    fs.writeFileSync(outputPath, report, 'utf-8');
    console.log(`\n✅ Report saved to: ${outputPath}`);
  }

  getResultsAsJson(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      totalChanges: this.results.reduce((sum, r) => sum + r.changes.length, 0),
      hasChanges: this.results.some(r => r.hasChanges),
      results: this.results
    }, null, 2);
  }
}

// Main execution
async function main() {
  const validator = new MicrosoftUpdatesValidator();
  
  try {
    await validator.validateAll();
    
    // Save markdown report
    const reportPath = path.join(__dirname, '../validation-report.md');
    validator.saveReport(reportPath);
    
    // Save JSON results for GitHub Actions
    const jsonPath = path.join(__dirname, '../validation-results.json');
    fs.writeFileSync(jsonPath, validator.getResultsAsJson(), 'utf-8');
    
    console.log('\n✅ Validation complete!');
    console.log(`📄 Markdown report: ${reportPath}`);
    console.log(`📊 JSON results: ${jsonPath}`);
    
    // Exit with appropriate code
    const hasChanges = JSON.parse(validator.getResultsAsJson()).hasChanges;
    process.exit(hasChanges ? 1 : 0);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(2);
  }
}

if (require.main === module) {
  main();
}

export { MicrosoftUpdatesValidator, ValidationResult, Change };
