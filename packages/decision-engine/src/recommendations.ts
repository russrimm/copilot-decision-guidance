import type { Recommendation, ScoringResult } from './types.js';

/**
 * Generate recommendation content based on scoring result
 * This provides the static rationale, next steps, and risks
 */
export function generateRecommendation(scoringResult: ScoringResult): Recommendation {
  const { recommendation } = scoringResult;

  switch (recommendation) {
    case 'M365_COPILOT':
      return generateM365CopilotRecommendation(scoringResult);
    case 'COPILOT_STUDIO':
      return generateCopilotStudioRecommendation(scoringResult);
    case 'FOUNDRY':
      return generateFoundryRecommendation(scoringResult);
    case 'AGENT_BUILDER':
      return generateAgentBuilderRecommendation(scoringResult);
    case 'HYBRID':
      return generateHybridRecommendation(scoringResult);
    default:
      // This should never happen, but provides a fallback
      console.error(`Unknown recommendation type: ${recommendation}`);
      return generateHybridRecommendation(scoringResult);
  }
}

function generateM365CopilotRecommendation(scoringResult: ScoringResult): Recommendation {
  return {
    type: 'M365_COPILOT',
    title: 'Microsoft 365 Copilot',
    summary:
      'For this scenario, Microsoft 365 Copilot is the best fit. It provides immediate productivity benefits across Microsoft 365 apps with built-in AI assistance for drafting, summarizing, and searching your organizational content. Note: Most organizations use different platforms for different needs—M365 Copilot (for personal productivity), Copilot Studio (for custom agents), Microsoft Foundry (for pro-code AI applications), or Agent Builder (for simple knowledge-base bots).',
    reasons: [
      'Your primary focus is on enhancing personal productivity within Microsoft 365 applications',
      'You need out-of-the-box capabilities that work immediately with minimal configuration',
      'Your users primarily work with Microsoft 365 content (emails, documents, Teams chats)',
      'You want to empower all knowledge workers with AI-powered productivity tools',
      'You need enterprise-grade security and compliance built-in with Microsoft 365',
      'Your timeline requires immediate time-to-value without custom development',
    ],
    nextSteps: [
      'Review Microsoft 365 Copilot licensing requirements and ensure eligible base licenses (Microsoft 365 E3/E5 or Business Standard/Premium)',
      'Plan your rollout strategy: pilot with a small group before organization-wide deployment',
      'Ensure Microsoft 365 data governance is in place (permissions, sensitivity labels, DLP policies)',
      'Review and configure Copilot settings in Microsoft 365 admin center',
      'Prepare change management and training materials for end users',
      'Set up usage monitoring with Microsoft Copilot Dashboard and Viva Insights',
      'Establish feedback channels to track adoption and identify improvement areas',
      'Consider Copilot Studio for custom agents or Microsoft Foundry for advanced AI if M365 Copilot capabilities are insufficient for specialized scenarios',
    ],
    risks: [
      'Users may receive suggestions based on content they have permission to access—ensure Microsoft 365 permissions are correctly configured',
      'AI-generated content may contain inaccuracies or "hallucinations"—users should review outputs critically',
      'Oversharing risk: Users might inadvertently expose sensitive information if permissions are too broad',
      'Requires user training and change management to drive adoption and effective use',
      'Limited to Microsoft 365 ecosystem—does not extend to custom business processes or external systems',
      'Per-user licensing cost may be significant at organization scale—plan budget accordingly',
    ],
    complianceConsiderations: [
      "Data Residency: Microsoft 365 Copilot respects your tenant's Microsoft 365 data residency commitments. Data processing occurs within your committed geography (EU Data Boundary compliant for EU customers).",
      'HIPAA Compliance: Covered under Microsoft 365 HIPAA Business Associate Agreement (BAA). Suitable for healthcare organizations handling PHI when proper controls are in place.',
      'Data Privacy: Prompts, responses, and data accessed through Microsoft Graph are NOT used to train foundation LLMs. Your organizational data remains private.',
      'Licensing: Requires Microsoft 365 E3/E5 or Business Standard/Premium base license plus Microsoft 365 Copilot add-on ($30/user/month for Enterprise).',
      'GCC/Government: Available in GCC, GCC-High, and DoD environments with specific feature sets and compliance certifications.',
      'AI Compliance Resources: Access comprehensive compliance documentation at https://servicetrust.microsoft.com/viewpage/AIResources including: ISO 42001 Audit Report (March 2025), GDPR & Generative AI Guide (May 2024), Risk Assessment Quickstart (Aug 2025), Managing Risk in Financial Services (Nov 2025), Works Council Adoption Guide (April 2025), and Transcription Management controls (March 2025).',
    ],
    sources: [
      {
        title: 'Microsoft 365 Copilot Overview',
        url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-overview',
      },
      {
        title: 'Microsoft 365 Copilot Licensing',
        url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-licensing',
      },
      {
        title: 'Data, Privacy, and Security for Microsoft 365 Copilot',
        url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-privacy',
      },
      {
        title: 'Get Started with Microsoft 365 Copilot',
        url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-app-overview',
      },
      {
        title: 'Copilot Studio Implementation Guide',
        url: 'https://aka.ms/copilotstudioimplementationguide',
      },
      {
        title: 'Copilot Studio API Decision Guide (Deployment Options)',
        url: 'https://microsoft.github.io/mcscatblog/posts/copilot-studio-api-decision-guide/',
      },
      {
        title: 'Copilot and Agents Spotlight (Training)',
        url: 'https://adoption.microsoft.com/en-us/customer-hub/copilot-and-agents-spotlight/',
      },
      {
        title: 'Microsoft AI Decision Framework',
        url: 'https://microsoft.github.io/Microsoft-AI-Decision-Framework/',
      },
    ],
    scoringResult,
  };
}

