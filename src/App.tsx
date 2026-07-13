import { lazy, Suspense, useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import {
  initialGates,
  initialIncidents,
  initialTasks,
  initialTransit
} from './utils/mockData';
import type {
  GateInfo,
  TransitInfo,
  IncidentReport,
  StaffTask
} from './utils/mockData';
import { SessionManager, CSRFProtection } from './utils/security';
import type { SecureSession } from './utils/security';
import { Bell, ShieldCheck, Signal, ChevronDown } from 'lucide-react';

const FanHub = lazy(() => import('./components/FanHub').then(module => ({ default: module.FanHub })));
const OpsCommand = lazy(() => import('./components/OpsCommand').then(module => ({ default: module.OpsCommand })));

function App() {
  const [role, setRole] = useState<'home' | 'fan' | 'operator'>('home');
  const [session, setSession] = useState<SecureSession | null>(null);
  const [csrfToken, setCsrfToken] = useState('');

  const [gates, setGates] = useState<GateInfo[]>(initialGates);
  const [transit] = useState<TransitInfo[]>(initialTransit);
  const [incidents, setIncidents] = useState<IncidentReport[]>(initialIncidents);
  const [tasks, setTasks] = useState<StaffTask[]>(initialTasks);

  const [notificationsCount, setNotificationsCount] = useState(2);

  useEffect(() => {
    const token = CSRFProtection.generateToken();
    setCsrfToken(token);

    const activeUser = SessionManager.startSession({
      userId: 'user-diego-142',
      role: 'operator',
      userName: 'Diego Rossi',
      ticketId: 'TK-992F'
    });
    setSession(activeUser);
  }, []);

  const handleAddIncident = (newIncident: IncidentReport, generatedTask?: StaffTask) => {
    setIncidents(prev => [newIncident, ...prev]);
    setNotificationsCount(prev => prev + 1);

    if (generatedTask) {
      setTasks(prev => [generatedTask, ...prev]);
    }
  };

  const handleUpdateIncidentStatus = (id: string, status: 'Open' | 'Investigating' | 'Resolved') => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { ...inc, status };
      }
      return inc;
    }));
  };

  const handleAssignTask = (taskId: string, staffName: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'In Progress', assignedTo: staffName };
      }
      return t;
    }));
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: 'Completed' };
      }
      return t;
    }));
  };

  if (role === 'home') {
    return <LandingPage onEnter={setRole} />;
  }

  return (
    <div className="app-root flex flex-row min-h-screen bg-[#030712] text-slate-100 antialiased selection:bg-emerald-950 selection:text-emerald-300">
      <a className="skip-link" href="#workspace-content">Skip to workspace</a>

      <Navigation
        currentRole={role}
        setRole={(newRole) => {
          setCsrfToken(CSRFProtection.rotateToken());
          setRole(newRole);
        }}
        session={session}
        notificationsCount={notificationsCount}
      />

      <div className="main-content-wrapper flex flex-col flex-grow">
        <header className="workspace-topbar">
          <div className="workspace-context">
            <span className="live-dot" aria-hidden="true" />
            <span className="workspace-context-label">Matchday operations</span>
            <span className="workspace-divider" aria-hidden="true" />
            <span className="workspace-venue">MetLife Stadium · East Rutherford</span>
          </div>
          <div className="workspace-actions">
            <span className="workspace-sync"><Signal size={14} /> Synced 20:08:42</span>
            <button className="topbar-icon-button" aria-label="View notifications"><Bell size={16} /><span className="notification-dot" /></button>
            <button className="operator-chip" aria-label="Open operator menu"><span>DR</span><span>Diego Rossi</span><ChevronDown size={14} /></button>
          </div>
        </header>
        <main className="flex-grow p-4" id="workspace-content">
          <Suspense fallback={<div className="workspace-loading" role="status">Loading live venue workspace...</div>}>
            {role === 'fan' ? (
              <FanHub
                session={session}
                gates={gates}
                transit={transit}
                activeIncidents={incidents}
              />
            ) : (
              <OpsCommand
                session={session}
                gates={gates}
                setGates={setGates}
                transit={transit}
                incidents={incidents}
                onAddIncident={handleAddIncident}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                tasks={tasks}
                onAssignTask={handleAssignTask}
                onCompleteTask={handleCompleteTask}
                csrfToken={csrfToken}
              />
            )}
          </Suspense>
        </main>

        <footer className="workspace-footer w-full py-4 px-6 border-t border-slate-900 bg-slate-950/80 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <ShieldCheck size={12} className="text-emerald" />
            <span>ArenaMind 2026 operations node. Simulated venue feed.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Decision mode: <strong className="text-emerald">Human approval</strong></span>
            <span>AI fallback: <strong className="text-emerald">Available offline</strong></span>
            <span>Version: <strong>2.0.0</strong></span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
