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

  // Helper to sanitize text and remove problematic characters
  const sanitizeText = (text: string): string => {
    return text
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/[^\x00-\x7F]/g, (char) => {
        // Replace common special characters
        const replacements: Record<string, string> = {
          '\u2013': '-', // en dash
          '\u2014': '--', // em dash
          '\u2018': "'", // left single quote
          '\u2019': "'", // right single quote
          '\u201C': '"', // left double quote
          '\u201D': '"', // right double quote
          '\u2022': '*', // bullet
          '\u2026': '...', // ellipsis
        };
        return replacements[char] || char;
      });
  };

  // Helper function to add text with proper wrapping
  const addText = (text: string, fontSize: number, isBold: boolean = false): void => {
    const cleanText = sanitizeText(text);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');

    // Use splitTextToSize to get proper line breaks
    const lines = doc.splitTextToSize(cleanText, maxWidth);

    // Add lines with proper page breaks
    for (let i = 0; i < lines.length; i++) {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      // Pass string directly with options to ensure proper encoding
      doc.text(lines[i], margin, yPosition, { maxWidth: maxWidth });
      yPosition += fontSize * 0.5 + 1;
    }
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
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('About This Analysis', margin, yPosition);
    yPosition += 7;

    addText((recommendation as any).introduction, 10, false);
    yPosition += 5;
  }

  // Summary
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  addText(summary, 11, false);
  yPosition += 5;

  // Confidence Level
  if (yPosition > 260) {
    doc.addPage();
    yPosition = 20;
  }
  doc.setFontSize(11);
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
  doc.text(`  • Microsoft Foundry: ${scoringResult.scores.foundry}`, margin, yPosition);
  yPosition += 6;
  doc.text(`  • Agent Builder: ${scoringResult.scores.agentBuilder}`, margin, yPosition);
  yPosition += 6;
  doc.text(`  • Hybrid: ${scoringResult.scores.hybrid}`, margin, yPosition);
  yPosition += 12;

  // Why This Recommendation
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Why This Recommendation', margin, yPosition);
  yPosition += 8;

  reasons.forEach((reason, idx) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    addText(`${idx + 1}. ${reason}`, 11, false);
    yPosition += 2;
  });
  yPosition += 4;

  // Next Steps
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Next Steps', margin, yPosition);
  yPosition += 8;

  nextSteps.forEach((step, idx) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    addText(`${idx + 1}. ${step}`, 11, false);
    yPosition += 2;
  });
  yPosition += 4;

  // Risks & Watch-outs
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Risks & Watch-outs', margin, yPosition);
  yPosition += 8;

  risks.forEach((risk, idx) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    addText(`${idx + 1}. ${risk}`, 11, false);
    yPosition += 2;
  });
  yPosition += 4;

  // Compliance & Governance Considerations
  if (complianceConsiderations && complianceConsiderations.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Compliance & Governance Considerations', margin, yPosition);
    yPosition += 8;

    complianceConsiderations.forEach((item, idx) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      addText(`${idx + 1}. ${item}`, 11, false);
      yPosition += 2;
    });
    yPosition += 4;
  }

  // Sources
  if (yPosition > 250) {
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
