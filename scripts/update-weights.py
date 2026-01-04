import json
import sys

# Read the file
with open('packages/decision-engine/src/data/decision-model.v1.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

count = 0

# Iterate through question groups
for group in data['questionGroups']:
    for question in group['questions']:
        for answer in question['answers']:
            if 'weights' in answer:
                weights = answer['weights']
                m365 = weights.get('m365Copilot', 0)
                studio = weights.get('copilotStudio', 0)
                
                # Calculate foundry weight (higher for pro-code scenarios)
                if studio >= 9:
                    foundry = 8
                elif studio >= 7:
                    foundry = 6
                elif m365 >= 9:
                    foundry = 2
                else:
                    foundry = 4
                
                # Calculate agentBuilder weight (higher for simple Q&A scenarios)
                if m365 >= 8 and studio <= 4:
                    agentBuilder = 7
                elif studio >= 9:
                    agentBuilder = 2
                elif m365 >= 6 and studio >= 6:
                    agentBuilder = 5
                else:
                    agentBuilder = 4
                
                # Add new weights
                weights['foundry'] = foundry
                weights['agentBuilder'] = agentBuilder
                count += 1

# Write back
with open('packages/decision-engine/src/data/decision-model.v1.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f'Updated {count} weight entries with foundry and agentBuilder values')
