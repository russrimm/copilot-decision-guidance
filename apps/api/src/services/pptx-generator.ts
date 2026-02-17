import PptxGenJS from 'pptxgenjs';
import type { UseCase } from '../data/use-cases.js';

const COLOR_PRIMARY = '2563EB'; // Blue
const COLOR_DARK = '1F2937'; // Dark Gray
const COLOR_LIGHT = 'F3F4F6'; // Light Gray
const COLOR_ACCENT = '10B981'; // Green

export async function generateUseCasePPTX(useCase: UseCase): Promise<Buffer> {
  const prs = new PptxGenJS();
  prs.defineLayout({ name: 'LAYOUT1', width: 10, height: 7.5 });
  prs.defineLayout({ name: 'LAYOUT2', width: 10, height: 7.5 });

  // Title Slide
  const slide1 = prs.addSlide();
  slide1.background = { color: COLOR_PRIMARY };
  slide1.addText(useCase.title, {
    x: 0.5,
    y: 2.5,
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });
  slide1.addText('Implementation Guide & Business Case', {
    x: 0.5,
    y: 4.2,
    w: 9,
    h: 0.6,
    fontSize: 20,
    color: 'FFFFFF',
    align: 'center',
  });

  // Context Slide
  const slide2 = prs.addSlide();
  slide2.addText('Overview', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: COLOR_DARK,
  });
  slide2.addText(useCase.description, {
    x: 0.5,
    y: 1.2,
    w: 9,
    h: 1.5,
    fontSize: 14,
    color: COLOR_DARK,
  });

  // Key Metrics
  const metrics = [
    { label: 'Timeline', value: `${useCase.implementation.estimatedTimelineWeeks}w` },
    { label: 'Payback', value: `${useCase.roi.paybackPeriodMonths}m` },
    { label: 'Annual Value', value: useCase.roi.estimatedAnnualValue },
  ];

  let xPos = 0.5;
  metrics.forEach((metric, idx) => {
    const box = slide2.addShape(prs.ShapeType.rect, {
      x: xPos,
      y: 3,
      w: 2.8,
      h: 1.5,
      fill: { color: COLOR_LIGHT },
      line: { color: COLOR_PRIMARY, width: 2 },
    });

    slide2.addText(metric.label, {
      x: xPos,
      y: 3.1,
      w: 2.8,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: COLOR_DARK,
      align: 'center',
    });

    slide2.addText(metric.value, {
      x: xPos,
      y: 3.6,
      w: 2.8,
      h: 0.8,
      fontSize: 20,
      bold: true,
      color: COLOR_PRIMARY,
      align: 'center',
    });

    xPos += 3;
  });

  // Agent Architecture Slide
  const slide3 = prs.addSlide();
  slide3.addText('Agent Architecture', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: COLOR_DARK,
  });

  slide3.addText(useCase.agentArchitecture.name, {
    x: 0.5,
    y: 1.2,
    w: 9,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: COLOR_PRIMARY,
  });

  slide3.addText(useCase.agentArchitecture.overview, {
    x: 0.5,
    y: 1.7,
    w: 9,
    h: 1,
    fontSize: 12,
    color: COLOR_DARK,
  });

  // Components
  slide3.addText('Key Components:', {
    x: 0.5,
    y: 2.8,
    w: 4,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: COLOR_DARK,
  });

  let yPos = 3.15;
  useCase.agentArchitecture.components.slice(0, 4).forEach((comp) => {
    slide3.addText(`• ${comp}`, {
      x: 0.7,
      y: yPos,
      w: 4.3,
      h: 0.3,
      fontSize: 10,
      color: COLOR_DARK,
    });
    yPos += 0.35;
  });

  // Data Flow
  slide3.addShape(prs.ShapeType.rect, {
    x: 5.2,
    y: 2.8,
    w: 4.3,
    h: 3.2,
    fill: { color: COLOR_LIGHT },
    line: { color: COLOR_PRIMARY, width: 1 },
  });

  slide3.addText('Data Flow:', {
    x: 5.4,
    y: 2.95,
    w: 3.9,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: COLOR_DARK,
  });

  slide3.addText(useCase.agentArchitecture.dataFlow, {
    x: 5.4,
    y: 3.3,
    w: 3.9,
    h: 2.6,
    fontSize: 10,
    color: COLOR_DARK,
  });

  // Implementation Roadmap Slide
  const slide4 = prs.addSlide();
  slide4.addText('Implementation Roadmap', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: COLOR_DARK,
  });

  const phases = [
    { name: 'Phase 1', items: useCase.implementation.phase1, x: 0.5 },
    { name: 'Phase 2', items: useCase.implementation.phase2, x: 3.5 },
    { name: 'Phase 3', items: useCase.implementation.phase3, x: 6.5 },
  ];

  phases.forEach((phase) => {
    // Phase header
    slide4.addShape(prs.ShapeType.rect, {
      x: phase.x,
      y: 1.2,
      w: 2.8,
      h: 0.4,
      fill: { color: COLOR_PRIMARY },
    });

    slide4.addText(phase.name, {
      x: phase.x,
      y: 1.2,
      w: 2.8,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });

    // Phase items
    let itemY = 1.7;
    phase.items.forEach((item) => {
      slide4.addText(`• ${item}`, {
        x: phase.x + 0.15,
        y: itemY,
        w: 2.5,
        h: 0.6,
        fontSize: 9,
        color: COLOR_DARK,
        wrap: true,
      });
      itemY += 0.65;
    });
  });

  // Skills section
  slide4.addText(`Timeline: ${useCase.implementation.estimatedTimelineWeeks} weeks`, {
    x: 0.5,
    y: 5.8,
    w: 9,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: COLOR_PRIMARY,
  });

  slide4.addText(`Required Skills: ${useCase.implementation.skillsRequired.join(', ')}`, {
    x: 0.5,
    y: 6.15,
    w: 9,
    h: 0.8,
    fontSize: 10,
    color: COLOR_DARK,
    wrap: true,
  });

  // ROI Slide
  const slide5 = prs.addSlide();
  slide5.addText('Business Impact & ROI', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: COLOR_DARK,
  });

  const roi = useCase.roi;
  const roiMetrics = [
    { label: 'Time Savings', value: `${roi.timeSavingsPercentage}%`, color: COLOR_ACCENT },
    { label: 'Cost Reduction', value: `${roi.costReductionPercentage}%`, color: COLOR_ACCENT },
    {
      label: 'Productivity Gain',
      value: `${roi.productivityGainPercentage}%`,
      color: COLOR_ACCENT,
    },
  ];

  let metricX = 0.5;
  roiMetrics.forEach((metric) => {
    slide5.addShape(prs.ShapeType.rect, {
      x: metricX,
      y: 1.3,
      w: 2.8,
      h: 2,
      fill: { color: COLOR_LIGHT },
      line: { color: metric.color, width: 2 },
    });

    slide5.addText(metric.value, {
      x: metricX,
      y: 1.6,
      w: 2.8,
      h: 0.8,
      fontSize: 36,
      bold: true,
      color: metric.color,
      align: 'center',
    });

    slide5.addText(metric.label, {
      x: metricX,
      y: 2.5,
      w: 2.8,
      h: 0.6,
      fontSize: 12,
      bold: true,
      color: COLOR_DARK,
      align: 'center',
    });

    metricX += 3.1;
  });

  // Additional metrics
  const bottomMetrics = [
    { label: 'Payback Period', value: `${roi.paybackPeriodMonths} months` },
    { label: 'Annual Value', value: roi.estimatedAnnualValue },
  ];

  let bottomX = 1;
  bottomMetrics.forEach((metric) => {
    slide5.addShape(prs.ShapeType.rect, {
      x: bottomX,
      y: 3.6,
      w: 3.5,
      h: 1.2,
      fill: { color: COLOR_LIGHT },
      line: { color: COLOR_PRIMARY, width: 1 },
    });

    slide5.addText(metric.label, {
      x: bottomX + 0.2,
      y: 3.8,
      w: 3.1,
      h: 0.3,
      fontSize: 11,
      bold: true,
      color: COLOR_DARK,
    });

    slide5.addText(metric.value, {
      x: bottomX + 0.2,
      y: 4.2,
      w: 3.1,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: COLOR_PRIMARY,
    });

    bottomX += 3.8;
  });

  // Next Steps Slide
  const slide6 = prs.addSlide();
  slide6.addText('Recommended Next Steps', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: COLOR_DARK,
  });

  const nextSteps = [
    'Review this presentation with technical and business leadership',
    'Validate data source availability and security requirements',
    'Identify Phase 1 pilot teams and success metrics',
    'Schedule implementation discovery session',
    'Develop detailed project schedule and resource plan',
  ];

  let stepY = 1.3;
  nextSteps.forEach((step, idx) => {
    slide6.addShape(prs.ShapeType.ellipse, {
      x: 0.7,
      y: stepY + 0.08,
      w: 0.3,
      h: 0.3,
      fill: { color: COLOR_PRIMARY },
    });

    slide6.addText((idx + 1).toString(), {
      x: 0.7,
      y: stepY + 0.05,
      w: 0.3,
      h: 0.3,
      fontSize: 14,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
    });

    slide6.addText(step, {
      x: 1.2,
      y: stepY,
      w: 8.3,
      h: 0.5,
      fontSize: 12,
      color: COLOR_DARK,
      valign: 'middle',
    });

    stepY += 0.95;
  });

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

