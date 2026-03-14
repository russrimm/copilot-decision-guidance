/**
 * Microsoft Product Updates Validation Script (MCP-first)
 *
 * This validator enforces the Microsoft Learn MCP workflow by reading a checked-in
 * weekly snapshot that must be produced from Microsoft Learn MCP tools.
 *
 * Exit codes:
 * - 0: No updates required (fresh snapshot, no pending impact items)
 * - 1: Updates required (stale snapshot and/or pending impact items)
 * - 2: Validation execution failure
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

type Severity = 'critical' | 'major' | 'minor';
type Confidence = 'high' | 'medium' | 'low';
type ImpactStatus = 'pending' | 'completed' | 'not-applicable';

interface Change {
  category: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  description: string;
  severity: Severity;
  source: string;
}

interface ValidationResult {
  source: string;
  hasChanges: boolean;
  changes: Change[];
  lastChecked: string;
  confidence: Confidence;
}

interface McpSourcePage {
  id: string;
  title: string;
  url: string;
  lastReviewedAt?: string;
  highlights: string[];
  changeSummary?: string;
}

interface SnapshotImpact {
  id: string;
  summary: string;
  severity: Severity;
  status: ImpactStatus;
  recommendedFiles: string[];
  notes?: string;
}

interface MicrosoftLearnSnapshot {
  schemaVersion: number;
  source: 'microsoft-learn-mcp';
  capturedAt: string;
  lookbackDays: number;
  generatedBy: string;
  pages: McpSourcePage[];
  impacts: SnapshotImpact[];
  notes?: string[];
}

interface ValidationSummary {
  timestamp: string;
  totalChanges: number;
  hasChanges: boolean;
  results: ValidationResult[];
  metadata: {
    snapshotPath: string;
    maxSnapshotAgeDays: number;
  };
}

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = path.dirname(SCRIPT_FILE);

const SNAPSHOT_PATH = path.join(SCRIPT_DIR, '../docs/microsoft-learn-weekly-snapshot.json');
const REPORT_PATH = path.join(SCRIPT_DIR, '../validation-report.md');
const RESULTS_PATH = path.join(SCRIPT_DIR, '../validation-results.json');
const MAX_SNAPSHOT_AGE_DAYS = 8;

class MicrosoftUpdatesValidator {
  private results: ValidationResult[] = [];

  private readSnapshot(): MicrosoftLearnSnapshot {
    if (!fs.existsSync(SNAPSHOT_PATH)) {
      throw new Error(
        `Missing required MCP snapshot: ${SNAPSHOT_PATH}. Refresh it via Microsoft Learn MCP tools before running validation.`
      );
    }

    const raw = fs.readFileSync(SNAPSHOT_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<MicrosoftLearnSnapshot>;

    if (parsed.source !== 'microsoft-learn-mcp') {
      throw new Error(
        'Snapshot source must be "microsoft-learn-mcp" to enforce MCP-first validation.'
      );
    }

    if (!parsed.capturedAt || Number.isNaN(new Date(parsed.capturedAt).getTime())) {
      throw new Error('Snapshot capturedAt is missing or invalid ISO timestamp.');
    }

    if (!Array.isArray(parsed.pages)) {
      throw new Error('Snapshot pages must be an array.');
    }

    if (!Array.isArray(parsed.impacts)) {
      throw new Error('Snapshot impacts must be an array.');
    }

    return parsed as MicrosoftLearnSnapshot;
  }

  private getSnapshotAgeDays(capturedAt: string): number {
    const capturedMs = new Date(capturedAt).getTime();
    const nowMs = Date.now();
    return Math.floor((nowMs - capturedMs) / (1000 * 60 * 60 * 24));
  }

  async validateAll(): Promise<ValidationResult[]> {
    console.log('🔍 Validating Microsoft Learn MCP weekly snapshot...\n');

    const snapshot = this.readSnapshot();
    const snapshotAgeDays = this.getSnapshotAgeDays(snapshot.capturedAt);
    const pendingImpacts = snapshot.impacts.filter((impact) => impact.status === 'pending');

    const mcpValidationChanges: Change[] = [];

    if (snapshotAgeDays > MAX_SNAPSHOT_AGE_DAYS) {
      mcpValidationChanges.push({
        category: 'mcp_snapshot_freshness',
        field: 'capturedAt',
        oldValue: snapshot.capturedAt,
        newValue: new Date().toISOString(),
        description: `MCP snapshot is ${snapshotAgeDays} days old. Refresh weekly snapshot using Microsoft Learn MCP tools.`,
        severity: 'critical',
        source: 'Microsoft Learn MCP Snapshot',
      });
    }

    for (const impact of pendingImpacts) {
      mcpValidationChanges.push({
        category: 'portal_update_required',
        field: impact.recommendedFiles.join(', '),
        oldValue: 'pending',
        newValue: 'completed',
        description: impact.summary,
        severity: impact.severity,
        source: `Impact ${impact.id}`,
      });
    }

    const pageCoverageChange: Change = {
      category: 'mcp_source_coverage',
      field: 'pages.length',
      oldValue: null,
      newValue: snapshot.pages.length,
      description: `Snapshot contains ${snapshot.pages.length} MCP-validated Microsoft Learn sources.`,
      severity: 'minor',
      source: 'Microsoft Learn MCP Snapshot',
    };

    this.results.push({
      source: 'Microsoft Learn MCP Snapshot',
      hasChanges: mcpValidationChanges.length > 0,
      changes: [...mcpValidationChanges, pageCoverageChange],
      lastChecked: new Date().toISOString(),
      confidence: 'high',
    });

    console.log(`  ✅ Snapshot read from: ${SNAPSHOT_PATH}`);
    console.log(`  ✅ Snapshot age: ${snapshotAgeDays} day(s)`);
    console.log(`  ✅ Pending impacts: ${pendingImpacts.length}\n`);

    return this.results;
  }

  generateReport(): string {
    const now = new Date().toISOString();
    const actionable = this.results
      .flatMap((result) => result.changes)
      .filter((change) => change.category !== 'mcp_source_coverage');

    const criticalChanges = actionable.filter((change) => change.severity === 'critical');
    const majorChanges = actionable.filter((change) => change.severity === 'major');
    const minorChanges = actionable.filter((change) => change.severity === 'minor');

    let report = '# Microsoft Product Updates Validation Report\n\n';
    report += `**Date:** ${now}\n`;
    report +=
      '**Validation Mode:** Microsoft Learn MCP snapshot (MCP-first, no direct web scraping)\n';
    report += `**Snapshot File:** \`${SNAPSHOT_PATH}\`\n`;
    report += `**Max Snapshot Age:** ${MAX_SNAPSHOT_AGE_DAYS} days\n\n`;

    report += '## Summary\n\n';
    report += `- Actionable updates: **${actionable.length}**\n`;
    report += `- Critical: **${criticalChanges.length}**\n`;
    report += `- Major: **${majorChanges.length}**\n`;
    report += `- Minor: **${minorChanges.length}**\n\n`;

    if (actionable.length === 0) {
      report +=
        '✅ No updates required. Snapshot is fresh and no pending portal updates were recorded.\n\n';
    } else {
      report += '## Action Required\n\n';
      for (const change of actionable) {
        report += `- [${change.severity.toUpperCase()}] ${change.description}\n`;
        report += `  - Source: ${change.source}\n`;
        report += `  - Field(s): ${change.field}\n`;
      }
      report += '\n';
    }

    report += '## MCP Workflow\n\n';
    report +=
      '1. Use Microsoft Learn MCP tools (`microsoft_docs_search`, then `microsoft_docs_fetch`) to collect weekly updates.\n';
    report +=
      '2. Update `docs/microsoft-learn-weekly-snapshot.json` with findings and impacted portal files.\n';
    report += '3. Implement code/content updates for each pending impact item.\n';
    report += '4. Mark impact status as `completed` after each update is merged.\n\n';

    return report;
  }

  getResults(): ValidationSummary {
    const totalChanges = this.results.reduce((sum, result) => sum + result.changes.length, 0);
    const actionable = this.results
      .flatMap((result) => result.changes)
      .filter((change) => change.category !== 'mcp_source_coverage');

    return {
      timestamp: new Date().toISOString(),
      totalChanges,
      hasChanges: actionable.length > 0,
      results: this.results,
      metadata: {
        snapshotPath: SNAPSHOT_PATH,
        maxSnapshotAgeDays: MAX_SNAPSHOT_AGE_DAYS,
      },
    };
  }

  saveArtifacts(): void {
    fs.writeFileSync(REPORT_PATH, this.generateReport(), 'utf-8');
    fs.writeFileSync(RESULTS_PATH, JSON.stringify(this.getResults(), null, 2), 'utf-8');

    console.log(`📄 Markdown report: ${REPORT_PATH}`);
    console.log(`📊 JSON results: ${RESULTS_PATH}`);
  }
}

async function main(): Promise<void> {
  const validator = new MicrosoftUpdatesValidator();

  try {
    await validator.validateAll();
    validator.saveArtifacts();

    const summary = validator.getResults();

    if (summary.hasChanges) {
      console.log('\n⚠️ Changes detected - action required.');
      process.exit(1);
    }

    console.log('\n✅ Validation complete - no action required.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(2);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_FILE) {
  void main();
}

export { MicrosoftUpdatesValidator };
