import PptxGenJSImport from 'pptxgenjs';
import type { ScoringResult } from '@copilot-guidance/decision-engine';

type RecommendationType = ScoringResult['recommendation'];

export interface ExecutiveOverviewPptxInput {
  timestamp: string;
  scoringResult: ScoringResult;
  recommendation: {
    type: RecommendationType;
    title: string;
    summary?: string;
    reasons?: string[];
    nextSteps?: string[];
  };
  qaData: Array<{
    questionId?: string;
    question: string;
    answer: string;
    comment?: string;
  }>;
  aiRecommendation?: {
    summary?: string;
    strategicGuidance?: string;
    implementationRoadmap?: string[];
    riskMitigation?: string[];
    nextSteps?: string[];
  };
}

const COLOR_PRIMARY = '2563EB';
const COLOR_DARK = '1F2937';
const COLOR_LIGHT = 'F3F4F6';
const COLOR_MUTED = '6B7280';

function formatRecommendationType(type: RecommendationType): string {
  switch (type) {
    case 'M365_COPILOT':
      return 'Microsoft 365 Copilot';
    case 'COPILOT_STUDIO':
      return 'Copilot Studio';
    case 'FOUNDRY':
      return 'Microsoft Foundry';
    case 'AGENT_BUILDER':
      return 'Agent Builder';
    case 'HYBRID':
      return 'Hybrid';
    default:
      return String(type);
  }
}

function calculateMatchScore(scoringResult: ScoringResult): number {
  const scores = scoringResult.scores;
  const total = Object.values(scores).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;

  const recommendedScore =
    scoringResult.recommendation === 'M365_COPILOT'
      ? scores.m365Copilot
      : scoringResult.recommendation === 'COPILOT_STUDIO'
        ? scores.copilotStudio
        : scoringResult.recommendation === 'FOUNDRY'
          ? scores.foundry
          : scoringResult.recommendation === 'AGENT_BUILDER'
            ? scores.agentBuilder
            : scores.hybrid;

  return Math.round((recommendedScore / total) * 100);
}

