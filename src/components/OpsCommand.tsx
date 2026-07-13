import React, { useState, useEffect } from 'react';
import { IncidentManager } from './IncidentManager';
import { TaskDispatcher } from './TaskDispatcher';
import type { GateInfo, TransitInfo, IncidentReport, StaffTask } from '../utils/mockData';
import { sanitizeInput, CSRFProtection } from '../utils/security';
import type { SecureSession } from '../utils/security';
import { askArenaMindAI } from '../utils/ai';
import { ShieldCheck, Radio, Send, RefreshCw, Compass } from 'lucide-react';

interface OpsCommandProps {
  session: SecureSession | null;
  gates: GateInfo[];
  setGates: React.Dispatch<React.SetStateAction<GateInfo[]>>;
  transit: TransitInfo[];
  incidents: IncidentReport[];
  onAddIncident: (newIncident: IncidentReport, generatedTask?: StaffTask) => void;
  onUpdateIncidentStatus: (id: string, status: 'Open' | 'Investigating' | 'Resolved') => void;
  tasks: StaffTask[];
  onAssignTask: (taskId: string, staffName: string) => void;
  onCompleteTask: (taskId: string) => void;
  csrfToken: string;
}

interface BroadcastAlert {
  id: string;
  originalText: string;
  translations: Record<string, string>;
  sender: string;
  time: string;
  channels: string[];
}

