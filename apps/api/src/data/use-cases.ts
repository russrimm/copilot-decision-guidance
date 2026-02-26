// Use cases database for Oil, Gas, and Energy sector
export interface UseCase {
  id: string;
  title: string;
  description: string;
  vertical: 'oil' | 'gas' | 'energy';
  personas: string[];
  departments: string[];
  dataSources: string[];
  agentArchitecture: {
    name: string;
    overview: string;
    components: string[];
    dataFlow: string;
  };
  implementation: {
    phase1: string[];
    phase2: string[];
    phase3: string[];
    estimatedTimelineWeeks: number;
    skillsRequired: string[];
  };
  roi: {
    timeSavingsPercentage: number;
    costReductionPercentage: number;
    productivityGainPercentage: number;
    paybackPeriodMonths: number;
    estimatedAnnualValue: string;
  };
  screenshot?: string;
}

type UseCaseSeed = Omit<UseCase, 'personas'> & {
  personas?: string[];
};

const REQUIRED_PERSONAS = [
  'Executive Persona (C-Suite / Sr Leader)',
  'HR Persona (CHRO, VP of HR)',
  'Analyst Persona (Heavy Excel User)',
  'Sales Persona (Sales Leads, AEs, BDMs)',
  'Legal Persona (General Counsel, Lawyers)',
  'Exec Office Team (Chief of Staff, Admins)',
  'Marketing Persona (Marketing roles)',
  'Customer Support Persona',
] as const;

const DEPARTMENT_TO_PERSONAS: Record<string, readonly (typeof REQUIRED_PERSONAS)[number][]> = {
  hr: [REQUIRED_PERSONAS[1]],
  legal: [REQUIRED_PERSONAS[4]],
  marketing: [REQUIRED_PERSONAS[6]],
  sales: [REQUIRED_PERSONAS[3]],
  'customer-service': [REQUIRED_PERSONAS[7]],
  operations: [REQUIRED_PERSONAS[7]],
  finance: [REQUIRED_PERSONAS[2]],
  engineering: [REQUIRED_PERSONAS[2]],
  it: [REQUIRED_PERSONAS[2]],
  compliance: [REQUIRED_PERSONAS[4]],
};

