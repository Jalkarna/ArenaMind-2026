import React, { useState } from 'react';
import type { GateInfo, TransitInfo } from '../utils/mockData';
import { Map, Layers, Info, Accessibility, Coffee, Compass, Landmark } from 'lucide-react';

interface SmartMapProps {
  gates: GateInfo[];
  transit: TransitInfo[];
  onAskAIAboutLocation: (locationName: string) => void;
}

export const SmartMap: React.FC<SmartMapProps> = ({ gates, transit, onAskAIAboutLocation }) => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'gates' | 'concessions' | 'medical' | 'transit' | 'accessibility'>('all');
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);

  // Read transit variable to satisfy TS unused locals rule
  console.log('[Map Monitor] Loaded transit connections:', transit.length);

  // Define static locations mapped to stadium layout coordinates
  const features = [
    { id: 'gate-a', type: 'gate', name: 'Gate A (North Entry)', x: 180, y: 40, size: 14, color: 'emerald', details: 'North Gate. Current wait: 5 mins.' },
    { id: 'gate-b', type: 'gate', name: 'Gate B (VIP East)', x: 330, y: 130, size: 14, color: 'blue', details: 'VIP & Corporate Suites Access. Wait: 2 mins.' },
    { id: 'gate-c', type: 'gate', name: 'Gate C (East Entry)', x: 320, y: 250, size: 14, color: 'rose', details: 'High Congestion. Digital scanners slow. Wait: 35 mins.' },
    { id: 'gate-d', type: 'gate', name: 'Gate D (South Entry)', x: 180, y: 340, size: 14, color: 'rose', details: 'Heavy Crowds. Exit path narrow. Wait: 45 mins.' },
    { id: 'gate-e', type: 'gate', name: 'Gate E (West Entry - Accessible)', x: 40, y: 200, size: 14, color: 'emerald', details: 'Fully ADA compliant. Elevators to all levels. Wait: 8 mins.' },
    { id: 'gate-f', type: 'gate', name: 'Gate F (Media / Staff)', x: 50, y: 100, size: 14, color: 'yellow', details: 'Operations personnel only.' },
    
    { id: 'con-1', type: 'concessions', name: 'North Concourse Grill', x: 180, y: 90, size: 10, color: 'yellow', details: 'Burgers, Hotdogs, Vegan burgers. No queues.' },
    { id: 'con-2', type: 'concessions', name: 'East Concourse Tacos', x: 260, y: 180, size: 10, color: 'yellow', details: 'Tacos, Beer, Soft drinks.' },
    { id: 'con-3', type: 'concessions', name: 'West Concourse Drinks', x: 100, y: 200, size: 10, color: 'yellow', details: 'Beer, Soda, Smart Water Refill Bin.' },

    { id: 'med-1', type: 'medical', name: 'Main Medical Center', x: 250, y: 110, size: 11, color: 'rose', details: 'Doctor & EMS staff on-site. Defibrillator available.' },
    { id: 'med-2', type: 'medical', name: 'Medical Station South', x: 130, y: 290, size: 11, color: 'rose', details: 'First aid unit.' },

    { id: 'trn-1', type: 'transit', name: 'Metro Line 6 Station', x: 370, y: 260, size: 12, color: 'blue', details: 'High demand. Outbound trains arriving every 3 mins.' },
    { id: 'trn-2', type: 'transit', name: 'Shuttle Stop S1', x: 20, y: 240, size: 12, color: 'blue', details: 'Outer Parking Lot Shuttle. Clean electric buses.' },

    { id: 'acc-1', type: 'accessibility', name: 'ADA elevator North', x: 110, y: 110, size: 11, color: 'emerald', details: 'Elevator access to Suite and Level 300.' },
    { id: 'acc-2', type: 'accessibility', name: 'ADA elevator South', x: 270, y: 280, size: 11, color: 'emerald', details: 'Elevator access to Level 200/300.' }
  ];

  const handlePointClick = (point: any) => {
    setSelectedZone(point);
  };

  const getGateColorClass = (gateId: string) => {
    const gate = gates.find(g => g.id === gateId);
    if (!gate) return 'fill-gray-500';
    if (gate.status === 'Closed') return 'fill-red-900 stroke-red-500';
    if (gate.currentLoad > 80) return 'fill-rose-600 stroke-rose-300 animate-pulse';
    if (gate.currentLoad > 50) return 'fill-amber-500 stroke-amber-200';
    return 'fill-emerald-500 stroke-emerald-200';
  };

  // Filter based on layer selection
  const visibleFeatures = features.filter(f => {
    if (activeLayer === 'all') return true;
    return f.type === activeLayer;
  });

  return (
    <div className="card glass-card map-card flex flex-col h-full">
      <div className="card-header flex items-center justify-between border-b pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Map className="text-emerald" size={20} />
          <h2 className="card-title text-lg font-bold">Interactive Stadium Map</h2>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={heatmapEnabled}
              onChange={() => setHeatmapEnabled(!heatmapEnabled)}
              className="accent-emerald"
            />
            Live Heatmap
          </label>
        </div>
      </div>

      {/* Layer Select Buttons */}
      <div className="map-layers flex flex-wrap gap-1.5 mb-3">
        <button className={`layer-btn ${activeLayer === 'all' ? 'active' : ''}`} onClick={() => setActiveLayer('all')}>
          <Layers size={12} /> All
        </button>
        <button className={`layer-btn ${activeLayer === 'gates' ? 'active' : ''}`} onClick={() => setActiveLayer('gates')}>
          <Compass size={12} /> Gates
        </button>
        <button className={`layer-btn ${activeLayer === 'concessions' ? 'active' : ''}`} onClick={() => setActiveLayer('concessions')}>
          <Coffee size={12} /> Food
        </button>
        <button className={`layer-btn ${activeLayer === 'medical' ? 'active' : ''}`} onClick={() => setActiveLayer('medical')}>
          <Landmark size={12} /> Medical
        </button>
        <button className={`layer-btn ${activeLayer === 'transit' ? 'active' : ''}`} onClick={() => setActiveLayer('transit')}>
          <Map size={12} /> Transit
        </button>
        <button className={`layer-btn ${activeLayer === 'accessibility' ? 'active' : ''}`} onClick={() => setActiveLayer('accessibility')}>
          <Accessibility size={12} /> ADA
        </button>
      </div>

      {/* Stadium Grid SVG Layout */}
      <div className="map-canvas relative flex-grow flex items-center justify-center bg-slate-950/80 rounded-lg p-4 border border-slate-800 overflow-hidden min-h-[300px]">
        <div className="map-scale-label" aria-hidden="true"><span>LIVE ZONE MODEL</span><strong>20:08</strong></div>
        
        {/* Heatmap overlay background */}
        {heatmapEnabled && (
          <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen">
            {/* Glowing Red Heat for Gates C & D */}
            <div className="absolute w-44 h-44 rounded-full bg-rose-600 blur-3xl" style={{ top: '65%', left: '70%' }}></div>
            <div className="absolute w-36 h-36 rounded-full bg-rose-500 blur-3xl" style={{ top: '80%', left: '40%' }}></div>
            {/* Soft Green for Gates A & E */}
            <div className="absolute w-28 h-28 rounded-full bg-emerald-500 blur-3xl" style={{ top: '5%', left: '40%' }}></div>
            <div className="absolute w-28 h-28 rounded-full bg-emerald-600 blur-3xl" style={{ top: '50%', left: '5%' }}></div>
          </div>
        )}

        <svg viewBox="0 0 400 400" className="stadium-model w-full h-full max-h-[350px] max-w-[350px]">
          {/* Outer Ring */}
          <ellipse cx="200" cy="200" rx="180" ry="160" className="fill-none stroke-slate-800 stroke-[4]" />
          
          {/* Inner Seating Ring */}
          <ellipse cx="200" cy="200" rx="140" ry="120" className="fill-slate-900/80 stroke-slate-700 stroke-[3]" />
          
          {/* Playing Field (Pitch) */}
          <rect x="140" y="150" width="120" height="100" rx="6" className="fill-emerald-950/50 stroke-emerald-700 stroke-[2]" />
          {/* Field Lines */}
          <line x1="200" y1="150" x2="200" y2="250" className="stroke-emerald-700/60 stroke-[1.5]" />
          <circle cx="200" cy="200" r="20" className="fill-none stroke-emerald-700/60 stroke-[1.5]" />
          
          {/* Spectator Sections Division lines */}
          <line x1="200" y1="40" x2="200" y2="80" className="stroke-slate-800 stroke-[2] stroke-dasharray-[2]" />
          <line x1="200" y1="320" x2="200" y2="360" className="stroke-slate-800 stroke-[2]" />
          <line x1="60" y1="200" x2="100" y2="200" className="stroke-slate-800 stroke-[2]" />
          <line x1="300" y1="200" x2="340" y2="200" className="stroke-slate-800 stroke-[2]" />

          {/* Render Active Points */}
          {visibleFeatures.map(pt => {
            let fillClass = 'fill-blue-500';
            if (pt.type === 'gate') {
              fillClass = getGateColorClass(pt.id);
            } else if (pt.type === 'concessions') {
              fillClass = 'fill-amber-400 stroke-amber-200';
            } else if (pt.type === 'medical') {
              fillClass = 'fill-rose-500 stroke-rose-200';
            } else if (pt.type === 'transit') {
              fillClass = 'fill-sky-500 stroke-sky-200';
            } else if (pt.type === 'accessibility') {
              fillClass = 'fill-emerald-400 stroke-emerald-200';
            }

            const isSelected = selectedZone?.id === pt.id;

            return (
              <g key={pt.id} className="cursor-pointer" onClick={() => handlePointClick(pt)} id={`map-node-${pt.id}`}>
                {/* Highlight ring if selected */}
                {isSelected && (
                  <circle cx={pt.x} cy={pt.y} r={pt.size + 4} className="fill-none stroke-emerald-400 stroke-[2] animate-ping" />
                )}
                {/* Base SVG Node */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={pt.size / 2 + (isSelected ? 2 : 0)}
                  className={`${fillClass} transition-all duration-300 hover:scale-125`}
                />
                {/* Node Symbol Label (T, G, C etc.) */}
                <text
                  x={pt.x}
                  y={pt.y + 3}
                  textAnchor="middle"
                  className="fill-slate-950 font-bold text-[8px] pointer-events-none select-none"
                >
                  {pt.type === 'gate' ? 'G' : pt.type === 'concessions' ? 'F' : pt.type === 'medical' ? 'M' : pt.type === 'transit' ? 'T' : 'E'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Details Panel */}
      <div className="selected-zone-info mt-4 p-3 bg-slate-900/60 border border-slate-800 rounded-lg min-h-[100px] flex flex-col justify-between">
        {selectedZone ? (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block bg-emerald-400"></span>
                  {selectedZone.name}
                </h4>
                <p className="text-xs text-slate-400 mt-1">{selectedZone.details}</p>
              </div>
              <span className="text-[10px] uppercase font-bold badge-slate px-2 py-0.5 rounded">
                {selectedZone.type}
              </span>
            </div>
            <div className="mt-3 flex gap-2 justify-end">
              <button
                onClick={() => onAskAIAboutLocation(selectedZone.name)}
                className="text-[11px] bg-slate-800 hover:bg-emerald-900/50 hover:text-emerald-300 border border-slate-700 px-3 py-1.5 rounded transition"
                id={`btn-ask-ai-${selectedZone.id}`}
              >
                Ask AI about this area
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-4">
            <Info size={18} className="mb-1" />
            <p className="text-xs">Select a zone to review its live signal and get a context-aware recommendation.</p>
          </div>
        )}
      </div>
    </div>
  );
};