function generateCopilotStudioRecommendation(scoringResult: ScoringResult): Recommendation {
  return {
    type: 'COPILOT_STUDIO',
    title: 'Copilot Studio',
    summary:
      'For this scenario, Copilot Studio is the best fit. Build custom agents with specialized workflows, integrate with line-of-business systems, and deliver tailored experiences. Deploy agents to multiple channels including Microsoft 365 Copilot, Microsoft Teams, websites, or custom endpoints. Note: Most organizations use different platforms for different needs—M365 Copilot (for personal productivity), Copilot Studio (for custom agents and workflows), Microsoft Foundry (for pro-code AI development), or Agent Builder (for simple Q&A bots).',
    reasons: [
      'You need to build custom agents or chatbots for specific business processes',
      'Your scenario requires integration with line-of-business systems beyond Microsoft 365',
      'You need multi-step workflows, orchestration, or event-driven automation',
      'Your audience includes external customers or requires custom deployment channels',
      'Agents can be deployed to Microsoft 365 Copilot, Teams, websites, or custom endpoints',
      'You have low-code or developer skills available to build and maintain the solution',
      'You require advanced governance, lifecycle management, and environment strategies',
      'You want to leverage Power Platform connectors (1000+ prebuilt connectors available)',
    ],
    nextSteps: [
      'Review the Copilot Studio implementation guide for planning, architecture, and best practices',
      'Identify your licensing path: Microsoft 365 Copilot license (for M365 integration), standalone Copilot Studio subscription, or pay-as-you-go',
      'Decide on deployment channels: Microsoft 365 Copilot, Microsoft Teams, website embed, or custom endpoints',
      'Set up Power Platform environment and configure governance policies in Power Platform admin center',
      'Define your agent use cases and map out workflows, data sources, and integration points',
      'Design your agent conversation flow and identify required connectors (standard or premium)',
      'Build a prototype in Copilot Studio using the visual designer or agent templates',
      'If deploying to M365 Copilot or Teams, configure agent settings for Microsoft 365 integration',
      'Test your agent with a pilot group and iterate based on feedback',
      'Implement monitoring and analytics to track agent performance and usage across channels',
      'Plan for ongoing maintenance, updates, and lifecycle management',
      'Consider Microsoft Foundry (Azure AI Foundry) if you need advanced pro-code capabilities, custom model fine-tuning, or complex orchestration beyond Copilot Studio',
    ],
    risks: [
      'Requires low-code or development skills—plan for training or hiring appropriate talent',
      'Longer time to value compared to out-of-the-box solutions—expect weeks to months for custom builds',
      'Connector governance is critical—ensure only authorized systems are accessible',
      'Usage-based or capacity-based licensing model requires monitoring and budgeting for Copilot Credits',
      'Custom agents need ongoing maintenance, updates, and monitoring',
      'Complexity increases with multi-step workflows and external integrations—plan for robust testing',
      'Data loss prevention (DLP) policies must be configured to prevent unauthorized data access',
    ],
    complianceConsiderations: [
      'Data Residency: Copilot Studio respects Power Platform environment regions. CRITICAL: If "Allow web search" is enabled in agent settings, queries route to Bing API hosted ONLY in US data centers—organizations with strict data sovereignty requirements (GDPR, EU Data Boundary) must disable web search or accept cross-region data flow.',
      'HIPAA Compliance: Covered under Power Platform HIPAA BAA. Healthcare organizations must ensure PHI only flows through HIPAA-compliant connectors and storage. Disable web search for PHI-related queries.',
      'Licensing: Included with M365 Copilot license when agents are used in M365/Teams/SharePoint with Graph grounding (zero-rated). Standalone use or premium connectors incur Copilot Credits consumption.',
      'Connector Compliance: Premium connectors (SAP, Salesforce, etc.) may have additional licensing and compliance requirements. Custom connectors calling external APIs must be evaluated for data residency.',
      'Environment Governance: Use ALM (Application Lifecycle Management) with dev/test/prod environments. Apply DLP policies at environment level to prevent unauthorized data access.',
      'AI Compliance Resources: Access comprehensive compliance documentation at https://servicetrust.microsoft.com/viewpage/AIResources including: ISO 42001 Audit Report (March 2025), GDPR & Generative AI Guide (May 2024), Risk Assessment Quickstart (Aug 2025), Managing Risk in Financial Services (Nov 2025), Works Council Adoption Guide (April 2025), and Transcription Management controls (March 2025).',
    ],
    sources: [
      {
        title: 'Copilot Studio Overview',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio',
      },
      {
        title: 'Choose between Microsoft 365 Copilot and Copilot Studio',
        url: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/copilot-studio-experience',
      },
      {
        title: 'Power Platform Connectors',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/advanced-connectors',
      },
      {
        title: 'Copilot Studio Licensing',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/billing-licensing',
      },
      {
        title: 'Extend Capabilities with Agents',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/copilot-connectors-in-copilot-studio',
      },
      {
        title: 'Copilot Studio Implementation Guide',
        url: 'https://aka.ms/copilotstudioimplementationguide',
      },
      {
        title: 'Copilot Studio API Decision Guide (Deployment Options)',
        url: 'https://microsoft.github.io/mcscatblog/posts/copilot-studio-api-decision-guide/',
      },
      {
        title: 'Copilot and Agents Spotlight (Training)',
        url: 'https://adoption.microsoft.com/en-us/customer-hub/copilot-and-agents-spotlight/',
      },
      {
        title: 'Microsoft AI Decision Framework',
        url: 'https://microsoft.github.io/Microsoft-AI-Decision-Framework/',
      },
    ],
    scoringResult,
  };
}

