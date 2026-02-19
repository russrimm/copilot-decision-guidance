import { Router, type Request, type Response } from 'express';
import { getRelevantUseCases, useCaseDatabase, type UseCase } from '../data/use-cases.js';
import { generateUseCasePDF, generateMultipleUseCasesPDF } from '../services/pdf-generator.js';
import { generateUseCasePPTX, generateMultipleUseCasesPPTX } from '../services/pptx-generator.js';

const router = Router();

const DEPARTMENTS = [
  { id: 'operations', label: 'Operations', icon: '🏭' },
  { id: 'engineering', label: 'Engineering', icon: '🔧' },
  { id: 'finance', label: 'Finance & Accounting', icon: '💰' },
  { id: 'hr', label: 'Human Resources', icon: '👥' },
  { id: 'it', label: 'Information Technology', icon: '💻' },
  { id: 'legal', label: 'Legal & Compliance', icon: '⚖️' },
  { id: 'compliance', label: 'Compliance', icon: '✅' },
  { id: 'supply-chain', label: 'Supply Chain', icon: '📦' },
  { id: 'procurement', label: 'Procurement', icon: '🛒' },
  { id: 'hsse', label: 'Health, Safety & Environment', icon: '🏥' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔩' },
  { id: 'production', label: 'Production', icon: '🏗️' },
  { id: 'geosciences', label: 'Geosciences & Exploration', icon: '🌍' },
  { id: 'environmental', label: 'Environmental', icon: '🌱' },
  { id: 'marketing', label: 'Marketing & Communications', icon: '📢' },
  { id: 'sales', label: 'Sales', icon: '📈' },
];

const DATA_SOURCES = [
  { id: 'fabric', label: 'Microsoft Fabric', icon: '🧵' },
  { id: 'onedrive', label: 'OneDrive', icon: '☁️' },
  { id: 'sharepoint', label: 'SharePoint', icon: '📄' },
  { id: 'sql', label: 'SQL Database', icon: '🗄️' },
  { id: 'salesforce', label: 'Salesforce', icon: '☁️' },
  { id: 'sap', label: 'SAP', icon: '📊' },
  { id: 'snowflake', label: 'Snowflake', icon: '❄️' },
  { id: 'azure-datalake', label: 'Azure Data Lake', icon: '📦' },
  { id: 'dataverse', label: 'Dataverse', icon: '🔄' },
  { id: 'excel', label: 'Excel / CSV', icon: '📑' },
  { id: 'scada', label: 'SCADA Systems', icon: '⚙️' },
  { id: 'historian', label: 'Historian Database', icon: '📈' },
  { id: 'blob-storage', label: 'Azure Blob Storage', icon: '☁️' },
  { id: 'documents', label: 'Document Repository', icon: '📁' },
  { id: 'email', label: 'Email Archives', icon: '📧' },
];

const SUPPORTED_VERTICALS = new Set(['oil', 'gas', 'energy']);

const VERTICAL_ARCHETYPE_MAP: Record<string, 'oil' | 'gas' | 'energy'> = {
  oil: 'oil',
  'natural-gas': 'gas',
  energy: 'energy',
  'aerospace-defense': 'energy',
  agriculture: 'energy',
  automotive: 'energy',
  construction: 'energy',
  'consumer-goods': 'energy',
  education: 'energy',
  'financial-services': 'energy',
  'government-public-sector': 'energy',
  'healthcare-life-sciences': 'energy',
  'hospitality-travel': 'energy',
  'industrial-manufacturing': 'energy',
  'legal-services': 'energy',
  'media-entertainment': 'energy',
  nonprofit: 'energy',
  'pharmaceuticals-biotech': 'energy',
  'professional-services': 'energy',
  'real-estate': 'energy',
  'retail-ecommerce': 'energy',
  'technology-software': 'energy',
  telecommunications: 'gas',
  'transportation-logistics': 'gas',
};

const VERTICALS = [
  { id: 'aerospace-defense', label: 'Aerospace & Defense', icon: '🛫' },
  { id: 'agriculture', label: 'Agriculture', icon: '🌾' },
  { id: 'automotive', label: 'Automotive', icon: '🚗' },
  { id: 'construction', label: 'Construction', icon: '🏗️' },
  { id: 'consumer-goods', label: 'Consumer Goods', icon: '🛍️' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'energy', label: 'Energy & Utilities', icon: '⚡' },
  { id: 'financial-services', label: 'Financial Services', icon: '🏦' },
  { id: 'government-public-sector', label: 'Government & Public Sector', icon: '🏛️' },
  { id: 'healthcare-life-sciences', label: 'Healthcare & Life Sciences', icon: '🏥' },
  { id: 'hospitality-travel', label: 'Hospitality & Travel', icon: '🏨' },
  { id: 'industrial-manufacturing', label: 'Industrial Manufacturing', icon: '🏭' },
  { id: 'legal-services', label: 'Legal Services', icon: '⚖️' },
  { id: 'media-entertainment', label: 'Media & Entertainment', icon: '🎬' },
  { id: 'natural-gas', label: 'Natural Gas', icon: '⛽' },
  { id: 'nonprofit', label: 'Nonprofit', icon: '🤝' },
  { id: 'oil', label: 'Oil & Gas Extraction', icon: '🛢️' },
  { id: 'pharmaceuticals-biotech', label: 'Pharmaceuticals & Biotech', icon: '💊' },
  { id: 'professional-services', label: 'Professional Services', icon: '💼' },
  { id: 'real-estate', label: 'Real Estate', icon: '🏢' },
  { id: 'retail-ecommerce', label: 'Retail & eCommerce', icon: '🛒' },
  { id: 'technology-software', label: 'Technology & Software', icon: '💻' },
  { id: 'telecommunications', label: 'Telecommunications', icon: '📡' },
  { id: 'transportation-logistics', label: 'Transportation & Logistics', icon: '🚚' },
];

function resolveVerticalForCatalog(vertical: unknown): 'oil' | 'gas' | 'energy' {
  if (typeof vertical !== 'string' || vertical.length === 0) {
    return 'energy';
  }

  if (SUPPORTED_VERTICALS.has(vertical)) {
    return vertical as 'oil' | 'gas' | 'energy';
  }

  return VERTICAL_ARCHETYPE_MAP[vertical] ?? 'energy';
}

function toLabelSelections(
  selections: unknown,
  byId: Map<string, string>,
  aliasesById?: Record<string, string>
): string[] {
  if (!Array.isArray(selections)) return [];
  return selections
    .filter((v): v is string => typeof v === 'string')
    .map((idOrLabel) => {
      const alias = aliasesById?.[idOrLabel];
      return alias ?? byId.get(idOrLabel) ?? idOrLabel;
    });
}

// Get all verticals available
router.get('/verticals', (req: Request, res: Response) => {
  res.json(VERTICALS);
});

// Get all departments (for all verticals)
router.get('/departments', (req: Request, res: Response) => {
  res.json(DEPARTMENTS);
});

// Get all data sources
router.get('/data-sources', (req: Request, res: Response) => {
  res.json(DATA_SOURCES);
});

// Get relevant use cases based on selection
router.post('/generate', (req: Request, res: Response) => {
  try {
    const { vertical, departments, dataSources } = req.body;

    if (!vertical) {
      return res.status(400).json({ error: 'Vertical is required' });
    }

    const departmentLabelById = new Map(DEPARTMENTS.map((d) => [d.id, d.label] as const));
    const dataSourceLabelById = new Map(DATA_SOURCES.map((d) => [d.id, d.label] as const));

    const normalizedDepartments = toLabelSelections(departments, departmentLabelById);
    const normalizedDataSources = toLabelSelections(dataSources, dataSourceLabelById);

    const selectedCriteria = {
      vertical,
      departments: normalizedDepartments,
      dataSources: normalizedDataSources,
    };

    const resolvedVertical = resolveVerticalForCatalog(vertical);

    let effectiveCriteria = { ...selectedCriteria };
    let useCases = getRelevantUseCases(
      resolvedVertical,
      effectiveCriteria.departments,
      effectiveCriteria.dataSources
    );

    // If filters are too restrictive (or mismatched), progressively relax them.
    if (useCases.length === 0 && effectiveCriteria.departments.length > 0) {
      effectiveCriteria = { ...effectiveCriteria, departments: [] };
      useCases = getRelevantUseCases(
        resolvedVertical,
        effectiveCriteria.departments,
        effectiveCriteria.dataSources
      );
    }

    if (useCases.length === 0 && effectiveCriteria.dataSources.length > 0) {
      effectiveCriteria = { ...effectiveCriteria, dataSources: [] };
      useCases = getRelevantUseCases(
        resolvedVertical,
        effectiveCriteria.departments,
        effectiveCriteria.dataSources
      );
    }

    if (useCases.length === 0) {
      effectiveCriteria = { ...effectiveCriteria, departments: [], dataSources: [] };
      useCases = getRelevantUseCases(
        resolvedVertical,
        effectiveCriteria.departments,
        effectiveCriteria.dataSources
      );
    }

    res.json({
      useCases,
      selectedCriteria,
      resolvedVertical,
      effectiveCriteria,
      totalCount: useCases.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate use cases' });
  }
});

// Get specific use case details
router.get('/use-case/:id', (req: Request, res: Response) => {
  const useCase = useCaseDatabase.find((uc) => uc.id === req.params.id);

  if (!useCase) {
    return res.status(404).json({ error: 'Use case not found' });
  }

  res.json(useCase);
});

// Get all use cases (for admin/reference)
router.get('/all', (req: Request, res: Response) => {
  res.json(useCaseDatabase);
});

// Export single use case as PDF
router.get('/export/pdf/:id', async (req: Request, res: Response) => {
  try {
    const useCase = useCaseDatabase.find((uc) => uc.id === req.params.id);

    if (!useCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }

    const pdfBuffer = await generateUseCasePDF(useCase);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${useCase.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Export single use case as PPTX
router.get('/export/pptx/:id', async (req: Request, res: Response) => {
  try {
    const useCase = useCaseDatabase.find((uc) => uc.id === req.params.id);

    if (!useCase) {
      return res.status(404).json({ error: 'Use case not found' });
    }

    const pptxBuffer = await generateUseCasePPTX(useCase);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${useCase.id}.pptx"`);
    res.send(pptxBuffer);
  } catch (error) {
    console.error('PPTX generation error:', error);
    res.status(500).json({ error: 'Failed to generate PowerPoint' });
  }
});

// Export multiple use cases as PDF
router.post('/export/pdf-batch', async (req: Request, res: Response) => {
  try {
    const { useCaseIds } = req.body;

    if (!Array.isArray(useCaseIds) || useCaseIds.length === 0) {
      return res.status(400).json({ error: 'useCaseIds array is required' });
    }

    const useCases = useCaseIds
      .map((id) => useCaseDatabase.find((uc) => uc.id === id))
      .filter((uc): uc is UseCase => uc !== undefined);

    if (useCases.length === 0) {
      return res.status(404).json({ error: 'No valid use cases found' });
    }

    const pdfBuffer = await generateMultipleUseCasesPDF(useCases);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="use-cases.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF batch generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF batch' });
  }
});

// Export multiple use cases as PPTX
router.post('/export/pptx-batch', async (req: Request, res: Response) => {
  try {
    const { useCaseIds } = req.body;

    if (!Array.isArray(useCaseIds) || useCaseIds.length === 0) {
      return res.status(400).json({ error: 'useCaseIds array is required' });
    }

    const useCases = useCaseIds
      .map((id) => useCaseDatabase.find((uc) => uc.id === id))
      .filter((uc): uc is UseCase => uc !== undefined);

    if (useCases.length === 0) {
      return res.status(404).json({ error: 'No valid use cases found' });
    }

    const pptxBuffer = await generateMultipleUseCasesPPTX(useCases);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="use-cases.pptx"');
    res.send(pptxBuffer);
  } catch (error) {
    console.error('PPTX batch generation error:', error);
    res.status(500).json({ error: 'Failed to generate PowerPoint batch' });
  }
});

export default router;
