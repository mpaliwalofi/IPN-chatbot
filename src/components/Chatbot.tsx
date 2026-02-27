import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Chatbot.css';

// ============================================================================
// Types
// ============================================================================

interface Source {
  file: string;
  path: string;
  category: 'backend' | 'frontend' | 'other';
  relevance_score: number;
}

interface ValidationMetrics {
  faithfulness: number;
  relevance: number;
  coherence: number;
  hallucination: number;
  toxicity: number;
  completeness: number;
  overall_quality: number;
}

interface MessageMetadata {
  retrieved_chunks?: number;
  used_context?: boolean;
  processing_time_ms?: number;
  is_overview?: boolean;
  validation?: ValidationMetrics;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  sources?: Source[];
  metadata?: MessageMetadata;
  isError?: boolean;
  isStreaming?: boolean;
}

interface ChatResponse {
  response: string;
  sources: Source[];
  metadata: MessageMetadata;
}

// ============================================================================
// Utility Functions
// ============================================================================

const generateId = () => Math.random().toString(36).substring(2, 9);

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatMarkdown = (text: string): string => {
  // Basic markdown formatting for display
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```/g, '').trim();
      return `<pre><code>${code}</code></pre>`;
    })
    .replace(/\n/g, '<br />');
};

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'backend':
      return '⚙️';
    case 'frontend':
      return '💻';
    default:
      return '📄';
  }
};

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'backend':
      return 'Backend';
    case 'frontend':
      return 'Frontend';
    default:
      return 'Documentation';
  }
};

// ============================================================================
// Validation Metrics Component
// ============================================================================

const ValidationMetricsBadge: React.FC<{ metrics: ValidationMetrics }> = ({ metrics }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return '#22c55e'; // green
    if (score >= 0.6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };
  
  const getScoreIcon = (score: number): string => {
    if (score >= 0.8) return '✓';
    if (score >= 0.6) return '~';
    return '!';
  };
  
  const overall = metrics.overall_quality || 0;
  
  return (
    <div className="sia-validation-badge">
      <button 
        className="sia-validation-badge__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          borderLeft: `3px solid ${getScoreColor(overall)}`,
        }}
      >
        <span className="sia-validation-badge__icon" style={{ color: getScoreColor(overall) }}>
          {getScoreIcon(overall)}
        </span>
        <span className="sia-validation-badge__label">Quality Score</span>
        <span className="sia-validation-badge__score" style={{ color: getScoreColor(overall) }}>
          {Math.round(overall * 100)}%
        </span>
        <span className={`sia-validation-badge__arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </button>
      
      {isExpanded && (
        <div className="sia-validation-badge__details">
          <div className="sia-validation-badge__grid">
            <div className="sia-validation-badge__item">
              <span className="sia-validation-badge__metric-name">Faithfulness</span>
              <div className="sia-validation-badge__bar">
                <div 
                  className="sia-validation-badge__bar-fill" 
                  style={{ width: `${(metrics.faithfulness || 0) * 100}%`, background: getScoreColor(metrics.faithfulness || 0) }}
                />
              </div>
              <span className="sia-validation-badge__metric-value">{Math.round((metrics.faithfulness || 0) * 100)}%</span>
            </div>
            
            <div className="sia-validation-badge__item">
              <span className="sia-validation-badge__metric-name">Relevance</span>
              <div className="sia-validation-badge__bar">
                <div 
                  className="sia-validation-badge__bar-fill" 
                  style={{ width: `${(metrics.relevance || 0) * 100}%`, background: getScoreColor(metrics.relevance || 0) }}
                />
              </div>
              <span className="sia-validation-badge__metric-value">{Math.round((metrics.relevance || 0) * 100)}%</span>
            </div>
            
            <div className="sia-validation-badge__item">
              <span className="sia-validation-badge__metric-name">Coherence</span>
              <div className="sia-validation-badge__bar">
                <div 
                  className="sia-validation-badge__bar-fill" 
                  style={{ width: `${(metrics.coherence || 0) * 100}%`, background: getScoreColor(metrics.coherence || 0) }}
                />
              </div>
              <span className="sia-validation-badge__metric-value">{Math.round((metrics.coherence || 0) * 100)}%</span>
            </div>
            
            <div className="sia-validation-badge__item">
              <span className="sia-validation-badge__metric-name">No Hallucination</span>
              <div className="sia-validation-badge__bar">
                <div 
                  className="sia-validation-badge__bar-fill" 
                  style={{ width: `${(metrics.hallucination || 0) * 100}%`, background: getScoreColor(metrics.hallucination || 0) }}
                />
              </div>
              <span className="sia-validation-badge__metric-value">{Math.round((metrics.hallucination || 0) * 100)}%</span>
            </div>
            
            <div className="sia-validation-badge__item">
              <span className="sia-validation-badge__metric-name">Safety</span>
              <div className="sia-validation-badge__bar">
                <div 
                  className="sia-validation-badge__bar-fill" 
                  style={{ width: `${(1 - (metrics.toxicity || 0)) * 100}%`, background: getScoreColor(1 - (metrics.toxicity || 0)) }}
                />
              </div>
              <span className="sia-validation-badge__metric-value">{Math.round((1 - (metrics.toxicity || 0)) * 100)}%</span>
            </div>
            
            <div className="sia-validation-badge__item">
              <span className="sia-validation-badge__metric-name">Completeness</span>
              <div className="sia-validation-badge__bar">
                <div 
                  className="sia-validation-badge__bar-fill" 
                  style={{ width: `${(metrics.completeness || 0) * 100}%`, background: getScoreColor(metrics.completeness || 0) }}
                />
              </div>
              <span className="sia-validation-badge__metric-value">{Math.round((metrics.completeness || 0) * 100)}%</span>
            </div>
          </div>
          
          <div className="sia-validation-badge__footer">
            <small>AI-generated content quality metrics</small>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Components
// ============================================================================

const SourceBadge: React.FC<{ source: Source; index: number }> = ({ source, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="sia-source-badge">
      <button 
        className="sia-source-badge__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="sia-source-badge__icon">{getCategoryIcon(source.category)}</span>
        <span className="sia-source-badge__number">[{index + 1}]</span>
        <span className="sia-source-badge__name">{source.file}</span>
        <span className={`sia-source-badge__arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </button>
      {isExpanded && (
        <div className="sia-source-badge__details">
          <div className="sia-source-badge__row">
            <span className="sia-source-badge__label">Category:</span>
            <span className="sia-source-badge__value">{getCategoryLabel(source.category)}</span>
          </div>
          <div className="sia-source-badge__row">
            <span className="sia-source-badge__label">Relevance:</span>
            <span className="sia-source-badge__value">
              {Math.round(source.relevance_score * 100)}%
            </span>
          </div>
          <div className="sia-source-badge__row">
            <span className="sia-source-badge__label">Path:</span>
            <span className="sia-source-badge__value sia-source-badge__path">
              {source.path}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const MessageContent: React.FC<{ message: Message }> = ({ message }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (contentRef.current && message.sender === 'bot') {
      contentRef.current.innerHTML = formatMarkdown(message.text);
    }
  }, [message.text, message.sender]);
  
  if (message.sender === 'user') {
    return <p>{message.text}</p>;
  }
  
  if (message.isError) {
    return (
      <div className="sia-error-content">
        <span className="sia-error-icon">⚠️</span>
        <p>{message.text}</p>
      </div>
    );
  }
  
  return (
    <div className="sia-message-content">
      <div ref={contentRef} className="sia-formatted-text" />
      
      {/* Sources */}
      {message.sources && message.sources.length > 0 && (
        <div className="sia-sources">
          <div className="sia-sources__header">
            <span className="sia-sources__icon">📚</span>
            <span className="sia-sources__title">Sources</span>
            <span className="sia-sources__count">({message.sources.length})</span>
          </div>
          <div className="sia-sources__list">
            {message.sources.map((source, idx) => (
              <SourceBadge key={idx} source={source} index={idx} />
            ))}
          </div>
        </div>
      )}
      
      {/* Metadata */}
      {message.metadata && message.metadata.used_context && (
        <div className="sia-metadata">
          <span className="sia-metadata__item">
            🎯 {message.metadata.retrieved_chunks || 0} chunks retrieved
          </span>
          {message.metadata.processing_time_ms && (
            <span className="sia-metadata__item">
              ⚡ {message.metadata.processing_time_ms}ms
            </span>
          )}
        </div>
      )}
      
      {/* Validation Metrics */}
      {message.metadata?.validation && (
        <ValidationMetricsBadge metrics={message.metadata.validation} />
      )}
    </div>
  );
};

// ============================================================================
// Main Chatbot Component
// ============================================================================

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I'm **SIA** (Smart IPN Assistant). 🤖\n\nI can help you with:\n• **Backend** (PHP/Symfony/API Platform)\n• **Frontend** (Vue.js/Nuxt/TypeScript)\n• **CMS** (Strapi configurations)\n\nWhat would you like to know about the IPN codebase?",
      time: getTime(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick suggestion options
  const suggestions = [
    'How does the subscription system work?',
    'Give me an overview of IPN codebase',
    'How many controllers are there?',
    'List all entities',
    'Show cart components',
    'API authentication flow',
  ];

  // Check backend health on mount
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        setConnectionStatus('online');
      } else {
        setConnectionStatus('offline');
      }
    } catch {
      // Try legacy health endpoint
      try {
        const response = await fetch('/health');
        if (response.ok) {
          setConnectionStatus('online');
        } else {
          setConnectionStatus('offline');
        }
      } catch {
        setConnectionStatus('offline');
      }
    }
  };

  const getChatHistory = useCallback(() => {
    return messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
  }, [messages]);

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      sender: 'user',
      text: userInput,
      time: getTime(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Try new API first, fallback to legacy
      let response: Response | null = null;
      let useLegacy = false;
      
      try {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.text,
            chat_history: getChatHistory().slice(0, -1), // Exclude the message we just added
          }),
        });
      } catch {
        useLegacy = true;
      }

      // Fallback to legacy endpoint
      if (useLegacy || !response || !response.ok) {
        response = await fetch('/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userMessage.text,
            chat_history: getChatHistory().slice(0, -1),
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      
      const botMessage: Message = {
        id: generateId(),
        sender: 'bot',
        text: data.response,
        time: getTime(),
        sources: data.sources,
        metadata: data.metadata,
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: generateId(),
        sender: 'bot',
        text: 'Sorry, I encountered an error processing your request. Please make sure the RAG backend is running on port 5000.',
        time: getTime(),
        isError: true,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUserInput(suggestion);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: "Chat cleared! How can I help you today?",
        time: getTime(),
      },
    ]);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`sia-fab ${isOpen ? 'sia-fab--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle IPN Assistant"
      >
        <span className="sia-fab__ring" />
        <span className="sia-fab__icon">
          {isOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </span>
        {!isOpen && <span className="sia-fab__badge">1</span>}
      </button>

      {/* Chat Window */}
      <div className={`sia-panel ${isOpen ? 'sia-panel--open' : ''}`}>
        {/* Header */}
        <div className="sia-header">
          <div className="sia-header__left">
            <div className="sia-avatar">
              <svg viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="20" fill="#f4c642" opacity="0.15" />
                <path d="M20 10c-5.5 0-10 3.6-10 8 0 2.4 1.3 4.5 3.3 6L12 28l5-2.5c1 .3 2 .5 3 .5 5.5 0 10-3.6 10-8s-4.5-8-10-8z" fill="#f4c642"/>
                <circle cx="16" cy="18" r="1.5" fill="#0e5a4a"/>
                <circle cx="20" cy="18" r="1.5" fill="#0e5a4a"/>
                <circle cx="24" cy="18" r="1.5" fill="#0e5a4a"/>
              </svg>
            </div>
            <div className="sia-header__info">
              <span className="sia-header__name">IPN Assistant</span>
              <span className="sia-header__status">
                <span className={`sia-status-dot sia-status-dot--${connectionStatus}`} />
                {connectionStatus === 'online' ? 'Online' : connectionStatus === 'checking' ? 'Connecting...' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="sia-header__right">
            <button 
              className="sia-clear-btn" 
              onClick={clearChat}
              title="Clear chat"
              aria-label="Clear chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <span className="sia-header__brand">IPN Docs</span>
            <button className="sia-close-btn" onClick={() => setIsOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Divider accent */}
        <div className="sia-header__accent" />

        {/* Messages */}
        <div className="sia-messages" ref={chatWindowRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`sia-msg sia-msg--${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="sia-msg__avatar">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="#f4c642" opacity="0.2"/>
                    <path d="M12 6c-3.3 0-6 2.2-6 4.8 0 1.4.8 2.7 2 3.6l-.7 2.6 3-1.5c.5.2 1.1.3 1.7.3 3.3 0 6-2.2 6-4.8S15.3 6 12 6z" fill="#f4c642"/>
                  </svg>
                </div>
              )}
              <div className={`sia-msg__bubble ${msg.isError ? 'sia-msg__bubble--error' : ''}`}>
                <MessageContent message={msg} />
                <span className="sia-msg__time">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="sia-msg sia-msg--bot">
              <div className="sia-msg__avatar">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#f4c642" opacity="0.2"/>
                  <path d="M12 6c-3.3 0-6 2.2-6 4.8 0 1.4.8 2.7 2 3.6l-.7 2.6 3-1.5c.5.2 1.1.3 1.7.3 3.3 0 6-2.2 6-4.8S15.3 6 12 6z" fill="#f4c642"/>
                </svg>
              </div>
              <div className="sia-msg__bubble sia-msg__bubble--typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        <div className="sia-suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              className="sia-suggestion"
              onClick={() => handleSuggestionClick(s)}
              disabled={isLoading}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="sia-input-area">
          <input
            ref={inputRef}
            type="text"
            className="sia-input"
            placeholder={isLoading ? "Processing..." : "Ask about API docs, endpoints..."}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            className={`sia-send-btn ${userInput.trim() && !isLoading ? 'sia-send-btn--active' : ''}`}
            onClick={handleSend}
            disabled={!userInput.trim() || isLoading}
            aria-label="Send"
          >
            {isLoading ? (
              <svg className="sia-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>

        <div className="sia-footer">
          Powered by <strong>IPN Docs</strong> · Inspired Pet Nutrition
          {connectionStatus === 'offline' && (
            <span className="sia-footer__warning"> · Backend Offline</span>
          )}
        </div>
      </div>
    </>
  );
};

export default Chatbot;
