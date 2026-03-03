import { useMemo, useState } from 'react';
import jsPDF from 'jspdf';

type GuideTrack = 'm365-copilot' | 'copilot-studio' | 'microsoft-foundry';

interface RoleRequirement {
  role: string;
  why: string;
  typicalOwner: string;
}

interface TrackGuide {
  id: GuideTrack;
  label: string;
  intro: string;
  licensing: string[];
  preImplementationDecisions: string[];
  implementationSteps: string[];
  permissions: RoleRequirement[];
  awareness: string[];
}

const implementationGuides: Record<GuideTrack, TrackGuide> = {
  'm365-copilot': {
    id: 'm365-copilot',
    label: 'Microsoft 365 Copilot',
    intro:
      'Introductory rollout path for enabling Microsoft 365 Copilot and delivering a functional first agent/extensibility scenario with governance in place.',
    licensing: [
      'Confirm eligible base Microsoft 365 licensing for target users and purchase/allocate Microsoft 365 Copilot licenses.',
      'Decide pilot cohort size and assignment method (direct assignment vs group-based assignment).',
      'Validate any extra licenses needed for governance controls (for example, Purview capabilities used in your plan).',
      'Assign Microsoft 365 Copilot licenses in Microsoft 365 admin center and validate user entitlement propagation.',
      'For extensibility scenarios, confirm developer and admin licensing for integrated apps/connectors used by your first agent.',
    ],
    preImplementationDecisions: [
      'Define your first 2-3 measurable scenarios (for example: meeting prep, document summarization, service response drafting).',
      'Choose pilot departments and set success metrics before rollout (adoption, time saved, quality, risk events).',
      'Set update channel strategy for Microsoft 365 Apps (Current Channel vs Monthly Enterprise Channel).',
      'Decide governance boundaries for data oversharing risk (labels, sharing controls, access hygiene).',
      'Choose extensibility approach for first functional agent: integrated app agent, connector-backed grounding, or both.',
      'Confirm support/operations model (who approves agent publication, who owns incidents, who tracks usage).',
    ],
    implementationSteps: [
      '1) Baseline readiness: verify Microsoft 365 app/network prerequisites and identity posture.',
      '2) Configure tenant controls in Microsoft 365 admin center Copilot area (including relevant Copilot controls).',
      '3) Assign pilot user licenses and validate in Active Users + product usage visibility.',
      '4) Prepare data security baseline (labels/DLP/sharing standards) to reduce accidental oversharing.',
      '5) Enable and validate user access in Copilot web and desktop entry points.',
      '6) Build your first functional agent/extensibility scenario in approved environment.',
      '7) Configure agent permissions and admin approval/publish workflow.',
      '8) Run pilot scripts with real prompts and business acceptance criteria.',
      '9) Capture telemetry (usage, adoption, response quality, incidents) and tune prompts/instructions.',
      '10) Publish broader rollout plan with phased expansion, training, and governance checkpoints.',
    ],
    permissions: [
      {
        role: 'AI Administrator',
        why: 'Manages Microsoft 365 Copilot settings, reporting, adoption controls, and AI-specific admin operations.',
        typicalOwner: 'Copilot Program Lead / M365 Platform Admin',
      },
      {
        role: 'Global Administrator (limited use)',
        why: 'Needed for high-privilege tenant actions and one-time setup tasks when lower-privilege roles are insufficient.',
        typicalOwner: 'Identity Platform Owner',
      },
      {
        role: 'License Administrator / User Administrator',
        why: 'Assigns Copilot and prerequisite licenses to pilot and production user cohorts.',
        typicalOwner: 'Identity & Access Operations',
      },
      {
        role: 'SharePoint Administrator',
        why: 'Controls content governance and permissions posture in key grounding repositories.',
        typicalOwner: 'Collaboration Platform Admin',
      },
      {
        role: 'Purview Administrator / Compliance role holders',
        why: 'Implements data protection controls, auditability, and compliance guardrails tied to Copilot usage.',
        typicalOwner: 'Security & Compliance Team',
      },
    ],
    awareness: [
      'License and capability entitlements evolve; validate against current Microsoft licensing guidance before purchase and rollout.',
      'Guest/cross-tenant licensing and access behavior can differ from internal users; test these scenarios explicitly.',
      'Oversharing risk is usually a data-permissions issue, not an AI issue—fix content access hygiene early.',
      'Use least-privilege administration; keep Global Admin usage minimal and audited.',
      'Treat pilot prompts and outputs as change-managed assets with regular quality and safety review.',
    ],
  },
  'copilot-studio': {
    id: 'copilot-studio',
    label: 'Copilot Studio',
    intro:
      'Introductory path for designing, securing, and shipping a functional Copilot Studio agent with the right environment, roles, and governance.',
    licensing: [
      'Confirm tenant-level Copilot Studio capacity model and message/capacity planning for pilot workload.',
      'Assign maker access via Copilot Studio user license (where applicable) and/or Copilot Studio author controls.',
      'Validate required Power Platform licensing for dependencies (Dataverse, flows, premium connectors).',
      'Allocate environment capacity for target production/pilot environment before go-live.',
      'Decide whether additional governance tooling is required (for example Copilot Studio Kit components).',
    ],
    preImplementationDecisions: [
      'Select environment strategy (dev/test/prod, trial vs production, tenant routing constraints).',
      'Define DLP policy boundaries and connector allow/deny posture before makers build agents.',
      'Pick authentication pattern per connector (end-user credentials, maker credentials, service principal).',
      'Define human escalation requirements and transcript access policy up front.',
      'Define quality gates (functional tests, safety tests, regression tests) before first publish.',
      'Set ALM approach (solution packaging, release approvals, rollback strategy).',
    ],
    implementationSteps: [
      '1) Create/confirm Power Platform environment with Dataverse and required capacity.',
      '2) Assign maker/author permissions for the delivery team in that environment.',
      '3) Configure DLP and environment policies to constrain risky connector combinations.',
      '4) Create the agent, define core topics/instructions/knowledge sources.',
      '5) Configure actions/connectors and credential model per integration.',
      '6) Add fallback + escalation behavior (handoff to human/system workflows).',
      '7) Configure channel publishing target (Teams/web/custom) and sharing model.',
      '8) Execute test pass: prompt quality, connector behavior, permission boundaries, transcript policy.',
      '9) Publish to pilot users, monitor transcripts/analytics, and iterate quickly.',
      '10) Promote through ALM path to production with change controls and operational runbook.',
    ],
    permissions: [
      {
        role: 'Power Platform Administrator',
        why: 'Manages environment strategy, tenant settings, and governance controls used by Copilot Studio.',
        typicalOwner: 'Power Platform CoE Admin',
      },
      {
        role: 'System Administrator (environment)',
        why: 'Required for full environment-level configuration, role assignment, and advanced admin operations.',
        typicalOwner: 'Environment Owner',
      },
      {
        role: 'Environment Maker / Copilot Studio author permissions',
        why: 'Allows makers to author, test, and iterate agents in approved environments.',
        typicalOwner: 'Agent Builder / Fusion Team Maker',
      },
      {
        role: 'Bot Transcript Viewer (if needed)',
        why: 'Grants transcript read access for support/compliance workflows; scope carefully due to sensitive conversation data.',
        typicalOwner: 'Support Lead / Compliance Analyst',
      },
      {
        role: 'AI Administrator (cross-platform governance)',
        why: 'Useful when coordinating Microsoft 365 Copilot + Copilot Studio governance, reporting, and publication workflows.',
        typicalOwner: 'Enterprise Copilot Governance Lead',
      },
    ],
    awareness: [
      'Trial environments can expire; avoid building critical pilots without a production-grade environment plan.',
      'Misconfigured DLP can block integrations late—define and test policy early.',
      'Transcript access has privacy implications; grant only to trained roles with clear purpose.',
      'Connector credential choices materially affect security and supportability; document per connector.',
      'Agent behavior quality depends on iterative testing and monitoring, not one-time design.',
    ],
  },
  'microsoft-foundry': {
    id: 'microsoft-foundry',
    label: 'Microsoft Foundry',
    intro:
      'Introductory path for rolling out Microsoft Foundry, building a first enterprise agent prototype, and applying guardrails before wider production use.',
    licensing: [
      'Confirm an Azure subscription and region strategy where required Foundry models/features are available for pilot and production.',
      'Plan model capacity and deployment type (standard vs provisioned) for expected pilot workload and latency/cost goals.',
      'Validate required role assignments and service access ahead of build (Foundry resource/project access plus model deployment permissions).',
      'Allocate budget ownership and cost monitoring per business group or delivery team before rollout.',
      'Record dependencies that can affect spend (model tokens, connected services like Search/Storage, and evaluation runs).',
    ],
    preImplementationDecisions: [
      'Define environment boundaries (dev/test/prod) and whether resources are split by business group for isolation and cost tracking.',
      'Choose access model and scopes early: subscription/resource group/resource/project with least-privilege RBAC.',
      'Decide identity strategy per connection (managed identity/shared token vs user identity passthrough) based on audit needs.',
      'Decide which enterprise data/tools to connect first (for example SharePoint, Microsoft Learn MCP, Search, Storage).',
      'Choose initial guardrail strategy (risks, intervention points, and block vs annotate actions) before pilot publication.',
      'Define evaluation gates for prototype quality and safety before promotion (task adherence, fluency, safety checks).',
    ],
    implementationSteps: [
      '1) Create or confirm Foundry resource and project structure for your pilot use case.',
      '2) Configure RBAC roles for admins, project managers, and project users at the right scopes.',
      '3) Set baseline security controls (networking approach, key management requirements, and approved connection patterns).',
      '4) Deploy your first model in the project and verify endpoint/authentication readiness.',
      '5) Build the first enterprise agent prototype with core instructions and initial tools/connections.',
      '6) Validate tool and data connectivity with real business prompts and graceful fallback behavior.',
      '7) Configure a custom guardrail: add controls, set intervention points/actions, and assign it to target models/agents.',
      '8) Run cloud evaluation for realistic scenarios and review pass/fail scores plus reasons.',
      '9) Monitor usage/latency/cost, then tune prompts, tools, model choice, and guardrail settings.',
      '10) Publish phased rollout with operations ownership, runbook checks, and promotion criteria for production.',
    ],
    permissions: [
      {
        role: 'Azure AI Account Owner (or equivalent high-privilege admin)',
        why: 'Required for top-level Foundry governance, resource configuration, and advanced operations such as guardrail management setup.',
        typicalOwner: 'Central AI Platform Administrator',
      },
      {
        role: 'Azure AI Project Manager',
        why: 'Creates and manages Foundry projects and coordinates contributor access and project-level delivery.',
        typicalOwner: 'AI Product Owner / Delivery Lead',
      },
      {
        role: 'Azure AI User',
        why: 'Enables project users/developers to build, test, and evaluate agents within approved project boundaries.',
        typicalOwner: 'AI Engineer / App Developer',
      },
      {
        role: 'Security / Networking Administrator',
        why: 'Implements organization security requirements including network isolation, private connectivity, and policy-aligned controls.',
        typicalOwner: 'Cloud Security Engineer',
      },
      {
        role: 'Cost & Observability Owner',
        why: 'Owns Azure Monitor/Log Analytics visibility, budget controls, and service health signals across pilot and production.',
        typicalOwner: 'Platform Operations / FinOps Lead',
      },
    ],
    awareness: [
      'Use least-privilege scope by default: start with Azure AI User and elevate only where required.',
      'Guardrails should be tested in playground/non-production first; assignment takes effect immediately on selected models/agents.',
      'Guardrail processing can add latency; start with essential controls and measure impact during pilot.',
      'Preview SDK and feature paths can change; confirm package/version guidance before production commitments.',
      'Document model region availability, quota assumptions, and fallback plans before expansion.',
      'Sources used for this track: Foundry rollout planning, idea-to-prototype tutorial, and guardrails creation guidance on Microsoft Learn.',
    ],
  },
};