export async function generateMultipleUseCasesPPTX(useCases: UseCase[]): Promise<Buffer> {
  const prs = new PptxGenJS();

  // Title Slide
  const slide1 = prs.addSlide();
  slide1.background = { color: COLOR_PRIMARY };
  slide1.addText('AI Agent Use Cases', {
    x: 0.5,
    y: 2,
    w: 9,
    h: 1,
    fontSize: 54,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });
  slide1.addText('Oil, Gas & Energy Sector', {
    x: 0.5,
    y: 3.2,
    w: 9,
    h: 0.6,
    fontSize: 32,
    color: 'FFFFFF',
    align: 'center',
  });
  slide1.addText(`${useCases.length} Recommended Use Cases`, {
    x: 0.5,
    y: 4.2,
    w: 9,
    h: 0.5,
    fontSize: 20,
    color: COLOR_LIGHT,
    align: 'center',
  });

  // Table of Contents
  const slide2 = prs.addSlide();
  slide2.addText('Table of Contents', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.5,
    fontSize: 32,
    bold: true,
    color: COLOR_DARK,
  });

  let tocY = 1.2;
  useCases.forEach((useCase, idx) => {
    slide2.addText(`${idx + 1}. ${useCase.title}`, {
      x: 0.7,
      y: tocY,
      w: 8.6,
      h: 0.4,
      fontSize: 14,
      color: COLOR_DARK,
    });
    tocY += 0.5;
  });

  // Add summary slide for each use case
  useCases.forEach((useCase) => {
    const slide = prs.addSlide();
    slide.addText(useCase.title, {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.5,
      fontSize: 28,
      bold: true,
      color: COLOR_DARK,
    });

    slide.addText(useCase.description, {
      x: 0.5,
      y: 1.1,
      w: 9,
      h: 1,
      fontSize: 12,
      color: COLOR_DARK,
      wrap: true,
    });

    // Quick metrics
    const quickMetrics = [
      { label: 'Timeline', value: `${useCase.implementation.estimatedTimelineWeeks}w` },
      { label: 'Payback', value: `${useCase.roi.paybackPeriodMonths}m` },
      {
        label: 'Time Savings',
        value: `${useCase.roi.timeSavingsPercentage}%`,
      },
      { label: 'Annual Value', value: useCase.roi.estimatedAnnualValue },
    ];

    let qmX = 0.5;
    quickMetrics.forEach((metric) => {
      slide.addShape(prs.ShapeType.rect, {
        x: qmX,
        y: 2.3,
        w: 2.1,
        h: 1.2,
        fill: { color: COLOR_LIGHT },
        line: { color: COLOR_PRIMARY, width: 1 },
      });

      slide.addText(metric.value, {
        x: qmX,
        y: 2.45,
        w: 2.1,
        h: 0.5,
        fontSize: 16,
        bold: true,
        color: COLOR_PRIMARY,
        align: 'center',
      });

      slide.addText(metric.label, {
        x: qmX,
        y: 3.05,
        w: 2.1,
        h: 0.3,
        fontSize: 10,
        color: COLOR_DARK,
        align: 'center',
      });

      qmX += 2.25;
    });

    // ROI highlights
    slide.addText('Expected Impact:', {
      x: 0.5,
      y: 3.7,
      w: 9,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: COLOR_DARK,
    });

    const impacts = [
      `Cost Reduction: ${useCase.roi.costReductionPercentage}%`,
      `Productivity Gain: ${useCase.roi.productivityGainPercentage}%`,
    ];

    let impactY = 4.1;
    impacts.forEach((impact) => {
      slide.addText(`• ${impact}`, {
        x: 0.7,
        y: impactY,
        w: 4.5,
        h: 0.3,
        fontSize: 11,
        color: COLOR_DARK,
      });
      impactY += 0.4;
    });

    // Implementation overview
    slide.addText('Implementation Phases:', {
      x: 5.2,
      y: 3.7,
      w: 4.3,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: COLOR_DARK,
    });

    let phaseY = 4.1;
    ['Phase 1', 'Phase 2', 'Phase 3'].forEach((phase, idx) => {
      slide.addText(`${phase}: ${useCase.implementation.estimatedTimelineWeeks / 3}w`, {
        x: 5.2,
        y: phaseY,
        w: 4.3,
        h: 0.3,
        fontSize: 10,
        color: COLOR_DARK,
      });
      phaseY += 0.4;
    });
  });

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