function generateFoundryRecommendation(scoringResult: ScoringResult): Recommendation {
  return {
    type: 'FOUNDRY',
    title: 'Microsoft Foundry (formerly Azure AI Foundry)',
    summary:
      'For this scenario, Microsoft Foundry is the best fit. This full-stack AI development platform provides comprehensive tools for building, evaluating, and deploying custom AI applications with advanced capabilities including fine-tuning, custom model deployment, and complex orchestration. Foundry is ideal for organizations with pro-code development teams and sophisticated AI requirements beyond low-code/no-code tools.',
    reasons: [
      'You require advanced pro-code development capabilities with SDKs (Python, .NET, JavaScript)',
      'Your scenario involves custom model fine-tuning, model evaluation, or deploying proprietary AI models',
      'You need complete control over AI orchestration, prompt engineering, and response quality',
      'Your team has professional developers and data scientists experienced with AI/ML workflows',
      'You require advanced features like Prompt Flow, content safety evaluations, and custom deployment targets',
      'Your solution demands sophisticated RAG patterns with vector databases and semantic indexing',
      'You need integration with Azure services (Cognitive Search, OpenAI, Document Intelligence, Storage)',
      'Your organization requires enterprise-grade MLOps practices with versioning, A/B testing, and CI/CD',
    ],
    nextSteps: [
      'Review Azure AI Foundry documentation and architecture to understand platform capabilities',
      'Set up an Azure subscription with appropriate resource groups and governance policies',
      'Create an Azure AI Foundry hub and project in your target region (consider data residency requirements)',
      'Configure Azure OpenAI Service or provision custom model deployments as needed',
      'Set up development environment with Foundry SDKs (Python recommended for full feature coverage)',
      'Design your AI application architecture: orchestration flows, data sources, model endpoints',
      'Implement Prompt Flow for orchestration or use SDKs directly for programmatic control',
      'Configure vector databases (Azure AI Search, Cosmos DB, PostgreSQL) for RAG scenarios',
      'Implement content safety filters and evaluation flows to ensure quality and compliance',
      'Set up monitoring with Application Insights and Azure Monitor for observability',
      'Establish MLOps pipelines for continuous evaluation, testing, and deployment',
      'Plan for production scaling: managed online endpoints, autoscaling, and cost optimization',
    ],
    risks: [
      'Requires significant development expertise—data scientists, AI engineers, and cloud architects',
      'Longer time to value compared to low-code solutions—expect months for production-ready implementations',
      'Higher operational complexity: managing infrastructure, model versions, deployments, and monitoring',
      'Cost management critical: pay-as-you-go pricing for compute, storage, and model consumption requires budgeting',
      'Security and compliance entirely managed by your development team—no built-in guardrails like low-code tools',
      'Custom AI models and fine-tuning require significant data preparation, labeling, and validation',
      'Integration complexity with existing systems may require custom connectors and middleware',
      'Ongoing maintenance burden: keeping up with SDK updates, model versions, and Azure service changes',
    ],
    complianceConsiderations: [
      'Data Residency: Azure AI Foundry deployments respect Azure region selection. Deploy resources in compliant regions (EU, US Government, etc.). CRITICAL: Some Azure OpenAI models available only in specific regions—verify model availability before deployment.',
      'HIPAA Compliance: Azure AI services support HIPAA compliance via Business Associate Agreement (BAA). Configure appropriate storage (Azure Storage with encryption) and ensure all data flows through HIPAA-compliant services.',
      'Data Privacy: Custom training data stored in your Azure subscription is NOT used to train foundation models. Implement encryption at rest and in transit for all data stores.',
      "Model Fine-Tuning: Custom fine-tuning uses your organization's data exclusively. Ensure data classification, access controls, and audit logging meet regulatory requirements.",
      'Responsible AI: Implement content safety filters, red team testing, and evaluation flows. Use Azure AI Content Safety service to detect harmful content, jailbreak attempts, and protected material.',
      'Government Clouds: Azure AI Foundry available in Azure Government (GCC-High, DoD) with FedRAMP High, DISA IL5, and CJIS compliance certifications.',
      'AI Compliance Resources: Access comprehensive compliance documentation at https://servicetrust.microsoft.com/viewpage/AIResources including: Azure OpenAI Privacy Impact Assessment (2024), ISO/IEC 30107-3 Face Liveness Detection (April 2025), GDPR & Generative AI Guide (May 2024), and ISO 42001 controls for AI management systems.',
    ],
    sources: [
      {
        title: 'What is Azure AI Foundry?',
        url: 'https://learn.microsoft.com/en-us/azure/ai-studio/what-is-ai-studio',
      },
      {
        title: 'Azure AI Foundry SDKs and Tools',
        url: 'https://learn.microsoft.com/en-us/azure/ai-studio/how-to/develop/sdk-overview',
      },
      {
        title: 'Prompt Flow in Azure AI Foundry',
        url: 'https://learn.microsoft.com/en-us/azure/ai-studio/how-to/prompt-flow',
      },
      {
        title: 'Model Fine-Tuning and Deployment',
        url: 'https://learn.microsoft.com/en-us/azure/ai-studio/how-to/fine-tune-model-llama',
      },
      {
        title: 'Azure AI Foundry Security and Compliance',
        url: 'https://learn.microsoft.com/en-us/azure/ai-studio/concepts/security',
      },
      {
        title: 'Power CAT Agent Platform Advisor',
        url: 'https://microsoft.github.io/powercat/agent-platform-advisor/',
      },
      {
        title: 'Copilot and Agents Spotlight (Training)',
        url: 'https://adoption.microsoft.com/en-us/customer-hub/copilot-and-agents-spotlight/',
      },
      {
        title: 'Microsoft AI Decision Framework',
        url: 'https://microsoft.github.io/Microsoft-AI-Decision-Framework/',
      },
    ],
    scoringResult,
  };
}