function checklistFileBaseName(track: GuideTrack): string {
  if (track === 'm365-copilot') return 'm365-copilot';
  if (track === 'copilot-studio') return 'copilot-studio';
  return 'microsoft-foundry';
}

const sectionTitles = [
  { id: 'licensing', label: 'Licensing & Assignment' },
  { id: 'decisions', label: 'Decisions Before Build' },
  { id: 'permissions', label: 'Permissions & Roles' },
  { id: 'steps', label: 'Implementation Steps' },
  { id: 'awareness', label: 'Things to Watch' },
] as const;

function normalizeStep(step: string): string {
  return step.replace(/^\d+\)\s*/, '');
}

function toPdfSafeText(value: string): string {
  return value
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/☐/g, '[ ]')
    .replace(/✅/g, '[x]')
    .replace(/⚠️/g, '[!]')
    .replace(/❌/g, '[x]')
    .replace(/•/g, '-')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function saveTextFile(content: string, fileName: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildMarkdownChecklist(guide: TrackGuide): string {
  const lines: string[] = [];

  lines.push(`# ${guide.label} Implementation Checklist`);
  lines.push('');
  lines.push(`_Generated from Microsoft Agentic Solution Advisor on ${new Date().toISOString()}_`);
  lines.push('');
  lines.push('## Overview');
  lines.push(guide.intro);
  lines.push('');
  lines.push('## Licensing & Assignment');
  guide.licensing.forEach((item) => lines.push(`- [ ] ${item}`));
  lines.push('');
  lines.push('## Decisions Before Build');
  guide.preImplementationDecisions.forEach((item) => lines.push(`- [ ] ${item}`));
  lines.push('');
  lines.push('## Permissions & Roles (and why)');
  guide.permissions.forEach((entry) => {
    lines.push(`- [ ] **${entry.role}**`);
    lines.push(`  - Why: ${entry.why}`);
    lines.push(`  - Typical owner: ${entry.typicalOwner}`);
  });
  lines.push('');
  lines.push('## Steps to a Functional Agent');
  guide.implementationSteps.forEach((step) => lines.push(`- [ ] ${normalizeStep(step)}`));
  lines.push('');
  lines.push('## Things to Watch');
  guide.awareness.forEach((item) => lines.push(`- [ ] ${item}`));

  return lines.join('\n');
}

function buildPdfChecklist(guide: TrackGuide) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxLineWidth = pageWidth - margin * 2;
  let y = margin;

  const addHeading = (text: string) => {
    if (y > pageHeight - 80) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(text, margin, y);
    y += 20;
  };

  const addBody = (text: string, bullet = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const prefix = bullet ? '[ ] ' : '';
    const wrapped = doc.splitTextToSize(toPdfSafeText(`${prefix}${text}`), maxLineWidth);

    if (y + wrapped.length * 14 > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.text(wrapped, margin, y);
    y += wrapped.length * 14 + 4;
  };

  addHeading(`${guide.label} Implementation Checklist`);
  addBody(toPdfSafeText(`Generated: ${new Date().toLocaleString('en-US')}`));
  addBody(toPdfSafeText(guide.intro));

  addHeading('Licensing & Assignment');
  guide.licensing.forEach((item) => addBody(item, true));

  addHeading('Decisions Before Build');
  guide.preImplementationDecisions.forEach((item) => addBody(item, true));

  addHeading('Permissions & Roles (and why)');
  guide.permissions.forEach((entry) => {
    addBody(toPdfSafeText(`${entry.role} - ${entry.why}`), true);
    addBody(toPdfSafeText(`Owner: ${entry.typicalOwner}`));
  });

  addHeading('Steps to a Functional Agent');
  guide.implementationSteps.forEach((step) => addBody(normalizeStep(step), true));

  addHeading('Things to Watch');
  guide.awareness.forEach((item) => addBody(item, true));

  doc.save(
    `${checklistFileBaseName(guide.id)}-implementation-checklist.pdf`
  );
}

export default function ImplementationGuide() {
  const [selectedTrack, setSelectedTrack] = useState<GuideTrack>('m365-copilot');
  const guide = useMemo(() => implementationGuides[selectedTrack], [selectedTrack]);

  const downloadMarkdownChecklist = () => {
    const markdown = buildMarkdownChecklist(guide);
    saveTextFile(
      markdown,
      `${checklistFileBaseName(guide.id)}-implementation-checklist.md`,
      'text/markdown;charset=utf-8'
    );
  };

  const downloadPdfChecklist = () => {
    buildPdfChecklist(guide);
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Implementation Guide
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Introductory walkthroughs to move from planning to a functional first agent in either
          Microsoft 365 Copilot, Copilot Studio, or Microsoft Foundry.
        </p>

        <div className="flex flex-wrap gap-3 mb-4">
          <button
            type="button"
            onClick={() => setSelectedTrack('m365-copilot')}
            className={`btn ${selectedTrack === 'm365-copilot' ? 'btn-primary' : 'btn-secondary'}`}
          >
            M365 Copilot Walkthrough
          </button>
          <button
            type="button"
            onClick={() => setSelectedTrack('copilot-studio')}
            className={`btn ${
              selectedTrack === 'copilot-studio' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Copilot Studio Walkthrough
          </button>
          <button
            type="button"
            onClick={() => setSelectedTrack('microsoft-foundry')}
            className={`btn ${
              selectedTrack === 'microsoft-foundry' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            Microsoft Foundry Walkthrough
          </button>
        </div>

        <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <span className="font-semibold">Selected:</span> {guide.label} — {guide.intro}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={downloadMarkdownChecklist} className="btn-secondary">
            Download Markdown Checklist
          </button>
          <button type="button" onClick={downloadPdfChecklist} className="btn-primary">
            Download PDF Checklist
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Guide Menu</h2>
        <div className="flex flex-wrap gap-2">
          {sectionTitles.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="btn-secondary !h-10 text-sm">
              {section.label}
            </a>
          ))}
        </div>
      </section>

      <section id="licensing" className="card">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Licensing & Assignment
        </h2>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          {guide.licensing.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>

      <section id="decisions" className="card">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Decisions Before Build
        </h2>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          {guide.preImplementationDecisions.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>

      <section id="permissions" className="card overflow-x-auto">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Permissions & Roles (and why)
        </h2>
        <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="text-left px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                Role
              </th>
              <th className="text-left px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                Why this role is required
              </th>
              <th className="text-left px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white">
                Typical owner
              </th>
            </tr>
          </thead>
          <tbody>
            {guide.permissions.map((entry) => (
              <tr key={entry.role} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 font-medium">
                  {entry.role}
                </td>
                <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">{entry.why}</td>
                <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                  {entry.typicalOwner}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section id="steps" className="card">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Steps to a Functional Agent
        </h2>
        <ol className="space-y-2 text-gray-700 dark:text-gray-300 list-decimal list-inside">
          {guide.implementationSteps.map((step) => (
            <li key={step}>{normalizeStep(step)}</li>
          ))}
        </ol>
      </section>

      <section id="awareness" className="card">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
          Things to Watch
        </h2>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          {guide.awareness.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
