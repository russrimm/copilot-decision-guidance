import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Recommendation } from '../types';

export function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateMarkdownSummary(
  recommendation: Recommendation,
  answers?: Array<{ question: string; answer: string }>
): string {
  const {
    type,
    title,
    summary,
    reasons,
    nextSteps,
    risks,
    complianceConsiderations,
    sources,
    scoringResult,
  } = recommendation;

  // Helper to add inline markdown links
  const addMarkdownLinks = (text: string): string => {
    if (!sources || sources.length === 0) return text;

    const linkMap: Record<string, { url: string; title: string }> = {};
    sources.forEach((source) => {
      const url = source.url.toLowerCase();
      if (url.includes('microsoft-365-copilot-overview')) {
        linkMap['Microsoft 365 Copilot'] = source;
        linkMap['M365 Copilot'] = source;
      } else if (url.includes('copilot-studio') || url.includes('microsoft-copilot-studio')) {
        linkMap['Copilot Studio'] = source;
      } else if (url.includes('copilotstudioimplementationguide')) {
        linkMap['implementation guide'] = source;
        linkMap['Implementation Guide'] = source;
      } else if (url.includes('licensing')) {
        linkMap['licensing'] = source;
      } else if (url.includes('privacy') || url.includes('security')) {
        linkMap['privacy'] = source;
        linkMap['security'] = source;
        linkMap['data privacy'] = source;
      } else if (url.includes('extensibility')) {
        linkMap['extensibility'] = source;
        linkMap['extend'] = source;
      }
    });

    let result = text;
    Object.entries(linkMap).forEach(([keyword, source]) => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      result = result.replace(regex, (match) => `[${match}](${source.url})`);
    });
    return result;
  };

  let markdown = `# ${title}\n\n`;
  markdown += `**Recommendation Type:** ${type}\n\n`;

  // Add introduction if available
  if ((recommendation as any).introduction) {
    markdown += `## About This Analysis\n\n${(recommendation as any).introduction}\n\n`;
  }

  // Add Q&A section if provided
  if (answers && answers.length > 0) {
    markdown += `## Your Questionnaire Responses\n\n`;
    answers.forEach((qa, idx) => {
      markdown += `**Q${idx + 1}:** ${qa.question}\n\n`;
      markdown += `**A:** ${qa.answer}\n\n`;
    });
  }

  markdown += `## Summary\n\n${addMarkdownLinks(summary)}\n\n`;

  markdown += `## Why This Recommendation\n\n`;
  reasons.forEach((reason, idx) => {
    markdown += `${idx + 1}. ${addMarkdownLinks(reason)}\n`;
  });
  markdown += `\n`;

  markdown += `## Next Steps\n\n`;
  nextSteps.forEach((step, idx) => {
    markdown += `${idx + 1}. ${addMarkdownLinks(step)}\n`;
  });
  markdown += `\n`;

  markdown += `## Risks & Watch-outs\n\n`;
  risks.forEach((risk, idx) => {
    markdown += `${idx + 1}. ${addMarkdownLinks(risk)}\n`;
  });
  markdown += `\n`;

  if (complianceConsiderations && complianceConsiderations.length > 0) {
    markdown += `## Compliance & Governance Considerations\n\n`;
    complianceConsiderations.forEach((item, idx) => {
      markdown += `${idx + 1}. ${addMarkdownLinks(item)}\n`;
    });
    markdown += `\n`;
  }

  markdown += `## Confidence Level\n\n`;
  markdown += `**${scoringResult.confidenceLevel.toUpperCase()}** confidence based on your answers.\n\n`;

  markdown += `## Scores\n\n`;
  markdown += `- Microsoft 365 Copilot: ${scoringResult.scores.m365Copilot}\n`;
  markdown += `- Copilot Studio: ${scoringResult.scores.copilotStudio}\n`;
  markdown += `- Hybrid: ${scoringResult.scores.hybrid}\n\n`;

  markdown += `## Sources\n\n`;
  sources.forEach((source) => {
    markdown += `- [${source.title}](${source.url})\n`;
  });
  markdown += `\n`;

  markdown += `---\n\n`;
  markdown += `*Generated on ${new Date().toLocaleString()}*\n`;

  return markdown;
}

