import PptxGenJS from 'pptxgenjs';
import type { UseCase } from '../data/use-cases.js';

const COLOR_PRIMARY = '2563EB';
const COLOR_DARK = '1F2937';
const COLOR_LIGHT = 'F3F4F6';
const COLOR_ACCENT = '10B981';
const COLOR_MUTED = '6B7280';

function bulletize(items: string[], maxItems = 5): string {
  return items
    .slice(0, maxItems)
    .map((item) => `• ${item}`)
    .join('\n');
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

function splitFlow(flow: string): string[] {
  return flow
    .split('→')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 5);
}

function bufferFromPptOutput(output: unknown): Buffer {
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

export async function generateUseCasePPTX(useCase: UseCase): Promise<Buffer> {
  const prs = new PptxGenJS();
  prs.layout = 'LAYOUT_WIDE';

  const phaseDuration = Math.max(1, Math.round(useCase.implementation.estimatedTimelineWeeks / 3));
  const roi = useCase.roi;

  const slide1 = prs.addSlide();
  slide1.background = { color: COLOR_PRIMARY };
  slide1.addText(useCase.title, {
    x: 0.7,
    y: 2.1,
    w: 11.8,
    h: 1.3,
    fontSize: 34,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });
  slide1.addText(`${useCase.vertical.toUpperCase()} | Implementation Guide & Value Case`, {
    x: 0.7,
    y: 3.6,
    w: 11.8,
    h: 0.5,
    fontSize: 17,
    color: 'E5E7EB',
    align: 'center',
  });
  slide1.addText(`Departments: ${useCase.departments.join(', ')}`, {
    x: 0.7,
    y: 4.2,
    w: 11.8,
    h: 0.5,
    fontSize: 13,
    color: 'E5E7EB',
    align: 'center',
  });

  const slide2 = prs.addSlide();
  slide2.addText('Executive Summary', {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: COLOR_DARK,
  });
  slide2.addShape(prs.ShapeType.roundRect, {
    x: 0.6,
    y: 1.2,
    w: 8.4,
    h: 3.5,
    fill: { color: 'F8FAFC' },
    line: { color: 'D1D5DB', width: 1 },
  });
  slide2.addText('Business Opportunity', {
    x: 0.85,
    y: 1.45,
    w: 3.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: COLOR_PRIMARY,
  });
  slide2.addText(truncateText(useCase.description, 250), {
    x: 0.85,
    y: 1.8,
    w: 7.9,
    h: 1,
    fontSize: 12,
    color: COLOR_DARK,
    valign: 'top',
  });
  slide2.addText('Pilot Scope', {
    x: 0.85,
    y: 2.95,
    w: 3.4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: COLOR_PRIMARY,
  });
  slide2.addText(
    bulletize([
      `Primary departments: ${useCase.departments.slice(0, 3).join(', ')}`,
      `Core data sources: ${useCase.dataSources.slice(0, 3).join(', ')}`,
      `Target timeline: ${useCase.implementation.estimatedTimelineWeeks} weeks`,
    ]),
    {
      x: 0.85,
      y: 3.3,
      w: 7.9,
      h: 1.3,
      fontSize: 11,
      color: COLOR_DARK,
      valign: 'top',
    }
  );

  const metrics = [
    { label: 'Time Savings', value: `${roi.timeSavingsPercentage}%` },
    { label: 'Cost Reduction', value: `${roi.costReductionPercentage}%` },
    { label: 'Productivity', value: `${roi.productivityGainPercentage}%` },
    { label: 'Payback', value: `${roi.paybackPeriodMonths} mo` },
    { label: 'Annual Value', value: roi.estimatedAnnualValue },
  ];

  let metricY = 1.2;
  metrics.forEach((metric) => {
    slide2.addShape(prs.ShapeType.roundRect, {
      x: 9.3,
      y: metricY,
      w: 3,
      h: 0.62,
      fill: { color: COLOR_LIGHT },
      line: { color: 'D1D5DB', width: 1 },
    });
    slide2.addText(metric.label, {
      x: 9.48,
      y: metricY + 0.08,
      w: 1.6,
      h: 0.2,
      fontSize: 9,
      color: COLOR_MUTED,
    });
    slide2.addText(metric.value, {
      x: 9.48,
      y: metricY + 0.26,
      w: 2.65,
      h: 0.25,
      fontSize: 13,
      bold: true,
      color: COLOR_PRIMARY,
    });
    metricY += 0.72;
  });

  const slide3 = prs.addSlide();
  slide3.addText('Architecture Blueprint', {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: COLOR_DARK,
  });
  slide3.addText(useCase.agentArchitecture.name, {
    x: 0.6,
    y: 1.1,
    w: 12,
    h: 0.35,
    fontSize: 15,
    bold: true,
    color: COLOR_PRIMARY,
  });
  slide3.addText(truncateText(useCase.agentArchitecture.overview, 260), {
    x: 0.6,
    y: 1.45,
    w: 12,
    h: 0.8,
    fontSize: 11,
    color: COLOR_DARK,
  });

  const componentX = 0.6;
  let componentY = 2.4;
  useCase.agentArchitecture.components.slice(0, 5).forEach((component) => {
    slide3.addShape(prs.ShapeType.roundRect, {
      x: componentX,
      y: componentY,
      w: 4.8,
      h: 0.52,
      fill: { color: 'EFF6FF' },
      line: { color: 'BFDBFE', width: 1 },
    });
    slide3.addText(component, {
      x: componentX + 0.2,
      y: componentY + 0.13,
      w: 4.4,
      h: 0.25,
      fontSize: 10,
      color: COLOR_DARK,
      bold: true,
    });
    componentY += 0.62;
  });

  const flowSteps = splitFlow(useCase.agentArchitecture.dataFlow);
  let flowX = 5.9;
  flowSteps.forEach((step, index) => {
    slide3.addShape(prs.ShapeType.roundRect, {
      x: flowX,
      y: 3.2,
      w: 1.4,
      h: 0.95,
      fill: { color: COLOR_LIGHT },
      line: { color: COLOR_PRIMARY, width: 1 },
    });
    slide3.addText(truncateText(step, 38), {
      x: flowX + 0.08,
      y: 3.35,
      w: 1.24,
      h: 0.62,
      fontSize: 9,
      color: COLOR_DARK,
      align: 'center',
      valign: 'middle',
    });
    if (index < flowSteps.length - 1) {
      slide3.addText('→', {
        x: flowX + 1.42,
        y: 3.55,
        w: 0.2,
        h: 0.2,
        fontSize: 14,
        bold: true,
        color: COLOR_PRIMARY,
      });
    }
    flowX += 1.58;
  });

  slide3.addText('Implementation Guide Patterns', {
    x: 5.9,
    y: 4.55,
    w: 5.8,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: COLOR_PRIMARY,
  });
  slide3.addText(
    bulletize([
      'Ground responses using approved enterprise content and policy references.',
      'Route high-risk recommendations through human approval workflows.',
      'Capture feedback telemetry for prompt tuning and model governance.',
    ]),
    {
      x: 5.9,
      y: 4.88,
      w: 6.3,
      h: 1.7,
      fontSize: 10,
      color: COLOR_DARK,
      valign: 'top',
    }
  );

  const slide4 = prs.addSlide();
  slide4.addText('90-Day Delivery Plan', {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: COLOR_DARK,
  });

  const phases = [
    { name: 'Phase 1: Foundation', items: useCase.implementation.phase1, x: 0.6 },
    { name: 'Phase 2: Pilot & Validate', items: useCase.implementation.phase2, x: 4.35 },
    { name: 'Phase 3: Scale & Optimize', items: useCase.implementation.phase3, x: 8.1 },
  ];

  phases.forEach((phase) => {
    slide4.addShape(prs.ShapeType.roundRect, {
      x: phase.x,
      y: 1.2,
      w: 3.45,
      h: 5.15,
      fill: { color: 'F8FAFC' },
      line: { color: 'D1D5DB', width: 1 },
    });
    slide4.addText(phase.name, {
      x: phase.x + 0.2,
      y: 1.42,
      w: 3.05,
      h: 0.35,
      fontSize: 11,
      bold: true,
      color: COLOR_PRIMARY,
    });
    slide4.addText(bulletize(phase.items, 4), {
      x: phase.x + 0.2,
      y: 1.82,
      w: 3.05,
      h: 4.2,
      fontSize: 9.5,
      color: COLOR_DARK,
      valign: 'top',
    });
  });

  slide4.addText(
    `Estimated timeline: ${useCase.implementation.estimatedTimelineWeeks} weeks  |  Typical phase duration: ~${phaseDuration} weeks  |  Skills: ${useCase.implementation.skillsRequired.slice(0, 5).join(', ')}`,
    {
      x: 0.6,
      y: 6.55,
      w: 11.9,
      h: 0.35,
      fontSize: 10,
      color: COLOR_MUTED,
    }
  );

  const slide5 = prs.addSlide();
  slide5.addText('Value Realization & Governance', {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: COLOR_DARK,
  });

  const roiMetrics = [
    { label: 'Time Savings', value: `${roi.timeSavingsPercentage}%` },
    { label: 'Cost Reduction', value: `${roi.costReductionPercentage}%` },
    { label: 'Productivity Gain', value: `${roi.productivityGainPercentage}%` },
  ];

  let roiX = 0.8;
  roiMetrics.forEach((metric) => {
    slide5.addShape(prs.ShapeType.roundRect, {
      x: roiX,
      y: 1.25,
      w: 2.7,
      h: 1.8,
      fill: { color: COLOR_LIGHT },
      line: { color: COLOR_ACCENT, width: 1.5 },
    });
    slide5.addText(metric.value, {
      x: roiX,
      y: 1.62,
      w: 2.7,
      h: 0.55,
      fontSize: 28,
      bold: true,
      color: COLOR_ACCENT,
      align: 'center',
    });
    slide5.addText(metric.label, {
      x: roiX,
      y: 2.3,
      w: 2.7,
      h: 0.3,
      fontSize: 10,
      color: COLOR_DARK,
      bold: true,
      align: 'center',
    });
    roiX += 2.95;
  });

  slide5.addShape(prs.ShapeType.roundRect, {
    x: 9.7,
    y: 1.25,
    w: 2.3,
    h: 1.8,
    fill: { color: 'EFF6FF' },
    line: { color: 'BFDBFE', width: 1.5 },
  });
  slide5.addText('Payback', {
    x: 9.7,
    y: 1.55,
    w: 2.3,
    h: 0.25,
    fontSize: 10,
    color: COLOR_MUTED,
    align: 'center',
  });
  slide5.addText(`${roi.paybackPeriodMonths} months`, {
    x: 9.7,
    y: 1.88,
    w: 2.3,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: COLOR_PRIMARY,
    align: 'center',
  });
  slide5.addText(roi.estimatedAnnualValue, {
    x: 9.7,
    y: 2.37,
    w: 2.3,
    h: 0.35,
    fontSize: 11,
    color: COLOR_PRIMARY,
    bold: true,
    align: 'center',
  });

  slide5.addShape(prs.ShapeType.roundRect, {
    x: 0.8,
    y: 3.45,
    w: 5.7,
    h: 2.7,
    fill: { color: 'FFFFFF' },
    line: { color: 'D1D5DB', width: 1 },
  });
  slide5.addText('KPIs to Track', {
    x: 1,
    y: 3.7,
    w: 3,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: COLOR_PRIMARY,
  });
  slide5.addText(
    bulletize([
      'Cycle time reduction in target workflow',
      'Recommendation acceptance rate and user trust score',
      'Escalation volume and mean-time-to-resolution',
      'Business value captured vs. baseline operating cost',
    ]),
    {
      x: 1,
      y: 4.02,
      w: 5.3,
      h: 1.95,
      fontSize: 10,
      color: COLOR_DARK,
      valign: 'top',
    }
  );

  slide5.addShape(prs.ShapeType.roundRect, {
    x: 6.8,
    y: 3.45,
    w: 5.2,
    h: 2.7,
    fill: { color: 'FFFFFF' },
    line: { color: 'D1D5DB', width: 1 },
  });
  slide5.addText('Controls and Safeguards', {
    x: 7,
    y: 3.7,
    w: 3.7,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: COLOR_PRIMARY,
  });
  slide5.addText(
    bulletize([
      'Role-based access and environment-level policy controls',
      'Grounded responses with approved knowledge sources',
      'Human-in-the-loop approvals for high-impact actions',
      'Audit-ready logs for recommendations and decisions',
    ]),
    {
      x: 7,
      y: 4.02,
      w: 4.8,
      h: 1.95,
      fontSize: 10,
      color: COLOR_DARK,
      valign: 'top',
    }
  );

  const slide6 = prs.addSlide();
  slide6.addText('Recommended Next Steps', {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: COLOR_DARK,
  });

  const nextSteps = [
    'Align business owner, technical owner, and pilot success criteria.',
    'Confirm enterprise data access pathways and governance boundaries.',
    'Launch a focused pilot with measurable KPI baseline and target state.',
    'Run weekly implementation reviews with risk, quality, and adoption metrics.',
    'Plan scale-out by reusing architecture patterns and rollout playbooks.',
  ];

  let stepY = 1.3;
  nextSteps.forEach((step, index) => {
    slide6.addShape(prs.ShapeType.roundRect, {
      x: 0.9,
      y: stepY,
      w: 11.2,
      h: 0.78,
      fill: { color: index % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
      line: { color: 'D1D5DB', width: 1 },
    });
    slide6.addShape(prs.ShapeType.ellipse, {
      x: 1.1,
      y: stepY + 0.18,
      w: 0.35,
      h: 0.35,
      fill: { color: COLOR_PRIMARY },
      line: { color: COLOR_PRIMARY, width: 1 },
    });
    slide6.addText(String(index + 1), {
      x: 1.1,
      y: stepY + 0.2,
      w: 0.35,
      h: 0.28,
      fontSize: 10,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });
    slide6.addText(step, {
      x: 1.55,
      y: stepY + 0.2,
      w: 10.2,
      h: 0.35,
      fontSize: 11,
      color: COLOR_DARK,
      valign: 'middle',
    });
    stepY += 0.9;
  });

  const output = await prs.write({ outputType: 'nodebuffer' });
  return bufferFromPptOutput(output);
}

export async function generateMultipleUseCasesPPTX(useCases: UseCase[]): Promise<Buffer> {
  const prs = new PptxGenJS();
  prs.layout = 'LAYOUT_WIDE';

  const slide1 = prs.addSlide();
  slide1.background = { color: COLOR_PRIMARY };
  slide1.addText('Use Case Assistant Portfolio', {
    x: 0.7,
    y: 2.1,
    w: 11.8,
    h: 1,
    fontSize: 42,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });
  slide1.addText('Oil, Gas & Energy Scenarios', {
    x: 0.7,
    y: 3.25,
    w: 11.8,
    h: 0.5,
    fontSize: 22,
    color: 'E5E7EB',
    align: 'center',
  });
  slide1.addText(`${useCases.length} Recommended Use Cases`, {
    x: 0.7,
    y: 4,
    w: 11.8,
    h: 0.5,
    fontSize: 16,
    color: 'E5E7EB',
    align: 'center',
  });

  const slide2 = prs.addSlide();
  slide2.addText('Portfolio Summary', {
    x: 0.6,
    y: 0.5,
    w: 12,
    h: 0.5,
    fontSize: 28,
    bold: true,
    color: COLOR_DARK,
  });

  const verticalCount = useCases.reduce<Record<string, number>>((acc, useCase) => {
    acc[useCase.vertical] = (acc[useCase.vertical] ?? 0) + 1;
    return acc;
  }, {});

  slide2.addText(
    `Vertical coverage: ${Object.entries(verticalCount)
      .map(([key, count]) => `${key.toUpperCase()} (${count})`)
      .join(' | ')}`,
    {
      x: 0.6,
      y: 1.2,
      w: 11.8,
      h: 0.35,
      fontSize: 11,
      color: COLOR_MUTED,
    }
  );

  let listY = 1.8;
  useCases.forEach((useCase, index) => {
    slide2.addShape(prs.ShapeType.roundRect, {
      x: 0.8,
      y: listY,
      w: 11.4,
      h: 0.78,
      fill: { color: index % 2 === 0 ? 'F8FAFC' : 'FFFFFF' },
      line: { color: 'D1D5DB', width: 1 },
    });
    slide2.addText(`${index + 1}. ${useCase.title}`, {
      x: 1,
      y: listY + 0.12,
      w: 7,
      h: 0.26,
      fontSize: 12,
      bold: true,
      color: COLOR_DARK,
    });
    slide2.addText(
      `${useCase.vertical.toUpperCase()} | ${useCase.implementation.estimatedTimelineWeeks}w | ${useCase.roi.paybackPeriodMonths}m payback`,
      {
        x: 1,
        y: listY + 0.4,
        w: 6.7,
        h: 0.2,
        fontSize: 9,
        color: COLOR_MUTED,
      }
    );
    slide2.addText(useCase.roi.estimatedAnnualValue, {
      x: 9.1,
      y: listY + 0.2,
      w: 2.8,
      h: 0.25,
      fontSize: 11,
      bold: true,
      color: COLOR_PRIMARY,
      align: 'right',
    });
    listY += 0.88;
  });

  useCases.forEach((useCase, index) => {
    const slide = prs.addSlide();
    const roi = useCase.roi;

    slide.addText(`${index + 1}. ${useCase.title}`, {
      x: 0.6,
      y: 0.5,
      w: 11.8,
      h: 0.45,
      fontSize: 24,
      bold: true,
      color: COLOR_DARK,
    });
    slide.addText(`${useCase.vertical.toUpperCase()} | ${useCase.departments.join(', ')}`, {
      x: 0.6,
      y: 0.96,
      w: 11.8,
      h: 0.25,
      fontSize: 10,
      color: COLOR_MUTED,
    });

    slide.addShape(prs.ShapeType.roundRect, {
      x: 0.6,
      y: 1.35,
      w: 7.7,
      h: 2.15,
      fill: { color: 'F8FAFC' },
      line: { color: 'D1D5DB', width: 1 },
    });
    slide.addText(truncateText(useCase.description, 230), {
      x: 0.85,
      y: 1.65,
      w: 7.2,
      h: 0.85,
      fontSize: 11,
      color: COLOR_DARK,
    });
    slide.addText(
      bulletize([
        `Architecture: ${useCase.agentArchitecture.name}`,
        `Data sources: ${useCase.dataSources.slice(0, 4).join(', ')}`,
        `Pilot timeline: ${useCase.implementation.estimatedTimelineWeeks} weeks`,
      ]),
      {
        x: 0.85,
        y: 2.58,
        w: 7.2,
        h: 0.75,
        fontSize: 9.5,
        color: COLOR_DARK,
        valign: 'top',
      }
    );

    const quickMetrics = [
      { label: 'Time', value: `${roi.timeSavingsPercentage}%` },
      { label: 'Cost', value: `${roi.costReductionPercentage}%` },
      { label: 'Productivity', value: `${roi.productivityGainPercentage}%` },
      { label: 'Payback', value: `${roi.paybackPeriodMonths}m` },
    ];

    let metricX = 8.6;
    quickMetrics.forEach((metric) => {
      slide.addShape(prs.ShapeType.roundRect, {
        x: metricX,
        y: 1.35,
        w: 1.8,
        h: 1.05,
        fill: { color: COLOR_LIGHT },
        line: { color: 'D1D5DB', width: 1 },
      });
      slide.addText(metric.value, {
        x: metricX,
        y: 1.62,
        w: 1.8,
        h: 0.3,
        fontSize: 15,
        bold: true,
        color: COLOR_PRIMARY,
        align: 'center',
      });
      slide.addText(metric.label, {
        x: metricX,
        y: 2,
        w: 1.8,
        h: 0.2,
        fontSize: 9,
        color: COLOR_MUTED,
        align: 'center',
      });
      metricX += 1.9;
    });

    slide.addShape(prs.ShapeType.roundRect, {
      x: 8.6,
      y: 2.55,
      w: 3.7,
      h: 0.95,
      fill: { color: 'EFF6FF' },
      line: { color: 'BFDBFE', width: 1 },
    });
    slide.addText('Estimated Annual Value', {
      x: 8.8,
      y: 2.78,
      w: 3.2,
      h: 0.2,
      fontSize: 9,
      color: COLOR_MUTED,
    });
    slide.addText(roi.estimatedAnnualValue, {
      x: 8.8,
      y: 3.03,
      w: 3.2,
      h: 0.3,
      fontSize: 14,
      color: COLOR_PRIMARY,
      bold: true,
    });

    slide.addShape(prs.ShapeType.roundRect, {
      x: 0.6,
      y: 3.8,
      w: 5.75,
      h: 2.55,
      fill: { color: 'FFFFFF' },
      line: { color: 'D1D5DB', width: 1 },
    });
    slide.addText('Implementation Priorities', {
      x: 0.85,
      y: 4.05,
      w: 3,
      h: 0.25,
      fontSize: 11,
      bold: true,
      color: COLOR_PRIMARY,
    });
    slide.addText(
      bulletize([...useCase.implementation.phase1, ...useCase.implementation.phase2], 5),
      {
        x: 0.85,
        y: 4.33,
        w: 5.3,
        h: 1.92,
        fontSize: 9.5,
        color: COLOR_DARK,
        valign: 'top',
      }
    );

    slide.addShape(prs.ShapeType.roundRect, {
      x: 6.55,
      y: 3.8,
      w: 5.75,
      h: 2.55,
      fill: { color: 'FFFFFF' },
      line: { color: 'D1D5DB', width: 1 },
    });
    slide.addText('Operational Readiness', {
      x: 6.8,
      y: 4.05,
      w: 3.4,
      h: 0.25,
      fontSize: 11,
      bold: true,
      color: COLOR_PRIMARY,
    });
    slide.addText(
      bulletize([
        'Define owner, approver, and support model for live operations.',
        'Set policy controls for data access, response quality, and escalation.',
        'Track adoption and business outcomes with baseline comparison.',
        'Run continuous improvement loop for prompts, flows, and knowledge.',
      ]),
      {
        x: 6.8,
        y: 4.33,
        w: 5.3,
        h: 1.92,
        fontSize: 9.5,
        color: COLOR_DARK,
        valign: 'top',
      }
    );
  });

  const output = await prs.write({ outputType: 'nodebuffer' });
  return bufferFromPptOutput(output);
}
