import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { FanHub } from './components/FanHub';
import { OpsCommand } from './components/OpsCommand';
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
import { SessionManager, CSRFProtection, verifySecurityHeaders } from './utils/security';
import type { SecureSession } from './utils/security';
import { Bell, ShieldCheck, Signal, ChevronDown } from 'lucide-react';

function App() {
  const [role, setRole] = useState<'fan' | 'operator'>('fan');
  const [session, setSession] = useState<SecureSession | null>(null);
  const [csrfToken, setCsrfToken] = useState('');
  
  // Operations Mock State
  const [gates, setGates] = useState<GateInfo[]>(initialGates);
  const [transit] = useState<TransitInfo[]>(initialTransit);
  const [incidents, setIncidents] = useState<IncidentReport[]>(initialIncidents);
  const [tasks, setTasks] = useState<StaffTask[]>(initialTasks);
  
  const [notificationsCount, setNotificationsCount] = useState(2);

  // Initialize Session and Security Tokens (CWE-384 / CWE-352)
  useEffect(() => {
    // Generate secure CSRF token
    const token = CSRFProtection.generateToken();
    setCsrfToken(token);

    // Start a secure user session
    const activeUser = SessionManager.startSession({
      userId: 'user-diego-142',
      role: 'operator',
      userName: 'Diego Rossi',
      ticketId: 'TK-992F'
    });
    setSession(activeUser);

    // Verify security configuration logs
    const headers = verifySecurityHeaders();
    console.log('[Security Monitor] App initialized with security controls:', headers);
  }, []);

  // Handlers for state-changing operations
  const handleAddIncident = (newIncident: IncidentReport, generatedTask?: StaffTask) => {
    setIncidents(prev => [newIncident, ...prev]);
    
    // Automatically trigger notification badge for ops staff
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

  return (
    <div className="app-root flex flex-row min-h-screen bg-[#030712] text-slate-100 antialiased selection:bg-emerald-950 selection:text-emerald-300">
      
      {/* Left Sidebar Menu */}
      <Navigation
        currentRole={role}
        setRole={(newRole) => {
          // Rotate CSRF token on role change as defense-in-depth security practice
          setCsrfToken(CSRFProtection.rotateToken());
          setRole(newRole);
        }}
        session={session}
        csrfToken={csrfToken}
        notificationsCount={notificationsCount}
      />

      {/* Right Column Layout Wrapper */}
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
        {/* Main viewport */}
        <main className="flex-grow p-4">
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
        </main>

        {/* Footer detailing security & performance specs */}
        <footer className="workspace-footer w-full py-4 px-6 border-t border-slate-900 bg-slate-950/80 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-500 gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <ShieldCheck size={12} className="text-emerald" />
            <span>StadiuMind 2026 Virtual Operations Node. Secure Sandbox Environment.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Latency: <strong className="text-emerald">3ms</strong></span>
            <span>Security Level: <strong className="text-emerald">FIPS 140-2 Compliant (Simulated)</strong></span>
            <span>Version: <strong>1.4.2-stable</strong></span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
