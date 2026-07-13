import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertCircle, Languages, HelpCircle } from 'lucide-react';
import { askArenaMindAI, LOCALIZED_STRINGS, toPlainText } from '../utils/ai';
import type { AIAction } from '../utils/ai';
import { sanitizeInput } from '../utils/security';
import type { SecureSession } from '../utils/security';
import type { GateInfo, TransitInfo, IncidentReport } from '../utils/mockData';

interface AIAssistantProps {
  session: SecureSession | null;
  gates: GateInfo[];
  transit: TransitInfo[];
  activeIncidents: IncidentReport[];
  initialPrompt?: string;
  onExecuteAIAction?: (actionId: string, payload?: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  suggestedActions?: AIAction[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  session: _session,
  gates,
  transit,
  activeIncidents,
  initialPrompt = '',
  onExecuteAIAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState<'en' | 'es' | 'fr' | 'ar'>('en');
  const [isTyping, setIsTyping] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (initialPrompt) {
      setInputValue(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    if (trimmed.length > 500) {
      setInputError('Query exceeds maximum length of 500 characters.');
      return;
    }
    setInputError(null);

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `usr-${Date.now()}`;

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
    setInputValue(current => current === trimmed ? '' : current);

    setIsTyping(true);

    try {
      const context = { role: 'fan' as const, language, seatSection: 'Section 212', gates, transit, activeIncidents };
      let response;
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 1800);
        const request = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ query: sanitizedText, context }),
        });
        window.clearTimeout(timeout);
        if (!request.ok) throw new Error('Hosted assistant unavailable');
        response = await request.json();
      } catch {
        response = await askArenaMindAI(sanitizedText, context);
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: toPlainText(response.answer),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: response.suggestedActions,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'system',
          text: 'ArenaMind could not produce a grounded response. Live venue tools remain available.',
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

  const handleActionClick = (actionId: string, payload?: string) => {
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
    if (language === 'fr') {
      return [
        { label: 'Meilleure porte', text: 'Quelle porte a le moins d’attente ?' },
        { label: 'Accès fauteuil', text: 'Où sont les ascenseurs accessibles en fauteuil roulant ?' },
        { label: 'État du métro', text: 'Le métro est-il bondé maintenant ?' },
        { label: 'Points recyclage', text: 'Comment gagner des points en recyclant ?' },
      ];
    }
    if (language === 'ar') {
      return [
        { label: 'أفضل بوابة', text: 'ما هي البوابة الأقل انتظاراً؟ gate' },
        { label: 'مسار ميسر', text: 'أين مسار wheelchair والمصاعد؟' },
        { label: 'حالة المترو', text: 'ما حالة metro الآن؟' },
        { label: 'نقاط التدوير', text: 'كيف أحصل على نقاط recycle؟' },
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
          <h2 className="card-title text-lg font-bold">ArenaMind AI Assistant</h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-2 py-1">
          <Languages size={13} className="text-slate-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'es' | 'fr' | 'ar')}
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
      <div
        ref={messagesContainerRef}
        className="chat-messages-container flex-grow overflow-y-auto pr-1 flex flex-col gap-3 min-h-[220px]"
        role="log"
        aria-live="polite"
        aria-label="ArenaMind conversation"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
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
                <span className="dot animate-pulse delay-75"></span>
                <span className="dot animate-pulse delay-150"></span>
                <span className="dot animate-pulse delay-220"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input query validation errors */}
      {inputError && (
        <div id="chat-input-error" role="alert" className="input-error-bar bg-rose-950/40 border border-rose-900 rounded p-2 text-xs text-rose-300 flex items-center gap-1.5 my-2">
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
          aria-label="Ask ArenaMind about the venue"
          aria-describedby={inputError ? 'chat-input-error' : undefined}
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
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold p-2.5 rounded transition flex items-center justify-center"
          title="Send query"
          aria-label="Send message"
          id="btn-send-chat"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
