import { Router } from 'express';
import { useCaseDatabase } from '../data/use-cases.js';
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
const VERTICAL_ARCHETYPE_MAP = {
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
function resolveVerticalForCatalog(vertical) {
    if (typeof vertical !== 'string' || vertical.length === 0) {
        return 'energy';
    }
    if (SUPPORTED_VERTICALS.has(vertical)) {
        return vertical;
    }
    return VERTICAL_ARCHETYPE_MAP[vertical] ?? 'energy';
}
function toLabelSelections(selections, byId, aliasesById) {
    if (!Array.isArray(selections))
        return [];
    return selections
        .filter((v) => typeof v === 'string')
        .map((idOrLabel) => {
        const alias = aliasesById?.[idOrLabel];
        return alias ?? byId.get(idOrLabel) ?? idOrLabel;
    });
}
function normalizeToken(input) {
    return input
        .trim()
        .toLowerCase()
        .replace(/[–—]/g, '-')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function normalizeDepartmentId(input) {
    const token = normalizeToken(input);
    const map = {
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
function normalizeDataSourceId(input) {
    const token = normalizeToken(input);
    const map = {
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
const NORMALIZED_USE_CASES = useCaseDatabase.map((useCase) => ({
    useCase,
    normalizedDepartments: useCase.departments.map(normalizeDepartmentId),
    normalizedDataSources: useCase.dataSources.map(normalizeDataSourceId),
}));
function getVerticalUseCases(vertical) {
    if (vertical === 'all') {
        return NORMALIZED_USE_CASES;
    }
    return NORMALIZED_USE_CASES.filter((entry) => entry.useCase.vertical === vertical);
}
function getRelevantUseCasesFromNormalized(verticalUseCases, departments, dataSources) {
    const requestedDeptIds = new Set(departments.map(normalizeDepartmentId));
    const requestedSourceIds = new Set(dataSources.map(normalizeDataSourceId));
    return verticalUseCases.filter((entry) => {
        const deptMatch = requestedDeptIds.size === 0 ||
            entry.normalizedDepartments.some((dept) => requestedDeptIds.has(dept));
        const dataMatch = requestedSourceIds.size === 0 ||
            entry.normalizedDataSources.some((source) => requestedSourceIds.has(source));
        return deptMatch && dataMatch;
    });
}
function scoreUseCaseMatch(useCase, selectedDepartmentIds, selectedDataSourceIds) {
    const deptOverlap = useCase.normalizedDepartments.filter((dept) => selectedDepartmentIds.has(dept))
        .length;
    const sourceOverlap = useCase.normalizedDataSources.filter((source) => selectedDataSourceIds.has(source))
        .length;
    return deptOverlap * 10 + sourceOverlap * 3;
}
function hasDepartmentMatch(useCase, selectedDepartmentIds) {
    if (selectedDepartmentIds.size === 0) {
        return true;
    }
    return useCase.normalizedDepartments.some((dept) => selectedDepartmentIds.has(dept));
}
function ensureDepartmentCoverage(verticalUseCases, selectedDepartmentsRaw, selectedDataSourcesRaw) {
    if (!Array.isArray(selectedDepartmentsRaw) || selectedDepartmentsRaw.length === 0) {
        return [];
    }
    const selectedDepartmentIds = new Set(selectedDepartmentsRaw
        .filter((value) => typeof value === 'string')
        .map((dept) => normalizeDepartmentId(dept)));
    const selectedDataSourceIds = new Set((Array.isArray(selectedDataSourcesRaw) ? selectedDataSourcesRaw : [])
        .filter((value) => typeof value === 'string')
        .map((source) => normalizeDataSourceId(source)));
    if (verticalUseCases.length === 0 || selectedDepartmentIds.size === 0) {
        return [];
    }
    const rankedVerticalDefaults = [...verticalUseCases].sort((a, b) => scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
        scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds));
    const guaranteedMatches = [];
    for (const departmentId of selectedDepartmentIds) {
        const exactDepartmentMatches = verticalUseCases
            .filter((useCase) => useCase.normalizedDepartments.includes(departmentId))
            .sort((a, b) => scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
            scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds));
        const chosen = exactDepartmentMatches[0] ?? rankedVerticalDefaults[0];
        if (chosen && !guaranteedMatches.some((existing) => existing.useCase.id === chosen.useCase.id)) {
            guaranteedMatches.push(chosen);
        }
    }
    return guaranteedMatches;
}
function ensureMinimumRecommendations(selectedUseCases, verticalUseCases, selectedDepartmentIds, selectedDataSourceIds, minimumCount = 3) {
    if (selectedUseCases.length >= minimumCount) {
        return selectedUseCases;
    }
    const result = [...selectedUseCases];
    const rankedDefaults = [...verticalUseCases].sort((a, b) => scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
        scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds));
    for (const candidate of rankedDefaults) {
        if (!hasDepartmentMatch(candidate, selectedDepartmentIds)) {
            continue;
        }
        if (!result.some((item) => item.useCase.id === candidate.useCase.id)) {
            result.push(candidate);
        }
        if (result.length >= minimumCount) {
            break;
        }
    }
    return result;
}
function getIndustryFallbackUseCase(verticalUseCases, selectedDepartmentIds, selectedDataSourceIds) {
    if (verticalUseCases.length === 0) {
        return null;
    }
    const ranked = [...verticalUseCases].sort((a, b) => scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
        scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds));
    return ranked[0] ?? null;
}
// Get all verticals available
router.get('/verticals', (req, res) => {
    res.json(VERTICALS);
});
// Get all departments (for all verticals)
router.get('/departments', (req, res) => {
    res.json(DEPARTMENTS);
});
// Get all data sources
router.get('/data-sources', (req, res) => {
    res.json(DATA_SOURCES);
});
// Get relevant use cases based on selection
router.post('/generate', (req, res) => {
    try {
        const { vertical, departments, dataSources } = req.body;
        if (!vertical) {
            return res.status(400).json({ error: 'Vertical is required' });
        }
        const departmentLabelById = new Map(DEPARTMENTS.map((d) => [d.id, d.label]));
        const dataSourceLabelById = new Map(DATA_SOURCES.map((d) => [d.id, d.label]));
        const normalizedDepartments = toLabelSelections(departments, departmentLabelById);
        const normalizedDataSources = toLabelSelections(dataSources, dataSourceLabelById);
        const selectedCriteria = {
            vertical,
            departments: normalizedDepartments,
            dataSources: normalizedDataSources,
        };
        const resolvedVertical = resolveVerticalForCatalog(vertical);
        const verticalUseCases = getVerticalUseCases(resolvedVertical);
        const selectedDepartmentIds = new Set((Array.isArray(departments) ? departments : [])
            .filter((value) => typeof value === 'string')
            .map((dept) => normalizeDepartmentId(dept)));
        const selectedDataSourceIds = new Set((Array.isArray(dataSources) ? dataSources : [])
            .filter((value) => typeof value === 'string')
            .map((source) => normalizeDataSourceId(source)));
        const guaranteedDepartmentMatches = ensureDepartmentCoverage(verticalUseCases, departments, dataSources);
        let effectiveCriteria = { ...selectedCriteria };
        let useCases = getRelevantUseCasesFromNormalized(verticalUseCases, effectiveCriteria.departments, effectiveCriteria.dataSources);
        // Keep department alignment strict; only relax data source filters when needed.
        if (useCases.length === 0 && effectiveCriteria.dataSources.length > 0) {
            effectiveCriteria = { ...effectiveCriteria, dataSources: [] };
            useCases = getRelevantUseCasesFromNormalized(verticalUseCases, effectiveCriteria.departments, effectiveCriteria.dataSources);
        }
        const mergedUseCases = [...useCases, ...guaranteedDepartmentMatches]
            .filter((useCase, index, all) => all.findIndex((entry) => entry.useCase.id === useCase.useCase.id) === index)
            .filter((useCase) => hasDepartmentMatch(useCase, selectedDepartmentIds))
            .sort((a, b) => scoreUseCaseMatch(b, selectedDepartmentIds, selectedDataSourceIds) -
            scoreUseCaseMatch(a, selectedDepartmentIds, selectedDataSourceIds));
        let recommendedUseCases = ensureMinimumRecommendations(mergedUseCases, verticalUseCases, selectedDepartmentIds, selectedDataSourceIds, 3);
        let industryFallbackApplied = false;
        if (recommendedUseCases.length === 0) {
            const fallbackUseCase = getIndustryFallbackUseCase(verticalUseCases, selectedDepartmentIds, selectedDataSourceIds);
            if (fallbackUseCase) {
                recommendedUseCases = [fallbackUseCase];
                industryFallbackApplied = true;
            }
        }
        res.json({
            useCases: recommendedUseCases.map((entry) => entry.useCase),
            selectedCriteria,
            resolvedVertical,
            effectiveCriteria,
            totalCount: recommendedUseCases.length,
            guaranteedDepartmentCoverage: guaranteedDepartmentMatches.map((entry) => entry.useCase.id),
            industryFallbackApplied,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate use cases' });
    }
});
// Get specific use case details
router.get('/use-case/:id', (req, res) => {
    const useCase = useCaseDatabase.find((uc) => uc.id === req.params.id);
    if (!useCase) {
        return res.status(404).json({ error: 'Use case not found' });
    }
    res.json(useCase);
});
// Get all use cases (for admin/reference)
router.get('/all', (req, res) => {
    res.json(useCaseDatabase);
});
// Export single use case as PDF
router.get('/export/pdf/:id', async (req, res) => {
    try {
        const useCase = useCaseDatabase.find((uc) => uc.id === req.params.id);
        if (!useCase) {
            return res.status(404).json({ error: 'Use case not found' });
        }
        const pdfBuffer = await generateUseCasePDF(useCase);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${useCase.id}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});
// Export single use case as PPTX
router.get('/export/pptx/:id', async (req, res) => {
    try {
        const useCase = useCaseDatabase.find((uc) => uc.id === req.params.id);
        if (!useCase) {
            return res.status(404).json({ error: 'Use case not found' });
        }
        const pptxBuffer = await generateUseCasePPTX(useCase);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename="${useCase.id}.pptx"`);
        res.send(pptxBuffer);
    }
    catch (error) {
        console.error('PPTX generation error:', error);
        res.status(500).json({ error: 'Failed to generate PowerPoint' });
    }
});
// Export multiple use cases as PDF
router.post('/export/pdf-batch', async (req, res) => {
    try {
        const { useCaseIds } = req.body;
        if (!Array.isArray(useCaseIds) || useCaseIds.length === 0) {
            return res.status(400).json({ error: 'useCaseIds array is required' });
        }
        const useCases = useCaseIds
            .map((id) => useCaseDatabase.find((uc) => uc.id === id))
            .filter((uc) => uc !== undefined);
        if (useCases.length === 0) {
            return res.status(404).json({ error: 'No valid use cases found' });
        }
        const pdfBuffer = await generateMultipleUseCasesPDF(useCases);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="use-cases.pdf"');
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('PDF batch generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF batch' });
    }
});
// Export multiple use cases as PPTX
router.post('/export/pptx-batch', async (req, res) => {
    try {
        const { useCaseIds } = req.body;
        if (!Array.isArray(useCaseIds) || useCaseIds.length === 0) {
            return res.status(400).json({ error: 'useCaseIds array is required' });
        }
        const useCases = useCaseIds
            .map((id) => useCaseDatabase.find((uc) => uc.id === id))
            .filter((uc) => uc !== undefined);
        if (useCases.length === 0) {
            return res.status(404).json({ error: 'No valid use cases found' });
        }
        const pptxBuffer = await generateMultipleUseCasesPPTX(useCases);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', 'attachment; filename="use-cases.pptx"');
        res.send(pptxBuffer);
    }
    catch (error) {
        console.error('PPTX batch generation error:', error);
        res.status(500).json({ error: 'Failed to generate PowerPoint batch' });
    }
});
export default router;
