import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

type Severity = 'critical' | 'major' | 'minor';

type MindMapIssue = {
  category: string;
  severity: Severity;
  message: string;
  suggestion: string;
};

type MindMapValidationResult = {
  timestamp: string;
  hasChanges: boolean;
  totalIssues: number;
  issues: MindMapIssue[];
  checks: {
    duplicateNodeIdsInTrees: boolean;
    m365LearnUrlPrefix: boolean;
  };
};

const CURRENT_FILE = fileURLToPath(import.meta.url);
const CURRENT_DIR = path.dirname(CURRENT_FILE);
const REPO_ROOT = path.join(CURRENT_DIR, '..');
const MIND_MAP_FILE = path.join(REPO_ROOT, 'apps/web/src/pages/CopilotStudioMindMap.tsx');
const REPORT_FILE = path.join(REPO_ROOT, 'mindmap-validation-report.md');
const RESULTS_FILE = path.join(REPO_ROOT, 'mindmap-validation-results.json');

const M365_PREFIX = 'https://learn.microsoft.com/en-us/microsoft-365-copilot';

function extractSection(content: string, startMarker: string, endMarker: string): string {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    return '';
  }

  return content.slice(start, end);
}

function collectIds(content: string): string[] {
  const matches = content.matchAll(/id:\s*'([^']+)'/g);
  return Array.from(matches, (match) => match[1]);
}

function collectLearnUrls(content: string): string[] {
  const matches = content.matchAll(/learnUrl:\s*'([^']+)'/g);
  return Array.from(matches, (match) => match[1]);
}

function buildReport(result: MindMapValidationResult): string {
  const lines: string[] = [];
  lines.push('# Mind Map Validation Report');
  lines.push('');
  lines.push(`**Date:** ${result.timestamp}`);
  lines.push(`**Total Issues:** ${result.totalIssues}`);
  lines.push(`**Status:** ${result.hasChanges ? '⚠️ Updates Required' : '✅ Valid'}`);
  lines.push('');

  if (!result.hasChanges) {
    lines.push('All mind map checks passed.');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('## Issues Detected');
  lines.push('');

  for (const issue of result.issues) {
    lines.push(`- [${issue.severity.toUpperCase()}] **${issue.category}** - ${issue.message}`);
    lines.push(`  - Suggestion: ${issue.suggestion}`);
  }

  lines.push('');
  lines.push('## Required Action');
  lines.push('');
  lines.push('1. Update `apps/web/src/pages/CopilotStudioMindMap.tsx` to resolve all issues listed above.');
  lines.push('2. Re-run `ts-node scripts/validate-mindmaps.ts` until the report is clean.');
  lines.push('');

  return lines.join('\n');
}

function validateMindMaps(): MindMapValidationResult {
  const timestamp = new Date().toISOString();
  const issues: MindMapIssue[] = [];

  if (!fs.existsSync(MIND_MAP_FILE)) {
    issues.push({
      category: 'file',
      severity: 'critical',
      message: 'Mind map source file was not found.',
      suggestion: 'Restore apps/web/src/pages/CopilotStudioMindMap.tsx before running weekly validation.',
    });

    return {
      timestamp,
      hasChanges: true,
      totalIssues: issues.length,
      issues,
      checks: {
        duplicateNodeIdsInTrees: false,
        m365LearnUrlPrefix: false,
      },
    };
  }

  const content = fs.readFileSync(MIND_MAP_FILE, 'utf-8');

  const treesSection = extractSection(content, 'const copilotStudioTree', 'const mindMapOptions');
  if (!treesSection) {
    issues.push({
      category: 'structure',
      severity: 'critical',
      message: 'Unable to locate tree definitions section in CopilotStudioMindMap.tsx.',
      suggestion: 'Ensure tree constants remain defined before mindMapOptions.',
    });
  } else {
    const ids = collectIds(treesSection);
    const counts = new Map<string, number>();
    for (const id of ids) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    const duplicates = Array.from(counts.entries())
      .filter(([, count]) => count > 1)
      .map(([id]) => id)
      .sort();

    if (duplicates.length > 0) {
      issues.push({
        category: 'duplicate-ids',
        severity: 'major',
        message: `Duplicate node ids detected in tree definitions: ${duplicates.join(', ')}`,
        suggestion: 'Make each node id unique to avoid connector/path and selection collisions.',
      });
    }
  }

  const m365Section = extractSection(content, 'const m365CopilotTree', 'const microsoftFoundryTree');
  if (!m365Section) {
    issues.push({
      category: 'structure',
      severity: 'critical',
      message: 'Unable to locate m365CopilotTree section.',
      suggestion: 'Ensure m365CopilotTree is declared before microsoftFoundryTree.',
    });
  } else {
    const m365Urls = collectLearnUrls(m365Section);
    const invalidUrls = m365Urls.filter((url) => !url.startsWith(M365_PREFIX));

    if (invalidUrls.length > 0) {
      issues.push({
        category: 'm365-link-policy',
        severity: 'major',
        message: `Found ${invalidUrls.length} Microsoft 365 Copilot links outside required prefix.`,
        suggestion: `Replace non-compliant links so all m365CopilotTree learnUrl values start with ${M365_PREFIX}.`,
      });
    }
  }

  return {
    timestamp,
    hasChanges: issues.length > 0,
    totalIssues: issues.length,
    issues,
    checks: {
      duplicateNodeIdsInTrees: !issues.some((issue) => issue.category === 'duplicate-ids'),
      m365LearnUrlPrefix: !issues.some((issue) => issue.category === 'm365-link-policy'),
    },
  };
}

function main() {
  const result = validateMindMaps();
  const report = buildReport(result);

  fs.writeFileSync(REPORT_FILE, report, 'utf-8');
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(result, null, 2), 'utf-8');

  console.log(`Mind map validation complete. Issues: ${result.totalIssues}`);
  console.log(`Report: ${REPORT_FILE}`);
  console.log(`Results: ${RESULTS_FILE}`);

  process.exit(result.hasChanges ? 1 : 0);
}

const isMain = process.argv[1] ? path.resolve(process.argv[1]) === CURRENT_FILE : false;

if (isMain) {
  main();
}

export { validateMindMaps };