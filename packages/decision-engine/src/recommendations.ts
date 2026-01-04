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
    ],
    scoringResult,
  };
}

function generateHybridRecommendation(scoringResult: ScoringResult): Recommendation {
  return {
    type: 'HYBRID',
    title: 'Hybrid Approach (Multiple Platforms)',
    summary:
      'For this scenario, combining multiple Microsoft agentic platforms provides the best outcome. Deploy Microsoft 365 Copilot for broad productivity, Copilot Studio for custom agents, Microsoft Foundry for advanced AI development, and Agent Builder for simple knowledge-base bots. This hybrid approach is common—organizations use different platforms for different scenarios based on complexity, audience, and requirements.',
    reasons: [
      'You need both broad productivity enhancements AND custom business process automation',
      'Your organization has diverse needs: general knowledge workers and specialized roles',
      'You want immediate value from out-of-the-box capabilities plus long-term custom solutions',
      'Your data spans Microsoft 365 content and line-of-business systems',
      'Copilot Studio agents can be published to M365 Copilot and Teams for seamless user experience',
      'You have mixed audiences: internal employees and external customers or partners',
      'You want to balance time-to-value (M365 Copilot) with tailored experiences (Copilot Studio)',
      'Your budget supports per-user licensing for broad deployment plus targeted custom agents',
    ],
    nextSteps: [
      'Phase 1: Deploy Microsoft 365 Copilot organization-wide to deliver immediate productivity benefits',
      'Ensure foundational governance is in place: permissions, DLP, sensitivity labels, compliance policies',
      'Phase 2: Review the Copilot Studio implementation guide to plan your custom agent strategy',
      'Identify high-value use cases for custom agents (e.g., customer support, HR automation, sales processes)',
      'Set up Power Platform environment for Copilot Studio development with appropriate governance',
      'Build and pilot custom agents with Copilot Studio for specific departments or processes',
      'Phase 3: Evaluate Microsoft Foundry for advanced AI scenarios requiring pro-code development or custom model fine-tuning',
      'Consider Agent Builder for rapid deployment of simple knowledge-base Q&A agents without custom development',
      'Publish Copilot Studio agents to Microsoft 365 Copilot and Teams for unified user experience',
      'Configure cross-product integration: ensure agents published to M365 Copilot respect tenant permissions and compliance',
      'Monitor usage and ROI for M365 Copilot (via Copilot Dashboard), Copilot Studio agents (via analytics), and Foundry applications (via Application Insights)',
      'Iterate and expand: scale successful agents and identify new automation opportunities across all platforms',
    ],
    risks: [
      'Complexity of managing two platforms—ensure clear governance and ownership boundaries',
      'Higher total cost: per-user M365 Copilot licenses PLUS Copilot Studio capacity or usage costs',
      'Requires diverse skillsets: end-user adoption for M365 Copilot AND low-code/dev skills for Copilot Studio',
      'Risk of fragmented user experience if not designed cohesively—plan integration touchpoints',
      'Both platforms require separate governance, monitoring, and compliance strategies',
      'Change management complexity: training users on two different Copilot experiences',
      'Data boundaries between M365 and external systems must be carefully managed to prevent leakage',
    ],
    complianceConsiderations: [
      'Data Residency: M365 Copilot respects M365 tenant residency; Copilot Studio respects Power Platform environment regions. CRITICAL: If Copilot Studio agents enable web search, Bing API routes to US data centers only—organizations with EU Data Boundary or strict sovereignty requirements must disable web search.',
      'Dual Compliance Frameworks: Both products support HIPAA (M365 BAA + Power Platform BAA) and other regulatory requirements. Ensure PHI/PII flows only through compliant paths and storage.',
      'Licensing Complexity: M365 Copilot ($30/user/month for Enterprise) + Copilot Studio consumption. M365 Copilot licensed users get zero-rated Copilot Studio usage when using Graph grounding in Teams/SharePoint.',
      'Governance Separation: M365 Copilot governed via M365 admin center; Copilot Studio governed via Power Platform admin center. Coordinate DLP policies, permissions, and audit strategies across both.',
      'Integration Points: Declarative agents built in Copilot Studio can extend M365 Copilot. Ensure data classification and access controls are consistent across both platforms to prevent data leakage.',
    ],
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
    ],
    scoringResult,
  };
}