export function downloadMarkdown(markdown: string, filename: string) {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePDF(
  recommendation: Recommendation,
  answers: Array<{ question: string; answer: string }>
) {
  const {
    type,
    summary,
    reasons,
    nextSteps,
    risks,
    complianceConsiderations,
    sources,
    scoringResult,
  } = recommendation;
  const doc = new jsPDF();

  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;

  // Helper function to wrap text manually
  const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Microsoft Agentic Solution Report', margin, yPosition);
  yPosition += 15;

  // Recommendation Type
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const typeLabel = type.replace(/_/g, ' ');
  doc.text(`Recommendation: ${typeLabel}`, margin, yPosition);
  yPosition += 10;

  // Add introduction if available
  if ((recommendation as any).introduction) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('About This Analysis', margin, yPosition);
    yPosition += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const introLines = wrapText((recommendation as any).introduction, maxWidth, 10);
    introLines.forEach((line) => {
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 10;
  }

  // Summary
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const summaryLines = wrapText(summary, maxWidth, 11);
  summaryLines.forEach((line) => {
    doc.text(line, margin, yPosition);
    yPosition += 6;
  });
  yPosition += 10;

  // Confidence Level
  doc.setFont('helvetica', 'bold');
  doc.text(`Confidence Level: ${scoringResult.confidenceLevel.toUpperCase()}`, margin, yPosition);
  yPosition += 10;

  // Scores
  doc.setFont('helvetica', 'normal');
  doc.text(`Scores:`, margin, yPosition);
  yPosition += 7;
  doc.text(`  • Microsoft 365 Copilot: ${scoringResult.scores.m365Copilot}`, margin, yPosition);
  yPosition += 6;
  doc.text(`  • Copilot Studio: ${scoringResult.scores.copilotStudio}`, margin, yPosition);
  yPosition += 6;
  doc.text(`  • Hybrid: ${scoringResult.scores.hybrid}`, margin, yPosition);
  yPosition += 12;

  // Check if we need a new page
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  // Why This Recommendation
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Why This Recommendation', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  reasons.forEach((reason, idx) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    const reasonLines = wrapText(`${idx + 1}. ${reason}`, maxWidth, 11);
    reasonLines.forEach((line) => {
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    yPosition += 4;
  });
  yPosition += 6;

  // Next Steps
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Next Steps', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  nextSteps.forEach((step, idx) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    const stepLines = wrapText(`${idx + 1}. ${step}`, maxWidth, 11);
    stepLines.forEach((line) => {
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    yPosition += 4;
  });
  yPosition += 6;

  // Risks & Watch-outs
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risks & Watch-outs', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  risks.forEach((risk, idx) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    const riskLines = wrapText(`${idx + 1}. ${risk}`, maxWidth, 11);
    riskLines.forEach((line) => {
      doc.text(line, margin, yPosition);
      yPosition += 6;
    });
    yPosition += 4;
  });
  yPosition += 10;

  // Compliance & Governance Considerations
  if (complianceConsiderations && complianceConsiderations.length > 0) {
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Compliance & Governance Considerations', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    complianceConsiderations.forEach((item, idx) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      const itemLines = wrapText(`${idx + 1}. ${item}`, maxWidth, 11);
      itemLines.forEach((line) => {
        doc.text(line, margin, yPosition);
        yPosition += 6;
      });
      yPosition += 4;
    });
    yPosition += 10;
  }

  // Sources
  if (yPosition > 230) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Sources', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 255);
  sources.forEach((source) => {
    if (yPosition > 275) {
      doc.addPage();
      yPosition = 20;
    }
    doc.textWithLink(source.title, margin, yPosition, { url: source.url });
    yPosition += 6;
  });
  doc.setTextColor(0, 0, 0);
  yPosition += 10;

  // Your Answers Section
  if (answers && answers.length > 0) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Answers', margin, yPosition);
    yPosition += 12;

    // Create table data
    const tableData = answers.map((qa) => [qa.question, qa.answer]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Question', 'Answer']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 100 },
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      margin: { left: margin, right: margin },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }

  return doc;
}

export function downloadPDF(
  recommendation: Recommendation,
  answers: Array<{ question: string; answer: string }>,
  filename: string
) {
  const doc = generatePDF(recommendation, answers);
  doc.save(filename);
}
