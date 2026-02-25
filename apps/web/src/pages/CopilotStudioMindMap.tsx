import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useRef, useState } from 'react';

type MindMapNode = {
  id: string;
  label: string;
  learnUrl?: string;
  children?: MindMapNode[];
};

type PositionedNode = {
  id: string;
  parentId: string | null;
  node: MindMapNode;
  depth: number;
  x: number;
  y: number;
};

type ConnectorPath = {
  id: string;
  d: string;
};

const ROOT_WIDTH = 250;
const NODE_WIDTH = 300;
const NODE_HEIGHT = 56;
const HORIZONTAL_GAP = 72;
const VERTICAL_GAP = 22;
const PADDING_X = 24;
const PADDING_Y = 24;
const TEXT_PADDING_X = 22;
const RIGHT_ICON_SPACE = 44;
const AVG_CHAR_WIDTH = 7.4;
const MAX_LABEL_LINES = 2;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

const copilotStudioTree: MindMapNode = {
  id: 'copilot-studio',
  label: 'Copilot Studio',
  learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-what-is-copilot-studio',
  children: [
    {
      id: 'build-publish',
      label: 'Build & Publish',
      learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-create-first-agent',
      children: [
        {
          id: 'agent-authoring',
          label: 'Agent Authoring',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-first-bot',
          children: [
            {
              id: 'visual-canvas',
              label: 'Visual Canvas & Low-code Design',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-what-is-copilot-studio',
            },
            {
              id: 'templates',
              label: 'Templates & Starter Experiences',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-templates',
            },
            {
              id: 'real-time-testing',
              label: 'Real-time Testing',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-test-bot',
            },
          ],
        },
        {
          id: 'topics-conversation',
          label: 'Topics & Conversation Design',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-create-edit-topics',
          children: [
            {
              id: 'specific-topics',
              label: 'Specific/Curated Topics',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-create-edit-topics',
            },
            {
              id: 'multilingual-agents',
              label: 'Multilingual Agents',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-language-support',
            },
            {
              id: 'rich-responses',
              label: 'Rich & Dynamic Responses',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-send-message',
            },
          ],
        },
        {
          id: 'publish-channels',
          label: 'Publish to Channels',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/publication-fundamentals-publish-channels',
          children: [
            {
              id: 'm365-copilot-channel',
              label: 'Microsoft 365 Copilot',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/publication-fundamentals-publish-channels',
            },
            {
              id: 'teams-channel',
              label: 'Microsoft Teams',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/publication-fundamentals-publish-channels',
            },
            {
              id: 'custom-channel-runtime',
              label: 'Web/Custom Channels',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/publication-fundamentals-publish-channels',
            },
          ],
        },
      ],
    },
    {
      id: 'language-dialog-orchestration',
      label: 'Language, Dialog & Orchestration',
      learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions',
      children: [
        {
          id: 'language-understanding',
          label: 'Language Understanding',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions',
          children: [
            {
              id: 'classic-nlu',
              label: 'Classic NLU',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions',
            },
            {
              id: 'builtin-nlu',
              label: 'Built-in NLU',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions',
            },
            {
              id: 'byo-nlu',
              label: 'Bring-your-own NLU',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions',
            },
          ],
        },
        {
          id: 'dialog-management',
          label: 'Dialog Management',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-create-edit-topics',
          children: [
            {
              id: 'multi-turn',
              label: 'Multi-turn Conversations',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-create-edit-topics',
            },
            {
              id: 'inputs-outputs',
              label: 'Inputs, Outputs & Variables',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-variables',
            },
            {
              id: 'escalation',
              label: 'Escalate to Live Agent',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-hand-off',
            },
          ],
        },
        {
          id: 'orchestration-triggers',
          label: 'Orchestration & Triggers',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-triggers-about',
          children: [
            {
              id: 'generative-orch',
              label: 'Generative Orchestration',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions',
            },
            {
              id: 'autonomous-triggers',
              label: 'Autonomous Triggers',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/guidance/autonomous-agents',
            },
            {
              id: 'system-triggers',
              label: 'System-driven Triggers',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-triggers-about',
            },
          ],
        },
      ],
    },
    {
      id: 'knowledge-generative-answers',
      label: 'Knowledge & Generative Answers',
      learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio',
      children: [
        {
          id: 'knowledge-sources',
          label: 'Knowledge Sources',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio',
          children: [
            {
              id: 'public-websites',
              label: 'Public Websites',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio',
            },
            {
              id: 'dataverse-documents',
              label: 'Dataverse Documents',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio',
            },
            {
              id: 'sharepoint-knowledge',
              label: 'SharePoint Knowledge',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-add-unstructured-data',
            },
          ],
        },
        {
          id: 'enterprise-grounding',
          label: 'Enterprise Grounding',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-real-time-connectors',
          children: [
            {
              id: 'graph-grounding',
              label: 'Microsoft Graph Grounding',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio',
            },
            {
              id: 'connector-grounding',
              label: 'Enterprise Connectors',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-real-time-connectors',
            },
            {
              id: 'azure-ai-search',
              label: 'Azure AI Search Grounding',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-azure-ai-search',
            },
          ],
        },
        {
          id: 'answer-controls',
          label: 'Answer Controls',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/nlu-boost-node',
          children: [
            {
              id: 'fallback-pattern',
              label: 'Fallback with Generative Answers',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/nlu-boost-node',
            },
            {
              id: 'content-moderation',
              label: 'Content Moderation Levels',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/knowledge-copilot-studio#content-moderation',
            },
            {
              id: 'citations-behavior',
              label: 'Citations & Response Handling',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/nlu-boost-node',
            },
          ],
        },
      ],
    },
    {
      id: 'actions-integrations',
      label: 'Actions & Integrations',
      learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-connectors',
      children: [
        {
          id: 'integration-options',
          label: 'Integration Options',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-connectors',
          children: [
            {
              id: 'http-requests',
              label: 'HTTP Requests',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/authoring-http-node',
            },
            {
              id: 'power-platform-connectors',
              label: 'Power Platform Connectors',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-connectors',
            },
            {
              id: 'bot-framework-skills',
              label: 'Bot Framework Skills',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-use-skills',
            },
          ],
        },
        {
          id: 'action-patterns',
          label: 'Action Patterns',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/flows-overview',
          children: [
            {
              id: 'workflows',
              label: 'Agent Flows / Workflows',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/flows-overview',
            },
            {
              id: 'generative-actions',
              label: 'Generative Actions',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-generative-actions',
            },
            {
              id: 'long-running-tasks',
              label: 'Long-running Tasks',
              learnUrl: 'https://learn.microsoft.com/microsoft-365-copilot/extensibility/ux-custom-engine-agent#asynchronous-patterns',
            },
          ],
        },
        {
          id: 'pro-dev-extensibility',
          label: 'Pro-dev Extensibility',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/guidance/extend-copilot-studio',
          children: [
            {
              id: 'byom',
              label: 'Bring your own model (BYOM)',
              learnUrl:
                'https://learn.microsoft.com/power-platform/release-plan/2025wave2/microsoft-copilot-studio/use-own-model-when-generating-responses',
            },
            {
              id: 'custom-knowledge',
              label: 'Knowledge Base Extension',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/nlu-generative-answers-custom-data',
            },
            {
              id: 'custom-analytics',
              label: 'Custom Analytics Integration',
              learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/guidance/custom-analytics-strategy',
            },
          ],
        },
      ],
    },
    {
      id: 'security-governance',
      label: 'Security & Governance',
      learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/administer-security',
      children: [
        {
          id: 'data-policy-controls',
          label: 'Data Policy Controls (DLP)',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/admin-data-loss-prevention',
          children: [
            { id: 'auth-governance', label: 'Maker/User Authentication Controls' },
            { id: 'knowledge-governance', label: 'Knowledge Source Governance' },
            { id: 'connector-trigger-governance', label: 'Connector/Trigger Governance' },
          ],
        },
        {
          id: 'security-controls',
          label: 'Security Controls',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/administer-security',
          children: [
            { id: 'runtime-protection', label: 'Agent Runtime Protection Status' },
            { id: 'security-scan', label: 'Automatic Security Scan' },
            { id: 'cmk-support', label: 'Customer-managed Keys (CMK)' },
          ],
        },
        {
          id: 'audit-compliance',
          label: 'Audit & Compliance',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/administer-copilot-studio',
          children: [
            { id: 'purview-logs', label: 'Microsoft Purview Audit Logs' },
            { id: 'sentinel-logs', label: 'Microsoft Sentinel Monitoring' },
            { id: 'compliance-offerings', label: 'Compliance Offerings & Residency' },
          ],
        },
      ],
    },
    {
      id: 'alm-solutions',
      label: 'ALM & Solutions',
      learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-export-import-bots',
      children: [
        {
          id: 'solution-model',
          label: 'Solution Model',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/advanced-export-import-bots',
          children: [
            { id: 'agent-in-solution', label: 'Agents in Power Platform Solutions' },
            { id: 'custom-solutions', label: 'Custom Solutions' },
            { id: 'preferred-solution', label: 'Preferred Solution Setting' },
          ],
        },
        {
          id: 'environment-strategy',
          label: 'Environment Strategy',
          learnUrl: 'https://learn.microsoft.com/power-platform/alm/environment-strategy-alm',
          children: [
            { id: 'dev-test-prod', label: 'Dev/Test/Prod Environments' },
            { id: 'ring-deployment', label: 'Ring Deployments' },
            { id: 'environment-routing', label: 'Environment Routing' },
          ],
        },
        {
          id: 'deployment-automation',
          label: 'Deployment Automation',
          learnUrl: 'https://learn.microsoft.com/power-platform/alm/use-deployment-pipelines',
          children: [
            { id: 'import-export', label: 'Import/Export Solutions' },
            { id: 'solution-pipelines', label: 'Solution Pipelines (CI/CD)' },
            { id: 'managed-layers', label: 'Managed/Unmanaged Layers' },
          ],
        },
      ],
    },
    {
      id: 'analytics-operations',
      label: 'Analytics & Operations',
      learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/analytics-overview',
      children: [
        {
          id: 'analyze-improve',
          label: 'Analyze & Improve Lifecycle',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/analytics-overview',
          children: [
            { id: 'oob-insights', label: 'Out-of-box Insights' },
            { id: 'continuous-improvement', label: 'Continuous Improvement Loop' },
            { id: 'performance-testing', label: 'Performance Testing' },
          ],
        },
        {
          id: 'analytics-telemetry',
          label: 'Analytics & Telemetry',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/analytics-overview',
          children: [
            { id: 'conversation-transcripts', label: 'Conversation Transcripts' },
            { id: 'technical-telemetry', label: 'Technical Telemetry' },
            { id: 'app-insights', label: 'Application Insights Integration' },
          ],
        },
        {
          id: 'platform-services',
          label: 'Connected Platform Services',
          learnUrl: 'https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-what-is-copilot-studio',
          children: [
            { id: 'entra-id', label: 'Microsoft Entra ID' },
            { id: 'azure-monitor-storage', label: 'Azure Monitor / Storage' },
            { id: 'foundry-ai-services', label: 'Foundry & Azure AI Services' },
          ],
        },
      ],
    },
  ],
};

