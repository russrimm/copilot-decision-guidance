import PDFDocument from 'pdfkit';
export async function generateUseCasePDF(useCase) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
        });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        // Title Page
        doc.fontSize(28).font('Helvetica-Bold').text(useCase.title, { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica').text('Implementation Guide & Business Case', {
            align: 'center',
        });
        doc.moveDown(1);
        doc.fontSize(11).text(useCase.description, { align: 'left', width: 500 });
        doc.moveDown(2);
        // Quick Facts
        doc.fontSize(14).font('Helvetica-Bold').text('Quick Facts', { underline: true });
        doc.fontSize(10).font('Helvetica');
        doc.text(`Industry: ${useCase.vertical.toUpperCase()}`, { indent: 20 });
        doc.text(`Implementation Timeline: ${useCase.implementation.estimatedTimelineWeeks} weeks`, {
            indent: 20,
        });
        doc.text(`Expected Payback Period: ${useCase.roi.paybackPeriodMonths} months`, { indent: 20 });
        doc.text(`Annual Value: ${useCase.roi.estimatedAnnualValue}`, { indent: 20 });
        doc.moveDown(1.5);
        // Agent Architecture
        doc.fontSize(14).font('Helvetica-Bold').text('Agent Architecture', { underline: true });
        doc.fontSize(11).font('Helvetica-Bold').text(useCase.agentArchitecture.name);
        doc.fontSize(10).font('Helvetica').text(useCase.agentArchitecture.overview, {
            width: 500,
            align: 'left',
        });
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(10).text('Components:');
        useCase.agentArchitecture.components.forEach((comp) => {
            doc.font('Helvetica').fontSize(9).text(`• ${comp}`, { indent: 20 });
        });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text('Data Flow:');
        doc.fontSize(9).font('Helvetica').text(useCase.agentArchitecture.dataFlow, { indent: 20 });
        doc.moveDown(1.5);
        // Implementation Roadmap
        doc.fontSize(14).font('Helvetica-Bold').text('Implementation Roadmap', { underline: true });
        doc.moveDown(0.5);
        ['phase1', 'phase2', 'phase3'].forEach((phase, idx) => {
            const phaseNumber = idx + 1;
            const phaseData = useCase.implementation[phase];
            doc.fontSize(12).font('Helvetica-Bold').text(`Phase ${phaseNumber}`, { underline: true });
            phaseData.forEach((item) => {
                doc.fontSize(9).font('Helvetica').text(`✓ ${item}`, { indent: 20 });
            });
            doc.moveDown(0.3);
        });
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica-Bold').text('Skills Required:');
        useCase.implementation.skillsRequired.forEach((skill) => {
            doc.fontSize(9).text(`• ${skill}`, { indent: 20 });
        });
        doc.moveDown(1.5);
        // Business Impact
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Business Impact & ROI', { underline: true });
        doc.moveDown(1);
        const roi = useCase.roi;
        // Create a simple table for ROI metrics
        const metrics = [
            { label: 'Time Savings', value: `${roi.timeSavingsPercentage}%` },
            { label: 'Cost Reduction', value: `${roi.costReductionPercentage}%` },
            { label: 'Productivity Gain', value: `${roi.productivityGainPercentage}%` },
            { label: 'Payback Period', value: `${roi.paybackPeriodMonths} months` },
            { label: 'Annual Value', value: roi.estimatedAnnualValue },
        ];
        doc.fontSize(10);
        metrics.forEach((metric) => {
            doc.font('Helvetica-Bold').fontSize(10).text(metric.label + ':', { width: 150 });
            doc.font('Helvetica').fontSize(12).text(metric.value, { indent: 160 });
            doc.moveDown(0.5);
        });
        doc.moveDown(1);
        // Next Steps
        doc.fontSize(14).font('Helvetica-Bold').text('Recommended Next Steps', { underline: true });
        doc.fontSize(10).font('Helvetica');
        const nextSteps = [
            '1. Review this implementation guide with your technology and business leadership',
            '2. Validate data source availability and access permissions',
            '3. Identify Phase 1 pilot user groups and business sponsors',
            '4. Establish success metrics and KPIs aligned with business objectives',
            '5. Schedule discovery session with consulting team to refine scope and timeline',
            '6. Create detailed project roadmap with resource allocation',
            '7. Begin Phase 1 implementation with identified success criteria',
        ];
        nextSteps.forEach((step) => {
            doc.text(step, { width: 500, indent: 10 });
            doc.moveDown(0.4);
        });
        doc.end();
    });
}
export async function generateMultipleUseCasesPDF(useCases) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
        });
        const chunks = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        // Title Page
        doc.fontSize(32).font('Helvetica-Bold').text('AI Agent Use Cases', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).font('Helvetica').text('Oil, Gas & Energy Sector', { align: 'center' });
        doc.moveDown(1);
        doc.fontSize(12).text(`Total Use Cases: ${useCases.length}`, { align: 'center' });
        doc.moveDown(3);
        doc
            .fontSize(11)
            .text('This document contains detailed information about AI-powered use cases tailored to your organization. Each use case includes implementation guidance, architecture details, ROI analysis, and next steps.', { align: 'justify', width: 450 });
        doc.moveDown(2);
        doc.fontSize(14).font('Helvetica-Bold').text('Table of Contents', { underline: true });
        doc.moveDown(0.5);
        useCases.forEach((useCase, idx) => {
            doc
                .fontSize(10)
                .font('Helvetica')
                .text(`${idx + 1}. ${useCase.title}`);
        });
        // Add each use case
        useCases.forEach((useCase, idx) => {
            doc.addPage();
            doc
                .fontSize(18)
                .font('Helvetica-Bold')
                .text(`${idx + 1}. ${useCase.title}`);
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text(useCase.description, { width: 500 });
            doc.moveDown(1);
            // Quick facts
            doc.fontSize(11).font('Helvetica-Bold').text('Overview');
            doc.fontSize(9).font('Helvetica');
            doc.text(`Timeline: ${useCase.implementation.estimatedTimelineWeeks} weeks | Payback: ${useCase.roi.paybackPeriodMonths} months | Value: ${useCase.roi.estimatedAnnualValue}`, { width: 500 });
            doc.moveDown(0.5);
            // Architecture
            doc.fontSize(11).font('Helvetica-Bold').text('Architecture Overview');
            doc.font('Helvetica-Bold').fontSize(10).text(useCase.agentArchitecture.name);
            doc.fontSize(9).text(useCase.agentArchitecture.overview, { width: 500 });
            doc.moveDown(0.5);
            // ROI
            doc.fontSize(11).font('Helvetica-Bold').text('Expected Business Impact');
            doc.fontSize(9).font('Helvetica');
            doc.text(`Time Savings: ${useCase.roi.timeSavingsPercentage}%`, { indent: 10 });
            doc.text(`Cost Reduction: ${useCase.roi.costReductionPercentage}%`, { indent: 10 });
            doc.text(`Productivity Gain: ${useCase.roi.productivityGainPercentage}%`, { indent: 10 });
        });
        doc.end();
    });
}