function deploymentOverview(type: RecommendationType): {
  overview: string;
  components: string[];
  roadmap: Array<{ phase: string; items: string[] }>;
  decisions: string[];
} {
  const sharedDecisions = [
    'Define success metrics, pilot scope, and adoption KPIs',
    'Confirm data classification and content readiness (SharePoint/Teams/OneDrive)',
    'Decide identity + access guardrails (Entra ID, Conditional Access, MFA)',
    'Set monitoring and incident response (audit, telemetry, support model)',
  ];

  const powerPlatformDecisions = [
    'Establish Power Platform environment strategy (dev/test/prod, managed environments)',
    'Define Power Platform DLP policies (connector allow/deny boundaries by environment)',
    'Decide environment request + approval automation (intake, provisioning, naming, owners)',
    'Set ALM approach (solutions, pipelines, source control, release governance)',
  ];

  if (type === 'M365_COPILOT') {
    return {
      overview:
        'Deploy Microsoft 365 Copilot with a governance-first pilot, focusing on information hygiene, security controls, and user adoption within Microsoft 365 apps.',
      components: [
        'Microsoft 365 licensing and Copilot enablement',
        'Microsoft Purview (sensitivity labels, DLP, retention)',
        'SharePoint/OneDrive/Teams content readiness and permissions',
        'Entra ID + Conditional Access and device compliance',
        'Adoption, training, and change management',
      ],
      roadmap: [
        {
          phase: 'Phase 1 — Foundation (2-4 weeks)',
          items: [
            'Confirm licensing, eligible workloads, and tenant prerequisites',
            'Review data governance: labels, retention, and access boundaries',
            'Baseline security posture and admin controls',
          ],
        },
        {
          phase: 'Phase 2 — Pilot (4-8 weeks)',
          items: [
            'Select pilot personas and high-value scenarios',
            'Run training + office hours; collect feedback weekly',
            'Measure usage, time saved, and quality outcomes',
          ],
        },
        {
          phase: 'Phase 3 — Scale (8-16 weeks)',
          items: [
            'Expand to additional groups with refined guardrails',
            'Operationalize support and governance (policy, reporting)',
            'Iterate on content hygiene and knowledge management',
          ],
        },
      ],
      decisions: [...sharedDecisions],
    };
  }

  if (type === 'COPILOT_STUDIO') {
    return {
      overview:
        'Deploy Copilot Studio by establishing Power Platform governance (environments + DLP), then iteratively delivering agents integrated with business systems and measurable outcomes.',
      components: [
        'Power Platform environments and governance',
        'Copilot Studio agents + channels (Teams/Web)',
        'Connectors (standard/premium/custom) and data sources',
        'DLP policies + managed environments',
        'ALM pipelines and telemetry',
      ],
      roadmap: [
        {
          phase: 'Phase 1 — Governance Setup (2-6 weeks)',
          items: [
            'Define environment strategy and ownership model',
            'Implement Power Platform DLP policies and connector boundaries',
            'Stand up environment request + approval automation',
          ],
        },
        {
          phase: 'Phase 2 — Build & Pilot (4-10 weeks)',
          items: [
            'Select 1-2 priority agents with clear ROI',
            'Integrate required systems via connectors/APIs',
            'Add analytics, feedback loop, and human escalation paths',
          ],
        },
        {
          phase: 'Phase 3 — Scale (8-20 weeks)',
          items: [
            'Expand agent portfolio with reuse patterns',
            'Operationalize ALM, testing, and release cadence',
            'Establish Center of Excellence (CoE) practices and standards',
          ],
        },
      ],
      decisions: [...sharedDecisions, ...powerPlatformDecisions],
    };
  }

  if (type === 'HYBRID') {
    return {
      overview:
        'Use Microsoft 365 Copilot for broad productivity, and Copilot Studio for targeted custom agents where automation and integration drive differentiated value.',
      components: [
        'M365 Copilot enablement + governance',
        'Power Platform environments + DLP policies',
        'Copilot Studio for custom agents and workflows',
        'Integration patterns (connectors/APIs) and telemetry',
      ],
      roadmap: [
        {
          phase: 'Phase 1 — Foundation (2-6 weeks)',
          items: [
            'Enable M365 Copilot pilot with Purview guardrails',
            'Stand up Power Platform governance and environments',
            'Define which scenarios require custom agents vs in-app Copilot',
          ],
        },
        {
          phase: 'Phase 2 — Pilot & Prove (6-12 weeks)',
          items: [
            'Run M365 Copilot pilot across key personas',
            'Deliver 1-2 Copilot Studio agents for high-impact workflows',
            'Measure outcomes and refine governance and prompts',
          ],
        },
        {
          phase: 'Phase 3 — Scale (12-24 weeks)',
          items: [
            'Scale M365 Copilot adoption org-wide',
            'Expand agent portfolio with ALM + CoE patterns',
            'Operationalize monitoring, risk, and release management',
          ],
        },
      ],
      decisions: [...sharedDecisions, ...powerPlatformDecisions],
    };
  }

  // Foundry / Agent Builder: keep succinct, still include PP items if applicable.
  return {
    overview:
      'Deploy a custom AI/agent platform with strong platform engineering, security, and governance. Use pilots to validate value before scaling workloads and integrations.',
    components: [
      'Model/platform selection and deployment strategy',
      'Identity, networking, and secrets management',
      'Data governance and access controls',
      'Observability and evaluation/quality gates',
      'Release management and SRE/operations model',
    ],
    roadmap: [
      {
        phase: 'Phase 1 — Platform Foundation',
        items: [
          'Define reference architecture',
          'Set security and governance guardrails',
          'Stand up CI/CD and observability',
        ],
      },
      {
        phase: 'Phase 2 — Pilot Workloads',
        items: [
          'Implement 1-2 prioritized agents',
          'Add integrations and evals',
          'Run human-in-the-loop testing',
        ],
      },
      {
        phase: 'Phase 3 — Scale',
        items: [
          'Harden reliability and cost controls',
          'Expand workloads',
          'Operationalize support and change management',
        ],
      },
    ],
    decisions: [...sharedDecisions],
  };
}

function addTitle(slide: any, title: string) {
  slide.addText(title, {
    x: 0.6,
    y: 0.45,
    w: 8.8,
    h: 0.6,
    fontSize: 30,
    bold: true,
    color: COLOR_DARK,
  });
}

