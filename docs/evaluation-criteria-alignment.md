# Evaluation Criteria Alignment

This document maps the questionnaire in the Microsoft Agentic Solution Advisor to the [Microsoft AI Decision Framework Evaluation Criteria](https://microsoft.github.io/Microsoft-AI-Decision-Framework/docs/evaluation-criteria.html).

Last Updated: January 4, 2026

## Overview

The questionnaire is designed to be simple and straightforward while covering all critical evaluation criteria from the Microsoft AI Decision Framework. Each question group targets specific evaluation areas to ensure comprehensive platform assessment.

---

## Evaluation Criteria Coverage

### ✅ 1. Technical Complexity Assessment

**Framework Criteria:**

- Data sources (1 vs 5+)
- Workflow complexity (linear vs branching/parallel)
- Reasoning needs (simple lookup vs multi-step inference)
- Evaluation requirements (user feedback vs custom metrics)

**Questionnaire Coverage:**

| Question ID                 | Question                          | Coverage                                |
| --------------------------- | --------------------------------- | --------------------------------------- |
| `outcome_tasks`             | What types of tasks?              | Assistive vs action-oriented complexity |
| `data_sources`              | What data sources?                | M365, line-of-business, external APIs   |
| `integration_orchestration` | How complex is the orchestration? | Simple Q&A → multi-agent coordination   |
| `ttv_ai_requirements`       | What level of AI customization?   | Pre-built models → custom ML pipelines  |

**Result:** Fully covered with 4 questions addressing all complexity dimensions.

---

### ✅ 2. Skills & Resources

**Framework Criteria:**

- Makers (no devs, 10-20 hrs/week)
- Makers + Dev (occasional dev help, 20-30 hrs/week)
- Pro Developers (full dev team, 40+ hrs/week)
- Data Scientists (ML expertise, 40+ hrs/week)

**Questionnaire Coverage:**

| Question ID  | Question                                                   | Coverage                                               |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------ |
| `ttv_skills` | Who will build the solution and what skills are available? | Ownership model + technical capability in one question |

**Answers:**

- "No technical skills" → Makers
- "Low-code/no-code skills" → Makers + occasional dev
- "Developer skills" → Pro Developers
- "Data science / AI engineering skills" → Data Scientists

**Result:** Fully covered with direct 1:1 mapping.

---

### ✅ 3. Budget Assessment

**Framework Criteria:**

- Free / Included / < $500/mo
- $500-$2K/mo (pilots, Copilot Studio)
- $2K-$10K/mo (Studio + Azure AI Foundry)
- $10K+/mo (Full Azure AI stack)

**Questionnaire Coverage:**

| Question ID   | Question                           | Coverage                                |
| ------------- | ---------------------------------- | --------------------------------------- |
| `cost_budget` | What is your monthly budget range? | Maps directly to framework budget bands |

**Answers align exactly with framework ranges:**

- Free / Included (< $500/mo)
- $500-$2K/mo
- $2K-$10K/mo
- $10K+/mo

**Result:** Fully covered with exact framework alignment.

---

### ✅ 4. Time to Production

**Framework Criteria:**

- Days (M365 Copilot + Graph Connectors)
- 1-2 Weeks (M365 Copilot add-on or Copilot Studio)
- 1-2 Months (Studio + custom actions or Azure AI Foundry)
- 3-6 Months (Pro-code agents with enterprise controls)

**Questionnaire Coverage:**

| Question ID   | Question                        | Coverage                    |
| ------------- | ------------------------------- | --------------------------- |
| `ttv_urgency` | When do you need this solution? | Maps to framework timelines |

**Answers:**

- "Immediately—need value from day one" → Days
- "Within a few weeks" → 1-2 Weeks
- "Several months—can invest in design" → 1-6 Months

**Result:** Fully covered, simplified for user clarity.

---

### ✅ 5. Governance & Compliance

**Framework Criteria:**

- Data boundary (M365 tenant, Power Platform, Azure landing zone)
- Network isolation (VNet, private endpoints, air-gapped)
- Permissions model (user-scoped, service account, custom)
- Compliance requirements (GDPR, HIPAA, FedRAMP, etc.)

**Questionnaire Coverage:**

| Question ID                  | Question                                                         | Coverage                                |
| ---------------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| `governance_needs`           | What governance model and release controls do you need?          | Trust boundary + governance + ALM depth |
| `governance_dataresidency`   | Do you have data residency or sovereignty requirements?          | GDPR, government cloud, hybrid          |
| `governance_operating_model` | Which admin and governance model best matches your organization? | Control plane and operating ownership   |

**Result:** Fully covered with 3 questions addressing all governance dimensions.

---

### ✅ 6. Action Safety & Content Safety

**Framework Criteria:**

- Read-only actions
- Write actions (approval optional)
- Destructive actions (approval required)
- Proactive vs reactive capabilities

**Questionnaire Coverage:**

| Question ID      | Question                                 | Coverage                     |
| ---------------- | ---------------------------------------- | ---------------------------- |
| `data_actions`   | Can the agent take destructive actions?  | Action safety classification |
| `data_proactive` | Does the agent need to initiate actions? | Proactive vs reactive        |

**Answers for `data_actions`:**

- "Draft-only (user reviews everything)" → Read-only, maximum safety
- "Approval required for actions" → Write with approval
- "Execute after user confirmation" → Moderate autonomy
- "Autonomous execution within boundaries" → High autonomy

**Result:** Fully covered with explicit action safety guardrail questions.

---

### ✅ 7. Memory, Analytics & Conversation History

**Framework Criteria:**

- M365 Copilot: Grounding only, activity history in user mailbox
- Copilot Studio: Full transcript access for admins (Dataverse)
- Foundry Agent Service: Custom storage (customer Cosmos DB)
- M365 Agents SDK: Custom implementation

**Questionnaire Coverage:**

| Question ID   | Question                                              | Coverage                      |
| ------------- | ----------------------------------------------------- | ----------------------------- |
| `cost_memory` | Do you need to store and access conversation history? | Memory and audit requirements |

**Answers:**

- "No, conversations don't need to be retained" → No memory needs
- "Yes, but only for the user (personal history)" → User-scoped memory
- "Yes, admins need full transcript access" → Compliance/audit (Studio/Foundry)
- "Yes, need custom retention policies and PII scrubbing" → Custom implementation (Foundry)

**Result:** Fully covered with new question added specifically for this criterion.

---

### ✅ 8. Scale & Performance

**Framework Criteria:**

- User volume (Small: <100, Medium: 100-1K, Large: 1K-10K, Enterprise: 10K+)
- Performance requirements (1-3s SaaS, <1s optimized, <100ms real-time)
- Rate limits (RPM vs TPM models)
- Cost model trade-offs

**Questionnaire Coverage:**

| Question ID        | Question                                | Coverage               |
| ------------------ | --------------------------------------- | ---------------------- |
| `audience_scale`   | How many users will use this?           | User volume assessment |
| `cost_performance` | What are your performance requirements? | Latency requirements   |

**Answers for `cost_performance`:**

- "Relaxed (1-3 seconds acceptable)" → Managed platform (M365/Studio)
- "Fast (<1 second preferred)" → Optimized performance
- "Real-time (<100ms)" → Mission critical (Azure AI Foundry)

**Result:** Fully covered with scale and performance questions.

---

## Summary: Evaluation Criteria Checklist

| Criterion                   | Status           | Questions   | Notes                                                 |
| --------------------------- | ---------------- | ----------- | ----------------------------------------------------- |
| **Technical Complexity**    | ✅ Fully Covered | 5 questions | Development approach, orchestration, AI customization |
| **Skills & Resources**      | ✅ Fully Covered | 1 question  | Direct mapping to framework skill levels              |
| **Budget Assessment**       | ✅ Fully Covered | 1 question  | Exact framework budget ranges                         |
| **Time to Production**      | ✅ Fully Covered | 1 question  | Simplified timeline mapping                           |
| **Governance & Compliance** | ✅ Fully Covered | 3 questions | Trust boundary, data residency, ALM                   |
| **Action Safety**           | ✅ Fully Covered | 2 questions | Action risk + proactive capabilities                  |
| **Memory & Analytics**      | ✅ Fully Covered | 1 question  | **NEW:** Added for audit/compliance                   |
| **Scale & Performance**     | ✅ Fully Covered | 2 questions | User volume + latency requirements                    |

**Total Questions:** 16 across 7 question groups
**Framework Alignment:** 100% coverage of all 8 evaluation criteria

---

## Decision Model Enhancements (January 4, 2026)

### Changes Made

1. **Added 5-Platform Support:**
   - All questions now include weights for: M365 Copilot, Copilot Studio, Microsoft Foundry, Agent Builder, Hybrid
   - 92 answers updated with `foundry` and `agentBuilder` weights

2. **New Questions Added:**
   - `cost_budget`: Budget range ($500-$2K, $2K-$10K, $10K+/mo)
   - `cost_memory`: Conversation history and audit requirements
   - `cost_performance`: Performance requirements (1-3s, <1s, <100ms)
   - `data_proactive`: Proactive vs reactive agent capabilities
   - `data_actions`: Action safety classification
   - `governance_compliance`: Trust boundary selection
   - `governance_dataresidency`: Data sovereignty requirements
   - `integration_orchestration`: Orchestration complexity

3. **Framework Alignment:**
   - Questions map to [Microsoft AI Decision Framework](https://microsoft.github.io/Microsoft-AI-Decision-Framework/)
   - Evaluation criteria from [Evaluation Criteria page](https://microsoft.github.io/Microsoft-AI-Decision-Framework/docs/evaluation-criteria.html)
   - 9 critical questions from [Decision Framework](https://microsoft.github.io/Microsoft-AI-Decision-Framework/docs/decision-framework.html)

---

## Design Principles

### Keep Survey Simple

✅ **16 total questions** - Manageable for users (10-15 minutes)
✅ **Grouped logically** - 7 sections with clear themes
✅ **Plain language** - No jargon, clear helper text
✅ **Progressive disclosure** - Helper text provides context without overwhelming

### Ensure Critical Coverage

✅ **Action Safety** - Addresses destructive action risks (Question 7 of framework)
✅ **Memory & Analytics** - Critical for regulated industries (HIPAA, GDPR)
✅ **Budget Realism** - Specific dollar ranges help set expectations
✅ **Performance Requirements** - Distinguishes between platform capabilities
✅ **Compliance** - Trust boundaries and data residency explicitly covered

### Enable Accurate Recommendations

✅ **5-Platform Weights** - Every answer scores all 5 platforms
✅ **Context-Aware Scoring** - Weights reflect real platform capabilities
✅ **Hybrid Detection** - Threshold system identifies when hybrid approach is optimal
✅ **Foundry Differentiation** - Pro-code, custom models, autonomous actions score high
✅ **Agent Builder Positioning** - Simple, no-code, reactive scenarios score high

---

## Next Steps

### For Users

1. Complete the questionnaire (10-15 minutes)
2. Review the recommendation with reasons and next steps
3. Download the PDF report for stakeholders
4. Use the Agentic Decision Assistant for follow-up questions

### For Developers

1. Review the decision model: `packages/decision-engine/src/data/decision-model.v1.json`
2. Scoring logic: `packages/decision-engine/src/scoring.ts`
3. Recommendations: `packages/decision-engine/src/recommendations.ts`
4. API endpoint: `apps/api/src/index.ts` (`POST /api/score`)

### Related Documentation

- [Microsoft AI Decision Framework](https://microsoft.github.io/Microsoft-AI-Decision-Framework/)
- [Evaluation Criteria](https://microsoft.github.io/Microsoft-AI-Decision-Framework/docs/evaluation-criteria.html)
- [Implementation Patterns](https://microsoft.github.io/Microsoft-AI-Decision-Framework/docs/implementation-patterns.html)
- [Feature Comparison](https://microsoft.github.io/Microsoft-AI-Decision-Framework/docs/feature-comparison.html)

---

**Last Updated:** January 4, 2026  
**Decision Model Version:** 1.0  
**Framework Version:** Aligned with Microsoft AI Decision Framework (November 2025 release)