const rawUseCaseDatabase: UseCaseSeed[] = [
  {
    id: 'wellops-monitoring',
    title: 'Well Operations Monitoring Agent',
    description:
      'Monitors well performance metrics in real-time and alerts operators to anomalies, enabling faster intervention and reduced downtime.',
    vertical: 'oil',
    departments: ['Operations', 'Engineering', 'Maintenance'],
    dataSources: ['Azure Data Lake', 'SAP', 'SCADA Systems', 'Historian Database'],
    agentArchitecture: {
      name: 'Real-time Monitoring & Alert System',
      overview:
        'Autonomous agent that ingests SCADA data, correlates with historical trends, and proactively alerts on pressure/temperature anomalies.',
      components: [
        'Data Ingestion Layer (SCADA/Historian)',
        'ML-based Anomaly Detection',
        'Knowledge Base (Well Baselines)',
        'Alert & Notification Engine',
        'Escalation Logic',
      ],
      dataFlow: 'SCADA → Data Lake → Agent Analysis → Alert System → Dashboard & Teams',
    },
    implementation: {
      phase1: [
        'Integrate SCADA data with Azure Data Lake',
        'Define baseline metrics for well performance',
        'Create feedback loop for anomaly thresholds',
        'Deploy to 5-10 pilot wells',
      ],
      phase2: [
        'Train AI models on 12+ months historical data',
        'Build predictive failure models',
        'Integrate with maintenance scheduling system',
        'Scale to all wells in field',
      ],
      phase3: [
        'Add prescriptive recommendations',
        'Integrate autonomous optimization routines',
        'Build mobile app for field operatives',
        'Implement automated reporting',
      ],
      estimatedTimelineWeeks: 16,
      skillsRequired: ['Data Engineers', 'ML Engineers', 'SCADA Specialists', 'Domain Experts'],
    },
    roi: {
      timeSavingsPercentage: 35,
      costReductionPercentage: 22,
      productivityGainPercentage: 40,
      paybackPeriodMonths: 14,
      estimatedAnnualValue: '$2.3M per field',
    },
  },
  {
    id: 'compliance-advisor',
    title: 'Regulatory Compliance Assistant',
    description:
      'Ensures operations remain compliant with EPA, state, and local regulations by monitoring permits, inspections, and reporting requirements.',
    vertical: 'energy',
    departments: ['Compliance', 'Legal', 'Operations', 'Environmental'],
    dataSources: ['SharePoint', 'Document Repository', 'Dataverse', 'Email Archives'],
    agentArchitecture: {
      name: 'Compliance Monitoring & Reporting System',
      overview:
        'Agent tracks regulatory requirements, monitors permit expiration, flags non-compliance risks, and auto-generates required reports.',
      components: [
        'Regulatory Rules Engine',
        'Permit & Deadline Tracker',
        'Document Collection & Analysis',
        'Risk Assessment Module',
        'Report Generator',
      ],
      dataFlow: 'Regulatory Sources → Knowledge Base → Monitoring → Risk Detection → Reporting',
    },
    implementation: {
      phase1: [
        'Map all applicable regulations and permits',
        'Centralize compliance documentation in SharePoint',
        'Set up automated deadline tracking',
        'Create initial compliance dashboard',
      ],
      phase2: [
        'Build automated compliance audit workflow',
        'Train AI on historical violations and remediation',
        'Implement risk scoring for facilities',
        'Auto-generate monthly compliance reports',
      ],
      phase3: [
        'Integrate with field inspection systems',
        'Predictive non-compliance detection',
        'Automated corrective action plans',
        'Real-time regulatory update notifications',
      ],
      estimatedTimelineWeeks: 12,
      skillsRequired: [
        'Compliance Officers',
        'Legal Analysts',
        'Data Architects',
        'Regulatory Experts',
      ],
    },
    roi: {
      timeSavingsPercentage: 50,
      costReductionPercentage: 25,
      productivityGainPercentage: 45,
      paybackPeriodMonths: 10,
      estimatedAnnualValue: '$1.8M per organization',
    },
  },
  {
    id: 'maintenance-prediction',
    title: 'Predictive Maintenance Assistant',
    description:
      'Predicts equipment failures before they occur using sensor data and maintenance history, reducing unplanned downtime by up to 40%.',
    vertical: 'gas',
    departments: ['Maintenance', 'Operations', 'Engineering'],
    dataSources: ['Azure Data Lake', 'SAP', 'Asset Management System', 'Maintenance Logs'],
    agentArchitecture: {
      name: 'Predictive Maintenance Intelligence System',
      overview:
        'Uses sensor telemetry, maintenance history, and ML to predict failures and optimize maintenance scheduling.',
      components: [
        'Sensor Data Pipeline',
        'Equipment Health Analytics',
        'Failure Prediction Models',
        'Maintenance Optimization Engine',
        'Work Order Generation',
      ],
      dataFlow: 'Sensors → Data Lake → ML Models → Health Scoring → Maintenance Scheduling → SAP',
    },
    implementation: {
      phase1: [
        'Integrate sensor data from compression stations/compressors',
        'Connect to SAP for maintenance history',
        'Build equipment inventory in knowledge base',
        'Establish baseline health metrics',
      ],
      phase2: [
        'Train ML models on failure patterns (6-12 months data)',
        'Develop failure risk scoring algorithm',
        'Create maintenance schedule optimization',
        'Set up automated work order generation',
      ],
      phase3: [
        'Implement spare parts optimization logic',
        'Add supply chain integration for parts availability',
        'Create field technician mobile alerts',
        'Build predictive cost modeling',
      ],
      estimatedTimelineWeeks: 18,
      skillsRequired: [
        'ML Engineers',
        'Maintenance Managers',
        'Data Scientists',
        'Equipment Specialists',
      ],
    },
    roi: {
      timeSavingsPercentage: 40,
      costReductionPercentage: 38,
      productivityGainPercentage: 50,
      paybackPeriodMonths: 12,
      estimatedAnnualValue: '$3.2M per site',
    },
  },
  {
    id: 'document-extraction',
    title: 'Well Log & Geological Data Agent',
    description:
      'Intelligently extracts and catalogs information from wellbore logs, core samples, and geological surveys for better exploration decisions.',
    vertical: 'oil',
    departments: ['Geosciences', 'Exploration', 'Engineering'],
    dataSources: ['Document Repository', 'LAS Files', 'Core Lab Database', 'Azure Blob Storage'],
    agentArchitecture: {
      name: 'Geological Data Intelligence System',
      overview:
        'Parses Well Logs (LAS), core descriptions, and reports to extract parameters, correlate formations, and suggest drilling targets.',
      components: [
        'Well Log Parser (LAS/ASCII)',
        'Core Description OCR',
        'Formation Correlation Engine',
        'Petrophysical Analysis',
        'Drilling Recommendation Engine',
      ],
      dataFlow:
        'Raw Documents/Files → Parsing → Data Extraction → Correlation → Analysis → Recommendations',
    },
    implementation: {
      phase1: [
        'Ingest existing well log library',
        'Build Well-to-Formation mapping database',
        'Train OCR on core descriptions',
        'Create initial formation correlation model',
      ],
      phase2: [
        'Develop petrophysical analysis templates',
        'Train on zone analytics (porosity, permeability, saturation)',
        'Create inter-well correlation workflows',
        'Build drilling risk assessment module',
      ],
      phase3: [
        'Add seismic-to-well integration',
        'Predictive HC accumulation modeling',
        'Automated drilling target ranking',
        'Integration with 3D visualization tools',
      ],
      estimatedTimelineWeeks: 20,
      skillsRequired: [
        'Geoscientists',
        'Petrophysicists',
        'Data Scientists',
        'Software Developers',
      ],
    },
    roi: {
      timeSavingsPercentage: 60,
      costReductionPercentage: 15,
      productivityGainPercentage: 70,
      paybackPeriodMonths: 16,
      estimatedAnnualValue: '$4.1M per business unit',
    },
  },
  {
    id: 'supplier-management',
    title: 'Supplier Performance & Contract Agent',
    description:
      'Monitors supplier performance against SLAs, identifies risks, and recommends optimizations for procurement and vendor management.',
    vertical: 'energy',
    departments: ['Procurement', 'Finance', 'Supply Chain', 'Operations'],
    dataSources: ['SAP', 'Supplier Portal', 'Excel / CSV', 'Email Archives'],
    agentArchitecture: {
      name: 'Supplier Intelligence & Performance Management',
      overview:
        'Aggregates supplier metrics, contract terms, performance data to provide visibility and predictive alerts on supplier health.',
      components: [
        'Performance Metrics Aggregator',
        'Contract Intelligence Module',
        'Risk Scoring Engine',
        'Spend Analysis Tool',
        'Recommendation Engine',
      ],
      dataFlow:
        'SAP/Sources → Data Aggregation → Performance Analysis → Risk Scoring → Alerts & Insights',
    },
    implementation: {
      phase1: [
        'Integrate SAP PO/Invoice data',
        'Map supplier master data across systems',
        'Create KPI dashboard (on-time, quality, cost)',
        'Document SLA requirements',
      ],
      phase2: [
        'Build supplier risk scoring model',
        'Analyze historical performance trends',
        'Contract term extraction and tracking',
        'Automated performance reporting',
      ],
      phase3: [
        'Predictive supplier financial health modeling',
        'Spend optimization recommendations',
        'Automated contract renewal alerts',
        'Supplier collaboration portal integration',
      ],
      estimatedTimelineWeeks: 14,
      skillsRequired: [
        'Procurement Analysts',
        'Data Analysts',
        'Supply Chain Managers',
        'Finance Teams',
      ],
    },
    roi: {
      timeSavingsPercentage: 30,
      costReductionPercentage: 12,
      productivityGainPercentage: 35,
      paybackPeriodMonths: 11,
      estimatedAnnualValue: '$1.2M per company',
    },
  },
  {
    id: 'hsec-assistant',
    title: 'Health, Safety & Environmental Compliance Agent',
    description:
      'Tracks HSSE incidents, compliance metrics, and training requirements while providing predictive insights on risk areas.',
    vertical: 'oil',
    departments: ['Health & Safety', 'Environmental', 'Operations', 'HR'],
    dataSources: ['Incident Management System', 'Training Database', 'Dataverse', 'SharePoint'],
    agentArchitecture: {
      name: 'HSSE Intelligence & Risk Management System',
      overview:
        'Collects HSSE data from multiple sources, identifies trends, predicts high-risk areas, and recommends preventive measures.',
      components: [
        'Incident Data Aggregator',
        'Trend Analysis Engine',
        'Risk Prediction Model',
        'Training Compliance Tracker',
        'Alert & Recommendation System',
      ],
      dataFlow: 'Incident Systems → Data Lake → Analysis → Risk Prediction → Alerts & Dashboards',
    },
    implementation: {
      phase1: [
        'Centralize incident reporting in Dataverse',
        'Create HSSE KPI dashboard',
        'Map training requirements to roles',
        'Set up automated compliance tracking',
      ],
      phase2: [
        'Build incident trend analysis (root cause, patterns)',
        'Develop risk scoring by location/facility/role',
        'Create predictive safety risk model',
        'Automate training Due-date alerts',
      ],
      phase3: [
        'Behavioral safety analytics',
        'Hotspot prediction for field operations',
        'Integration with incident investigation system',
        'Personalized safety coaching recommendations',
      ],
      estimatedTimelineWeeks: 15,
      skillsRequired: ['HSSE Professionals', 'Data Analysts', 'ML Engineers', 'Domain Experts'],
    },
    roi: {
      timeSavingsPercentage: 45,
      costReductionPercentage: 20,
      productivityGainPercentage: 40,
      paybackPeriodMonths: 13,
      estimatedAnnualValue: '$2.1M per organization',
    },
  },
  {
    id: 'production-optimization',
    title: 'Production Optimization Agent',
    description:
      'Analyzes well production data to identify underperforming wells and recommends workover/optimization opportunities.',
    vertical: 'gas',
    departments: ['Production', 'Engineering', 'Operations'],
    dataSources: ['SCADA Systems', 'Production Database', 'Azure Data Lake', 'Well History'],
    agentArchitecture: {
      name: 'Production Intelligence & Optimization System',
      overview:
        'Analyzes production trends, identifies wells below expected performance, and recommends optimization interventions.',
      components: [
        'Production Data Pipeline',
        'Well Performance Baseline',
        'Anomaly Detection Engine',
        'Optimization Recommendation Engine',
        'ROI Calculator',
      ],
      dataFlow:
        'SCADA → Data Lake → Baseline Analysis → Anomaly Detection → Recommendations → Dashboard',
    },
    implementation: {
      phase1: [
        'Ingest 5+ years of production history',
        'Create well performance baselines (decline curves)',
        'Define typical production anomalies',
        'Build interactive dashboard',
      ],
      phase2: [
        'Train ML models to identify underperforming wells',
        'Develop workover ROI calculations',
        'Build artificial lift optimization models',
        'Create prioritization algorithm',
      ],
      phase3: [
        'Reservoir re-characterization recommendations',
        'ICD/Intelligent completion optimization',
        'Water management predictions',
        'Automated intervention planning',
      ],
      estimatedTimelineWeeks: 17,
      skillsRequired: [
        'Reservoir Engineers',
        'Production Engineers',
        'Data Scientists',
        'ML Specialists',
      ],
    },
    roi: {
      timeSavingsPercentage: 35,
      costReductionPercentage: 18,
      productivityGainPercentage: 45,
      paybackPeriodMonths: 14,
      estimatedAnnualValue: '$3.8M per portfolio',
    },
  },
  {
    id: 'trading-risk-copilot',
    title: 'Energy Trading Risk & Scheduling Copilot',
    description:
      'Improves power and gas trading outcomes by combining demand forecasts, market signals, and contract constraints to recommend schedules and hedging actions.',
    vertical: 'energy',
    departments: ['Operations', 'Finance', 'Compliance', 'IT'],
    dataSources: ['SQL Database', 'Azure Data Lake', 'Dataverse', 'SharePoint', 'Email Archives'],
    agentArchitecture: {
      name: 'Market-Aware Planning & Risk Intelligence',
      overview:
        'Combines structured market and position data with policy constraints to generate scenario-based dispatch and hedging recommendations with explainable rationale.',
      components: [
        'Price & Demand Forecast Service',
        'Position and Contract Normalization Layer',
        'Risk Policy Rules Engine',
        'Scenario Simulator',
        'Recommendation and Approval Workflow',
      ],
      dataFlow:
        'Market Feeds/ERP → Data Lake + SQL → Scenario Simulation → Risk Scoring → Trader Recommendations → Approval and Audit Trail',
    },
    implementation: {
      phase1: [
        'Connect pricing, contract, and historical load data',
        'Define risk thresholds with Finance and Compliance',
        'Build day-ahead recommendation prototype',
        'Pilot with one trading desk and one balancing area',
      ],
      phase2: [
        'Add intraday scenario simulation and stress testing',
        'Integrate approval workflow and audit evidence capture',
        'Implement explainability outputs for decisions',
        'Expand to additional regions and books',
      ],
      phase3: [
        'Automate exception handling and escalation paths',
        'Optimize hedging and scheduling under constraints',
        'Introduce portfolio-level optimization recommendations',
        'Operationalize continuous model monitoring',
      ],
      estimatedTimelineWeeks: 16,
      skillsRequired: ['Energy Traders', 'Risk Analysts', 'Data Engineers', 'Solution Architects'],
    },
    roi: {
      timeSavingsPercentage: 33,
      costReductionPercentage: 17,
      productivityGainPercentage: 38,
      paybackPeriodMonths: 12,
      estimatedAnnualValue: '$2.6M per trading desk',
    },
  },
  {
    id: 'pipeline-integrity-copilot',
    title: 'Pipeline Integrity & Leak Response Copilot',
    description:
      'Correlates pipeline telemetry, inspection findings, and maintenance history to prioritize integrity actions and accelerate leak response coordination.',
    vertical: 'gas',
    departments: ['Operations', 'Maintenance', 'Compliance', 'Engineering', 'HSSE'],
    dataSources: [
      'SCADA Systems',
      'Historian Database',
      'Azure Data Lake',
      'Document Repository',
      'SharePoint',
    ],
    agentArchitecture: {
      name: 'Integrity Monitoring and Response Orchestrator',
      overview:
        'Blends real-time telemetry, inspection data, and incident procedures to identify elevated integrity risks and orchestrate response playbooks.',
      components: [
        'Telemetry Ingestion and Quality Monitor',
        'Integrity Risk Scoring Engine',
        'Inspection Evidence Index',
        'Response Playbook Assistant',
        'Cross-Team Escalation Hub',
      ],
      dataFlow:
        'SCADA/Historian + Inspection Records → Risk Correlation → Priority Queue → Response Playbook → Work Orders and Compliance Logs',
    },
    implementation: {
      phase1: [
        'Integrate SCADA, ILI reports, and maintenance tickets',
        'Define integrity risk factors and thresholds',
        'Publish baseline leak response playbooks',
        'Pilot in one high-priority corridor',
      ],
      phase2: [
        'Enable alert prioritization by business impact and safety risk',
        'Automate work-order prepopulation and routing',
        'Add geospatial context to incident dashboards',
        'Run tabletop response simulations',
      ],
      phase3: [
        'Introduce predictive intervention recommendations',
        'Optimize inspection and maintenance cadence',
        'Automate compliance evidence packages',
        'Scale to enterprise-wide integrity operations',
      ],
      estimatedTimelineWeeks: 15,
      skillsRequired: [
        'Pipeline Engineers',
        'Integrity Specialists',
        'HSSE Teams',
        'Data Engineers',
      ],
    },
    roi: {
      timeSavingsPercentage: 36,
      costReductionPercentage: 20,
      productivityGainPercentage: 42,
      paybackPeriodMonths: 11,
      estimatedAnnualValue: '$2.9M per network segment',
    },
  },
  {
    id: 'customer-service-operations-copilot',
    title: 'Customer Service Operations Copilot',
    description:
      'Supports utility service teams with outage insights, billing resolution guidance, and proactive customer communications to reduce escalations.',
    vertical: 'energy',
    departments: ['Operations', 'Sales', 'Marketing', 'IT', 'Finance'],
    dataSources: ['Salesforce', 'Dataverse', 'SharePoint', 'SQL Database', 'Email Archives'],
    agentArchitecture: {
      name: 'Omnichannel Service Intelligence Assistant',
      overview:
        'Fuses CRM, outage, and billing signals to provide service agents with context-rich recommendations and consistent communications.',
      components: [
        'Customer Context Aggregator',
        'Case Prioritization Model',
        'Knowledge Retrieval and Grounding Layer',
        'Communication Drafting Assistant',
        'Workflow Automation Connector',
      ],
      dataFlow:
        'CRM + Billing + Service Events → Context Assembly → Recommendation Generation → Agent Workflow → Resolution and Feedback Loop',
    },
    implementation: {
      phase1: [
        'Consolidate customer profile and case history sources',
        'Index approved knowledge content and outage templates',
        'Deploy agent assist for top 10 service intents',
        'Pilot in one customer service team',
      ],
      phase2: [
        'Integrate proactive messaging workflows',
        'Implement escalation and sentiment-based routing',
        'Add billing exception explanation assistant',
        'Expand to multi-channel support operations',
      ],
      phase3: [
        'Optimize staffing and queue forecasting',
        'Automate post-incident communications at scale',
        'Personalize retention and outreach recommendations',
        'Establish continuous quality and prompt tuning cycle',
      ],
      estimatedTimelineWeeks: 13,
      skillsRequired: [
        'Service Operations Leads',
        'CRM Administrators',
        'Power Platform Developers',
        'Data Analysts',
      ],
    },
    roi: {
      timeSavingsPercentage: 32,
      costReductionPercentage: 14,
      productivityGainPercentage: 37,
      paybackPeriodMonths: 10,
      estimatedAnnualValue: '$1.9M per service organization',
    },
  },
];