const m365CopilotTree: MindMapNode = {
  id: 'm365-copilot',
  label: 'Microsoft 365 Copilot',
  children: [
    {
      id: 'm365-experiences',
      label: 'Copilot Experiences',
      children: [
        {
          id: 'm365-apps',
          label: 'Word, Excel, PowerPoint, Outlook, Teams',
          learnUrl:
            'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-overview#copilot-features-in-microsoft-365-apps',
          children: [
            {
              id: 'm365-apps-word',
              label: 'Word & PowerPoint',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-overview#copilot-features-in-microsoft-365-apps',
            },
            {
              id: 'm365-apps-excel',
              label: 'Excel & Outlook',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-overview#copilot-features-in-microsoft-365-apps',
            },
            {
              id: 'm365-apps-teams',
              label: 'Teams',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-overview#copilot-features-in-microsoft-365-apps',
            },
          ],
        },
        {
          id: 'm365-chat',
          label: 'Copilot Chat & Business Chat',
          learnUrl: 'https://learn.microsoft.com/copilot/overview#microsoft-365-copilot-chat-copilot-chat',
          children: [
            {
              id: 'm365-chat-copilot',
              label: 'Copilot Chat',
              learnUrl: 'https://learn.microsoft.com/copilot/overview#microsoft-365-copilot-chat-copilot-chat',
            },
            {
              id: 'm365-chat-business',
              label: 'Business Chat',
              learnUrl: 'https://learn.microsoft.com/copilot/overview#microsoft-365-copilot-chat-copilot-chat',
            },
          ],
        },
        {
          id: 'm365-agents',
          label: 'Agents (Researcher, Analyst)',
          learnUrl:
            'https://learn.microsoft.com/microsoft-365/admin/manage/manage-copilot-agents-integrated-apps?view=o365-worldwide',
          children: [
            {
              id: 'm365-agents-researcher',
              label: 'Researcher Agent',
              learnUrl:
                'https://learn.microsoft.com/microsoft-365/admin/manage/manage-copilot-agents-integrated-apps?view=o365-worldwide',
            },
            {
              id: 'm365-agents-analyst',
              label: 'Analyst Agent',
              learnUrl:
                'https://learn.microsoft.com/microsoft-365/admin/manage/manage-copilot-agents-integrated-apps?view=o365-worldwide',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-grounding',
      label: 'Grounding & Data Sources',
      children: [
        {
          id: 'm365-graph-grounding',
          label: 'Microsoft Graph Grounding',
          learnUrl: 'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-architecture',
          children: [
            {
              id: 'm365-graph-permissions',
              label: 'Permissions & Access',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-architecture',
            },
            {
              id: 'm365-graph-sources',
              label: 'Grounding Sources',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-architecture',
            },
          ],
        },
        {
          id: 'm365-sharepoint-onedrive',
          label: 'SharePoint & OneDrive',
          learnUrl:
            'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-minimum-requirements-data-compliance',
          children: [
            {
              id: 'm365-sharepoint',
              label: 'SharePoint',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-minimum-requirements-data-compliance',
            },
            {
              id: 'm365-onedrive',
              label: 'OneDrive',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-minimum-requirements-data-compliance',
            },
          ],
        },
        {
          id: 'm365-mail-calendar-teams',
          label: 'Mail, Calendar & Teams',
          learnUrl:
            'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-overview#copilot-works-with-microsoft-365-apps-and-microsoft-graph',
          children: [
            {
              id: 'm365-mail-calendar',
              label: 'Mail & Calendar',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-overview#copilot-works-with-microsoft-365-apps-and-microsoft-graph',
            },
            {
              id: 'm365-teams-collab',
              label: 'Teams Collaboration',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-overview#copilot-works-with-microsoft-365-apps-and-microsoft-graph',
            },
          ],
        },
        {
          id: 'm365-connectors',
          label: 'Microsoft 365 Copilot Connectors',
          learnUrl: 'https://learn.microsoft.com/microsoft-365-copilot/extensibility/overview-copilot-connector',
          children: [
            {
              id: 'm365-connectors-config',
              label: 'Connector Setup',
              learnUrl:
                'https://learn.microsoft.com/microsoft-365-copilot/extensibility/overview-copilot-connector',
            },
            {
              id: 'm365-connectors-graph',
              label: 'Graph Connectors',
              learnUrl: 'https://learn.microsoft.com/microsoftsearch/connectors-overview',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-extensibility',
      label: 'Extensibility & APIs',
      children: [
        {
          id: 'm365-copilot-apis',
          label: 'Copilot APIs (Chat, Retrieval)',
          learnUrl: 'https://learn.microsoft.com/microsoft-365-copilot/extensibility/copilot-apis-overview',
          children: [
            {
              id: 'm365-copilot-apis-chat',
              label: 'Chat API',
              learnUrl: 'https://learn.microsoft.com/microsoft-365-copilot/extensibility/copilot-apis-overview',
            },
            {
              id: 'm365-copilot-apis-retrieval',
              label: 'Retrieval API',
              learnUrl: 'https://learn.microsoft.com/microsoft-365-copilot/extensibility/copilot-apis-overview',
            },
          ],
        },
        {
          id: 'm365-graph-apis',
          label: 'Microsoft Graph APIs',
          learnUrl: 'https://learn.microsoft.com/graph/overview',
          children: [
            {
              id: 'm365-graph-auth',
              label: 'Auth & Permissions',
              learnUrl: 'https://learn.microsoft.com/graph/overview',
            },
            {
              id: 'm365-graph-data',
              label: 'People, Mail, Files',
              learnUrl: 'https://learn.microsoft.com/graph/overview',
            },
          ],
        },
        {
          id: 'm365-copilot-studio-ext',
          label: 'Copilot Studio Extensions',
          learnUrl: 'https://learn.microsoft.com/microsoft-365-copilot/extensibility/',
          children: [
            {
              id: 'm365-copilot-studio-actions',
              label: 'Actions',
              learnUrl: 'https://learn.microsoft.com/microsoft-365-copilot/extensibility/',
            },
            {
              id: 'm365-copilot-studio-connectors',
              label: 'Connectors',
              learnUrl: 'https://learn.microsoft.com/microsoft-365-copilot/extensibility/',
            },
          ],
        },
        {
          id: 'm365-plugins-actions',
          label: 'Plugins & Actions',
          learnUrl: 'https://learn.microsoft.com/microsoft-365-copilot/extensibility/overview-business-applications',
          children: [
            {
              id: 'm365-plugins',
              label: 'Plugins',
              learnUrl:
                'https://learn.microsoft.com/microsoft-365-copilot/extensibility/overview-business-applications',
            },
            {
              id: 'm365-actions',
              label: 'Actions',
              learnUrl:
                'https://learn.microsoft.com/microsoft-365-copilot/extensibility/overview-business-applications',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-security-compliance',
      label: 'Security, Privacy & Compliance',
      children: [
        {
          id: 'm365-purview-dlp',
          label: 'Microsoft Purview & DLP',
          learnUrl: 'https://learn.microsoft.com/purview/ai-m365-copilot',
          children: [
            {
              id: 'm365-purview-controls',
              label: 'Purview Controls',
              learnUrl: 'https://learn.microsoft.com/purview/ai-m365-copilot',
            },
            {
              id: 'm365-dlp-policies',
              label: 'DLP Policies',
              learnUrl: 'https://learn.microsoft.com/purview/ai-m365-copilot',
            },
          ],
        },
        {
          id: 'm365-sensitivity-irm',
          label: 'Sensitivity Labels & IRM',
          learnUrl:
            'https://learn.microsoft.com/purview/sensitivity-labels#sensitivity-labels-for-microsoft-365-copilot-and-microsoft-365-copilot-chat',
          children: [
            {
              id: 'm365-sensitivity-labels',
              label: 'Sensitivity Labels',
              learnUrl:
                'https://learn.microsoft.com/purview/sensitivity-labels#sensitivity-labels-for-microsoft-365-copilot-and-microsoft-365-copilot-chat',
            },
            {
              id: 'm365-irm',
              label: 'Information Rights Mgmt',
              learnUrl:
                'https://learn.microsoft.com/purview/sensitivity-labels#sensitivity-labels-for-microsoft-365-copilot-and-microsoft-365-copilot-chat',
            },
          ],
        },
        {
          id: 'm365-audit-ediscovery',
          label: 'Audit, eDiscovery & Retention',
          learnUrl:
            'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-architecture-data-protection-auditing#where-copilot-usage-data-is-stored-and-how-you-can-audit-it',
          children: [
            {
              id: 'm365-audit',
              label: 'Audit',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-architecture-data-protection-auditing#where-copilot-usage-data-is-stored-and-how-you-can-audit-it',
            },
            {
              id: 'm365-ediscovery',
              label: 'eDiscovery & Retention',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-architecture-data-protection-auditing#where-copilot-usage-data-is-stored-and-how-you-can-audit-it',
            },
          ],
        },
        {
          id: 'm365-conditional-access',
          label: 'Conditional Access & Entra ID',
          learnUrl:
            'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-architecture#copilot-honors-conditional-access-and-mfa',
          children: [
            {
              id: 'm365-conditional-access-policies',
              label: 'Conditional Access',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-architecture#copilot-honors-conditional-access-and-mfa',
            },
            {
              id: 'm365-mfa',
              label: 'MFA',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-architecture#copilot-honors-conditional-access-and-mfa',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-admin-governance',
      label: 'Admin Controls & Governance',
      children: [
        {
          id: 'm365-tenant-readiness',
          label: 'Tenant Readiness & Prereqs',
          learnUrl: 'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-setup#readiness-activities',
          children: [
            {
              id: 'm365-tenant-prereqs',
              label: 'Prerequisites',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-setup#readiness-activities',
            },
            {
              id: 'm365-tenant-licensing',
              label: 'Licensing',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-setup#readiness-activities',
            },
          ],
        },
        {
          id: 'm365-copilot-control-system',
          label: 'Copilot Control System',
          learnUrl: 'https://learn.microsoft.com/copilot/microsoft-365/copilot-control-system/management-controls',
          children: [
            {
              id: 'm365-control-govern',
              label: 'Governance Controls',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/copilot-control-system/management-controls',
            },
            {
              id: 'm365-control-data',
              label: 'Data Controls',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/copilot-control-system/management-controls',
            },
          ],
        },
        {
          id: 'm365-connectors-admin',
          label: 'Manage Connectors & Agents',
          learnUrl: 'https://learn.microsoft.com/microsoftsearch/connectors-overview',
          children: [
            {
              id: 'm365-connectors-admin-connectors',
              label: 'Connectors',
              learnUrl: 'https://learn.microsoft.com/microsoftsearch/connectors-overview',
            },
            {
              id: 'm365-connectors-admin-agents',
              label: 'Agents',
              learnUrl: 'https://learn.microsoft.com/microsoftsearch/connectors-overview',
            },
          ],
        },
        {
          id: 'm365-data-governance',
          label: 'Data Governance',
          learnUrl: 'https://learn.microsoft.com/sharepoint/get-ready-copilot-sharepoint-advanced-management',
          children: [
            {
              id: 'm365-data-access',
              label: 'Access & Permissions',
              learnUrl:
                'https://learn.microsoft.com/sharepoint/get-ready-copilot-sharepoint-advanced-management',
            },
            {
              id: 'm365-data-lifecycle',
              label: 'Lifecycle Policies',
              learnUrl:
                'https://learn.microsoft.com/sharepoint/get-ready-copilot-sharepoint-advanced-management',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-adoption-measurement',
      label: 'Adoption & Measurement',
      children: [
        {
          id: 'm365-usage-analytics',
          label: 'Copilot Analytics',
          learnUrl:
            'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-reports-for-admins#viva-insights-copilot-analytics',
          children: [
            {
              id: 'm365-analytics-viva',
              label: 'Viva Insights',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-reports-for-admins#viva-insights-copilot-analytics',
            },
            {
              id: 'm365-analytics-summary',
              label: 'Adoption Summary',
              learnUrl:
                'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-reports-for-admins#viva-insights-copilot-analytics',
            },
          ],
        },
        {
          id: 'm365-usage-reports',
          label: 'Usage Reports & Insights',
          learnUrl:
            'https://learn.microsoft.com/microsoft-365/admin/activity-reports/microsoft-365-copilot-usage?view=o365-worldwide',
          children: [
            {
              id: 'm365-usage-reporting',
              label: 'Usage Reporting',
              learnUrl:
                'https://learn.microsoft.com/microsoft-365/admin/activity-reports/microsoft-365-copilot-usage?view=o365-worldwide',
            },
            {
              id: 'm365-usage-adoption',
              label: 'Adoption Insights',
              learnUrl:
                'https://learn.microsoft.com/microsoft-365/admin/activity-reports/microsoft-365-copilot-usage?view=o365-worldwide',
            },
          ],
        },
        {
          id: 'm365-change-management',
          label: 'Change Management',
          learnUrl: 'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-enablement-resources',
          children: [
            {
              id: 'm365-change-training',
              label: 'Training & Enablement',
              learnUrl: 'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-enablement-resources',
            },
            {
              id: 'm365-change-communications',
              label: 'Comms & Champions',
              learnUrl: 'https://learn.microsoft.com/copilot/microsoft-365/microsoft-365-copilot-enablement-resources',
            },
          ],
        },
        {
          id: 'm365-feedback',
          label: 'User Feedback & Quality',
          learnUrl: 'https://learn.microsoft.com/viva/insights/org-team-insights/copilot-dashboard',
          children: [
            {
              id: 'm365-feedback-insights',
              label: 'Feedback Insights',
              learnUrl: 'https://learn.microsoft.com/viva/insights/org-team-insights/copilot-dashboard',
            },
            {
              id: 'm365-feedback-quality',
              label: 'Quality Signals',
              learnUrl: 'https://learn.microsoft.com/viva/insights/org-team-insights/copilot-dashboard',
            },
          ],
        },
      ],
    },
  ],
};

const microsoftFoundryTree: MindMapNode = {
  id: 'microsoft-foundry',
  label: 'Microsoft Foundry',
  children: [
    {
      id: 'foundry-model-catalog',
      label: 'Model Catalog & Selection',
      learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/foundry-models-overview?view=foundry-classic',
      children: [
        {
          id: 'foundry-foundation-models',
          label: 'Foundation Models',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/foundry-models-overview?view=foundry-classic',
          children: [
            {
              id: 'foundry-model-catalog-detail',
              label: 'Model Catalog',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/concepts/foundry-models-overview?view=foundry-classic',
            },
            {
              id: 'foundry-model-deployment-options',
              label: 'Deployment Options',
              learnUrl:
                'https://learn.microsoft.com/azure/machine-learning/foundry-models-overview?view=azureml-api-2#overview-of-model-catalog-capabilities',
            },
          ],
        },
        {
          id: 'foundry-open-models',
          label: 'Open & Partner Models',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/foundry-models-overview?view=foundry-classic',
          children: [
            {
              id: 'foundry-model-providers',
              label: 'Model Providers',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/concepts/foundry-models-overview?view=foundry-classic',
            },
            {
              id: 'foundry-model-licensing',
              label: 'Licensing & Terms',
              learnUrl:
                'https://learn.microsoft.com/azure/machine-learning/foundry-models-overview?view=azureml-api-2#overview-of-model-catalog-capabilities',
            },
          ],
        },
        {
          id: 'foundry-model-evaluation',
          label: 'Model Evaluation',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/foundry-models-overview?view=foundry-classic',
          children: [
            {
              id: 'foundry-compare-models',
              label: 'Compare Models',
              learnUrl:
                'https://learn.microsoft.com/azure/machine-learning/foundry-models-overview?view=azureml-api-2#overview-of-model-catalog-capabilities',
            },
            {
              id: 'foundry-benchmarks',
              label: 'Benchmarks',
              learnUrl:
                'https://learn.microsoft.com/azure/machine-learning/foundry-models-overview?view=azureml-api-2#overview-of-model-catalog-capabilities',
            },
          ],
        },
      ],
    },
    {
      id: 'foundry-orchestration',
      label: 'Prompt Flow & Orchestration',
      children: [
        {
          id: 'foundry-prompt-flow',
          label: 'Prompt Flow',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic',
          children: [
            {
              id: 'foundry-prompt-flow-variants',
              label: 'Prompt Variants',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic',
            },
            {
              id: 'foundry-prompt-flow-evaluation',
              label: 'Built-in Evaluation',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic',
            },
          ],
        },
        {
          id: 'foundry-tool-calling',
          label: 'Tool/Function Calling',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic',
          children: [
            {
              id: 'foundry-tools-llm',
              label: 'LLM Tools',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic',
            },
            {
              id: 'foundry-tools-python',
              label: 'Python Tools',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic',
            },
          ],
        },
        {
          id: 'foundry-agentic-workflows',
          label: 'Agentic Workflows',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic',
          children: [
            {
              id: 'foundry-flow-collaboration',
              label: 'Collaboration',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic',
            },
            {
              id: 'foundry-flow-deployment',
              label: 'Flow Deployment',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/prompt-flow?view=foundry-classic',
            },
          ],
        },
      ],
    },
    {
      id: 'foundry-data-retrieval',
      label: 'Data & Retrieval',
      children: [
        {
          id: 'foundry-vector-search',
          label: 'Vector Search',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/how-to/index-add?view=foundry-classic',
          children: [
            {
              id: 'foundry-vector-index',
              label: 'Vector Indexes',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/how-to/index-add?view=foundry-classic',
            },
            {
              id: 'foundry-vector-prereqs',
              label: 'Azure AI Search Prereqs',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/how-to/index-add?view=foundry-classic',
            },
          ],
        },
        {
          id: 'foundry-rag-pipelines',
          label: 'RAG Pipelines',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/retrieval-augmented-generation?view=foundry-classic',
          children: [
            {
              id: 'foundry-rag-retrieve',
              label: 'Retrieve, Augment, Generate',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/concepts/retrieval-augmented-generation?view=foundry-classic#how-does-rag-work',
            },
            {
              id: 'foundry-rag-index',
              label: 'Indexes for RAG',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/concepts/retrieval-augmented-generation?view=foundry-classic#what-is-an-index-and-why-do-i-need-it',
            },
          ],
        },
        {
          id: 'foundry-data-connectors',
          label: 'Indexes & Data Sources',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/retrieval-augmented-generation?view=foundry-classic',
          children: [
            {
              id: 'foundry-data-index-asset',
              label: 'Index Assets',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/concepts/retrieval-augmented-generation?view=foundry-classic',
            },
            {
              id: 'foundry-data-search',
              label: 'Azure AI Search',
              learnUrl: 'https://learn.microsoft.com/azure/search/search-what-is-azure-search',
            },
          ],
        },
      ],
    },
    {
      id: 'foundry-safety',
      label: 'Safety & Responsible AI',
      children: [
        {
          id: 'foundry-content-filters',
          label: 'Content Safety Filters',
          learnUrl: 'https://learn.microsoft.com/azure/ai-services/content-safety/overview',
          children: [
            {
              id: 'foundry-content-safety-text',
              label: 'Text Safety',
              learnUrl: 'https://learn.microsoft.com/azure/ai-services/content-safety/overview',
            },
            {
              id: 'foundry-content-safety-image',
              label: 'Image Safety',
              learnUrl: 'https://learn.microsoft.com/azure/ai-services/content-safety/overview',
            },
          ],
        },
        {
          id: 'foundry-evaluations',
          label: 'Evaluate & Red-team',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/responsible-use-of-ai-overview?view=foundry-classic',
          children: [
            {
              id: 'foundry-discover-risks',
              label: 'Discover Risks',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/responsible-use-of-ai-overview?view=foundry-classic',
            },
            {
              id: 'foundry-protect-risks',
              label: 'Protect with Guardrails',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/responsible-use-of-ai-overview?view=foundry-classic',
            },
          ],
        },
        {
          id: 'foundry-policy-controls',
          label: 'Governance Controls',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/responsible-use-of-ai-overview?view=foundry-classic',
          children: [
            {
              id: 'foundry-govern-monitor',
              label: 'Monitor & Govern',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/responsible-use-of-ai-overview?view=foundry-classic',
            },
            {
              id: 'foundry-govern-compliance',
              label: 'Compliance Checkpoints',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/responsible-use-of-ai-overview?view=foundry-classic',
            },
          ],
        },
      ],
    },
    {
      id: 'foundry-deployment',
      label: 'Deployment & Monitoring',
      children: [
        {
          id: 'foundry-managed-endpoints',
          label: 'Model Deployments',
          learnUrl:
            'https://learn.microsoft.com/azure/ai-foundry/foundry-models/how-to/quickstart-ai-project?view=foundry-classic',
          children: [
            {
              id: 'foundry-deploy-model',
              label: 'Deploy a Model',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/foundry-models/how-to/quickstart-ai-project?view=foundry-classic',
            },
            {
              id: 'foundry-model-endpoints',
              label: 'Inference Endpoint',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/foundry-models/how-to/quickstart-ai-project?view=foundry-classic',
            },
          ],
        },
        {
          id: 'foundry-scaling-cost',
          label: 'Quota & Capacity',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/how-to/quota?view=foundry-classic',
          children: [
            {
              id: 'foundry-quota-requests',
              label: 'Quota Requests',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/how-to/quota?view=foundry-classic',
            },
            {
              id: 'foundry-quota-monitor',
              label: 'Usage Monitoring',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/how-to/quota?view=foundry-classic',
            },
          ],
        },
        {
          id: 'foundry-observability',
          label: 'Observability & Monitoring',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/how-to/monitor-applications?view=foundry-classic',
          children: [
            {
              id: 'foundry-observability-insights',
              label: 'App Insights',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/how-to/monitor-applications?view=foundry-classic',
            },
            {
              id: 'foundry-continuous-eval',
              label: 'Continuous Evaluation',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/how-to/monitor-applications?view=foundry-classic',
            },
          ],
        },
      ],
    },
    {
      id: 'foundry-integration',
      label: 'App Integration',
      children: [
        {
          id: 'foundry-sdks',
          label: 'SDKs & APIs',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/quickstarts/hub-get-started-code?view=foundry-classic',
          children: [
            {
              id: 'foundry-quickstart',
              label: 'Quickstart (SDK)',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/quickstarts/hub-get-started-code?view=foundry-classic',
            },
            {
              id: 'foundry-project-setup',
              label: 'Project Setup',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/what-is-foundry?view=foundry-classic',
            },
          ],
        },
        {
          id: 'foundry-cicd',
          label: 'Projects & Resources',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/what-is-foundry?view=foundry-classic',
          children: [
            {
              id: 'foundry-project-types',
              label: 'Project Types',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/what-is-foundry?view=foundry-classic#types-of-projects',
            },
            {
              id: 'foundry-hub-resources',
              label: 'Hub Resources',
              learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/ai-resources?view=foundry-classic',
            },
          ],
        },
        {
          id: 'foundry-identity',
          label: 'Identity & Access',
          learnUrl: 'https://learn.microsoft.com/azure/ai-foundry/concepts/ai-resources?view=foundry-classic',
          children: [
            {
              id: 'foundry-hub-security',
              label: 'Hub Security',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/concepts/ai-resources?view=foundry-classic#share-configurations-across-projects-using-hub',
            },
            {
              id: 'foundry-shared-connections',
              label: 'Connections',
              learnUrl:
                'https://learn.microsoft.com/azure/ai-foundry/concepts/ai-resources?view=foundry-classic#share-configurations-across-projects-using-hub',
            },
          ],
        },
      ],
    },
  ],
};

const mindMapOptions = [
  { id: 'copilot-studio', label: 'Copilot Studio', tree: copilotStudioTree },
  { id: 'm365-copilot', label: 'Microsoft 365 Copilot', tree: m365CopilotTree },
  { id: 'microsoft-foundry', label: 'Microsoft Foundry', tree: microsoftFoundryTree },
];

function distanceBetween(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number }
): number {
  const deltaX = pointA.x - pointB.x;
  const deltaY = pointA.y - pointB.y;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function midpoint(pointA: { x: number; y: number }, pointB: { x: number; y: number }) {
  return {
    x: (pointA.x + pointB.x) / 2,
    y: (pointA.y + pointB.y) / 2,
  };
}

function wrapLabel(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  if (maxCharsPerLine <= 0) {
    return [text];
  }

  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(word.slice(0, Math.max(1, maxCharsPerLine)));
      current = '';
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (lines.length === maxLines) {
    const remainingWords = words.join(' ').length > lines.join(' ').length;
    if (remainingWords) {
      const lastIndex = lines.length - 1;
      const last = lines[lastIndex];
      const trimmed = last.replace(/\s+$/, '').slice(0, Math.max(1, maxCharsPerLine - 1));
      lines[lastIndex] = `${trimmed}…`;
    }
  }

  return lines;
}

function hasChildren(node: MindMapNode): boolean {
  return Boolean(node.children && node.children.length > 0);
}

function collectDescendantIds(node: MindMapNode): string[] {
  const descendants: string[] = [];

  const walk = (current: MindMapNode) => {
    current.children?.forEach((child) => {
      descendants.push(child.id);
      walk(child);
    });
  };

  walk(node);
  return descendants;
}

function getSubtreeHeight(
  node: MindMapNode,
  expandedNodeIds: Set<string>,
  cache: Map<string, number>
): number {
  const cached = cache.get(node.id);
  if (cached !== undefined) {
    return cached;
  }

  if (!hasChildren(node) || !expandedNodeIds.has(node.id)) {
    cache.set(node.id, NODE_HEIGHT);
    return NODE_HEIGHT;
  }

  const childHeights = (node.children ?? []).map((child) =>
    getSubtreeHeight(child, expandedNodeIds, cache)
  );

  const childrenTotalHeight =
    childHeights.reduce((sum, height) => sum + height, 0) +
    Math.max(0, childHeights.length - 1) * VERTICAL_GAP;

  const height = Math.max(NODE_HEIGHT, childrenTotalHeight);
  cache.set(node.id, height);
  return height;
}

function getNodeX(depth: number): number {
  if (depth === 0) {
    return PADDING_X;
  }

  return PADDING_X + ROOT_WIDTH + HORIZONTAL_GAP + (depth - 1) * (NODE_WIDTH + HORIZONTAL_GAP);
}

function getNodeWidth(depth: number): number {
  return depth === 0 ? ROOT_WIDTH : NODE_WIDTH;
}

function buildLayout(root: MindMapNode, expandedNodeIds: Set<string>) {
  const positionedNodes: PositionedNode[] = [];
  const edges: Array<{ from: string; to: string }> = [];
  const subtreeHeightCache = new Map<string, number>();

  const topChildren = root.children ?? [];
  const topHeights = topChildren.map((child) =>
    getSubtreeHeight(child, expandedNodeIds, subtreeHeightCache)
  );

  const topTotalHeight =
    topHeights.reduce((sum, height) => sum + height, 0) +
    Math.max(0, topChildren.length - 1) * VERTICAL_GAP;

  const rootExpanded = expandedNodeIds.has(root.id);
  const rootCenterY = rootExpanded ? PADDING_Y + topTotalHeight / 2 : PADDING_Y + NODE_HEIGHT / 2;

  positionedNodes.push({
    id: root.id,
    parentId: null,
    node: root,
    depth: 0,
    x: getNodeX(0),
    y: rootCenterY,
  });

  const placeChildren = (parent: MindMapNode, parentCenterY: number, depth: number) => {
    const children = parent.children ?? [];
    if (!children.length) {
      return;
    }

    const childHeights = children.map((child) =>
      getSubtreeHeight(child, expandedNodeIds, subtreeHeightCache)
    );

    const childrenTotalHeight =
      childHeights.reduce((sum, height) => sum + height, 0) +
      Math.max(0, children.length - 1) * VERTICAL_GAP;

    let cursorY = parentCenterY - childrenTotalHeight / 2;

    children.forEach((child, index) => {
      const subtreeHeight = childHeights[index];
      const childCenterY = cursorY + subtreeHeight / 2;

      positionedNodes.push({
        id: child.id,
        parentId: parent.id,
        node: child,
        depth,
        x: getNodeX(depth),
        y: childCenterY,
      });

      edges.push({ from: parent.id, to: child.id });

      if (hasChildren(child) && expandedNodeIds.has(child.id)) {
        placeChildren(child, childCenterY, depth + 1);
      }

      cursorY += subtreeHeight + VERTICAL_GAP;
    });
  };

  if (rootExpanded) {
    placeChildren(root, rootCenterY, 1);
  }

  const nodeMap = new Map(positionedNodes.map((entry) => [entry.id, entry]));

  const connectorPaths: ConnectorPath[] = edges
    .map((edge) => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);

      if (!fromNode || !toNode) {
        return null;
      }

      const fromX = fromNode.x + getNodeWidth(fromNode.depth);
      const fromY = fromNode.y;
      const toX = toNode.x;
      const toY = toNode.y;

      const curveOffset = Math.max(42, Math.min(120, (toX - fromX) * 0.42));
      const d = `M ${fromX} ${fromY} C ${fromX + curveOffset} ${fromY}, ${toX - curveOffset} ${toY}, ${toX} ${toY}`;

      return {
        id: `${edge.from}->${edge.to}`,
        d,
      };
    })
    .filter((entry): entry is ConnectorPath => Boolean(entry));

  const maxRight = positionedNodes.reduce((max, entry) => {
    const right = entry.x + getNodeWidth(entry.depth);
    return Math.max(max, right);
  }, 0);

  const maxBottom = positionedNodes.reduce((max, entry) => {
    const bottom = entry.y + NODE_HEIGHT / 2;
    return Math.max(max, bottom);
  }, 0);

  return {
    positionedNodes,
    connectorPaths,
    width: maxRight + PADDING_X,
    height: Math.max(520, maxBottom + PADDING_Y),
  };
}

export default function CopilotStudioMindMap() {
  const [selectedMapId, setSelectedMapId] = useState(mindMapOptions[0].id);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLElement | null>(null);
  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });
  const touchStateRef = useRef<
    | {
        mode: 'none';
      }
    | {
        mode: 'pan';
        startX: number;
        startY: number;
        originX: number;
        originY: number;
      }
    | {
        mode: 'pinch';
        startDistance: number;
        startZoom: number;
        worldX: number;
        worldY: number;
      }
  >({ mode: 'none' });
  const suppressClickRef = useRef(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  const selectedMap = useMemo(
    () => mindMapOptions.find((map) => map.id === selectedMapId) ?? mindMapOptions[0],
    [selectedMapId]
  );

  const { positionedNodes, connectorPaths, width, height } = useMemo(
    () => buildLayout(selectedMap.tree, expandedNodeIds),
    [expandedNodeIds, selectedMap]
  );
  const frameWidth = Math.max(width + 2 * PADDING_X, 980);
  const scaledWidth = Math.ceil(frameWidth * zoom);
  const scaledHeight = Math.ceil(height * zoom);
  const canvasWidth = Math.max(frameWidth, scaledWidth + Math.abs(Math.min(0, offset.x)));
  const canvasHeight = Math.max(height, scaledHeight + Math.abs(Math.min(0, offset.y)));

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      setViewportWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setExpandedNodeIds(new Set());
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [selectedMapId]);

  const fitToView = () => {
    if (!viewportWidth) {
      return;
    }

    const nextZoom = Math.min(1, viewportWidth / frameWidth);
    const boundedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    setZoom(Number(boundedZoom.toFixed(2)));
    setOffset({ x: 0, y: 0 });
  };

  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const applyZoomAtPoint = (nextZoomRaw: number, anchorX: number, anchorY: number) => {
    const boundedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoomRaw));

    if (boundedZoom === zoom) {
      return;
    }

    const worldX = (anchorX - offset.x) / zoom;
    const worldY = (anchorY - offset.y) / zoom;

    const nextOffsetX = Math.min(0, anchorX - worldX * boundedZoom);
    const nextOffsetY = Math.min(0, anchorY - worldY * boundedZoom);

    setZoom(Number(boundedZoom.toFixed(2)));
    setOffset({
      x: Number(nextOffsetX.toFixed(2)),
      y: Number(nextOffsetY.toFixed(2)),
    });
  };

  const zoomIn = () => {
    const anchorX = viewportWidth > 0 ? viewportWidth / 2 : frameWidth / 2;
    const anchorY = height / 2;
    applyZoomAtPoint(zoom + ZOOM_STEP, anchorX, anchorY);
  };

  const zoomOut = () => {
    const anchorX = viewportWidth > 0 ? viewportWidth / 2 : frameWidth / 2;
    const anchorY = height / 2;
    applyZoomAtPoint(zoom - ZOOM_STEP, anchorX, anchorY);
  };

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const bounds = surface.getBoundingClientRect();
      const anchorX = event.clientX - bounds.left;
      const anchorY = event.clientY - bounds.top;
      const direction = event.deltaY > 0 ? -1 : 1;

      applyZoomAtPoint(zoom + direction * ZOOM_STEP, anchorX, anchorY);
    };

    surface.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      surface.removeEventListener('wheel', onWheel);
    };
  }, [applyZoomAtPoint, zoom]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) {
      return;
    }

    const onTouchStart = (event: TouchEvent) => {
      if (!surfaceRef.current) {
        return;
      }

      if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchStateRef.current = {
          mode: 'pan',
          startX: touch.clientX,
          startY: touch.clientY,
          originX: offset.x,
          originY: offset.y,
        };
        setIsPanning(true);
        return;
      }

      if (event.touches.length === 2) {
        event.preventDefault();
        const bounds = surface.getBoundingClientRect();
        const touchA = event.touches[0];
        const touchB = event.touches[1];
        const pointA = { x: touchA.clientX, y: touchA.clientY };
        const pointB = { x: touchB.clientX, y: touchB.clientY };
        const centerClient = midpoint(pointA, pointB);
        const anchorX = centerClient.x - bounds.left;
        const anchorY = centerClient.y - bounds.top;

        touchStateRef.current = {
          mode: 'pinch',
          startDistance: distanceBetween(pointA, pointB),
          startZoom: zoom,
          worldX: (anchorX - offset.x) / zoom,
          worldY: (anchorY - offset.y) / zoom,
        };

        setIsPanning(true);
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!surfaceRef.current) {
        return;
      }

      const state = touchStateRef.current;
      if (state.mode === 'none') {
        return;
      }

      if (state.mode === 'pan' && event.touches.length === 1) {
        const touch = event.touches[0];
        const deltaX = touch.clientX - state.startX;
        const deltaY = touch.clientY - state.startY;

        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          suppressClickRef.current = true;
        }

        setOffset({
          x: Number((state.originX + deltaX).toFixed(2)),
          y: Number((state.originY + deltaY).toFixed(2)),
        });

        event.preventDefault();
        return;
      }

      if (state.mode === 'pinch' && event.touches.length === 2) {
        const bounds = surface.getBoundingClientRect();
        const touchA = event.touches[0];
        const touchB = event.touches[1];
        const pointA = { x: touchA.clientX, y: touchA.clientY };
        const pointB = { x: touchB.clientX, y: touchB.clientY };
        const nextDistance = distanceBetween(pointA, pointB);
        const scaleFactor = state.startDistance > 0 ? nextDistance / state.startDistance : 1;
        const nextZoomRaw = state.startZoom * scaleFactor;
        const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoomRaw));

        const centerClient = midpoint(pointA, pointB);
        const anchorX = centerClient.x - bounds.left;
        const anchorY = centerClient.y - bounds.top;

        const nextOffsetX = Number((anchorX - state.worldX * nextZoom).toFixed(2));
        const nextOffsetY = Number((anchorY - state.worldY * nextZoom).toFixed(2));

        setZoom(Number(nextZoom.toFixed(2)));
        setOffset({ x: nextOffsetX, y: nextOffsetY });

        suppressClickRef.current = true;
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length === 0) {
        touchStateRef.current = { mode: 'none' };
        setIsPanning(false);
        return;
      }

      if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchStateRef.current = {
          mode: 'pan',
          startX: touch.clientX,
          startY: touch.clientY,
          originX: offset.x,
          originY: offset.y,
        };
        setIsPanning(true);
      }
    };

    surface.addEventListener('touchstart', onTouchStart, { passive: false });
    surface.addEventListener('touchmove', onTouchMove, { passive: false });
    surface.addEventListener('touchend', onTouchEnd, { passive: false });
    surface.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      surface.removeEventListener('touchstart', onTouchStart);
      surface.removeEventListener('touchmove', onTouchMove);
      surface.removeEventListener('touchend', onTouchEnd);
      surface.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [offset.x, offset.y, zoom]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState.active) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        suppressClickRef.current = true;
      }

      setOffset({
        x: Number((dragState.originX + deltaX).toFixed(2)),
        y: Number((dragState.originY + deltaY).toFixed(2)),
      });
    };

    const onMouseUp = () => {
      if (!dragStateRef.current.active) {
        return;
      }

      dragStateRef.current.active = false;
      setIsPanning(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const startPanning = (event: ReactMouseEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };

    setIsPanning(true);
  };

  const toggleNode = (node: MindMapNode) => {
    if (!hasChildren(node)) {
      return;
    }

    setExpandedNodeIds((previous) => {
      const next = new Set(previous);

      if (next.has(node.id)) {
        next.delete(node.id);
        collectDescendantIds(node).forEach((descendantId) => next.delete(descendantId));
      } else {
        next.add(node.id);
      }

      return next;
    });
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mind Maps</h1>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-secondary !h-9 px-3" onClick={fitToView}>
              Fit to view
            </button>
            <button type="button" className="btn btn-secondary !h-9 px-3" onClick={resetZoom}>
              100%
            </button>
            <button
              type="button"
              className="btn btn-secondary !h-9 w-9 px-0"
              onClick={zoomOut}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="inline-flex h-9 min-w-[3.5rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="btn btn-secondary !h-9 w-9 px-0"
              onClick={zoomIn}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {mindMapOptions.map((map) => {
            const isSelected = map.id === selectedMapId;
            return (
              <button
                key={map.id}
                type="button"
                onClick={() => setSelectedMapId(map.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  isSelected
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {map.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-200">
          Click a box with an arrow to expand into the next level of sub-topics.
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
          Tip: use mouse wheel to zoom at cursor, click-drag to pan, or pinch on touch devices.
        </p>
      </div>

      <div ref={viewportRef} className="pb-2">
        <section
          ref={surfaceRef}
          onMouseDown={startPanning}
          className={`inline-block rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-xl select-none ${
            isPanning ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          <svg
            width={canvasWidth}
            height={canvasHeight}
            className="block"
            aria-label="Copilot Studio drill-down map"
          >
            <defs>
              <filter id="helpGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="0 0 0 0 0.45  0 0 0 0 0.55  0 0 0 0 1  0 0 0 0.9 0"
                  result="coloredBlur"
                />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
              {connectorPaths.map((path) => (
                <path
                  key={path.id}
                  d={path.d}
                  fill="none"
                  stroke="rgba(165, 180, 252, 0.78)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              ))}

              {positionedNodes.map((entry) => {
                const expandable = hasChildren(entry.node);
                const isExpanded = expandedNodeIds.has(entry.id);
                const isRoot = entry.depth === 0;
                const nodeWidth = getNodeWidth(entry.depth);
                const x = entry.x;
                const y = entry.y - NODE_HEIGHT / 2;
                const maxTextWidth = nodeWidth - TEXT_PADDING_X - RIGHT_ICON_SPACE;
                const maxCharsPerLine = Math.max(6, Math.floor(maxTextWidth / AVG_CHAR_WIDTH));
                const labelLines = wrapLabel(entry.node.label, maxCharsPerLine, MAX_LABEL_LINES);
                const lineHeight = 18;
                const textStartY = NODE_HEIGHT / 2 - ((labelLines.length - 1) * lineHeight) / 2;

                const rectFill = isRoot
                  ? 'rgba(99, 102, 241, 0.26)'
                  : isExpanded
                    ? 'rgba(6, 78, 59, 0.64)'
                    : expandable
                      ? 'rgba(51, 65, 85, 0.9)'
                      : 'rgba(30, 41, 59, 0.92)';

                const rectStroke = isRoot
                  ? 'rgba(99, 102, 241, 0.8)'
                  : isExpanded
                    ? 'rgba(52, 211, 153, 0.85)'
                    : 'rgba(100, 116, 139, 0.9)';

                const onNodeClick = () => {
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }

                  if (expandable) {
                    toggleNode(entry.node);
                  }
                };

                const onHelpClick = (event: ReactMouseEvent<SVGGElement>) => {
                  event.stopPropagation();
                  const targetUrl = entry.node.learnUrl;
                  if (!targetUrl) {
                    return;
                  }
                  window.open(targetUrl, '_blank', 'noopener,noreferrer');
                };

                return (
                  <g
                    key={entry.id}
                    transform={`translate(${x}, ${y})`}
                    onClick={onNodeClick}
                    className={expandable ? 'cursor-pointer' : ''}
                  >
                    {entry.node.learnUrl && (
                      <title>{`Microsoft Learn: ${entry.node.learnUrl}`}</title>
                    )}
                    <rect
                      x={0}
                      y={0}
                      width={nodeWidth}
                      height={NODE_HEIGHT}
                      rx={12}
                      fill={rectFill}
                      stroke={rectStroke}
                      strokeWidth={1.4}
                    />

                    {!isRoot && entry.node.learnUrl && (
                      <g onClick={onHelpClick} className="cursor-pointer">
                        <circle
                          cx={-11}
                          cy={NODE_HEIGHT / 2}
                          r={8.5}
                          fill="rgba(15, 23, 42, 1)"
                          stroke="rgba(148, 163, 184, 0.75)"
                          strokeWidth={1.2}
                          filter="url(#helpGlow)"
                        />
                        <text
                          x={-11}
                          y={NODE_HEIGHT / 2 + 0.5}
                          fill="rgb(226 232 240)"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={16}
                          fontWeight={700}
                        >
                          ?
                        </text>
                      </g>
                    )}

                    <text
                      x={TEXT_PADDING_X}
                      y={textStartY}
                      fill={isRoot ? 'rgb(224 231 255)' : 'rgb(241 245 249)'}
                      fontSize={16}
                      fontWeight={600}
                      dominantBaseline="middle"
                    >
                      {labelLines.map((line, index) => (
                        <tspan key={line + index} x={TEXT_PADDING_X} y={textStartY + index * lineHeight}>
                          {line}
                        </tspan>
                      ))}
                    </text>

                    {isRoot && entry.node.learnUrl && (
                      <g onClick={onHelpClick} className="cursor-pointer">
                        <circle
                          cx={-11}
                          cy={NODE_HEIGHT / 2}
                          r={10}
                          fill="rgba(15, 23, 42, 1)"
                          stroke="rgba(199, 210, 254, 0.8)"
                          strokeWidth={1.2}
                          filter="url(#helpGlow)"
                        />
                        <text
                          x={-11}
                          y={NODE_HEIGHT / 2 + 0.5}
                          fill="rgb(224 231 255)"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={18}
                          fontWeight={700}
                        >
                          ?
                        </text>
                      </g>
                    )}

                    {(expandable || isRoot) && (
                      <g>
                        <circle
                          cx={nodeWidth - 22}
                          cy={NODE_HEIGHT / 2}
                          r={10}
                          fill="rgba(15, 23, 42, 1)"
                          stroke={isRoot ? 'rgba(199, 210, 254, 0.8)' : 'rgba(148, 163, 184, 0.75)'}
                          strokeWidth={1.2}
                        />
                        <text
                          x={nodeWidth - 22}
                          y={NODE_HEIGHT / 2 + 0.5}
                          fill={isRoot ? 'rgb(224 231 255)' : 'rgb(226 232 240)'}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={15}
                          fontWeight={700}
                        >
                          {isExpanded ? '−' : '›'}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </section>
      </div>
    </div>
  );
}
