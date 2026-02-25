import { Router, type Request, type Response } from 'express';
import { getRelevantUseCases, useCaseDatabase, type UseCase } from '../data/use-cases.js';
import { generateUseCasePDF, generateMultipleUseCasesPDF } from '../services/pdf-generator.js';
import { generateUseCasePPTX, generateMultipleUseCasesPPTX } from '../services/pptx-generator.js';

const router = Router();

const DEPARTMENTS = [
  {
    id: 'customer-service',
    label: 'Customer Service',
    icon: '🎧',
    topics: [
      'Self-help',
      'Support assignment',
      'Issue diagnosis',
      'Problem resolution',
      'Continuous improvement',
    ],
  },
  { id: 'operations', label: 'Operations', icon: '🏭' },
  { id: 'engineering', label: 'Engineering', icon: '🔧' },
  {
    id: 'finance',
    label: 'Finance',
    icon: '💰',
    topics: [
      'Quote to cash',
      'Record to report',
      'Tax & treasury',
      'Planning & analysis',
      'Risk management and compliance',
      'Procure-to-pay',
    ],
  },
  {
    id: 'hr',
    label: 'HR',
    icon: '👥',
    topics: [
      'Employee engagement',
      'Recruiting',
      'HR admin & payroll',
      'Compensation & benefits',
      'Learning & development',
      'Talent management',
      'HR strategy & planning',
    ],
  },
  {
    id: 'it',
    label: 'IT',
    icon: '💻',
    topics: [
      'Data management',
      'Software management & acquisition',
      'Device management',
      'IT operations',
      'Network operations',
      'Information security',
      'Change management & user adoption',
    ],
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: '⚖️',
    topics: [
      'Regulatory & compliance management',
      'Contracting',
      'Risk management',
      'Litigation',
      'Consultation',
      'Intellectual property',
      'Advisory services',
    ],
  },
  { id: 'compliance', label: 'Compliance', icon: '✅' },
  { id: 'supply-chain', label: 'Supply Chain', icon: '📦' },
  { id: 'procurement', label: 'Procurement', icon: '🛒' },
  { id: 'hsse', label: 'Health, Safety & Environment', icon: '🏥' },
  { id: 'maintenance', label: 'Maintenance', icon: '🔩' },
  { id: 'production', label: 'Production', icon: '🏗️' },
  { id: 'geosciences', label: 'Geosciences & Exploration', icon: '🌍' },
  { id: 'environmental', label: 'Environmental', icon: '🌱' },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: '📢',
    topics: [
      'Customer insights & strategy',
      'Demand generation',
      'Content creation',
      'Campaign execution',
      'Predictive analysis',
      'Personalization',
      'Sales enablement & recommendation',
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: '📈',
    topics: [
      'Customer self-service',
      'Lead generation',
      'Customer engagement',
      'Negotiations & closing',
      'Post-sale follow-up & upsell',
      'Sales analysis & forecasting',
    ],
  },
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

function normalizeToken(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDepartmentId(input: string): string {
  const token = normalizeToken(input);
  const map: Record<string, string> = {
    'customer-service': 'operations',
    customerservice: 'operations',
    operations: 'operations',
    engineering: 'engineering',
    finance: 'finance',
    'finance-accounting': 'finance',
    'finance-and-accounting': 'finance',
    hr: 'hr',
    'human-resources': 'hr',
    it: 'it',
    'information-technology': 'it',
    legal: 'legal',
    compliance: 'compliance',
    'supply-chain': 'supply-chain',
    supplychain: 'supply-chain',
    procurement: 'procurement',
    hsse: 'hsse',
    'health-safety-environment': 'hsse',
    'health-safety-and-environment': 'hsse',
    maintenance: 'maintenance',
    production: 'production',
    geosciences: 'geosciences',
    'geosciences-exploration': 'geosciences',
    environmental: 'environmental',
    marketing: 'marketing',
    'marketing-communications': 'marketing',
    sales: 'sales',
  };
  return map[token] ?? token;
}

function normalizeDataSourceId(input: string): string {
  const token = normalizeToken(input);
  const map: Record<string, string> = {
    fabric: 'fabric',
    'microsoft-fabric': 'fabric',
    onedrive: 'onedrive',
    sharepoint: 'sharepoint',
    sql: 'sql',
    'sql-database': 'sql',
    salesforce: 'salesforce',
    sap: 'sap',
    snowflake: 'snowflake',
    'azure-data-lake': 'azure-datalake',
    dataverse: 'dataverse',
    excel: 'excel',
    'excel-csv': 'excel',
    scada: 'scada',
    'scada-systems': 'scada',
    historian: 'historian',
    'historian-database': 'historian',
    'azure-blob-storage': 'blob-storage',
    'blob-storage': 'blob-storage',
    documents: 'documents',
    'document-repository': 'documents',
    email: 'email',
    'email-archives': 'email',
  };
  return map[token] ?? token;
}

function scoreUseCaseMatch(
  useCase: UseCase,
  selectedDepartmentIds: Set<string>,
  selectedDataSourceIds: Set<string>
): number {
  const deptIds = useCase.departments.map(normalizeDepartmentId);
  const sourceIds = useCase.dataSources.map(normalizeDataSourceId);

  const deptOverlap = deptIds.filter((dept) => selectedDepartmentIds.has(dept)).length;
  const sourceOverlap = sourceIds.filter((source) => selectedDataSourceIds.has(source)).length;

  return deptOverlap * 10 + sourceOverlap * 3;
}

function hasDepartmentMatch(useCase: UseCase, selectedDepartmentIds: Set<string>): boolean {
  if (selectedDepartmentIds.size === 0) {
    return true;
  }

  const deptIds = useCase.departments.map(normalizeDepartmentId);
  return deptIds.some((dept) => selectedDepartmentIds.has(dept));
}

function ensureDepartmentCoverage(
  verticalUseCases: UseCase[],
  selectedDepartmentsRaw: unknown,
  selectedDataSourcesRaw: unknown
): UseCase[] {
  if (!Array.isArray(selectedDepartmentsRaw) || selectedDepartmentsRaw.length === 0) {
    return [];
  }

  const selectedDepartmentIds = new Set(
    selectedDepartmentsRaw
      .filter((value): value is string => typeof value === 'string')
      .map((dept) => normalizeDepartmentId(dept))
  );

  const selectedDataSourceIds = new Set(
    (Array.isArray(selectedDataSourcesRaw) ? selectedDataSourcesRaw : [])
      .filter((value): value is string => typeof value === 'string')
      .map((source) => normalizeDataSourceId(source))
  );

  if (verticalUseCases.length === 0 || selectedDepartmentIds.size === 0) {
    return [];
  }

  const rankedVerticalDefaults = [...verticalUseCases].sort(
    (a, b) =>
      scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
      scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds)
  );

  const guaranteedMatches: UseCase[] = [];

  for (const departmentId of selectedDepartmentIds) {
    const exactDepartmentMatches = verticalUseCases
      .filter((useCase) => useCase.departments.map(normalizeDepartmentId).includes(departmentId))
      .sort(
        (a, b) =>
          scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
          scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds)
      );

    const chosen = exactDepartmentMatches[0] ?? rankedVerticalDefaults[0];
    if (chosen && !guaranteedMatches.some((existing) => existing.id === chosen.id)) {
      guaranteedMatches.push(chosen);
    }
  }

  return guaranteedMatches;
}

