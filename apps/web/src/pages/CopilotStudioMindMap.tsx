import {
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
  label: 'Microsoft Copilot Studio',
  learnUrl:
    'https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio',
  children: [
    {
      id: 'agent-design-authoring',
      label: 'Agent Design & Authoring',
      learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-overview',
      children: [
        {
          id: 'choose-harness',
          label: 'Choose a Harness',
          learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/harnesses-overview',
          children: [
            {
              id: 'harness-github-copilot',
              label: 'GitHub Copilot Harness',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/overview',
            },
            {
              id: 'harness-standard',
              label: 'Standard Harness',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/switch-experiences',
            },
            {
              id: 'harness-copilot-chat',
              label: 'Copilot Chat Harness',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/microsoft-365-copilot-extend-with-agents',
            },
          ],
        },
        {
          id: 'agent-authoring',
          label: 'Agent Authoring',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/build-overview',
          children: [
            {
              id: 'agent-instructions',
              label: 'Instructions & Descriptions',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-instructions',
            },
            {
              id: 'agent-templates',
              label: 'Agent Templates',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/template-fundamentals',
            },
            {
              id: 'agent-test-panel',
              label: 'Test Your Agent',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-test-bot',
            },
          ],
        },
        {
          id: 'topics-conversation',
          label: 'Topics & Conversation Design',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-create-edit-topics',
          children: [
            {
              id: 'topic-triggers',
              label: 'Topic Trigger Phrases',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-triggers',
            },
            {
              id: 'multilingual-agents',
              label: 'Multilingual Agents',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/multilingual',
            },
            {
              id: 'adaptive-cards',
              label: 'Adaptive Cards',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/adaptive-cards-overview',
            },
          ],
        },
      ],
    },
    {
      id: 'orchestration-triggers',
      label: 'Orchestration & Triggers',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-copilot-studio/extend-agent-capabilities',
      children: [
        {
          id: 'generative-orchestration',
          label: 'Generative Orchestration',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-generative-actions',
          children: [
            {
              id: 'orch-classic-topics',
              label: 'Classic Topic Orchestration',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-topic-management',
            },
            {
              id: 'orch-generative-answers',
              label: 'Generative Answers Node',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/nlu-boost-node',
            },
            {
              id: 'orch-faq',
              label: 'Orchestration FAQ',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/faqs-generative-orchestration',
            },
          ],
        },
        {
          id: 'event-triggers',
          label: 'Event Triggers (Autonomous)',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-triggers-about',
          children: [
            {
              id: 'trigger-add-event',
              label: 'Scheduled & Record Triggers',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-trigger-event',
            },
            {
              id: 'trigger-quotas',
              label: 'Quotas & Throttling',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-quotas',
            },
          ],
        },
        {
          id: 'model-selection',
          label: 'Model Selection',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-select-agent-model',
          children: [
            {
              id: 'model-external',
              label: 'External Foundry Model',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-select-external-response-model',
            },
            {
              id: 'model-reasoning',
              label: 'Deep Reasoning (preview)',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-reasoning-models',
            },
            {
              id: 'model-retired',
              label: 'Retired Model Guidance',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-retired-model',
            },
          ],
        },
      ],
    },
    {
      id: 'knowledge-grounding',
      label: 'Knowledge & Grounding',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-studio',
      children: [
        {
          id: 'knowledge-sources',
          label: 'Knowledge Sources',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/knowledge-sources-overview',
          children: [
            {
              id: 'knowledge-public-websites',
              label: 'Public Websites',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-public-website',
            },
            {
              id: 'knowledge-sharepoint',
              label: 'SharePoint',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-sharepoint',
            },
            {
              id: 'knowledge-dataverse',
              label: 'Dataverse Tables',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-dataverse',
            },
            {
              id: 'knowledge-file-upload',
              label: 'File Uploads',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-add-file-upload',
            },
          ],
        },
        {
          id: 'enterprise-grounding',
          label: 'Enterprise Grounding',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-graph-vs-power-platform-connectors',
          children: [
            {
              id: 'grounding-copilot-connectors',
              label: 'Copilot Connectors (Graph)',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-copilot-connectors',
            },
            {
              id: 'grounding-power-platform',
              label: 'Power Platform Connectors (preview)',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-real-time-connectors',
            },
            {
              id: 'grounding-azure-ai-search',
              label: 'Azure AI Search',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-azure-ai-search',
            },
          ],
        },
        {
          id: 'answer-quality',
          label: 'Answer Quality & Controls',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/nlu-generative-answers-prompt-modification',
          children: [
            {
              id: 'knowledge-unstructured',
              label: 'Unstructured Data Sources',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-unstructured-data',
            },
            {
              id: 'grounding-bing-search',
              label: 'Bing Custom Search',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-bing-custom-search',
            },
            {
              id: 'knowledge-testing',
              label: 'Test Knowledge Sources',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/knowledge-test',
            },
          ],
        },
      ],
    },
    {
      id: 'tools-actions',
      label: 'Tools & Actions',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/tools-available',
      children: [
        {
          id: 'tool-types',
          label: 'Tool Types',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-tools-custom-agent',
          children: [
            {
              id: 'tools-connectors',
              label: 'Connectors as Tools',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-connectors',
            },
            {
              id: 'tools-agent-flows',
              label: 'Agent Flows as Tools',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-flow',
            },
            {
              id: 'tools-prompts',
              label: 'Prompts as Tools',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/prompts-overview',
            },
          ],
        },
        {
          id: 'open-extensibility',
          label: 'Open Extensibility',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-mcp',
          children: [
            {
              id: 'tools-mcp-servers',
              label: 'Connect an MCP Server',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/mcp-add-existing-server-to-agent',
            },
            {
              id: 'tools-rest-api',
              label: 'REST API Tools (preview)',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agent-extend-action-rest-api',
            },
            {
              id: 'tools-http-requests',
              label: 'HTTP Requests',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-http-node',
            },
          ],
        },
        {
          id: 'computer-use-automation',
          label: 'Computer Use & Automation',
          learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/computer-use',
          children: [
            {
              id: 'computer-use-supervision',
              label: 'Human Supervision',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/human-supervision-computer-use',
            },
            {
              id: 'computer-use-admin',
              label: 'Administer Computer Use',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/administer-computer-use',
            },
            {
              id: 'azure-bot-service-skills',
              label: 'Azure Bot Service Skills',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-use-skills',
            },
          ],
        },
      ],
    },
    {
      id: 'multi-agent-handoff',
      label: 'Multi-agent & Handoff',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-add-other-agents',
      children: [
        {
          id: 'connected-agents',
          label: 'Connected Agents',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/authoring-add-other-agents',
          children: [
            {
              id: 'agent-child',
              label: 'Child Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-agent-child-agent',
            },
            {
              id: 'agent-copilot-studio',
              label: 'Other Copilot Studio Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-agent-copilot-studio-agent',
            },
            {
              id: 'agent-foundry',
              label: 'Microsoft Foundry Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-agent-foundry-agent',
            },
          ],
        },
        {
          id: 'open-agent-protocols',
          label: 'Open Agent Protocols',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-agent-agent-to-agent',
          children: [
            {
              id: 'agent-m365-sdk',
              label: 'Microsoft 365 Agents SDK',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-agent-microsoft-365-agents-sdk-agent',
            },
            {
              id: 'agent-fabric-data',
              label: 'Fabric Data Agents (preview)',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-agent-fabric-data-agent',
            },
            {
              id: 'agent-work-iq',
              label: 'Work IQ (preview)',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/add-work-iq',
            },
          ],
        },
        {
          id: 'human-handoff',
          label: 'Human Handoff',
          learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-hand-off',
          children: [
            {
              id: 'handoff-contact-center',
              label: 'Dynamics 365 Handoff',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-hand-off-omnichannel',
            },
            {
              id: 'handoff-generic-hub',
              label: 'Generic Engagement Hub',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-generic-handoff',
            },
            {
              id: 'handoff-engagement',
              label: 'Customer Engagement Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/customer-copilot-overview',
            },
          ],
        },
      ],
    },
    {
      id: 'publish-channels',
      label: 'Publish & Channels',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-fundamentals-publish-channels',
      children: [
        {
          id: 'm365-surfaces',
          label: 'Teams & Microsoft 365 Copilot',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-microsoft-teams',
          children: [
            {
              id: 'channel-sharepoint',
              label: 'SharePoint',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-sharepoint',
            },
            {
              id: 'channel-power-pages',
              label: 'Power Pages',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-power-pages',
            },
            {
              id: 'channel-proactive-teams',
              label: 'Proactive Teams Messages',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-proactive-message',
            },
          ],
        },
        {
          id: 'web-custom-channels',
          label: 'Web & Custom Channels',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-connect-bot-to-web-channels',
          children: [
            {
              id: 'channel-agents-sdk',
              label: 'Custom Apps (Agents SDK)',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-integrate-web-or-native-app-m365-agents-sdk',
            },
            {
              id: 'channel-mobile-apps',
              label: 'Mobile & Custom Apps',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-connect-bot-to-custom-application',
            },
            {
              id: 'channel-whatsapp',
              label: 'WhatsApp',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-add-bot-to-whatsapp',
            },
          ],
        },
        {
          id: 'voice-telephony',
          label: 'Voice & Telephony',
          learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-overview',
          children: [
            {
              id: 'voice-realtime',
              label: 'Real-time Voice Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-realtime-voice-agents',
            },
            {
              id: 'voice-basic',
              label: 'Basic Voice Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-basic-overview',
            },
            {
              id: 'voice-contact-center',
              label: 'Dynamics 365 Contact Center',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/voice-get-started',
            },
          ],
        },
      ],
    },
    {
      id: 'security-governance',
      label: 'Security & Governance',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-copilot-studio/security-and-governance',
      children: [
        {
          id: 'security-data-policies',
          label: 'Data Policies (DLP)',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-data-loss-prevention',
          children: [
            {
              id: 'runtime-protection',
              label: 'Agent Runtime Protection',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/security-agent-runtime-view',
            },
            {
              id: 'security-scan',
              label: 'Automatic Security Scan',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/security-scan',
            },
            {
              id: 'external-threat-detection',
              label: 'Threat Detection (preview)',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/external-security-provider',
            },
          ],
        },
        {
          id: 'identity-authentication',
          label: 'Identity & Authentication',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-end-user-authentication',
          children: [
            {
              id: 'auth-entra-id',
              label: 'Microsoft Entra ID Auth',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/configuration-authentication-azure-ad',
            },
            {
              id: 'auth-sso',
              label: 'Single Sign-on',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/configure-sso',
            },
            {
              id: 'entra-agent-id',
              label: 'Entra Agent ID',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-use-entra-agent-identities',
            },
          ],
        },
        {
          id: 'admin-compliance',
          label: 'Admin & Compliance',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-agent-inventory',
          children: [
            {
              id: 'purview-audit-logs',
              label: 'Microsoft Purview Audit',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-logging-copilot-studio',
            },
            {
              id: 'cmk-support',
              label: 'Customer-managed Keys',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/admin-customer-managed-keys',
            },
            {
              id: 'data-residency',
              label: 'Geographic Data Residency',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/geo-data-residency',
            },
          ],
        },
      ],
    },
    {
      id: 'alm-environments',
      label: 'ALM & Environments',
      learnUrl: 'https://learn.microsoft.com/en-us/power-platform/alm/basics-alm',
      children: [
        {
          id: 'solution-model',
          label: 'Solutions',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-solutions-overview',
          children: [
            {
              id: 'solution-export-import',
              label: 'Export & Import Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-solutions-import-export',
            },
            {
              id: 'component-collections',
              label: 'Reusable Components',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-export-import-copilot-components',
            },
            {
              id: 'solution-connections',
              label: 'Manage Connections',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/authoring-connections',
            },
          ],
        },
        {
          id: 'environment-strategy',
          label: 'Environment Strategy',
          learnUrl: 'https://learn.microsoft.com/en-us/power-platform/alm/environment-strategy-alm',
          children: [
            {
              id: 'environments-setup',
              label: 'Work with Environments',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/environments-first-run-experience',
            },
            {
              id: 'managed-environments',
              label: 'Managed Environments',
              learnUrl:
                'https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-overview',
            },
            {
              id: 'solution-pipelines',
              label: 'Power Platform Pipelines',
              learnUrl: 'https://learn.microsoft.com/en-us/power-platform/alm/pipelines',
            },
          ],
        },
        {
          id: 'pro-dev-workflow',
          label: 'Pro-dev Workflow',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/visual-studio-code-extension-overview',
          children: [
            {
              id: 'vs-code-clone',
              label: 'Clone Agent in VS Code',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/visual-studio-code-extension-clone-agent',
            },
            {
              id: 'vs-code-sync',
              label: 'Synchronize Changes',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/visual-studio-code-extension-synchronization',
            },
            {
              id: 'multitenant-agents',
              label: 'Multitenant Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/multi-tenant-overview',
            },
          ],
        },
      ],
    },
    {
      id: 'analytics-evaluation-cost',
      label: 'Analytics, Evaluation & Cost',
      learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-overview',
      children: [
        {
          id: 'analytics-telemetry',
          label: 'Analytics & Telemetry',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-improve-agent-effectiveness',
          children: [
            {
              id: 'analytics-autonomous',
              label: 'Autonomous Agent Health',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-improve-agent-health',
            },
            {
              id: 'app-insights',
              label: 'Application Insights',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/telemetry-overview',
            },
            {
              id: 'analytics-viva',
              label: 'Viva Insights Rollup',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-viva-insights',
            },
          ],
        },
        {
          id: 'evaluation-testing',
          label: 'Evaluation & Testing',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-intro',
          children: [
            {
              id: 'evaluation-test-sets',
              label: 'Create Test Sets',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-create',
            },
            {
              id: 'evaluation-methods',
              label: 'Evaluation Methods',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-overview',
            },
            {
              id: 'evaluation-automation',
              label: 'Automate via Platform API',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-agent-evaluation-rest-api',
            },
          ],
        },
        {
          id: 'licensing-consumption',
          label: 'Licensing & Consumption',
          learnUrl: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/billing-licensing',
          children: [
            {
              id: 'copilot-credits',
              label: 'Copilot Credits',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/agents-experience/billing-credit-overview',
            },
            {
              id: 'billing-rates',
              label: 'Billing Rates & Management',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management',
            },
            {
              id: 'consumption-reporting',
              label: 'Consumption & Savings',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-consumption',
            },
          ],
        },
      ],
    },
  ],
};

