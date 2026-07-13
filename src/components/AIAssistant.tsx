import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Languages, HelpCircle } from 'lucide-react';
import { askArenaMindAI, LOCALIZED_STRINGS } from '../utils/ai';
import { sanitizeInput } from '../utils/security';
import type { SecureSession } from '../utils/security';
import type { GateInfo, TransitInfo, IncidentReport } from '../utils/mockData';

interface AIAssistantProps {
  session: SecureSession | null;
  gates: GateInfo[];
  transit: TransitInfo[];
  activeIncidents: IncidentReport[];
  initialPrompt?: string;
  onExecuteAIAction?: (actionId: string, payload?: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; actionId: string; payload?: any }[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  session,
  gates,
  transit,
  activeIncidents,
  initialPrompt = '',
  onExecuteAIAction,
}) => {
  console.log('[AI Monitor] Active session user:', session?.userName);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState<'en' | 'es' | 'fr' | 'ar'>('en');
  const [isTyping, setIsTyping] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message
  useEffect(() => {
    const welcomeText = LOCALIZED_STRINGS[language]?.welcome || LOCALIZED_STRINGS.en.welcome;
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'ai',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [language]);

  // Handle external prompts (e.g. clicking "Ask AI about this area" from the map)
  useEffect(() => {
    if (initialPrompt) {
      setInputValue(initialPrompt);
    }
  }, [initialPrompt]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    // Validate Input: Strict length constraints to prevent Buffer / DoS (CWE-20)
    if (trimmed.length > 500) {
      setInputError('Query exceeds maximum length of 500 characters.');
      return;
    }
    setInputError(null);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `usr-${Date.now()}`;

    // Add user message to state (securely escaping via sanitizeInput)
    const sanitizedText = sanitizeInput(trimmed);
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: sanitizedText,
        timestamp,
      },
    ]);
    // Do not clear a newer query if a previous suggestion is still resolving.
    setInputValue(current => current === trimmed ? '' : current);

    // Trigger GenAI Thinking State
    setIsTyping(true);

    try {
      // The local context engine keeps the fan experience responsive and deterministic
      // when the optional hosted model is unavailable at a venue edge node.
      const response = await askArenaMindAI(sanitizedText, {
        role: 'fan',
        language,
        seatSection: 'Section 212',
        gates,
        transit,
        activeIncidents,
      });

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: response.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: response.suggestedActions,
        },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'system',
          text: 'Error connecting to StadiuMind services. Please check security parameters.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  const handleActionClick = (actionId: string, payload?: any) => {
    if (onExecuteAIAction) {
      onExecuteAIAction(actionId, payload);
    }
  };

  const getQuickChips = () => {
    if (language === 'es') {
      return [
        { label: '¿Qué puerta usar?', text: '¿Qué puerta de acceso tiene menos espera?' },
        { label: 'Acceso silla de ruedas', text: '¿Dónde está el acceso para sillas de ruedas y elevadores?' },
        { label: 'Estado del metro', text: '¿Cómo está el transporte público y el metro ahora?' },
        { label: '¿Cómo reciclar vasos?', text: '¿Cómo funciona el reciclaje de carbono y premios?' },
      ];
    }
    return [
      { label: 'Best gate to enter?', text: 'Which entrance has the shortest queue line?' },
      { label: 'Wheelchair elevators', text: 'Where is wheelchair ADA access and elevator paths?' },
      { label: 'Transit congestions', text: 'Is the public transit metro system crowded right now?' },
      { label: 'Recycle eco-points', text: 'How do I scan my cups to earn carbon points and rewards?' },
    ];
  };

  return (
    <div className="card glass-card chat-card flex flex-col h-full">
      <div className="card-header border-b pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-emerald" size={20} />
          <h2 className="card-title text-lg font-bold">StadiuMind AI Assistant</h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-1">
          <Languages size={13} className="text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-transparent text-xs text-slate-300 outline-none border-none cursor-pointer"
            id="lang-select"
          >
            <option value="en" className="bg-slate-900">English</option>
            <option value="es" className="bg-slate-900">Español</option>
            <option value="fr" className="bg-slate-900">Français</option>
            <option value="ar" className="bg-slate-900">العربية</option>
          </select>
        </div>
      </div>

      {/* Messages viewport */}
      <div className="chat-messages-container flex-grow overflow-y-auto pr-1 flex flex-col gap-3 min-h-[220px]">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender}`}>
            <div className={`chat-bubble ${msg.sender}`}>
              <div className="message-content text-sm whitespace-pre-line leading-relaxed">
                {/* Safe rendering using normal React text node (auto-escaped) */}
                {msg.text}
              </div>

              {/* Render suggested actions in message bubble */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="message-actions mt-3 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleActionClick(act.actionId, act.payload)}
                      className="text-xs bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded transition"
                      id={`ai-act-${act.actionId}-${i}`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              )}

              <span className="bubble-time text-[9px] text-slate-500 block text-right mt-1.5 font-mono">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-bubble-wrapper ai">
            <div className="chat-bubble ai opacity-80">
              <div className="typing-indicator flex gap-1 items-center py-1">
                <span className="dot animate-bounce delay-75"></span>
                <span className="dot animate-bounce delay-150"></span>
                <span className="dot animate-bounce delay-220"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input query validation errors */}
      {inputError && (
        <div className="input-error-bar bg-rose-950/40 border border-rose-900 rounded p-2 text-xs text-rose-300 flex items-center gap-1.5 my-2">
          <AlertCircle size={14} />
          <span>{inputError}</span>
        </div>
      )}

      {/* Quick query chips */}
      <div className="quick-chips flex gap-2 overflow-x-auto py-2 border-t border-slate-800 mt-2 scrollbar-thin">
        {getQuickChips().map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.text)}
            className="chip-btn text-[11px] whitespace-nowrap bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1 rounded-full transition flex items-center gap-1"
            id={`quick-chip-${idx}`}
          >
            <HelpCircle size={10} className="text-emerald" />
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="chat-input-bar mt-2 flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={LOCALIZED_STRINGS[language]?.askPlaceholder || LOCALIZED_STRINGS.en.askPlaceholder}
          className="flex-grow bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
          maxLength={500}
          id="chat-input"
        />
        <button
          onMouseDown={(event) => {
            // Keep touch/automation clients responsive even when the input is still
            // committing its controlled value during a concurrent AI response.
            event.preventDefault();
            handleSendMessage((document.getElementById('chat-input') as HTMLInputElement | null)?.value ?? inputValue);
          }}
          onClick={() => handleSendMessage((document.getElementById('chat-input') as HTMLInputElement | null)?.value ?? inputValue)}
          disabled={!inputValue.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold p-2.5 rounded transition flex items-center justify-center"
          title="Send query"
          id="btn-send-chat"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
