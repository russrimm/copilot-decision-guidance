export type AgentType = 'general-assistant' | 'retrieval-agent' | 'task-agent' | 'autonomous-agent';
export type Platform =
  | 'Microsoft 365 Copilot'
  | 'Copilot Studio'
  | 'Agent Builder'
  | 'SharePoint Agent'
  | 'OneDrive Agent'
  | 'Azure AI Foundry';

export interface AgentListing {
  id: string;
  name: string;
  summary: string;
  agentType: AgentType;
  platforms: Platform[];
  departments: string[];
  dataSources: string[];
  examples: {
    userPrompt: string;
    agentResponseShape: string;
  }[];
  implementation: {
    whenToUse: string;
    howItWorks: string;
    setupSteps: string[];
    governanceNotes: string[];
  };
  tags: string[];
}

export const seedAgents: AgentListing[] = [
  {
    id: 'hse-policy-retrieval',
    name: 'HSE Policy Retrieval Agent',
    summary:
      'Answers frontline safety questions using approved HSE manuals and procedures, with citations and version control.',
    agentType: 'retrieval-agent',
    platforms: ['SharePoint Agent', 'Microsoft 365 Copilot', 'Copilot Studio'],
    departments: ['Health & Safety', 'Operations', 'HR'],
    dataSources: ['SharePoint', 'PDFs', 'Word documents'],
    examples: [
      {
        userPrompt: 'What are the stop-work criteria for confined space entry?',
        agentResponseShape:
          'Short answer + steps checklist + links to the approved procedure sections + “last updated” date',
      },
    ],
    implementation: {
      whenToUse:
        'Use when employees need fast, consistent answers grounded in approved documents (not a free-form assistant).',
      howItWorks:
        'Indexes approved documents, retrieves the most relevant sections, and responds with citations and policy guardrails.',
      setupSteps: [
        'Define a single authoritative SharePoint library for HSE policies',
        'Establish document owners, versioning, and review cadence',
        'Configure the agent’s allowed sources and prompt rules (citations required)',
        'Pilot with one site and validate answers against SMEs',
        'Roll out with feedback loop and quarterly evaluation',
      ],
      governanceNotes: [
        'Require citations for every answer (no “guessing”)',
        'Limit sources to approved libraries and labeled content',
        'Use least-privilege access and audit agent usage',
      ],
    },
    tags: ['safety', 'policy', 'citations', 'frontline'],
  },
  {
    id: 'permit-to-work-task',
    name: 'Permit-to-Work Task Agent',
    summary:
      'Helps users create and validate permit-to-work drafts by gathering required fields and checking completeness before submission.',
    agentType: 'task-agent',
    platforms: ['Copilot Studio', 'Agent Builder'],
    departments: ['Operations', 'Compliance', 'Maintenance'],
    dataSources: ['Dataverse', 'SharePoint', 'Email'],
    examples: [
      {
        userPrompt: 'Create a hot work permit draft for Tank 12 maintenance tomorrow.',
        agentResponseShape:
          'Guided form-filling conversation + validation errors + produces a structured record and summary for approval',
      },
    ],
    implementation: {
      whenToUse:
        'Use when the interaction must produce a structured output (records, approvals, tasks) with validation and auditability.',
      howItWorks:
        'Guides the user through required fields, validates business rules, and creates a permit record plus an approval workflow.',
      setupSteps: [
        'Define the permit schema (required fields, validations, routing)',
        'Connect data sources (Dataverse/SharePoint) and approval endpoints',
        'Implement business rule checks (location, hazards, supervisor approvals)',
        'Add a safe “handoff to human” step for final approval',
        'Pilot with one operations team and measure cycle-time reduction',
      ],
      governanceNotes: [
        'Enforce role-based approvals and immutable audit trails',
        'Prevent auto-approval; require human sign-off',
        'Log all actions, inputs, and produced artifacts',
      ],
    },
    tags: ['operations', 'workflow', 'approvals', 'compliance'],
  },
  {
    id: 'monthly-ops-report',
    name: 'Monthly Ops Reporting Assistant',
    summary:
      'Drafts monthly operational reports by aggregating KPIs, incidents, and key changes, then produces an executive-ready narrative.',
    agentType: 'general-assistant',
    platforms: ['Microsoft 365 Copilot'],
    departments: ['Operations', 'Finance', 'Leadership'],
    dataSources: ['Excel / CSV', 'SharePoint', 'Email'],
    examples: [
      {
        userPrompt: 'Summarize this month’s ops metrics and draft a leadership update.',
        agentResponseShape:
          'Executive summary + KPI highlights + risks/issues + actions and owners (in a Word/PowerPoint-friendly format)',
      },
    ],
    implementation: {
      whenToUse:
        'Use when the work happens inside Microsoft 365 apps and you need drafting/summarization, not a dedicated workflow engine.',
      howItWorks:
        'Uses context from the document/email/spreadsheet you are already working in, and drafts a narrative based on that content.',
      setupSteps: [
        'Standardize KPI spreadsheet structure and naming conventions',
        'Use a shared SharePoint location for source artifacts',
        'Provide a report template and a consistent prompt pattern',
        'Add a reviewer checklist for accuracy and confidentiality',
      ],
      governanceNotes: [
        'Respect sensitivity labels and DLP policies',
        'Avoid including customer/PII unless required and approved',
      ],
    },
    tags: ['reporting', 'executive', 'microsoft365'],
  },
  {
    id: 'autonomous-maintenance-planner',
    name: 'Autonomous Maintenance Planning Agent',
    summary:
      'Continuously monitors work order backlog, parts availability, and technician capacity to propose optimized weekly schedules.',
    agentType: 'autonomous-agent',
    platforms: ['Azure AI Foundry', 'Copilot Studio'],
    departments: ['Maintenance', 'Operations', 'Supply Chain'],
    dataSources: ['SAP', 'Asset Management System', 'Azure Data Lake'],
    examples: [
      {
        userPrompt: 'What should next week’s maintenance schedule look like?',
        agentResponseShape:
          'Proposed schedule + constraints + tradeoffs + confidence notes + “approve to apply” control',
      },
    ],
    implementation: {
      whenToUse:
        'Use when value comes from continuous monitoring + proactive recommendations, and you can enforce strong guardrails and approvals.',
      howItWorks:
        'Runs on a cadence, evaluates constraints, proposes plans, and requires human approval before applying changes.',
      setupSteps: [
        'Define the decision loop (signals, cadence, and outputs)',
        'Implement guardrails (no autonomous execution without approval)',
        'Connect systems (SAP, parts inventory, capacity planning)',
        'Add evaluation metrics (lateness reduction, downtime reduction)',
        'Start with “recommend-only” mode, then add controlled execution',
      ],
      governanceNotes: [
        'Require approvals for any action that changes systems of record',
        'Define blast radius and rollback procedures',
        'Monitor for drift and regularly re-evaluate recommendations',
      ],
    },
    tags: ['autonomous', 'planning', 'optimization'],
  },
];