const m365CopilotTree: MindMapNode = {
  id: 'm365-copilot',
  label: 'Microsoft 365 Copilot',
  learnUrl:
    'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-overview',
  children: [
    {
      id: 'm365-experiences',
      label: 'Copilot Experiences',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-365-copilot/which-copilot-for-your-organization',
      children: [
        {
          id: 'm365-apps',
          label: 'Copilot in Microsoft 365 Apps',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-app-overview',
          children: [
            {
              id: 'm365-apps-agents',
              label: 'Word, Excel & PowerPoint',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/wordexcelppt-agents',
            },
            {
              id: 'm365-copilot-search',
              label: 'Microsoft Copilot Search',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-search',
            },
            {
              id: 'm365-prompt-gallery',
              label: 'Copilot Prompt Gallery',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-prompt-gallery',
            },
          ],
        },
        {
          id: 'm365-chat',
          label: 'Microsoft 365 Copilot Chat',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-chat-considerations',
          children: [
            {
              id: 'm365-chat-requirements',
              label: 'Chat Requirements',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-chat-requirements',
            },
            {
              id: 'm365-chat-harmful-content',
              label: 'Harmful Content Protection',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/harmful-content-protection-copilot-chat',
            },
            {
              id: 'm365-personalization-memory',
              label: 'Personalization & Memory',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-personalization-memory',
            },
          ],
        },
        {
          id: 'm365-agents',
          label: 'Agents in Microsoft 365',
          learnUrl: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-agent-store',
          children: [
            {
              id: 'm365-agents-researcher',
              label: 'Researcher Agent',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/researcher-agent',
            },
            {
              id: 'm365-agents-computer-use',
              label: 'Researcher Computer Use',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/researcher-agent-computer-use',
            },
            {
              id: 'm365-agents-install',
              label: 'Install Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-agent-install',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-grounding',
      label: 'Grounding & Data Sources',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-architecture',
      children: [
        {
          id: 'm365-graph-grounding',
          label: 'Microsoft Graph Grounding',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-privacy',
          children: [
            {
              id: 'm365-graph-permissions',
              label: 'Data Protection & Auditing',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-architecture-data-protection-auditing',
            },
            {
              id: 'm365-graph-sources',
              label: 'Enterprise Data Protection',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/enterprise-data-protection',
            },
          ],
        },
        {
          id: 'm365-sharepoint-onedrive',
          label: 'SharePoint & OneDrive',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-minimum-requirements-data-compliance',
          children: [
            {
              id: 'm365-sharepoint',
              label: 'SharePoint Advanced Mgmt',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/get-ready-copilot-sharepoint-advanced-management',
            },
            {
              id: 'm365-secure-foundation',
              label: 'Secure Data Foundation',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/configure-secure-governed-data-foundation-microsoft-365-copilot',
            },
          ],
        },
        {
          id: 'm365-connectors',
          label: 'Microsoft 365 Copilot Connectors',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-copilot-connector',
          children: [
            {
              id: 'm365-connectors-search-manage',
              label: 'Manage Copilot Search',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-search-manage',
            },
            {
              id: 'm365-connectors-search-admin',
              label: 'Search Admin Experience',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-search-admin-experience',
            },
          ],
        },
        {
          id: 'm365-web-access',
          label: 'Web Search & Public Data',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/manage-public-web-access',
          children: [
            {
              id: 'm365-endpoints-allowlist',
              label: 'Endpoint Allowlist',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/add-copilot-endpoints-allowlist',
            },
            {
              id: 'm365-network-requirements',
              label: 'App & Network Requirements',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-requirements',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-extensibility',
      label: 'Extensibility & APIs',
      learnUrl: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/manage-generative-ai-apps',
      children: [
        {
          id: 'm365-declarative-agents',
          label: 'Declarative Agents',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-declarative-agent',
          children: [
            {
              id: 'm365-agents-requested',
              label: 'Manage Requested Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/agent-lifecycle/agent-copilot-studio-requested',
            },
            {
              id: 'm365-agents-upload',
              label: 'Upload Custom Agents',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/agent-lifecycle/agent-upload-agents',
            },
            {
              id: 'm365-agents-marketplace',
              label: 'Submit to Marketplace',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/agent-policies/agent-submit-marketplace',
            },
          ],
        },
        {
          id: 'm365-custom-engine-agents',
          label: 'Custom Engine Agents',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-custom-engine-agent',
          children: [
            {
              id: 'm365-agents-sideload',
              label: 'Sideload for Personal Use',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/agent-policies/agent-sideload',
            },
            {
              id: 'm365-agents-deploy',
              label: 'Deploy an Agent',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/agent-lifecycle/agent-deploy',
            },
            {
              id: 'm365-agents-availability',
              label: 'Set Agent Availability',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/agent-lifecycle/agent-availability',
            },
          ],
        },
        {
          id: 'm365-copilot-apis',
          label: 'Copilot APIs',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/copilot-apis-overview',
          children: [
            {
              id: 'm365-business-applications',
              label: 'Business Applications',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/overview-business-applications',
            },
            {
              id: 'm365-agent-essentials',
              label: 'Agent Essentials',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/agent-essentials-overview',
            },
            {
              id: 'm365-agent-prerequisites',
              label: 'Agent Prerequisites',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/agent-prerequisites',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-security-compliance',
      label: 'Security, Privacy & Compliance',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-365-copilot/security-microsoft-365-copilot',
      children: [
        {
          id: 'm365-prompt-defense',
          label: 'Prompt Defense in Depth',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-prompt-defense-in-depth',
          children: [
            {
              id: 'm365-subprocessors',
              label: 'AI Subprocessors',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-subprocessor-overview',
            },
            {
              id: 'm365-ai-model-choice',
              label: 'AI Model Choice',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/ai-models-overview',
            },
            {
              id: 'm365-preview-models',
              label: 'Preview AI Models',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/manage-preview-ai-models',
            },
          ],
        },
        {
          id: 'm365-conditional-access',
          label: 'Identity & Access',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/multiple-account-access',
          children: [
            {
              id: 'm365-ai-provider-access',
              label: 'AI Provider Access Groups',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-ai-provider-user-sec-group-access',
            },
            {
              id: 'm365-optimize-settings',
              label: 'Optimize Configuration',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/optimize-microsoft-365-configuration-settings',
            },
          ],
        },
        {
          id: 'm365-responsible-ai',
          label: 'Responsible AI',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/responsible-ai/responsible-ai-overview',
          children: [
            {
              id: 'm365-application-card',
              label: 'Application Card',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-application-card',
            },
            {
              id: 'm365-ai-disclaimers',
              label: 'AI Disclaimers',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-ai-disclaimers',
            },
            {
              id: 'm365-watermarks',
              label: 'AI Content Watermarks',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/watermarks',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-admin-governance',
      label: 'Admin Controls & Governance',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-control-system/overview',
      children: [
        {
          id: 'm365-tenant-readiness',
          label: 'Tenant Readiness & Prereqs',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-minimum-requirements',
          children: [
            {
              id: 'm365-tenant-setup',
              label: 'Setup & Assign Licenses',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-setup',
            },
            {
              id: 'm365-tenant-rollout',
              label: 'Organization Rollout',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-minimum-requirements-rollout',
            },
            {
              id: 'm365-app-deploy',
              label: 'Deploy the Copilot App',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/deploy-microsoft-365-copilot-app',
            },
          ],
        },
        {
          id: 'm365-copilot-control-system',
          label: 'Copilot Control System',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-control-system/management-controls',
          children: [
            {
              id: 'm365-control-security',
              label: 'Security & Governance',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-control-system/security-governance',
            },
            {
              id: 'm365-control-measurement',
              label: 'Measurement & Reporting',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-control-system/measurement-reporting',
            },
            {
              id: 'm365-control-admin-settings',
              label: 'Copilot Admin Settings',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-app-admin-settings',
            },
          ],
        },
        {
          id: 'm365-agent-governance',
          label: 'Agent Governance',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/m365-agents-admin-guide',
          children: [
            {
              id: 'm365-agents-blueprint',
              label: 'Deployment Blueprint',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/m365-agents-blueprint',
            },
            {
              id: 'm365-agents-checklist',
              label: 'Deployment Checklist',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/m365-agents-checklist',
            },
            {
              id: 'm365-agents-faq',
              label: 'Agents FAQ',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/m365-agents-faq',
            },
          ],
        },
      ],
    },
    {
      id: 'm365-adoption-measurement',
      label: 'Adoption & Measurement',
      learnUrl:
        'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-enablement-resources',
      children: [
        {
          id: 'm365-usage-analytics',
          label: 'Reports & Insights',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-reports-for-admins',
          children: [
            {
              id: 'm365-agent-usage-reports',
              label: 'Agent Usage Reports',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/agent-essentials/agent-usage-billing/agent-usage-cs-reports',
            },
            {
              id: 'm365-service-plans',
              label: 'Service Plan Diagnostics',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-service-plans',
            },
            {
              id: 'm365-powerbi',
              label: 'Power BI Data in Copilot',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/copilot-powerbi-copilot-chat',
            },
          ],
        },
        {
          id: 'm365-licensing-cost',
          label: 'Licensing & Cost',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-licensing',
          children: [
            {
              id: 'm365-copilot-credits',
              label: 'Copilot Credits Billing',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/usage-based-billing-overview-copilot-credits',
            },
            {
              id: 'm365-pay-as-you-go',
              label: 'Pay-as-you-go',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/pay-as-you-go/overview',
            },
            {
              id: 'm365-capacity-packs',
              label: 'Prepaid Capacity Packs',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/pay-as-you-go/copilot-capacity-packs',
            },
          ],
        },
        {
          id: 'm365-change-management',
          label: 'Change Management',
          learnUrl:
            'https://learn.microsoft.com/en-us/microsoft-365-copilot/microsoft-365-copilot-enable-users',
          children: [
            {
              id: 'm365-track-adoption',
              label: 'Track Copilot Adoption',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/track-copilot-adoption',
            },
            {
              id: 'm365-organizational-prompts',
              label: 'Organizational Prompts',
              learnUrl:
                'https://learn.microsoft.com/en-us/microsoft-365-copilot/organizational-prompts',
            },
            {
              id: 'm365-release-notes',
              label: 'Release Notes',
              learnUrl: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/release-notes',
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
  learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/what-is-foundry',
  children: [
    {
      id: 'foundry-plan-build',
      label: 'Plan & Build',
      learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/concepts/choose-build-approach',
      children: [
        {
          id: 'foundry-projects',
          label: 'Projects & Resources',
          learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/how-to/create-projects',
          children: [
            {
              id: 'foundry-architecture',
              label: 'Service Architecture',
              learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/concepts/architecture',
            },
            {
              id: 'foundry-sdks',
              label: 'SDKs & Endpoints',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/how-to/develop/sdk-overview',
            },
            {
              id: 'foundry-quotas',
              label: 'Quotas & Limits',
              learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/how-to/quota',
            },
          ],
        },
        {
          id: 'foundry-agent-service',
          label: 'Foundry Agent Service',
          learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/agents/overview',
          children: [
            {
              id: 'foundry-agent-lifecycle',
              label: 'Development Lifecycle',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/development-lifecycle',
            },
            {
              id: 'foundry-agent-identity',
              label: 'Agent Identity',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/agent-identity',
            },
            {
              id: 'foundry-publish-m365',
              label: 'Publish to Microsoft 365',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/publish-copilot',
            },
          ],
        },
      ],
    },
    {
      id: 'foundry-model-catalog',
      label: 'Models & Deployment',
      learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/concepts/foundry-models-overview',
      children: [
        {
          id: 'foundry-model-choice',
          label: 'Model Selection',
          learnUrl:
            'https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure',
          children: [
            {
              id: 'foundry-partner-models',
              label: 'Partner & Community Models',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-from-partners',
            },
            {
              id: 'foundry-deployment-types',
              label: 'Deployment Types',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/concepts/deployments-overview',
            },
            {
              id: 'foundry-manage-costs',
              label: 'Plan & Manage Costs',
              learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/concepts/manage-costs',
            },
          ],
        },
      ],
    },
    {
      id: 'foundry-toolbox',
      label: 'Toolbox & Tools',
      learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/toolbox-overview',
      children: [
        {
          id: 'foundry-tool-types',
          label: 'Tool Types',
          learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/openapi',
          children: [
            {
              id: 'foundry-tool-file-search',
              label: 'File Search',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/file-search',
            },
            {
              id: 'foundry-tool-code-interpreter',
              label: 'Code Interpreter',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/code-interpreter',
            },
            {
              id: 'foundry-tool-ai-search',
              label: 'Azure AI Search',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/ai-search',
            },
          ],
        },
        {
          id: 'foundry-retrieval',
          label: 'Retrieval & Indexes (RAG)',
          learnUrl:
            'https://learn.microsoft.com/en-us/azure/foundry/concepts/retrieval-augmented-generation',
        },
        {
          id: 'foundry-tool-governance',
          label: 'Tool Governance',
          learnUrl:
            'https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/governance',
          children: [
            {
              id: 'foundry-tool-auth',
              label: 'Tool Authentication',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/tool-authentication',
            },
            {
              id: 'foundry-tool-skills',
              label: 'Skills (preview)',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/skills',
            },
          ],
        },
      ],
    },
    {
      id: 'foundry-observability',
      label: 'Observability & Evaluation',
      learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/concepts/observability',
      children: [
        {
          id: 'foundry-tracing',
          label: 'Agent Tracing',
          learnUrl:
            'https://learn.microsoft.com/en-us/azure/foundry/observability/concepts/trace-agent-concept',
        },
        {
          id: 'foundry-evaluation',
          label: 'Evaluate Agents',
          learnUrl:
            'https://learn.microsoft.com/en-us/azure/foundry/observability/how-to/evaluate-agent',
          children: [
            {
              id: 'foundry-built-in-evaluators',
              label: 'Built-in Evaluators',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/concepts/built-in-evaluators',
            },
            {
              id: 'foundry-red-teaming',
              label: 'AI Red Teaming',
              learnUrl:
                'https://learn.microsoft.com/en-us/azure/foundry/concepts/ai-red-teaming-agent',
            },
          ],
        },
      ],
    },
    {
      id: 'foundry-trust-governance',
      label: 'Trust, Safety & Governance',
      learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/responsible-use-of-ai-overview',
      children: [
        {
          id: 'foundry-guardrails',
          label: 'Guardrails & Controls',
          learnUrl:
            'https://learn.microsoft.com/en-us/azure/foundry/guardrails/guardrails-overview',
        },
        {
          id: 'foundry-control-plane',
          label: 'Govern at Scale',
          learnUrl: 'https://learn.microsoft.com/en-us/azure/foundry/control-plane/overview',
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
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
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

  const applyZoomAtPoint = useCallback(
    (nextZoomRaw: number, anchorX: number, anchorY: number) => {
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
    },
    [offset.x, offset.y, zoom]
  );

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
        setAnnouncement(`${node.label} collapsed`);
      } else {
        next.add(node.id);
        setAnnouncement(`${node.label} expanded`);
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
        <div
          className="mt-3 flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Mind maps"
        >
          {mindMapOptions.map((map) => {
            const isSelected = map.id === selectedMapId;
            return (
              <button
                key={map.id}
                type="button"
                onClick={() => setSelectedMapId(map.id)}
                role="tab"
                aria-selected={isSelected}
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
          Click a box with an arrow, or focus it and press Enter, to expand the next level.
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
          Tip: use mouse wheel to zoom at cursor, click-drag to pan, or pinch on touch devices.
        </p>
        <span className="sr-only" role="status" aria-live="polite">
          {announcement}
        </span>
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
            role="tree"
            aria-label={`${selectedMap.label} drill-down map`}
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

                const onHelpKeyDown = (event: ReactKeyboardEvent<SVGGElement>) => {
                  if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                  }
                  event.preventDefault();
                  event.stopPropagation();
                  if (entry.node.learnUrl) {
                    window.open(entry.node.learnUrl, '_blank', 'noopener,noreferrer');
                  }
                };

                const onNodeKeyDown = (event: ReactKeyboardEvent<SVGGElement>) => {
                  if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                  }
                  event.preventDefault();
                  if (expandable) {
                    toggleNode(entry.node);
                  } else if (entry.node.learnUrl) {
                    window.open(entry.node.learnUrl, '_blank', 'noopener,noreferrer');
                  }
                };

                return (
                  <g
                    key={entry.id}
                    transform={`translate(${x}, ${y})`}
                    onClick={onNodeClick}
                    onKeyDown={onNodeKeyDown}
                    onFocus={() => setFocusedNodeId(entry.id)}
                    onBlur={() => setFocusedNodeId(null)}
                    tabIndex={0}
                    role="treeitem"
                    aria-expanded={expandable ? isExpanded : undefined}
                    aria-label={`${entry.node.label}${
                      expandable ? `, ${isExpanded ? 'expanded' : 'collapsed'}` : ''
                    }${entry.node.learnUrl ? ', Microsoft Learn link available' : ''}`}
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
                      stroke={focusedNodeId === entry.id ? 'rgb(253 224 71)' : rectStroke}
                      strokeWidth={focusedNodeId === entry.id ? 3 : 1.4}
                    />

                    {!isRoot && entry.node.learnUrl && (
                      <g
                        onClick={onHelpClick}
                        onKeyDown={onHelpKeyDown}
                        tabIndex={0}
                        role="link"
                        aria-label={`Open Microsoft Learn documentation for ${entry.node.label}`}
                        className="cursor-pointer"
                      >
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
                        <tspan
                          key={line + index}
                          x={TEXT_PADDING_X}
                          y={textStartY + index * lineHeight}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>

                    {isRoot && entry.node.learnUrl && (
                      <g
                        onClick={onHelpClick}
                        onKeyDown={onHelpKeyDown}
                        tabIndex={0}
                        role="link"
                        aria-label={`Open Microsoft Learn documentation for ${entry.node.label}`}
                        className="cursor-pointer"
                      >
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
