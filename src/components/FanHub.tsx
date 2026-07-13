import React, { useState } from 'react';
import { SmartMap } from './SmartMap';
import { AIAssistant } from './AIAssistant';
import { SustainabilityTracker } from './SustainabilityTracker';
import type { GateInfo, TransitInfo, IncidentReport } from '../utils/mockData';
import { maskPII } from '../utils/security';
import type { SecureSession } from '../utils/security';
import { Compass, Users, MapPin, Eye, Volume2, Type } from 'lucide-react';

interface FanHubProps {
  session: SecureSession | null;
  gates: GateInfo[];
  transit: TransitInfo[];
  activeIncidents: IncidentReport[];
}

export const FanHub: React.FC<FanHubProps> = ({
  session,
  gates,
  transit,
  activeIncidents,
}) => {
  const [mapAskPrompt, setMapAskPrompt] = useState('');

  const [highContrast, setHighContrast] = useState(false);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'xl'>('normal');
  const [voiceAssist, setVoiceAssist] = useState(false);

  const handleAskAIAboutLocation = (locationName: string) => {
    setMapAskPrompt(`Tell me about concessions, gates, accessibility paths, or queues near ${locationName}`);
  };

  const handleExecuteAIAction = (actionId: string, payload?: any) => {
    if (actionId === 'toggle-map-layer') {
      const el = document.getElementById(`map-node-gate-${payload}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getTextSizeClass = () => {
    switch (textSize) {
      case 'large': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return '';
    }
  };

  return (
    <div className={`fan-hub-screen flex flex-col min-h-screen ${highContrast ? 'high-contrast-mode' : ''} ${getTextSizeClass()}`}>
      
      {/* Banner message for Screen Readers / Accessibility */}
      <div className="sr-only">
        ArenaMind 2026 Fan Hub. Visual map and AI assistance available. Active seat section: 212.
      </div>

      <div className="flex-grow p-4 grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Side: Stadium Operations info, map and transit (8 columns) */}
        <div className="xl:col-span-8 flex flex-col gap-4">

          {/* Top Panel: Welcome banner & Accessibility Quick Toggles */}
          <div className="card glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-100 flex items-center gap-1.5">
                <Compass size={22} className="text-emerald" /> Fan Experience Hub
              </h2>
              {session && (
                <p className="text-xs text-slate-400 mt-1">
                  Ticket: <code className="text-emerald">{maskPII(session.ticketId || '', 'ticket')}</code> | Seat Section: <span className="font-semibold text-slate-200">Sec 212, Row 14</span>
                </p>
              )}
            </div>

            {/* Accessibility Panel */}
            <div className="accessibility-panel bg-slate-900/60 border border-slate-800 rounded-lg p-2.5 flex items-center gap-4">
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Eye size={12} className="text-emerald" /> Accessibility
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                    highContrast
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:text-slate-200'
                  }`}
                  id="btn-toggle-contrast"
                  title="Toggle High Contrast for visually impaired users"
                >
                  Contrast
                </button>

                <button
                  onClick={() => setTextSize(prev => prev === 'normal' ? 'large' : prev === 'large' ? 'xl' : 'normal')}
                  className="px-2 py-1 rounded text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-850 hover:text-slate-200 flex items-center gap-1"
                  id="btn-toggle-text-size"
                  title="Change text scaling size"
                >
                  <Type size={11} /> {textSize.toUpperCase()}
                </button>

                <button
                  onClick={() => setVoiceAssist(!voiceAssist)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                    voiceAssist
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:text-slate-200'
                  }`}
                  id="btn-toggle-voice"
                  title="Toggle Screen Reader narration support"
                >
                  <Volume2 size={11} /> {voiceAssist ? 'Audio ON' : 'Audio OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="flex-grow min-h-[400px]">
            <SmartMap
              gates={gates}
              transit={transit}
              onAskAIAboutLocation={handleAskAIAboutLocation}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="card glass-card p-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Users size={16} className="text-emerald" /> Live Gate Queues & Entrances
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                {gates.map(gate => (
                  <div key={gate.id} className="flex items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg hover:border-slate-800 transition">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">{gate.name}</span>
                      <span className="block text-[10px] text-slate-500">{gate.location}</span>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className={`text-[10px] font-bold block ${
                          gate.currentLoad > 80 ? 'text-rose-400' : gate.currentLoad > 50 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {gate.currentLoad}% full
                        </span>
                        <span className="text-[10px] text-slate-500">{gate.avgWaitMinutes}m wait</span>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${
                        gate.status === 'Open' ? (gate.currentLoad > 80 ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-gray-500'
                      }`}></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card glass-card p-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin size={16} className="text-emerald" /> Transportation & Shuttle Status
              </h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 scrollbar-thin">
                {transit.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/40 border border-slate-900 rounded-lg hover:border-slate-800 transition">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-slate-900 border border-slate-800 rounded text-slate-400 font-bold">
                          {t.type}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">{t.route.split(' (')[0]}</span>
                      </div>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{t.route}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold block ${
                        t.status === 'Crowded' ? 'text-rose-400' : t.status === 'Delayed' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {t.status}
                      </span>
                      <span className="text-[10px] text-slate-500">Next: {t.nextArrival}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: AI Assistant & Sustainability widget */}
        <div className="xl:col-span-4 flex flex-col gap-4">

          <div className="flex-grow min-h-[380px]">
            <AIAssistant
              session={session}
              gates={gates}
              transit={transit}
              activeIncidents={activeIncidents}
              initialPrompt={mapAskPrompt}
              onExecuteAIAction={handleExecuteAIAction}
            />
          </div>

          {/* Sustainability tracker rewards center */}
          <div className="h-auto">
            <SustainabilityTracker />
          </div>

        </div>

      </div>
    </div>
  );
};