function buildPersonaList(useCase: UseCaseSeed): string[] {
  const personas = new Set<string>([...REQUIRED_PERSONAS]);

  if (Array.isArray(useCase.personas)) {
    useCase.personas
      .filter((persona): persona is string => typeof persona === 'string' && persona.length > 0)
      .forEach((persona) => personas.add(persona));
  }

  useCase.departments.forEach((department) => {
    const normalizedDepartment = normalizeDepartment(department);
    const mappedPersonas = DEPARTMENT_TO_PERSONAS[normalizedDepartment] ?? [];
    mappedPersonas.forEach((persona) => personas.add(persona));
  });

  const order = new Map<string, number>(
    REQUIRED_PERSONAS.map((persona, index) => [persona, index] as const)
  );
  return [...personas].sort((left, right) => {
    const leftIndex = order.get(left);
    const rightIndex = order.get(right);

    if (leftIndex !== undefined && rightIndex !== undefined) {
      return leftIndex - rightIndex;
    }
    if (leftIndex !== undefined) {
      return -1;
    }
    if (rightIndex !== undefined) {
      return 1;
    }
    return left.localeCompare(right);
  });
}

export const useCaseDatabase: UseCase[] = rawUseCaseDatabase.map((useCase) => ({
  ...useCase,
  personas: buildPersonaList(useCase),
}));

