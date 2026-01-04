import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CopilotAgentProps {
  variant?: 'inline' | 'floating';
}

export function CopilotAgent({ variant = 'inline' }: CopilotAgentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "👋 Hi! I'm your Agentic Decision Assistant. I can help you understand licensing, compare Microsoft 365 Copilot, Copilot Studio, Microsoft Foundry, and Agent Builder, calculate costs, and answer deployment questions. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/copilot-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-5), // Last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          '❌ Sorry, I encountered an error. Please check that Azure OpenAI is configured in your environment variables.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What's the difference between M365 Copilot, Copilot Studio, and Microsoft Foundry?",
    'How much does Microsoft 365 Copilot cost?',
    'When should I use Microsoft Foundry vs Copilot Studio?',
    'What is Agent Builder and when should I use it?',
    'When should I use a hybrid approach?',
  ];

  const handleSuggestion = (question: string) => {
    setInput(question);
  };

  if (variant === 'floating') {
    return (
      <div className="copilot-floating-container">
        {/* Floating Button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            title="Open Copilot Agent"
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 
                       text-white rounded-full shadow-lg flex items-center justify-center 
                       transition-all hover:scale-110 z-50"
            aria-label="Open Copilot Agent"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        )}

        {/* Floating Chat Window */}
        {isOpen && (
          <div
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 
                          rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 
                          flex flex-col z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Agentic Decision Assistant
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <ChatContent
              messages={messages}
              loading={loading}
              input={input}
              setInput={setInput}
              handleSend={handleSend}
              handleKeyPress={handleKeyPress}
              suggestedQuestions={suggestedQuestions}
              handleSuggestion={handleSuggestion}
              messagesEndRef={messagesEndRef}
            />
          </div>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className="copilot-agent max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-4 flex items-center">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          💬 Agentic Decision Assistant
        </h2>
      </div>

      <ChatContent
        messages={messages}
        loading={loading}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleKeyPress={handleKeyPress}
        suggestedQuestions={suggestedQuestions}
        handleSuggestion={handleSuggestion}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
}

interface ChatContentProps {
  messages: Message[];
  loading: boolean;
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  suggestedQuestions: string[];
  handleSuggestion: (question: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function ChatContent({
  messages,
  loading,
  input,
  setInput,
  handleSend,
  handleKeyPress,
  suggestedQuestions,
  handleSuggestion,
  messagesEndRef,
}: ChatContentProps) {
  return (
    <div className="flex flex-col flex-1">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 max-h-[500px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="mb-4 px-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggested questions:</p>
          <div className="space-y-2">
            {suggestedQuestions.slice(0, 3).map((question, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(question)}
                className="w-full text-left text-sm px-3 py-2 bg-gray-50 dark:bg-gray-700 
                           hover:bg-gray-100 dark:hover:bg-gray-600 rounded border 
                           border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                           transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about Copilot licensing, features, or deployment..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-fit"
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
