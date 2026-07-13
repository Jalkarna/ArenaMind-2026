import React, { useState } from 'react';
import type { IncidentReport, StaffTask } from '../utils/mockData';
import { sanitizeInput, CSRFProtection } from '../utils/security';
import { AlertOctagon, Plus, ShieldAlert, CheckCircle, Clock, Send, LoaderCircle, Sparkles } from 'lucide-react';

interface IncidentManagerProps {
  incidents: IncidentReport[];
  onAddIncident: (newIncident: IncidentReport, generatedTask?: StaffTask) => void;
  onUpdateIncidentStatus: (id: string, status: 'Open' | 'Investigating' | 'Resolved') => void;
  csrfToken: string;
}

export const IncidentManager: React.FC<IncidentManagerProps> = ({
  incidents,
  onAddIncident,
  onUpdateIncidentStatus,
  csrfToken,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'MAJOR' | 'MINOR'>('ALL');
  const [isReporting, setIsReporting] = useState(false);

  const [category, setCategory] = useState<'Crowd' | 'Facilities' | 'Security' | 'Medical'>('Security');
  const [location, setLocation] = useState('Gate A (North Entry)');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isTriaging, setIsTriaging] = useState(false);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanDesc = sanitizeInput(description.trim());
    if (!cleanDesc) {
      setFormError('Please enter a description for the incident.');
      return;
    }

    if (cleanDesc.length > 250) {
      setFormError('Description cannot exceed 250 characters.');
      return;
    }

    if (!CSRFProtection.validateToken(csrfToken)) {
      setFormError('Security validation failure (Invalid CSRF Token). Operation aborted.');
      return;
    }

    setIsTriaging(true);
    let severity: 'CRITICAL' | 'MAJOR' | 'MINOR' = 'MINOR';
    let recommendedAction = 'Assess area and coordinate with nearby section staff.';
    let taskTitle = `Check ${category} issue at ${location.split(' ')[0]}`;

    try {
      const response = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, location, description: cleanDesc })
      });
      if (!response.ok) throw new Error('AI Triage API failed');
      const triaged = await response.json();
      severity = triaged.severity || 'MINOR';
      recommendedAction = triaged.recommendedAction || recommendedAction;
      taskTitle = triaged.taskTitle || taskTitle;
    } catch (err) {
      console.warn('[AI Triage Fallback] Using offline semantic rules:', err);
      const descLower = cleanDesc.toLowerCase();
      if (descLower.includes('fight') || descLower.includes('weapon') || descLower.includes('fire') || descLower.includes('collapse') || descLower.includes('smoke') || descLower.includes('emergency')) {
        severity = 'CRITICAL';
        recommendedAction = 'Deploy Emergency Security Squad. Clear nearby pathways. Broadcast evacuation or safety alert.';
        taskTitle = `CRITICAL: Clear gate/stairs at ${location.split(' ')[0]}`;
      } else if (descLower.includes('crowd') || descLower.includes('rush') || descLower.includes('stampede') || descLower.includes('blocked') || descLower.includes('turnstile')) {
        severity = 'MAJOR';
        recommendedAction = 'Dispatch 3 additional stewards. Configure temporary queues. Update stadium screens to bypass gates.';
        taskTitle = `MAJOR: Re-route crowds at ${location.split(' ')[0]}`;
      } else if (descLower.includes('medical') || descLower.includes('heart') || descLower.includes('faint') || descLower.includes('hurt') || descLower.includes('injury')) {
        severity = 'CRITICAL';
        recommendedAction = 'Deploy EMS response team with trauma bag and stretcher immediately.';
        taskTitle = `CRITICAL MEDICAL: Aid fan at ${location.split(' ')[0]}`;
      } else if (descLower.includes('leak') || descLower.includes('spill') || descLower.includes('broken') || descLower.includes('toilet') || descLower.includes('water')) {
        severity = 'MINOR';
        recommendedAction = 'Dispatch maintenance/sanitation crew with cleanup gear.';
        taskTitle = `Sanitation: Clean spill/repair at ${location.split(' ')[0]}`;
      }
    } finally {
      setIsTriaging(false);
    }

    const newId = `inc-${Date.now().toString().slice(-4)}`;
    const newInc: IncidentReport = {
      id: newId,
      category,
      severity,
      location,
      description: cleanDesc,
      reportedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Open',
      recommendedAction
    };

    const newTask: StaffTask = {
      id: `task-${Date.now().toString().slice(-4)}`,
      title: taskTitle,
      category: `${category} Dispatch`,
      location,
      status: 'Unassigned',
      priority: severity === 'CRITICAL' ? 'HIGH' : severity === 'MAJOR' ? 'MEDIUM' : 'LOW',
      createdAt: newInc.reportedTime
    };

    onAddIncident(newInc, newTask);
    setDescription('');
    setIsReporting(false);
  };

  const getSeverityBadgeClass = (severity: 'CRITICAL' | 'MAJOR' | 'MINOR') => {
    switch (severity) {
      case 'CRITICAL': return 'bg-rose-950/80 text-rose-300 border border-rose-800 animate-pulse';
      case 'MAJOR': return 'bg-amber-950/80 text-amber-300 border border-amber-800';
      case 'MINOR': return 'bg-slate-900 text-slate-400 border border-slate-800';
    }
  };

  const getStatusIcon = (status: 'Open' | 'Investigating' | 'Resolved') => {
    switch (status) {
      case 'Open': return <AlertOctagon size={14} className="text-rose-500" />;
      case 'Investigating': return <Clock size={14} className="text-amber-500 animate-spin" />;
      case 'Resolved': return <CheckCircle size={14} className="text-emerald-500" />;
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filterSeverity === 'ALL') return true;
    return inc.severity === filterSeverity;
  });

  return (
    <div className="card glass-card incident-card flex flex-col">
      <div className="card-header border-b pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-rose-500" size={20} />
          <h2 className="card-title text-lg font-bold">Live Operations Incident Log</h2>
        </div>
        <button
          onClick={() => setIsReporting(!isReporting)}
          className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded transition flex items-center gap-1"
          id="btn-toggle-report"
        >
          <Plus size={14} />
          {isReporting ? 'Close Form' : 'Report Incident'}
        </button>
      </div>

      {isReporting ? (
        /* Report Form (incorporating CSRF inputs - CWE-352) */
        <form onSubmit={handleCreateIncident} className="reporting-form space-y-3 p-3 bg-slate-950/60 border border-rose-950/30 rounded-lg">
          <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-1.5">
            <AlertOctagon size={16} /> File New Stadium Operations Report
          </h3>
          
          <input type="hidden" name="_csrf" value={csrfToken} />

          {formError && (
            <div className="p-2 bg-rose-950/50 border border-rose-900 rounded text-xs text-rose-300" id="form-error">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IncidentReport['category'])}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
                id="inc-category"
              >
                <option value="Security">Security / Police</option>
                <option value="Medical">Medical / First Aid</option>
                <option value="Crowd">Crowd Flow / Gates</option>
                <option value="Facilities">Facilities / Sanitation</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
                id="inc-location"
              >
                <option value="Gate A (North Entry)">Gate A (North)</option>
                <option value="Gate C (East Entry)">Gate C (East)</option>
                <option value="Gate D (South Entry)">Gate D (South)</option>
                <option value="Gate E (West Entry - Accessible)">Gate E (Accessible)</option>
                <option value="Section 104 Concession">Section 104 Concession</option>
                <option value="Section 212 Entrance">Section 212 Entrance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Ticket scanner failure causing queue backlog, or Medical emergency in Section 212"
              className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 outline-none focus:border-rose-700 transition"
              maxLength={250}
              id="inc-description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReporting(false)}
              className="px-3 py-1.5 text-xs border border-slate-800 hover:bg-slate-900 rounded transition text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTriaging}
              className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-bold rounded transition flex items-center gap-1"
              id="btn-submit-incident"
            >
              {isTriaging ? (
                <>
                  <LoaderCircle size={12} className="animate-spin" /> Triaging...
                </>
              ) : (
                <>
                  <Send size={12} /> Submit & Triage
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Incidents viewport */
        <div className="flex-grow flex flex-col min-h-[220px]">
          {/* Filters */}
          <div className="flex items-center gap-1 mb-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Severity:</span>
            {(['ALL', 'CRITICAL', 'MAJOR', 'MINOR'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                  filterSeverity === sev
                    ? 'bg-rose-950 text-rose-400 border-rose-800'
                    : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-2 max-h-[280px] scrollbar-thin">
            {filteredIncidents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No active incidents matching selection.</div>
            ) : (
              filteredIncidents.map(inc => (
                <div
                  key={inc.id}
                  className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-lg hover:border-slate-700 transition flex flex-col gap-2"
                  id={`inc-item-${inc.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${getSeverityBadgeClass(inc.severity)}`}>
                        {inc.severity}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">[{inc.reportedTime}]</span>
                      <span className="text-xs text-slate-300 font-semibold">{inc.location.split(' ')[0]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        {getStatusIcon(inc.status)}
                        {inc.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-normal">{inc.description}</p>

                  {/* GenAI Smart Recommendations */}
                  {inc.recommendedAction && (
                    <div className="p-2 bg-emerald-950/20 border border-emerald-900/30 rounded text-[11px] text-emerald-400 leading-normal flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 flex items-center gap-1">
                        <Sparkles size={11} /> GenAI tactical plan
                      </span>
                      {inc.recommendedAction}
                    </div>
                  )}

                  {/* Operator Action Panel */}
                  <div className="flex justify-end gap-1.5 pt-1 border-t border-slate-800/40">
                    <select
                      value={inc.status}
                      onChange={(e) => onUpdateIncidentStatus(inc.id, e.target.value as IncidentReport['status'])}
                      className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded px-2 py-0.5 outline-none"
                      id={`status-select-${inc.id}`}
                    >
                      <option value="Open">Open</option>
                      <option value="Investigating">Investigating</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