function addBullets(
  slide: any,
  items: string[],
  opts: { x: number; y: number; w: number; h: number; fontSize: number }
) {
  const text = items.map((i) => `• ${i}`).join('\n');
  slide.addText(text, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    fontSize: opts.fontSize,
    color: COLOR_DARK,
    valign: 'top',
  });
}

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildExecutiveOverviewContent(input: ExecutiveOverviewPptxInput): {
  strategicContext: string;
  principle: string;
  benefits: string[];
  mindsetShifts: string[];
  priorities: string[];
} {
  const referenceSignals = new Set(
    [
      input.recommendation.summary ?? '',
      ...(input.recommendation.reasons ?? []),
      ...(input.recommendation.nextSteps ?? []),
      input.aiRecommendation?.summary ?? '',
      input.aiRecommendation?.strategicGuidance ?? '',
      ...(input.aiRecommendation?.nextSteps ?? []),
    ]
      .map((entry) => normalizeForCompare(entry))
      .filter((entry) => entry.length > 0)
  );

  const removeOverlap = (items: string[]) =>
    items.filter((item) => !referenceSignals.has(normalizeForCompare(item)));

  return {
    strategicContext:
      input.aiRecommendation?.strategicGuidance ||
      input.aiRecommendation?.summary ||
      input.recommendation.summary ||
      'Agentic AI changes how work gets done by shifting teams from task execution to outcome ownership.',
    principle:
      'AI does not replace humans; it amplifies human creativity, judgement, and collaboration.',
    benefits: removeOverlap([
      'Accelerate cycle times by delegating repeatable work to agents and focusing teams on strategic outcomes.',
      'Improve decision quality by synthesizing signals from enterprise systems, workflows, and domain expertise.',
      'Increase resilience with auditable execution, policy-aligned controls, and measurable value tracking.',
      'Scale institutional knowledge by turning high-performing practices into reusable agent-enabled patterns.',
    ]),
    mindsetShifts: removeOverlap([
      'Treat agents as collaborators that perceive, plan, and act within governance boundaries.',
      'Shift from app operation to orchestration by setting goals, constraints, escalation paths, and quality thresholds.',
      'Evolve workforce capabilities toward agent orchestration, supervision, and continuous quality management.',
      'Build AI fluency so teams can confidently validate, refine, and integrate agent outputs.',
    ]),
    priorities: removeOverlap([
      'Prioritize measurable business outcomes over automation volume.',
      'Enforce responsible AI with fairness, transparency, accountability, and explicit ownership.',
      'Apply validation gates, auditability, and human-in-the-loop control for high-impact decisions and actions.',
      'Define a cross-functional operating model spanning product, risk, IT, security, and business leadership.',
    ]),
  };
}

