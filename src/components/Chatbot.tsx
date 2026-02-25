import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const getTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hello! I'm your IPN documentation assistant. How can I help you today?",
      time: getTime(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const userMessage: Message = {
      sender: 'user',
      text: userInput,
      time: getTime(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userInput }),
      });
      const data = await response.json();
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: data.response, time: getTime() },
      ]);
    } catch {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I encountered an error. Please try again.',
          time: getTime(),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
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
                <span className="sia-status-dot" /> Online
              </span>
            </div>
          </div>
          <div className="sia-header__right">
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
          {messages.map((msg, i) => (
            <div key={i} className={`sia-msg sia-msg--${msg.sender}`}>
              {msg.sender === 'bot' && (
                <div className="sia-msg__avatar">
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="#f4c642" opacity="0.2"/>
                    <path d="M12 6c-3.3 0-6 2.2-6 4.8 0 1.4.8 2.7 2 3.6l-.7 2.6 3-1.5c.5.2 1.1.3 1.7.3 3.3 0 6-2.2 6-4.8S15.3 6 12 6z" fill="#f4c642"/>
                  </svg>
                </div>
              )}
              <div className="sia-msg__bubble">
                <p>{msg.text}</p>
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
        </div>

        {/* Quick suggestions */}
        <div className="sia-suggestions">
          {['Browse API Docs', 'View Overview', 'Explorer Help'].map((s) => (
            <button
              key={s}
              className="sia-suggestion"
              onClick={() => {
                setUserInput(s);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
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
            placeholder="Ask about API docs, endpoints…"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={`sia-send-btn ${userInput.trim() ? 'sia-send-btn--active' : ''}`}
            onClick={handleSend}
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div className="sia-footer">Powered by <strong>IPN Docs</strong> · Inspired Pet Nutrition</div>
      </div>
    </>
  );
};

export default Chatbot;