function normalizeToken(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDepartment(input: string): string {
  const t = normalizeToken(input);
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
    'health-safety': 'hsse',
    maintenance: 'maintenance',
    production: 'production',
    geosciences: 'geosciences',
    'geosciences-exploration': 'geosciences',
    environmental: 'environmental',
    marketing: 'marketing',
    'marketing-communications': 'marketing',
    sales: 'sales',
  };
  return map[t] ?? t;
}

function normalizeDataSource(input: string): string {
  const t = normalizeToken(input);
  const map: Record<string, string> = {
    fabric: 'fabric',
    'microsoft-fabric': 'fabric',
    msfabric: 'fabric',
    onedrive: 'onedrive',
    'one-drive': 'onedrive',
    sharepoint: 'sharepoint',
    sql: 'sql',
    'sql-database': 'sql',
    salesforce: 'salesforce',
    sap: 'sap',
    snowflake: 'snowflake',
    'azure-data-lake': 'azure-datalake',
    azuredatalake: 'azure-datalake',
    dataverse: 'dataverse',
    excel: 'excel',
    'excel-csv': 'excel',
    'excel-and-csv': 'excel',
    'excel-data': 'excel',
    csv: 'excel',
    scada: 'scada',
    'scada-systems': 'scada',
    historian: 'historian',
    'historian-database': 'historian',
    'azure-blob-storage': 'blob-storage',
    blobstorage: 'blob-storage',
    'blob-storage': 'blob-storage',
    documents: 'documents',
    'document-repository': 'documents',
    'document-database': 'documents',
    email: 'email',
    'email-archives': 'email',
  };
  return map[t] ?? t;
}

export function getRelevantUseCases(
  vertical: 'oil' | 'gas' | 'energy' | 'all',
  departments: string[],
  dataSources: string[]
): UseCase[] {
  const requestedDeptIds = new Set(departments.map(normalizeDepartment));
  const requestedSourceIds = new Set(dataSources.map(normalizeDataSource));

  return useCaseDatabase.filter((useCase) => {
    const verticalMatch = vertical === 'all' || useCase.vertical === vertical;
    const useCaseDeptIds = useCase.departments.map(normalizeDepartment);
    const useCaseSourceIds = useCase.dataSources.map(normalizeDataSource);

    const deptMatch =
      requestedDeptIds.size === 0 || useCaseDeptIds.some((dept) => requestedDeptIds.has(dept));
    const dataMatch =
      requestedSourceIds.size === 0 ||
      useCaseSourceIds.some((source) => requestedSourceIds.has(source));

    return verticalMatch && deptMatch && dataMatch;
  });
}
