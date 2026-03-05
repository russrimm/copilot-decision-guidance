/**
 * Monthly Survey Question Validation Script
 *
 * Reviews survey questions monthly for accuracy against Microsoft 365 Copilot
 * enablement resources and official documentation.
 *
 * Primary Sources:
 * - https://learn.microsoft.com/en-us/copilot/microsoft-365/
 * - https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources
 * - https://microsoft.github.io/mcscatblog/posts/copilot-studio-api-decision-guide/
 *
 * Run monthly (1st of each month) via GitHub Actions
 */

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

interface QuestionValidationResult {
  questionId: string;
  questionTitle: string;
  status: 'accurate' | 'outdated' | 'needs-review' | 'missing-option';
  issues: string[];
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  lastValidated: string;
}

interface SurveyValidationReport {
  checkDate: string;
  totalQuestions: number;
  accurateQuestions: number;
  outdatedQuestions: number;
  needsReview: number;
  results: QuestionValidationResult[];
  sourceUrls: string[];
  recommendations: string[];
}

class SurveyQuestionValidator {
  private readonly PRIMARY_SOURCES = [
    'https://learn.microsoft.com/en-us/copilot/microsoft-365/',
    'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources',
    'https://learn.microsoft.com/en-us/copilot/microsoft-365/release-notes',
    'https://learn.microsoft.com/en-us/microsoft-copilot-studio/whats-new',
    'https://learn.microsoft.com/en-us/azure/ai-studio/what-is-ai-studio',
    'https://microsoft.github.io/mcscatblog/posts/copilot-studio-api-decision-guide/',
  ];

  private decisionModel: any;
  private sourceContent: Map<string, string> = new Map();
  private validationResults: QuestionValidationResult[] = [];

  constructor() {
    this.loadDecisionModel();
  }

  private loadDecisionModel(): void {
    try {
      const modelPath = path.join(
        __dirname,
        '../packages/decision-engine/src/data/decision-model.v1.json'
      );
      this.decisionModel = JSON.parse(fs.readFileSync(modelPath, 'utf-8'));
      console.log('✅ Loaded decision model');
      console.log(`   Version: ${this.decisionModel.version}`);
      console.log(`   Last Updated: ${this.decisionModel.metadata.lastUpdated}`);
      console.log(`   Total Question Groups: ${this.decisionModel.questionGroups.length}`);
      console.log('');
    } catch (error) {
      console.error('❌ Failed to load decision model:', error);
      this.decisionModel = {};
    }
  }

