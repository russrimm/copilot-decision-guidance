/**
 * Generate recommendation content based on scoring result
 * This provides the static rationale, next steps, and risks
 */
export function generateRecommendation(scoringResult) {
    const { recommendation } = scoringResult;
    switch (recommendation) {
        case 'M365_COPILOT':
            return generateM365CopilotRecommendation(scoringResult);
        case 'COPILOT_STUDIO':
            return generateCopilotStudioRecommendation(scoringResult);
        case 'HYBRID':
            return generateHybridRecommendation(scoringResult);
    }
}
function generateM365CopilotRecommendation(scoringResult) {
    return {
        type: 'M365_COPILOT',
        title: 'Microsoft 365 Copilot',
        summary: 'For this scenario, Microsoft 365 Copilot is the best fit. It provides immediate productivity benefits across Microsoft 365 apps with built-in AI assistance for drafting, summarizing, and searching your organizational content. Note: Most organizations deploy both M365 Copilot (for broad productivity) and Copilot Studio (for specialized agents) based on different use cases.',
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
function generateCopilotStudioRecommendation(scoringResult) {
    return {
        type: 'COPILOT_STUDIO',
        title: 'Copilot Studio',
        summary: 'For this scenario, Copilot Studio is the best fit. Build custom agents with specialized workflows, integrate with line-of-business systems, and deliver tailored experiences. Deploy agents to multiple channels including Microsoft 365 Copilot, Microsoft Teams, websites, or custom endpoints. Note: Most organizations use both M365 Copilot (for productivity) and Copilot Studio (for custom agents) based on different requirements.',
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
function generateHybridRecommendation(scoringResult) {
    return {
        type: 'HYBRID',
        title: 'Hybrid Approach (Microsoft 365 Copilot + Copilot Studio)',
        summary: 'For this scenario, both Microsoft 365 Copilot and Copilot Studio working together provide the best outcome. Deploy M365 Copilot for broad productivity gains, while building custom Copilot Studio agents for specialized processes. Copilot Studio agents can be published to M365 Copilot and Teams, creating a unified experience. This hybrid approach is common—organizations typically use M365 Copilot organization-wide and Copilot Studio for targeted use cases.',
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
            'Publish Copilot Studio agents to Microsoft 365 Copilot and Teams for unified user experience',
            'Configure cross-product integration: ensure agents published to M365 Copilot respect tenant permissions and compliance',
            'Monitor usage and ROI for both M365 Copilot (via Microsoft Copilot Dashboard) and Copilot Studio agents (via analytics)',
            'Iterate and expand: scale successful agents and identify new automation opportunities',
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