export async function generateExecutiveOverviewPPTX(
  input: ExecutiveOverviewPptxInput
): Promise<Buffer> {
  const PptxGenJSCtor =
    typeof PptxGenJSImport === 'function'
      ? PptxGenJSImport
      : ((PptxGenJSImport as unknown as { default?: unknown }).default as
          | (new () => any)
          | undefined);

  if (typeof PptxGenJSCtor !== 'function') {
    throw new Error('Unable to resolve pptxgenjs constructor');
  }

  const prs = new PptxGenJSCtor();
  prs.defineLayout({ name: 'LAYOUT_EXEC', width: 10, height: 7.5 });

  const recType = input.recommendation?.type ?? input.scoringResult.recommendation;
  const recLabel = formatRecommendationType(recType);
  const matchScore = calculateMatchScore(input.scoringResult);
  const conf = input.scoringResult.confidenceLevel;
  const timestampLabel = new Date(input.timestamp).toLocaleString('en-US');
  const deploy = deploymentOverview(recType);
  const executiveOverview = buildExecutiveOverviewContent(input);

  // Slide 1: Title
  const s1 = prs.addSlide();
  s1.background = { color: COLOR_PRIMARY };
  s1.addText('Executive Overview', {
    x: 0.6,
    y: 2.2,
    w: 8.8,
    h: 0.9,
    fontSize: 48,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });
  s1.addText(recLabel, {
    x: 0.6,
    y: 3.25,
    w: 8.8,
    h: 0.5,
    fontSize: 24,
    color: 'FFFFFF',
    align: 'center',
  });
  s1.addText(timestampLabel, {
    x: 0.6,
    y: 6.85,
    w: 8.8,
    h: 0.3,
    fontSize: 10,
    color: 'FFFFFF',
    align: 'center',
  });

  // Slide 2: Snapshot
  const s2 = prs.addSlide();
  addTitle(s2, 'Recommendation Snapshot');

  s2.addShape(prs.ShapeType.rect, {
    x: 0.6,
    y: 1.3,
    w: 8.8,
    h: 1.25,
    fill: { color: COLOR_LIGHT },
    line: { color: COLOR_PRIMARY, width: 1 },
  });
  s2.addText('Recommended Solution', {
    x: 0.85,
    y: 1.45,
    w: 4.5,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: COLOR_MUTED,
  });
  s2.addText(input.recommendation.title || recLabel, {
    x: 0.85,
    y: 1.75,
    w: 8.2,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: COLOR_DARK,
  });

  // Metrics boxes
  const metricBoxes = [
    { label: 'Match Score', value: `${matchScore}%` },
    { label: 'Confidence', value: conf.toUpperCase() },
  ];
  let mx = 0.6;
  metricBoxes.forEach((m) => {
    s2.addShape(prs.ShapeType.roundRect, {
      x: mx,
      y: 2.8,
      w: 4.35,
      h: 1.1,
      fill: { color: 'FFFFFF' },
      line: { color: COLOR_PRIMARY, width: 1 },
    });
    s2.addText(m.label, {
      x: mx + 0.2,
      y: 2.95,
      w: 3.95,
      h: 0.25,
      fontSize: 11,
      bold: true,
      color: COLOR_MUTED,
    });
    s2.addText(m.value, {
      x: mx + 0.2,
      y: 3.25,
      w: 3.95,
      h: 0.55,
      fontSize: 26,
      bold: true,
      color: COLOR_PRIMARY,
    });
    mx += 4.45;
  });

  const summaryText = (
    input.aiRecommendation?.summary ||
    input.recommendation.summary ||
    ''
  ).trim();

  // Slide 3: Executive Summary (dedicated slide to avoid clipping)
  if (summaryText) {
    const sSummary = prs.addSlide();
    addTitle(sSummary, 'Executive Summary');
    sSummary.addText(summaryText, {
      x: 0.6,
      y: 1.3,
      w: 8.8,
      h: 5.7,
      fontSize: 14,
      color: COLOR_DARK,
      valign: 'top',
      fit: 'shrink',
    });
  }

  // CxO Strategic Overview
  const sCxO = prs.addSlide();
  addTitle(sCxO, 'Executive Overview (CxO)');

  sCxO.addText('Strategic context', {
    x: 0.6,
    y: 1.2,
    w: 8.8,
    h: 0.35,
    fontSize: 12,
    bold: true,
    color: COLOR_MUTED,
  });

  sCxO.addText(executiveOverview.strategicContext, {
    x: 0.6,
    y: 1.5,
    w: 8.8,
    h: 0.95,
    fontSize: 12,
    color: COLOR_DARK,
    valign: 'top',
    fit: 'shrink',
  });

  sCxO.addText(`Principle: ${executiveOverview.principle}`, {
    x: 0.6,
    y: 2.55,
    w: 8.8,
    h: 0.5,
    fontSize: 11,
    bold: true,
    color: COLOR_DARK,
    fit: 'shrink',
  });

  sCxO.addText('Business benefits', {
    x: 0.6,
    y: 3.2,
    w: 2.65,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: COLOR_MUTED,
  });
  addBullets(sCxO, executiveOverview.benefits.slice(0, 4), {
    x: 0.6,
    y: 3.5,
    w: 2.75,
    h: 3.5,
    fontSize: 10,
  });

  sCxO.addText('Mindset & operating shifts', {
    x: 3.55,
    y: 3.2,
    w: 2.8,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: COLOR_MUTED,
  });
  addBullets(sCxO, executiveOverview.mindsetShifts.slice(0, 4), {
    x: 3.55,
    y: 3.5,
    w: 2.85,
    h: 3.5,
    fontSize: 10,
  });

  sCxO.addText('Top management priorities', {
    x: 6.55,
    y: 3.2,
    w: 2.8,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: COLOR_MUTED,
  });
  addBullets(sCxO, executiveOverview.priorities.slice(0, 4), {
    x: 6.55,
    y: 3.5,
    w: 2.85,
    h: 3.5,
    fontSize: 10,
  });

  // Deployment Overview
  const s3 = prs.addSlide();
  addTitle(s3, 'Overall Deployment Overview');
  s3.addText(deploy.overview, {
    x: 0.6,
    y: 1.25,
    w: 8.8,
    h: 1.0,
    fontSize: 13,
    color: COLOR_DARK,
  });
  s3.addText('Key components', {
    x: 0.6,
    y: 2.35,
    w: 8.8,
    h: 0.3,
    fontSize: 14,
    bold: true,
    color: COLOR_DARK,
  });
  addBullets(s3, deploy.components.slice(0, 7), { x: 0.6, y: 2.75, w: 8.8, h: 4.6, fontSize: 12 });

  // Slide 4: Roadmap
  const s4 = prs.addSlide();
  addTitle(s4, 'Roadmap');

  const cols = [0.6, 3.55, 6.5];
  deploy.roadmap.slice(0, 3).forEach((phase, idx) => {
    const x = cols[idx] ?? 0.6;
    s4.addShape(prs.ShapeType.rect, {
      x,
      y: 1.35,
      w: 2.85,
      h: 0.5,
      fill: { color: COLOR_PRIMARY },
    });
    s4.addText(phase.phase, {
      x,
      y: 1.35,
      w: 2.85,
      h: 0.5,
      fontSize: 11,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });

    addBullets(s4, phase.items.slice(0, 6), {
      x: x + 0.15,
      y: 1.95,
      w: 2.55,
      h: 4.9,
      fontSize: 10,
    });
  });

  // Slide 5: Decisions & Governance
  const s5 = prs.addSlide();
  addTitle(s5, 'Decisions to Make Along the Way');
  s5.addText(
    'These decisions should be made early and revisited during pilot-to-scale transitions (including Power Platform DLP policies and environment request automation where applicable).',
    {
      x: 0.6,
      y: 1.2,
      w: 8.8,
      h: 0.8,
      fontSize: 12,
      color: COLOR_DARK,
    }
  );
  addBullets(s5, deploy.decisions.slice(0, 10), { x: 0.6, y: 2.1, w: 8.8, h: 5.1, fontSize: 11 });

  // Slide 6+: Survey Highlights
  const qa = input.qaData.filter((q) => (q.question || '').trim().length > 0);
  const highlight = qa.filter((q) => (q.answer || '').trim() !== 'Not answered');

  const maxPerSlide = 6;
  const totalSlides = Math.max(1, Math.ceil(highlight.length / maxPerSlide));

  for (let i = 0; i < totalSlides; i++) {
    const slice = highlight.slice(i * maxPerSlide, (i + 1) * maxPerSlide);
    const s = prs.addSlide();
    addTitle(s, i === 0 ? 'Survey Highlights' : `Survey Highlights (cont.)`);

    let y = 1.25;
    slice.forEach((item) => {
      const q = item.question.trim();
      const a = item.answer.trim();
      const c = (item.comment ?? '').trim();

      s.addText(q, {
        x: 0.6,
        y,
        w: 8.8,
        h: 0.3,
        fontSize: 12,
        bold: true,
        color: COLOR_DARK,
      });
      y += 0.32;
      s.addText(`Answer: ${a}`, {
        x: 0.8,
        y,
        w: 8.6,
        h: 0.35,
        fontSize: 11,
        color: COLOR_DARK,
      });
      y += 0.35;

      if (c) {
        s.addText(`Comment: ${c}`, {
          x: 0.8,
          y,
          w: 8.6,
          h: 0.6,
          fontSize: 11,
          italic: true,
          color: COLOR_MUTED,
        });
        y += 0.6;
      }

      y += 0.2;
      if (y > 6.8) return;
    });
  }

  // Optional: AI Next Steps slide
  const aiNext =
    input.aiRecommendation?.nextSteps?.filter((s) => (s ?? '').trim().length > 0) ?? [];
  if (aiNext.length > 0) {
    const s = prs.addSlide();
    addTitle(s, 'AI-Powered Next Steps');
    addBullets(s, aiNext.slice(0, 8), { x: 0.6, y: 1.35, w: 8.8, h: 5.9, fontSize: 14 });
  }

  const output = await prs.write({ outputType: 'nodebuffer' });
  if (Buffer.isBuffer(output)) {
    return output;
  }
  if (typeof output === 'string') {
    return Buffer.from(output, 'base64');
  }
  if (output instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(output));
  }
  return Buffer.from(output as Uint8Array);
}
