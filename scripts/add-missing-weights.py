#!/usr/bin/env python3
"""
Script to add missing foundry and agentBuilder weights to decision-model.v1.json.
Intelligently determines appropriate weights based on the context of each answer.
"""

import json
import re

# Weight assignment rules based on answer characteristics
def get_weights_for_answer(question_id, answer_id, label, existing_weights):
    """
    Determine appropriate foundry and agentBuilder weights based on context.
    
    Microsoft Foundry (full-stack AI platform):
    - High for: pro-code, custom ML models, complex orchestration, autonomous actions, data science
    - Low for: simple Q&A, no-code, productivity, M365-only
    
    Agent Builder (rapid no-code deployment):
    - High for: quick deployment, simple scenarios, no-code, draft-only, reactive
    - Low for: complex workflows, pro-code, autonomous actions, custom models
    """
    
    m365 = existing_weights.get("m365Copilot", 5)
    studio = existing_weights.get("copilotStudio", 5)
    hybrid = existing_weights.get("hybrid", 5)
    
    # Default weights
    foundry = 5
    agent_builder = 5
    
    # Convert to lowercase for easier matching
    label_lower = label.lower()
    answer_id_lower = answer_id.lower()
    
    # M365 Copilot-heavy answers → low foundry, moderate agent builder
    if m365 >= 9:
        foundry = 2
        agent_builder = 6
    
    # Copilot Studio-heavy answers → moderate foundry, high agent builder
    if studio >= 9:
        foundry = 4
        agent_builder = 8
    
    # Hybrid answers → balanced
    if hybrid >= 9:
        foundry = 6
        agent_builder = 6
    
    # Pro-code/custom development → high foundry, low agent builder
    if any(term in label_lower for term in ["pro-code", "custom code", "full control", "develop", "data science", "ml pipeline", "fine-tuning"]):
        foundry = 9
        agent_builder = 2
    
    # No-code/low-code → low foundry, high agent builder
    if any(term in label_lower for term in ["no-code", "low-code", "visual", "guided"]):
        foundry = 2
        agent_builder = 9
    
    # Configuration/declarative → moderate foundry, high agent builder
    if any(term in label_lower for term in ["configuration", "declarative", "copilot studio"]):
        foundry = 3
        agent_builder = 8
    
    # Productivity/assistive → low foundry, moderate agent builder
    if any(term in label_lower for term in ["productivity", "draft", "summarize", "search", "assist"]):
        foundry = 2
        agent_builder = 6
    
    # Custom agent/automation → moderate-high foundry, high agent builder
    if any(term in label_lower for term in ["custom agent", "chatbot", "automate workflow"]):
        foundry = 5
        agent_builder = 8
    
    # Action-oriented → moderate foundry, high agent builder
    if any(term in label_lower for term in ["action-oriented", "create tickets", "update records", "trigger"]):
        foundry = 5
        agent_builder = 7
    
    # Complex orchestration/multi-agent → high foundry, low agent builder
    if any(term in label_lower for term in ["multi-agent", "complex orchestration", "custom orchestration", "advanced workflow"]):
        foundry = 9
        agent_builder = 3
    
    # Simple Q&A → low foundry, high agent builder
    if any(term in label_lower for term in ["simple q&a", "basic questions", "faq"]):
        foundry = 2
        agent_builder = 9
    
    # Autonomous actions → high foundry, moderate agent builder
    if any(term in label_lower for term in ["autonomous", "execute directly", "automatically"]):
        foundry = 8
        agent_builder = 5
    
    # Draft-only/approval required → low foundry, high agent builder
    if any(term in label_lower for term in ["draft-only", "approval", "review before"]):
        foundry = 3
        agent_builder = 8
    
    # Proactive/event-driven → high foundry, moderate agent builder
    if any(term in label_lower for term in ["proactive", "event-driven", "initiate", "monitor"]):
        foundry = 8
        agent_builder = 5
    
    # Reactive/on-demand → moderate foundry, high agent builder
    if any(term in label_lower for term in ["reactive", "on-demand", "user-initiated"]):
        foundry = 4
        agent_builder = 8
    
    # Azure landing zone/custom environment → high foundry, low agent builder
    if any(term in label_lower for term in ["azure landing zone", "custom environment", "full infrastructure"]):
        foundry = 9
        agent_builder = 2
    
    # M365 boundary → low foundry, moderate agent builder
    if any(term in label_lower for term in ["m365", "microsoft 365", "sharepoint", "teams only"]):
        foundry = 2
        agent_builder = 6
    
    # Power Platform → moderate foundry, high agent builder
    if any(term in label_lower for term in ["power platform", "dataverse", "power automate"]):
        foundry = 4
        agent_builder = 8
    
    # Scale considerations
    if any(term in label_lower for term in ["large scale", "thousands", "enterprise-wide"]):
        foundry = 7
        agent_builder = 5
    
    # Immediate/quick deployment → low foundry, high agent builder
    if any(term in label_lower for term in ["immediate", "day one", "quickly", "few weeks"]):
        foundry = 2
        agent_builder = 8
    
    # Long-term investment → high foundry, moderate agent builder
    if any(term in label_lower for term in ["several months", "invest", "design"]):
        foundry = 7
        agent_builder = 4
    
    # Unsure answers → balanced
    if "unsure" in answer_id_lower or "not sure" in label_lower:
        foundry = 5
        agent_builder = 5
    
    return foundry, agent_builder


def process_decision_model(file_path):
    """Process the decision model file and add missing weights."""
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    data = json.loads(content)
    
    changes_made = 0
    
    for group in data.get('questionGroups', []):
        for question in group.get('questions', []):
            question_id = question.get('id', '')
            for answer in question.get('answers', []):
                weights = answer.get('weights', {})
                
                # Check if foundry and agentBuilder are missing
                if 'foundry' not in weights or 'agentBuilder' not in weights:
                    answer_id = answer.get('id', '')
                    label = answer.get('label', '')
                    
                    foundry, agent_builder = get_weights_for_answer(
                        question_id, answer_id, label, weights
                    )
                    
                    # Add the missing weights
                    if 'foundry' not in weights:
                        weights['foundry'] = foundry
                        changes_made += 1
                    
                    if 'agentBuilder' not in weights:
                        weights['agentBuilder'] = agent_builder
                        changes_made += 1
                    
                    print(f"Updated {answer_id}: foundry={foundry}, agentBuilder={agent_builder}")
    
    # Write back to file with pretty formatting
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Total changes made: {changes_made}")
    print(f"✅ Updated {file_path}")
    
    return changes_made


if __name__ == "__main__":
    file_path = r"c:\repos\copilot-decision-guidance\packages\decision-engine\src\data\decision-model.v1.json"
    changes = process_decision_model(file_path)
    
    if changes > 0:
        print("\n✅ Successfully added missing weights to all answers!")
    else:
        print("\n✅ All answers already have complete weights!")