function generateAgentBuilderRecommendation(scoringResult: ScoringResult): Recommendation {
  return {
    type: 'AGENT_BUILDER',
    title: 'Agent Builder (Lightweight Q&A Agents in Copilot Studio)',
    summary:
      'For this scenario, Agent Builder is the best fit. This lightweight, guided experience within Copilot Studio enables rapid creation of simple Q&A agents based on knowledge bases (SharePoint, websites, files). Agent Builder is ideal for subject matter experts and business users who need quick-to-deploy conversational agents without complex workflows or integrations. Note: For more advanced scenarios, consider Copilot Studio (custom workflows), Microsoft Foundry (pro-code AI development), or M365 Copilot (broad productivity). Agents can be published to Microsoft Teams, websites, or other channels.',
    reasons: [
      'Your primary need is a simple knowledge-base Q&A agent with straightforward question-answering',
      'Subject matter experts or business users (not developers) will create and maintain the agent',
      'You have existing knowledge sources: SharePoint sites, public websites, PDF documents, or FAQs',
      'Time to value is critical—need deployment within days, not weeks',
      'Your audience needs conversational access to information without complex multi-step workflows',
      'You want a no-code experience with minimal technical expertise required',
      "Your use case doesn't require integrations with line-of-business systems or external APIs",
      'You need deployment to Microsoft Teams, websites, or other channels with minimal configuration',
    ],
    nextSteps: [
      'Access Agent Builder in Copilot Studio (https://copilotstudio.microsoft.com)',
      'Prepare your knowledge sources: organize SharePoint libraries, public URLs, or upload documents',
      'Use the guided Agent Builder wizard to create your agent and connect knowledge bases',
      'Configure agent name, description, instructions, and suggested prompts for users',
      'Test your agent in the built-in test canvas with sample questions from end users',
      'Review agent responses and refine knowledge sources if gaps identified',
      'Publish agent to target channel: Microsoft Teams, website embed, or custom endpoint',
      'Configure agent security: who can access, authentication requirements, and data permissions',
      'Share agent with pilot users and gather feedback on response quality and coverage',
      'Monitor agent analytics: usage, top topics, satisfaction scores, and escalation rates',
      'Iterate on knowledge base: add missing content, improve existing answers, and update regularly',
      'Consider upgrading to full Copilot Studio if you need complex workflows, integrations, or Power Automate flows',
      'Evaluate Microsoft Foundry (Azure AI Foundry) if you require advanced pro-code development, custom models, or sophisticated AI orchestration',
    ],
    risks: [
      'Limited to Q&A scenarios—cannot handle complex workflows, multi-step processes, or API integrations',
      'Knowledge base quality directly impacts agent effectiveness—requires well-structured, accurate content',
      'Agent may provide incorrect or incomplete answers if knowledge base has gaps or ambiguities',
      'No orchestration or conditional logic—cannot route to different actions based on user intent',
      'Scaling limitations for high-volume or complex enterprise scenarios',
      'Requires ongoing content maintenance to keep agent responses accurate and up-to-date',
      'Usage-based licensing: Copilot Credits consumption applies based on message volume and channels',
      'Limited customization compared to full Copilot Studio—cannot add custom connectors or code',
    ],
    complianceConsiderations: [
      'Data Residency: Agent Builder agents respect Power Platform environment regions. CRITICAL: If knowledge base sources are SharePoint or OneDrive, data residency follows Microsoft 365 tenant configuration. Web sources may be hosted outside your region.',
      'Knowledge Base Security: Agents inherit permissions from source systems. SharePoint agents respect document permissions—users only receive answers from content they can access. Ensure permissions configured correctly to prevent oversharing.',
      'HIPAA Compliance: Covered under Power Platform HIPAA BAA if knowledge base stored in compliant storage (SharePoint with BAA). Do NOT use public websites or non-compliant sources for PHI.',
      'Licensing: Included with Microsoft 365 Copilot license when agents deployed to Teams/M365 with Graph grounding (zero-rated). Standalone use or non-M365 channels consume Copilot Credits.',
      'Data Privacy: Knowledge base content indexed by agent uses Azure OpenAI embeddings. This data is NOT used to train foundation models. Vector embeddings stored in Power Platform environment.',
      'Web Search: If "Allow web search" enabled, agent queries route to Bing API (US data centers only). Disable for strict data sovereignty compliance.',
      'AI Compliance Resources: Access comprehensive compliance documentation at https://servicetrust.microsoft.com/viewpage/AIResources including: ISO 42001 Audit Report (March 2025), GDPR & Generative AI Guide (May 2024), Risk Assessment Quickstart (Aug 2025), Managing Risk in Financial Services (Nov 2025), and agent governance controls.',
    ],
    sources: [
      {
        title: 'Create a Copilot with Agent Builder',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/nlu-gpt-quickstart',
      },
      {
        title: 'Use Knowledge Sources in Copilot Studio',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/nlu-boost-conversations',
      },
      {
        title: 'Publish Your Agent to Channels',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/publication-fundamentals-publish-channels',
      },
      {
        title: 'Copilot Studio Analytics',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/analytics-overview',
      },
      {
        title: 'Security and Governance for Copilot Studio',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/security-and-governance',
      },
      {
        title: 'Power CAT Agent Platform Advisor',
        url: 'https://microsoft.github.io/powercat/agent-platform-advisor/',
      },
      {
        title: 'Copilot and Agents Spotlight (Training)',
        url: 'https://adoption.microsoft.com/en-us/customer-hub/copilot-and-agents-spotlight/',
      },
      {
        title: 'Microsoft AI Decision Framework',
        url: 'https://microsoft.github.io/Microsoft-AI-Decision-Framework/',
      },
    ],
    scoringResult,
  };
}