export const OpsCommand: React.FC<OpsCommandProps> = ({
  session,
  gates,
  setGates,
  transit,
  incidents,
  onAddIncident,
  onUpdateIncidentStatus,
  tasks,
  onAssignTask,
  onCompleteTask,
  csrfToken,
}) => {
  // AI briefs state
  const [aiBrief, setAiBrief] = useState('');
  const [loadingBrief, setLoadingBrief] = useState(false);

  // Broadcast Alert Form
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastLangEs, setBroadcastLangEs] = useState(true);
  const [broadcastLangFr, setBroadcastLangFr] = useState(true);
  const [broadcastLangAr, setBroadcastLangAr] = useState(true);
  const [broadcastList, setBroadcastList] = useState<BroadcastAlert[]>([]);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Fetch AI Operational briefing on load or when incidents change
  const refreshAIBrief = async () => {
    setLoadingBrief(true);
    try {
      const res = await askArenaMindAI('generate operations summary and status recommendations', {
        role: 'operator',
        language: 'en',
        gates,
        transit,
        activeIncidents: incidents,
      });
      setAiBrief(res.answer);
    } catch (e) {
      setAiBrief('Error fetching AI tactical briefing. Please try again.');
    } finally {
      setLoadingBrief(false);
    }
  };

  useEffect(() => {
    refreshAIBrief();
  }, [incidents, gates]);

  // Adjust gate status overrides dynamically
  const toggleGateStatus = (gateId: string, nextStatus: 'Open' | 'Closed' | 'Restricted') => {
    setGates(prev => prev.map(g => {
      if (g.id === gateId) {
        return {
          ...g,
          status: nextStatus,
          currentLoad: nextStatus === 'Closed' ? 0 : g.currentLoad,
          avgWaitMinutes: nextStatus === 'Closed' ? 0 : nextStatus === 'Restricted' ? 12 : g.avgWaitMinutes
        };
      }
      return g;
    }));
  };

  // Broadcast submit handler
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastError(null);
    setBroadcastSuccess(false);

    const cleanMsg = sanitizeInput(broadcastText.trim());
    if (!cleanMsg) {
      setBroadcastError('Please input emergency message description.');
      return;
    }

    if (!CSRFProtection.validateToken(csrfToken)) {
      setBroadcastError('CSRF verification failed.');
      return;
    }

    // AI translation simulation for Emergency Jumbotrons
    const translations: Record<string, string> = { en: cleanMsg };
    const lowerText = cleanMsg.toLowerCase();
    
    if (broadcastLangEs) {
      if (lowerText.includes('gate d') || lowerText.includes('gate c')) {
        translations.es = 'ATENCIÓN: Puertas C y D congestionadas. Por favor use la Puerta A o Puerta E para ingresar rápidamente.';
      } else {
        translations.es = `ALERTA VENUE: ${cleanMsg} (Traducido por StadiuMind AI)`;
      }
    }
    if (broadcastLangFr) {
      if (lowerText.includes('gate d') || lowerText.includes('gate c')) {
        translations.fr = 'ATTENTION: Portes C et D encombrées. Veuillez utiliser la Porte A ou la Porte E pour un accès rapide.';
      } else {
        translations.fr = `ALERTE VENUE: ${cleanMsg} (Traduit par StadiuMind AI)`;
      }
    }
    if (broadcastLangAr) {
      if (lowerText.includes('gate d') || lowerText.includes('gate c')) {
        translations.ar = 'تنبيه: البوابتان C و D مزدحمتان. يرجى استخدام البوابة A أو E للدخول السريع.';
      } else {
        translations.ar = `تنبيه ملعب: ${cleanMsg} (ترجمة الذكاء الاصطناعي)`;
      }
    }

    const newBroadcast: BroadcastAlert = {
      id: `alert-${Date.now().toString().slice(-4)}`,
      originalText: cleanMsg,
      translations,
      sender: session?.userName || 'Ops Commander',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channels: ['Stadium Jumbotron', 'Concourse Boards', 'Fan Mobile App']
    };

    setBroadcastList(prev => [newBroadcast, ...prev]);
    setBroadcastText('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  return (
    <div className="ops-command-screen p-4 flex flex-col gap-4 min-h-screen">
      
      {/* Top operational summary & metrics row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Tactical intelligence briefing by AI (5 columns) */}
        <div className="xl:col-span-5 flex flex-col">
          <div className="card glass-card ai-brief-card p-4 flex-grow flex flex-col justify-between">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={16} /> AI Operations Command Advisor
              </h3>
              <button
                onClick={refreshAIBrief}
                disabled={loadingBrief}
                className="text-slate-400 hover:text-emerald-400 transition"
                id="btn-refresh-brief"
              >
                <RefreshCw size={13} className={loadingBrief ? 'animate-spin' : ''} />
              </button>
            </div>

            {loadingBrief ? (
              <div className="flex-grow flex items-center justify-center py-10">
                <div className="typing-indicator flex gap-1 items-center">
                  <span className="dot animate-bounce delay-75"></span>
                  <span className="dot animate-bounce delay-150"></span>
                  <span className="dot animate-bounce delay-220"></span>
                </div>
              </div>
            ) : (
              <div className="flex-grow text-xs leading-relaxed text-slate-300 markdown-content" id="ops-ai-brief">
                {/* Standard React rendering, safe from injection */}
                <div className="whitespace-pre-line bg-slate-950/40 p-3 rounded-lg border border-slate-900">
                  {aiBrief}
                </div>
              </div>
            )}
            <p className="text-[10px] text-slate-500 mt-2 font-mono">
              Brief compiled at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Real-time updates active.
            </p>
          </div>
        </div>

        {/* Live Gate override control center (7 columns) */}
        <div className="xl:col-span-7 flex flex-col">
          <div className="card glass-card p-4 flex-grow">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Compass size={16} className="text-emerald" /> Dynamic Gate Flow Controllers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {gates.map(gate => (
                <div key={gate.id} className="p-3 bg-slate-900/40 border border-slate-900 rounded-lg flex flex-col justify-between gap-2 hover:border-slate-800 transition" id={`gate-ctrl-${gate.id}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">{gate.name.split(' ')[0]} {gate.name.split(' ')[1]}</span>
                      <span className="text-[10px] text-slate-500">{gate.location}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      gate.status === 'Open'
                        ? (gate.currentLoad > 80 ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-900')
                        : 'bg-slate-950 text-slate-500 border border-slate-850'
                    }`}>
                      {gate.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 pt-2">
                    <span className="text-[10px] text-slate-400">Load: {gate.currentLoad}%</span>
                    <div className="flex gap-1">
                      {(['Open', 'Restricted', 'Closed'] as const).map(st => (
                        <button
                          key={st}
                          onClick={() => toggleGateStatus(gate.id, st)}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition ${
                            gate.status === st
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                              : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300'
                          }`}
                          id={`btn-set-${gate.id}-${st}`}
                        >
                          {st.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Main operational rows: Incident Manager (left) and task dispatcher + broadcast (right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left: Incident Logger & List (5 columns) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="flex-grow">
            <IncidentManager
              incidents={incidents}
              onAddIncident={onAddIncident}
              onUpdateIncidentStatus={onUpdateIncidentStatus}
              csrfToken={csrfToken}
            />
          </div>
        </div>

        {/* Right: Staff dispatch & Emergency Broadcast System (7 columns) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          
          {/* Dispatch board */}
          <div className="flex-grow">
            <TaskDispatcher
              tasks={tasks}
              onAssignTask={onAssignTask}
              onCompleteTask={onCompleteTask}
            />
          </div>

          {/* Emergency Broadcaster */}
          <div className="card glass-card p-4">
            <div className="card-header border-b pb-2 mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                <Radio size={16} /> Multilingual Emergency Broadcast System
              </h3>
              <span className="badge-rose text-[9px] px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">Live Stadium Channels</span>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              {broadcastError && (
                <div className="p-2 bg-rose-950/40 border border-rose-900 rounded text-xs text-rose-300">
                  {broadcastError}
                </div>
              )}
              {broadcastSuccess && (
                <div className="p-2 bg-emerald-950/40 border border-emerald-900 rounded text-xs text-emerald-300">
                  Broadcast transmitted to stadium displays!
                </div>
              )}

              <input type="hidden" name="_csrf" value={csrfToken} />

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-grow">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Message Description</label>
                  <input
                    type="text"
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="e.g. Please divert to Gate A due to delays at Gate C. Transit Line 2 open."
                    className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-rose-600 transition"
                    maxLength={300}
                    id="broadcast-input"
                  />
                </div>

                {/* Multilingual translate selectors */}
                <div className="flex flex-col justify-end">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">AI Translations</label>
                  <div className="flex gap-2 bg-slate-900 border border-slate-850 rounded p-2">
                    <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcastLangEs}
                        onChange={() => setBroadcastLangEs(!broadcastLangEs)}
                        className="accent-emerald"
                      /> ES
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcastLangFr}
                        onChange={() => setBroadcastLangFr(!broadcastLangFr)}
                        className="accent-emerald"
                      /> FR
                    </label>
                    <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcastLangAr}
                        onChange={() => setBroadcastLangAr(!broadcastLangAr)}
                        className="accent-emerald"
                      /> AR
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-slate-950 font-black text-xs px-5 py-2 rounded transition flex items-center gap-1.5 shadow-lg shadow-rose-950/40"
                  id="btn-submit-broadcast"
                >
                  <Send size={12} /> Broadcast to Displays
                </button>
              </div>
            </form>

            {/* Broadcast log */}
            {broadcastList.length > 0 && (
              <div className="mt-4 border-t border-slate-800 pt-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Active Translations Displaying:</h4>
                <div className="space-y-2 max-h-[140px] overflow-y-auto scrollbar-thin">
                  {broadcastList.map(b => (
                    <div key={b.id} className="p-2.5 bg-slate-950/50 border border-slate-900 rounded-lg text-xs space-y-1.5" id={`broadcast-item-${b.id}`}>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                        <span>Sender: {b.sender} | {b.time}</span>
                        <span className="text-rose-500 font-bold">Active</span>
                      </div>
                      
                      {/* Grid showing English/Spanish/Arabic translations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-300">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">EN:</span>
                          {b.translations.en}
                        </div>
                        {b.translations.es && (
                          <div>
                            <span className="text-[9px] uppercase font-bold text-amber-500 block">ES:</span>
                            {b.translations.es}
                          </div>
                        )}
                        {b.translations.fr && (
                          <div>
                            <span className="text-[9px] uppercase font-bold text-blue-400 block">FR:</span>
                            {b.translations.fr}
                          </div>
                        )}
                        {b.translations.ar && (
                          <div dir="rtl" className="text-right">
                            <span className="text-[9px] uppercase font-bold text-emerald-400 block text-left">AR:</span>
                            {b.translations.ar}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