  private async fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https
        .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        })
        .on('error', reject);
    });
  }

  /**
   * Fetch all primary source content
   */
  private async fetchAllSources(): Promise<void> {
    console.log('📥 Fetching primary Microsoft sources...\n');

    for (const url of this.PRIMARY_SOURCES) {
      try {
        console.log(`   Fetching: ${url}`);
        const content = await this.fetchUrl(url);
        this.sourceContent.set(url, content);
        console.log(`   ✅ Fetched (${Math.round(content.length / 1024)}KB)\n`);
      } catch (error) {
        console.error(`   ❌ Failed to fetch ${url}:`, error);
        this.sourceContent.set(url, '');
      }
    }
  }

  /**
   * Main validation workflow
   */
  async validate(): Promise<SurveyValidationReport> {
    console.log('🔍 Starting Monthly Survey Question Validation');
    console.log(`📅 Check Date: ${new Date().toISOString()}`);
    console.log(`📚 Primary Sources: ${this.PRIMARY_SOURCES.length}`);
    console.log('');

    // Step 1: Fetch all source content
    await this.fetchAllSources();

    // Step 2: Validate each question group
    console.log('📋 Validating Question Groups...\n');
    for (const group of this.decisionModel.questionGroups) {
      console.log(`📂 Group: ${group.title}`);
      for (const question of group.questions) {
        const result = await this.validateQuestion(group, question);
        this.validationResults.push(result);

        const status =
          result.status === 'accurate'
            ? '✅'
            : result.status === 'outdated'
              ? '❌'
              : result.status === 'missing-option'
                ? '⚠️'
                : '🔔';
        console.log(`   ${status} ${question.title}`);
        if (result.issues.length > 0) {
          result.issues.forEach((issue) => console.log(`      • ${issue}`));
        }
      }
      console.log('');
    }

    // Step 3: Generate recommendations
    const recommendations = this.generateRecommendations();

    // Step 4: Create report
    const report: SurveyValidationReport = {
      checkDate: new Date().toISOString(),
      totalQuestions: this.validationResults.length,
      accurateQuestions: this.validationResults.filter((r) => r.status === 'accurate').length,
      outdatedQuestions: this.validationResults.filter((r) => r.status === 'outdated').length,
      needsReview: this.validationResults.filter(
        (r) => r.status === 'needs-review' || r.status === 'missing-option'
      ).length,
      results: this.validationResults,
      sourceUrls: this.PRIMARY_SOURCES,
      recommendations,
    };

    // Step 5: Save report
    this.saveReport(report);

    console.log('✅ Validation Complete!');
    console.log(`   Total Questions: ${report.totalQuestions}`);
    console.log(`   ✅ Accurate: ${report.accurateQuestions}`);
    console.log(`   ❌ Outdated: ${report.outdatedQuestions}`);
    console.log(`   🔔 Needs Review: ${report.needsReview}`);
    console.log('');

    return report;
  }

  /**
   * Validate a single question against Microsoft sources
   */
  private async validateQuestion(group: any, question: any): Promise<QuestionValidationResult> {
    const result: QuestionValidationResult = {
      questionId: question.id,
      questionTitle: question.title,
      status: 'accurate',
      issues: [],
      recommendations: [],
      confidence: 'high',
      lastValidated: new Date().toISOString(),
    };

    // Combine all source content
    const allContent = Array.from(this.sourceContent.values()).join(' ').toLowerCase();

    // Special validation based on question group
    switch (group.id) {
      case 'outcome':
        this.validateOutcomeQuestions(question, allContent, result);
        break;
      case 'audience':
        this.validateAudienceQuestions(question, allContent, result);
        break;
      case 'data':
        this.validateDataQuestions(question, allContent, result);
        break;
      case 'integration':
        this.validateIntegrationQuestions(question, allContent, result);
        break;
      case 'governance':
        this.validateGovernanceQuestions(question, allContent, result);
        break;
      case 'timeToValue':
        this.validateTimeToValueQuestions(question, allContent, result);
        break;
      case 'cost':
        this.validateCostQuestions(question, allContent, result);
        break;
    }

    // Generic validation: check if answer options are mentioned in sources
    this.validateAnswerOptions(question, allContent, result);

    return result;
  }

  /**
   * Validate outcome/use case questions
   */
  private validateOutcomeQuestions(
    question: any,
    content: string,
    result: QuestionValidationResult
  ): void {
    // Check if primary outcomes are still valid
    const outcomes = ['productivity', 'automation', 'custom agent', 'chatbot', 'workflow'];

    for (const outcome of outcomes) {
      if (!content.includes(outcome)) {
        result.issues.push(
          `Outcome "${outcome}" not prominently mentioned in current documentation`
        );
        result.status = 'needs-review';
        result.confidence = 'medium';
      }
    }

    // Check for new use cases
    const newUseCases = [
      'multi-agent orchestration',
      'ai agents',
      'intelligent automation',
      'decision support',
      'knowledge management',
      'process mining',
    ];

    for (const useCase of newUseCases) {
      if (content.includes(useCase) && question.id === 'outcome_primary') {
        result.recommendations.push(`Consider adding answer option for: ${useCase}`);
        result.status = 'missing-option';
      }
    }
  }

  /**
   * Validate audience questions
   */
  private validateAudienceQuestions(
    question: any,
    content: string,
    result: QuestionValidationResult
  ): void {
    const roles = ['knowledge worker', 'employee', 'customer', 'partner', 'external'];

    for (const role of roles) {
      if (content.includes(role)) {
        // Role is still mentioned - good
      }
    }

    // Check for new audience types
    const newAudiences = ['frontline worker', 'field service', 'remote worker', 'hybrid worker'];
    for (const audience of newAudiences) {
      if (content.includes(audience)) {
        result.recommendations.push(`Consider adding audience type: ${audience}`);
      }
    }
  }

  /**
   * Validate data source questions
   */
  private validateDataQuestions(
    question: any,
    content: string,
    result: QuestionValidationResult
  ): void {
    // Check if Graph is still the primary data source for M365 Copilot
    if (!content.includes('microsoft graph') && !content.includes('graph api')) {
      result.issues.push(
        'Microsoft Graph not prominently mentioned - verify if still primary data source'
      );
      result.status = 'needs-review';
    }

    // Check for new data connectors
    const connectors = [
      'sharepoint',
      'onedrive',
      'teams',
      'exchange',
      'outlook',
      'azure ai search',
      'dataverse',
      'sql',
      'custom connector',
    ];

    let mentionedConnectors = 0;
    for (const connector of connectors) {
      if (content.includes(connector)) {
        mentionedConnectors++;
      }
    }

    if (mentionedConnectors < connectors.length * 0.5) {
      result.issues.push(
        `Only ${mentionedConnectors}/${connectors.length} expected connectors mentioned`
      );
      result.confidence = 'medium';
    }
  }

  /**
   * Validate integration complexity questions
   */
  private validateIntegrationQuestions(
    question: any,
    content: string,
    result: QuestionValidationResult
  ): void {
    // Check for integration patterns
    const patterns = [
      'plugin',
      'connector',
      'api',
      'webhook',
      'graph connector',
      'custom integration',
      'third-party',
      'line of business',
    ];

    for (const pattern of patterns) {
      if (!content.includes(pattern) && question.helperText?.toLowerCase().includes(pattern)) {
        result.issues.push(`Integration pattern "${pattern}" not found in current documentation`);
        result.status = 'needs-review';
      }
    }

    // Check for new integration types
    if (content.includes('copilot studio connector') || content.includes('declarative agent')) {
      result.recommendations.push(
        'Consider updating integration options with latest connector types'
      );
    }
  }

  /**
   * Validate governance questions
   */
  private validateGovernanceQuestions(
    question: any,
    content: string,
    result: QuestionValidationResult
  ): void {
    // Check compliance and governance terms
    const governanceTerms = [
      'dlp',
      'data loss prevention',
      'compliance',
      'security',
      'rbac',
      'role-based access',
      'audit',
      'retention',
      'data residency',
      'sovereignty',
      'gdpr',
    ];

    for (const term of governanceTerms) {
      if (content.includes(term)) {
        // Still relevant
      }
    }

    // Check for new governance features
    if (content.includes('sensitivity label') || content.includes('information protection')) {
      result.recommendations.push(
        'Consider adding Information Protection / Sensitivity Labels as governance option'
      );
    }
  }

  /**
   * Validate time-to-value questions
   */
  private validateTimeToValueQuestions(
    question: any,
    content: string,
    result: QuestionValidationResult
  ): void {
    // Check if deployment timelines mentioned match our options
    const timelines = ['day one', 'immediate', 'weeks', 'months', 'pilot', 'rollout'];

    let timelinesMentioned = 0;
    for (const timeline of timelines) {
      if (content.includes(timeline)) {
        timelinesMentioned++;
      }
    }

    if (timelinesMentioned === 0) {
      result.issues.push('Deployment timeline information not found in current documentation');
      result.confidence = 'low';
    }
  }

  /**
   * Validate cost questions
   */
  private validateCostQuestions(
    question: any,
    content: string,
    result: QuestionValidationResult
  ): void {
    // Check pricing mentions
    if (content.includes('$30') && content.includes('per user')) {
      // M365 Copilot pricing confirmed
    } else {
      result.issues.push('M365 Copilot pricing ($30/user/month) not found in documentation');
      result.status = 'needs-review';
    }

    // Check for Copilot Studio pricing
    if (
      content.includes('copilot studio') &&
      (content.includes('$0.01') || content.includes('message'))
    ) {
      // Copilot Studio pricing confirmed
    } else if (
      question.id.includes('copilot_studio') ||
      question.title.toLowerCase().includes('studio')
    ) {
      result.issues.push('Copilot Studio pricing not verified in documentation');
      result.confidence = 'medium';
    }
  }

  /**
   * Validate answer options against source content
   */
  private validateAnswerOptions(
    question: any,
    content: string,
    result: QuestionValidationResult
  ): void {
    if (!question.answers) return;

    let missingOptions = 0;

    for (const answer of question.answers) {
      // Extract key terms from answer label
      const terms = answer.label
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter((term: string) => term.length > 4) // Only meaningful words
        .slice(0, 3); // Top 3 terms

      let termFound = false;
      for (const term of terms) {
        if (content.includes(term)) {
          termFound = true;
          break;
        }
      }

      if (!termFound && !answer.id.includes('unsure')) {
        missingOptions++;
      }
    }

    if (missingOptions > question.answers.length * 0.4) {
      result.issues.push(
        `${missingOptions}/${question.answers.length} answer options not found in documentation`
      );
      result.status = 'needs-review';
      result.confidence = 'low';
    }
  }

  /**
   * Generate overall recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const outdated = this.validationResults.filter((r) => r.status === 'outdated');
    const needsReview = this.validationResults.filter((r) => r.status === 'needs-review');
    const missingOptions = this.validationResults.filter((r) => r.status === 'missing-option');

    if (outdated.length > 0) {
      recommendations.push(
        `🚨 CRITICAL: ${outdated.length} questions are outdated and need immediate update`
      );
    }

    if (needsReview.length > 0) {
      recommendations.push(
        `⚠️  ${needsReview.length} questions need manual review against latest documentation`
      );
    }

    if (missingOptions.length > 0) {
      recommendations.push(
        `💡 ${missingOptions.length} questions may benefit from additional answer options`
      );
    }

    // Always recommend reviewing the enablement resources
    recommendations.push(
      '📖 Review https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-enablement-resources for latest guidance'
    );
    recommendations.push(
      '📊 Review https://learn.microsoft.com/en-us/copilot/microsoft-365/ for comprehensive product updates'
    );

    if (outdated.length === 0 && needsReview.length === 0 && missingOptions.length === 0) {
      recommendations.push(
        '✅ All survey questions appear accurate based on current Microsoft documentation'
      );
    }

    return recommendations;
  }

  /**
   * Save validation report
   */
  private saveReport(report: SurveyValidationReport): void {
    const reportPath = path.join(__dirname, '../survey-validation-report.md');
    const jsonReportPath = path.join(__dirname, '../survey-validation-results.json');

    // Markdown report
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(reportPath, markdown);

    // JSON report
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

    console.log(`📄 Saved report to: ${reportPath}`);
    console.log(`📄 Saved JSON to: ${jsonReportPath}`);
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(report: SurveyValidationReport): string {
    let md = `# Monthly Survey Question Validation Report\n\n`;
    md += `**Check Date:** ${new Date(report.checkDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}\n\n`;

    // Summary
    md += `## Summary\n\n`;
    md += `- **Total Questions:** ${report.totalQuestions}\n`;
    md += `- **✅ Accurate:** ${report.accurateQuestions} (${Math.round((report.accurateQuestions / report.totalQuestions) * 100)}%)\n`;
    md += `- **❌ Outdated:** ${report.outdatedQuestions}\n`;
    md += `- **🔔 Needs Review:** ${report.needsReview}\n\n`;

    // Primary Sources
    md += `## Primary Sources Validated\n\n`;
    report.sourceUrls.forEach((url) => {
      md += `- [${url}](${url})\n`;
    });
    md += `\n`;

    // Questions needing attention
    const needsAttention = report.results.filter((r) => r.status !== 'accurate');
    if (needsAttention.length > 0) {
      md += `## Questions Requiring Attention\n\n`;

      for (const result of needsAttention) {
        const icon =
          result.status === 'outdated' ? '❌' : result.status === 'missing-option' ? '💡' : '⚠️';
        md += `### ${icon} ${result.questionTitle}\n\n`;
        md += `- **Question ID:** \`${result.questionId}\`\n`;
        md += `- **Status:** ${result.status}\n`;
        md += `- **Confidence:** ${result.confidence}\n\n`;

        if (result.issues.length > 0) {
          md += `**Issues:**\n`;
          result.issues.forEach((issue) => (md += `- ${issue}\n`));
          md += `\n`;
        }

        if (result.recommendations.length > 0) {
          md += `**Recommendations:**\n`;
          result.recommendations.forEach((rec) => (md += `- ${rec}\n`));
          md += `\n`;
        }
      }
    }

    // Overall recommendations
    if (report.recommendations.length > 0) {
      md += `## Overall Recommendations\n\n`;
      report.recommendations.forEach((rec) => (md += `${rec}\n\n`));
    }

    // Manual verification steps
    md += `## Manual Verification Steps\n\n`;
    md += `1. Review each question flagged above against the primary source documentation\n`;
    md += `2. Check for new Microsoft 365 Copilot features that should be reflected in questions\n`;
    md += `3. Verify answer options remain comprehensive and mutually exclusive\n`;
    md += `4. Update question weights if product capabilities have significantly changed\n`;
    md += `5. Test the survey end-to-end with updated information\n`;
    md += `6. Update \`decision-model.v1.json\` with any changes\n`;
    md += `7. Update \`lastUpdated\` in metadata\n`;
    md += `8. Commit changes with message: "chore: update survey questions based on monthly validation (Month YYYY)"\n\n`;

    // Timestamp
    md += `---\n\n`;
    md += `*Report generated: ${new Date().toISOString()}*\n`;
    md += `*Next validation: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*\n`;

    return md;
  }
}

// Execute validation
const validator = new SurveyQuestionValidator();
validator
  .validate()
  .then((report) => {
    if (report.outdatedQuestions > 0 || report.needsReview > 0) {
      process.exit(1); // Exit with error to trigger issue creation
    }
    process.exit(0); // Clean exit
  })
  .catch((error) => {
    console.error('❌ Validation error:', error);
    process.exit(2); // Exit with error
  });