function generateHybridRecommendation(scoringResult: ScoringResult): Recommendation {
  const scores = scoringResult.scores;

  // Determine which platforms scored competitively (within threshold of top score)
  const maxScore = Math.max(
    scores.m365Copilot,
    scores.copilotStudio,
    scores.foundry,
    scores.agentBuilder
  );
  const threshold = 15; // Platforms within 15 points of max are considered "competitive"

  const competitivePlatforms = {
    m365: scores.m365Copilot >= maxScore - threshold,
    studio: scores.copilotStudio >= maxScore - threshold,
    foundry: scores.foundry >= maxScore - threshold,
    agentBuilder: scores.agentBuilder >= maxScore - threshold,
  };

  // Check for Foundry vs Studio overlap
  const foundryStudioOverlap =
    competitivePlatforms.foundry &&
    competitivePlatforms.studio &&
    Math.abs(scores.foundry - scores.copilotStudio) < 10;

  // Build dynamic summary listing competitive platforms
  const competitivePlatformNames: string[] = [];
  if (competitivePlatforms.m365) competitivePlatformNames.push('Microsoft 365 Copilot');
  if (competitivePlatforms.studio) competitivePlatformNames.push('Copilot Studio');
  if (competitivePlatforms.foundry) competitivePlatformNames.push('Microsoft Foundry');
  if (competitivePlatforms.agentBuilder) competitivePlatformNames.push('Agent Builder');

  const platformList =
    competitivePlatformNames.length > 1
      ? competitivePlatformNames.slice(0, -1).join(', ') +
        ' and ' +
        competitivePlatformNames[competitivePlatformNames.length - 1]
      : competitivePlatformNames[0] || 'multiple platforms';

  const summaryText =
    competitivePlatformNames.length > 1
      ? `For this scenario, combining ${platformList} provides the best outcome. This hybrid approach is common—organizations use different platforms for different scenarios based on complexity, audience, and requirements. Your scoring indicates multiple viable paths forward.`
      : `For this scenario, ${platformList} is recommended, though your requirements span multiple capability areas. This hybrid scoring indicates you may benefit from multiple platforms as your needs evolve. Consider starting with ${platformList} and expanding to additional platforms based on specific use cases.`;

  return {
    type: 'HYBRID',
    title: 'Hybrid Approach (Multiple Platforms)',
    summary: summaryText,
    reasons: [
      'Your requirements span multiple capability areas, making a single platform insufficient',
      'You need both broad productivity enhancements (M365 Copilot) AND custom business process automation (Copilot Studio/Foundry)',
      'Your organization has diverse needs: general knowledge workers, makers, and professional developers',
      'You want immediate value from out-of-the-box capabilities plus long-term custom solutions',
      'Your data spans Microsoft 365 content, line-of-business systems, and custom data sources',
      competitivePlatforms.m365 && competitivePlatforms.studio
        ? 'Copilot Studio agents can be published to M365 Copilot and Teams for seamless user experience'
        : null,
      'You have mixed audiences: internal employees and potentially external customers or partners',
      'Your budget supports per-user licensing for broad deployment plus targeted custom solutions',
      foundryStudioOverlap
        ? '⚠️ OVERLAP AREA: Copilot Studio vs Microsoft Foundry - Both scored competitively for your scenario. See "Key Decision Points" below for guidance on choosing between them.'
        : null,
    ].filter(Boolean) as string[],
    nextSteps: [
      competitivePlatforms.m365
        ? 'Phase 1: Deploy Microsoft 365 Copilot organization-wide to deliver immediate productivity benefits ($30/user/month)'
        : null,
      'Ensure foundational governance is in place: permissions, DLP, sensitivity labels, compliance policies',
      competitivePlatforms.studio || foundryStudioOverlap
        ? 'Phase 2A (Low-code path): Use Copilot Studio for custom agents with no-code/low-code development'
        : null,
      competitivePlatforms.studio
        ? '  ✓ Best for: Makers, citizen developers, rapid prototyping, 1000+ prebuilt connectors'
        : null,
      competitivePlatforms.studio
        ? '  ✓ Licensing: Zero-rated when M365 Copilot users access Studio agents in Teams/SharePoint'
        : null,
      foundryStudioOverlap
        ? '  ⚠️ Or Phase 2B (Pro-code path): Use Microsoft Foundry for full-stack AI development with code'
        : competitivePlatforms.foundry
          ? 'Phase 2B: Use Microsoft Foundry for advanced AI scenarios requiring pro-code development'
          : null,
      competitivePlatforms.foundry
        ? '  ✓ Best for: Pro developers, custom model fine-tuning, complex orchestration, multi-agent systems'
        : null,
      competitivePlatforms.foundry
        ? '  ✓ Licensing: Azure consumption (pay-as-you-go), PTU for reserved capacity'
        : null,
      foundryStudioOverlap
        ? '  💡 DECISION FACTORS (Studio vs Foundry): Choose Studio if you prioritize speed-to-market, have limited dev resources, need Power Platform integration. Choose Foundry if you need custom models, complex AI workflows, full infrastructure control, or are building AI-first products.'
        : null,
      competitivePlatforms.agentBuilder
        ? 'Phase 3 (Optional): Use Agent Builder for rapid deployment of simple knowledge-base Q&A agents'
        : null,
      competitivePlatforms.studio
        ? 'Publish Copilot Studio agents to Microsoft 365 Copilot and Teams for unified user experience'
        : null,
      'Configure cross-product integration: ensure agents respect tenant permissions and compliance across platforms',
      'Monitor usage and ROI: M365 Copilot Dashboard, Copilot Studio analytics, Azure Application Insights (Foundry)',
      'Establish center of excellence (CoE) to manage governance, best practices, and platform selection criteria',
      'Iterate and expand: scale successful agents and identify new automation opportunities across all platforms',
    ].filter(Boolean) as string[],
    risks: [
      'Complexity of managing multiple platforms—ensure clear governance and ownership boundaries',
      'Higher total cost: M365 Copilot licenses + Copilot Studio capacity + Azure Foundry consumption',
      'Requires diverse skillsets: end-user adoption (M365), low-code skills (Studio), pro-code development (Foundry)',
      'Risk of fragmented user experience if not designed cohesively—plan integration touchpoints',
      'Each platform requires separate governance, monitoring, and compliance strategies',
      'Change management complexity: training users on multiple experiences and knowing when to use each',
      'Data boundaries between M365, Power Platform, and Azure must be carefully managed to prevent leakage',
      foundryStudioOverlap
        ? '⚠️ Platform overlap risk: Without clear decision criteria, teams may build the same capability on multiple platforms. Define when to use Studio vs Foundry early.'
        : null,
      competitivePlatforms.foundry
        ? 'Foundry requires significant infrastructure setup, DevOps pipelines, and ongoing platform management'
        : null,
    ].filter(Boolean) as string[],
    keyDecisionPoints: foundryStudioOverlap
      ? [
          {
            question: 'Copilot Studio vs Microsoft Foundry - Which to Choose?',
            context:
              'Both platforms scored competitively for your scenario, indicating overlap in capabilities. They both support custom agent development, multi-turn conversations, and integration with enterprise data. Here is how to decide:',
            factors: [
              {
                factor: 'Development Approach',
                studio: 'No-code/low-code canvas with visual design tools',
                foundry: 'Pro-code with Python/C# SDKs, Jupyter notebooks, VS Code',
              },
              {
                factor: 'Target Developer Persona',
                studio: 'Citizen developers, makers, business analysts',
                foundry: 'Professional developers, data scientists, AI engineers',
              },
              {
                factor: 'Speed to Market',
                studio: 'Fastest—publish agents in hours/days with minimal code',
                foundry: 'Slower—requires development, testing, deployment pipelines (weeks)',
              },
              {
                factor: 'Custom Model Control',
                studio: 'Uses Microsoft-managed Azure OpenAI models (GPT-4, GPT-4o)',
                foundry:
                  'Full control: fine-tune models, use custom models, adjust hyperparameters',
              },
              {
                factor: 'Orchestration Patterns',
                studio: 'Built-in topics, Power Automate flows, prebuilt connectors',
                foundry: 'Custom orchestration with Semantic Kernel, LangChain, Prompt Flow',
              },
              {
                factor: 'Data Integration',
                studio: '1000+ prebuilt connectors (Power Platform), Dataverse, SharePoint',
                foundry: 'Custom connectors via code, direct database access, Azure services',
              },
              {
                factor: 'RAG (Retrieval-Augmented Generation)',
                studio: 'Built-in knowledge base search (SharePoint, websites, files)',
                foundry:
                  'Full control: Azure AI Search, custom embeddings, vector stores, chunking strategies',
              },
              {
                factor: 'Deployment Channels',
                studio: 'Teams, SharePoint, M365 Copilot, web chat, custom websites, WhatsApp',
                foundry: 'Custom applications, APIs, web apps (requires code integration)',
              },
              {
                factor: 'Licensing Model',
                studio:
                  'Included usage for eligible M365 Copilot employee-facing contexts (fair usage limits); otherwise Copilot Credits model (Pay-As-You-Go, capacity pack, Copilot Credit P3, Microsoft Agent P3)',
                foundry: 'Azure consumption (pay-as-you-go) or Provisioned Throughput Units (PTU)',
              },
              {
                factor: 'Infrastructure Control',
                studio: 'Fully managed—no infrastructure to manage',
                foundry: 'Full control: VNet integration, private endpoints, custom networking',
              },
              {
                factor: 'Multi-Agent Systems',
                studio: 'Agent-to-agent handoffs (preview), limited orchestration',
                foundry: 'Full multi-agent orchestration (AutoGen, Semantic Kernel patterns)',
              },
              {
                factor: 'Compliance & Data Residency',
                studio: 'Inherits Power Platform compliance, data residency',
                foundry: 'Full control over data residency, custom compliance implementations',
              },
            ],
            recommendation:
              '**Choose Copilot Studio if:** You prioritize speed, have limited development resources, need Power Platform integration, want to empower citizen developers, require 1000+ prebuilt connectors, or need zero-rated licensing when deploying to M365 Copilot users.\n\n**Choose Microsoft Foundry if:** You need custom model fine-tuning, require full infrastructure control (VNet, private endpoints), are building AI-first products, need complex multi-agent orchestration, have professional development teams, or require advanced RAG customization.\n\n**Use Both if:** Deploy Studio for rapid, low-code agents for common scenarios AND Foundry for complex, custom AI applications requiring full control. Many enterprises use Studio for 80% of use cases (speed) and Foundry for the remaining 20% (complexity).',
          },
        ]
      : undefined,
    complianceConsiderations: [
      'Data Residency: M365 Copilot respects M365 tenant residency; Copilot Studio respects Power Platform environment regions; Foundry respects Azure region selection. CRITICAL: If Copilot Studio agents enable web search, Bing API routes to US data centers only—organizations with EU Data Boundary or strict sovereignty requirements must disable web search.',
      'Multi-Platform Compliance: All platforms support HIPAA (M365 BAA + Power Platform BAA + Azure BAA) and other regulatory requirements. Ensure PHI/PII flows only through compliant paths and storage.',
      'Governance Separation: M365 Copilot governed via M365 admin center; Copilot Studio governed via Power Platform admin center; Foundry governed via Azure Portal. Coordinate DLP policies, permissions, and audit strategies across all platforms.',
      'Integration Points: Declarative agents built in Copilot Studio can extend M365 Copilot. Ensure data classification and access controls are consistent across all platforms to prevent data leakage.',
      competitivePlatforms.foundry
        ? 'Foundry Data Isolation: Foundry projects can be configured with VNet integration and private endpoints for complete network isolation. Data processed in Foundry does NOT leave your Azure subscription unless explicitly configured.'
        : null,
      'AI Compliance Resources: Access comprehensive compliance documentation at https://servicetrust.microsoft.com/viewpage/AIResources including: ISO 42001 Audit Report for M365 Copilot (March 2025), GDPR & Generative AI Guide (May 2024), Risk Assessment Quickstart (Aug 2025), Managing Risk in Financial Services (Nov 2025), Works Council Adoption Guide (April 2025), and unified governance controls across platforms.',
    ].filter(Boolean) as string[],
    licensingBreakdown: {
      description:
        'Hybrid approach licensing is complex because each platform has different pricing models. Here is how to estimate total cost:',
      platforms: [
        competitivePlatforms.m365
          ? {
              platform: 'Microsoft 365 Copilot',
              model: 'Per-user subscription',
              cost: '$30/user/month (Microsoft 365 Copilot for Enterprise)',
              notes:
                'Required for broad productivity deployment. Includes zero-rated access to Copilot Studio agents when accessed via M365 Copilot, Teams, or SharePoint.',
              example: '1000 users × $30 = $30,000/month (baseline for productivity)',
            }
          : null,
        competitivePlatforms.studio || foundryStudioOverlap
          ? {
              platform: 'Copilot Studio',
              model: 'Copilot Credits model (Pay-As-You-Go, capacity pack, pre-purchase plans)',
              cost: 'Usage measured in Copilot Credits; capacity pack includes 25,000 Copilot Credits per pack',
              notes:
                'Employee-facing usage for M365 Copilot licensed users can be included (subject to fair usage). Standalone use, external channels (web, WhatsApp), or non-M365-licensed usage typically consume Copilot Credits.',
              example:
                'Custom HR agent used by non-M365 licensed users on web channels consumes Copilot Credits. The same agent used by eligible M365 Copilot users in internal M365 contexts may be covered by included usage (fair usage limits apply).',
            }
          : null,
        competitivePlatforms.foundry || foundryStudioOverlap
          ? {
              platform: 'Microsoft Foundry (Azure AI Foundry)',
              model: 'Azure consumption (pay-as-you-go) OR Provisioned Throughput Units (PTU)',
              cost: 'Variable: Azure OpenAI token pricing ($0.03-$0.12/1k tokens depending on model) + infrastructure (compute, storage, networking)',
              notes:
                'Cost depends on model choice (GPT-4, GPT-4o, custom), usage volume, and infrastructure footprint. PTU ($6.50/hour/100k tokens) recommended for predictable high-volume workloads.',
              example:
                'Custom AI application with 1M GPT-4o tokens/month = ~$60/month (tokens) + $200/month (App Service, AI Search, storage) = $260/month total. High-volume scenarios with PTU = $4,680/month (PTU) + infrastructure.',
            }
          : null,
        competitivePlatforms.agentBuilder
          ? {
              platform: 'Agent Builder',
              model: 'Included with Copilot Studio licensing',
              cost: 'No separate license SKU—uses Copilot Studio Copilot Credits model for applicable scenarios',
              notes:
                'Same zero-rated benefit as Copilot Studio when accessed by M365 Copilot users in Teams/SharePoint.',
              example:
                'Simple FAQ agent in internal M365 contexts can be covered by included usage; external/standalone usage consumes Copilot Credits.',
            }
          : null,
      ].filter(Boolean),
      totalCostExample: `**Example Hybrid Deployment Cost:**\n${competitivePlatforms.m365 ? '- M365 Copilot: 1000 users × $30 = $30,000/month\n' : ''}${competitivePlatforms.studio ? '- Copilot Studio: 20,000 external messages = $200/month\n' : ''}${competitivePlatforms.foundry ? '- Foundry: 2 custom AI apps @ $500/month each = $1,000/month\n' : ''}${competitivePlatforms.agentBuilder ? '- Agent Builder: Included in Studio consumption\n' : ''}\n**Total: $${(competitivePlatforms.m365 ? 30000 : 0) + (competitivePlatforms.studio ? 200 : 0) + (competitivePlatforms.foundry ? 1000 : 0)}/month**\n\n💡 **Cost Optimization Tips:**\n- Maximize zero-rated Studio usage by publishing agents to M365 Copilot for licensed users\n- Use Agent Builder for simple knowledge-base scenarios to avoid custom development costs\n${competitivePlatforms.foundry ? '- Use Foundry PTU for high-volume, predictable workloads to reduce per-token costs\n' : ''}- Monitor usage across all platforms with Azure Cost Management and Power Platform admin analytics`,
    },
    sources: [
      {
        title: 'Microsoft 365 Copilot Overview',
        url: 'https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-overview',
      },
      {
        title: 'Copilot Studio Overview',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/fundamentals-what-is-copilot-studio',
      },
      {
        title: 'What is Azure AI Foundry (Microsoft Foundry)?',
        url: 'https://learn.microsoft.com/en-us/azure/ai-studio/what-is-ai-studio',
      },
      {
        title: 'Choose between Microsoft 365 Copilot and Copilot Studio',
        url: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/copilot-studio-experience',
      },
      {
        title: 'Extend Microsoft 365 Copilot with Copilot Studio Agents',
        url: 'https://learn.microsoft.com/en-us/microsoft-copilot-studio/microsoft-copilot-extend-copilot-extensions',
      },
      {
        title: 'Microsoft 365 Copilot Extensibility',
        url: 'https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/',
      },
      {
        title: 'Copilot Studio Implementation Guide',
        url: 'https://aka.ms/copilotstudioimplementationguide',
      },
      {
        title: 'Copilot and Agents Spotlight (Training)',
        url: 'https://adoption.microsoft.com/en-us/customer-hub/copilot-and-agents-spotlight/',
      },
      {
        title: 'Microsoft AI Decision Framework',
        url: 'https://microsoft.github.io/Microsoft-AI-Decision-Framework/',
      },
    ],
    scoringResult,
  };
}