function ensureMinimumRecommendations(
  selectedUseCases: UseCase[],
  verticalUseCases: UseCase[],
  selectedDepartmentIds: Set<string>,
  selectedDataSourceIds: Set<string>,
  minimumCount = 3
): UseCase[] {
  if (selectedUseCases.length >= minimumCount) {
    return selectedUseCases;
  }

  const result = [...selectedUseCases];
  const rankedDefaults = [...verticalUseCases].sort(
    (a, b) =>
      scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
      scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds)
  );

  for (const candidate of rankedDefaults) {
    if (!hasDepartmentMatch(candidate, selectedDepartmentIds)) {
      continue;
    }

    if (!result.some((item) => item.id === candidate.id)) {
      result.push(candidate);
    }
    if (result.length >= minimumCount) {
      break;
    }
  }

  return result;
}

function getIndustryFallbackUseCase(
  verticalUseCases: UseCase[],
  selectedDepartmentIds: Set<string>,
  selectedDataSourceIds: Set<string>
): UseCase | null {
  if (verticalUseCases.length === 0) {
    return null;
  }

  const ranked = [...verticalUseCases].sort(
    (a, b) =>
      scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
      scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds)
  );

  return ranked[0] ?? null;
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
    const verticalUseCases = useCaseDatabase.filter((entry) => entry.vertical === resolvedVertical);
    const selectedDepartmentIds = new Set(
      (Array.isArray(departments) ? departments : [])
        .filter((value): value is string => typeof value === 'string')
        .map((dept) => normalizeDepartmentId(dept))
    );
    const selectedDataSourceIds = new Set(
      (Array.isArray(dataSources) ? dataSources : [])
        .filter((value): value is string => typeof value === 'string')
        .map((source) => normalizeDataSourceId(source))
    );

    const guaranteedDepartmentMatches = ensureDepartmentCoverage(verticalUseCases, departments, dataSources);

    let effectiveCriteria = { ...selectedCriteria };
    let useCases = getRelevantUseCases(
      resolvedVertical,
      effectiveCriteria.departments,
      effectiveCriteria.dataSources
    );

    // Keep department alignment strict; only relax data source filters when needed.
    if (useCases.length === 0 && effectiveCriteria.dataSources.length > 0) {
      effectiveCriteria = { ...effectiveCriteria, dataSources: [] };
      useCases = getRelevantUseCases(
        resolvedVertical,
        effectiveCriteria.departments,
        effectiveCriteria.dataSources
      );
    }

    const mergedUseCases = [...useCases, ...guaranteedDepartmentMatches]
      .filter((useCase, index, all) => all.findIndex((entry) => entry.id === useCase.id) === index)
      .filter((useCase) => hasDepartmentMatch(useCase, selectedDepartmentIds))
      .sort(
        (a, b) =>
          scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
          scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds)
      );

    let recommendedUseCases = ensureMinimumRecommendations(
      mergedUseCases,
      verticalUseCases,
      selectedDepartmentIds,
      selectedDataSourceIds,
      3
    );

    let industryFallbackApplied = false;
    if (recommendedUseCases.length === 0) {
      const fallbackUseCase = getIndustryFallbackUseCase(
        verticalUseCases,
        selectedDepartmentIds,
        selectedDataSourceIds
      );

      if (fallbackUseCase) {
        recommendedUseCases = [fallbackUseCase];
        industryFallbackApplied = true;
      }
    }

    res.json({
      useCases: recommendedUseCases,
      selectedCriteria,
      resolvedVertical,
      effectiveCriteria,
      totalCount: recommendedUseCases.length,
      guaranteedDepartmentCoverage: guaranteedDepartmentMatches.map((entry) => entry.id),
      industryFallbackApplied,
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
