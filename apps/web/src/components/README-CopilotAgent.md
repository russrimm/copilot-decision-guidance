# Agentic Decision Assistant

An AI-powered chat interface for the Microsoft Agentic Solution Advisor that helps users understand Microsoft 365 Copilot, Copilot Studio, Microsoft Foundry, and Agent Builder licensing, features, and decision guidance for agentic capabilities.

## Features

- **Real-time Chat**: Interactive conversation with an AI agent
- **Knowledge Base**: Powered by structured licensing data from the December 2025 Microsoft licensing guide
- **Cost Calculations**: Can provide cost estimates on-demand
- **Contextual Responses**: Maintains conversation history for better context
- **Dual Display Modes**:
  - **Inline**: Embedded in the landing page
  - **Floating**: Accessible from all pages via a floating button

## Usage

### Inline (Landing Page)

The agent is displayed inline on the landing page:

```tsx
import { CopilotAgent } from '../components/CopilotAgent';

<CopilotAgent variant="inline" />;
```

### Floating (All Pages)

The agent appears as a floating button in the bottom-right corner:

```tsx
import { CopilotAgent } from '../components/CopilotAgent';

<CopilotAgent variant="floating" />;
```

## API Endpoint

The agent communicates with the backend via:

**POST** `/api/copilot-agent/chat`

**Request:**

```json
{
  "message": "What's the difference between M365 Copilot and Copilot Studio?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response:**

```json
{
  "response": "Microsoft 365 Copilot and Copilot Studio serve different purposes..."
}
```

## Knowledge Base

The agent has access to:

1. **Licensing Data** (`licensing-data.json`)
   - Pricing for all license types
   - Feature comparisons
   - Deployment channels
   - Decision guidance

2. **Capabilities**
   - Compare M365 Copilot vs Copilot Studio
   - Calculate cost estimates
   - Explain licensing options
   - Recommend deployment approaches
   - Answer compliance questions

## Configuration

Requires either Azure OpenAI or OpenAI API key:

### Azure OpenAI (Recommended)

```bash
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=your-deployment-name
```

### OpenAI

```bash
OPENAI_API_KEY=your-key
```

## Example Queries

- "What's the difference between M365 Copilot and Copilot Studio?"
- "How much does Microsoft 365 Copilot cost?"
- "Can I deploy Copilot Studio agents to external channels?"
- "What are Copilot Credits?"
- "Calculate cost for 50 users with 20,000 messages per month"
- "When should I use a hybrid approach?"

## Behavior

- **Conversational**: Natural language responses
- **Accurate**: Based on structured licensing data
- **Concise**: 2-4 paragraph responses
- **Helpful**: Includes relevant links when appropriate
- **Honest**: Admits when it doesn't know something

## UI Features

- **Suggested Questions**: Pre-populated questions for first-time users
- **Message History**: Scrollable conversation view
- **Loading States**: Animated typing indicators
- **Timestamps**: Each message includes send time
- **Keyboard Shortcuts**:
  - Enter: Send message
  - Shift+Enter: New line
- **Responsive**: Works on desktop and mobile

## Styling

Uses Tailwind CSS with dark mode support:

- Light theme: Clean, professional
- Dark theme: Comfortable for extended use
- Animations: Smooth transitions and pulse effects

## Future Enhancements

- [ ] Voice input/output
- [ ] Message export (PDF/email)
- [ ] Multi-language support
- [ ] Citation links to specific sections
- [ ] Feedback buttons (thumbs up/down)
- [ ] Integration with Azure AI Search for PDF search
- [ ] Conversation history persistence
- [ ] User authentication for personalized experiences
