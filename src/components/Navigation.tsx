import React from 'react';
import { ShieldCheck, LogOut, Compass, LayoutDashboard, LandPlot } from 'lucide-react';
import { SessionManager } from '../utils/security';
import type { SecureSession } from '../utils/security';

interface NavigationProps {
  currentRole: 'home' | 'fan' | 'operator';
  setRole: (role: 'home' | 'fan' | 'operator') => void;
  session: SecureSession | null;
  notificationsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentRole,
  setRole,
  session,
  notificationsCount,
}) => {
  return (
    <header className="sidebar-container">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <span className="logo-icon"><LandPlot size={18} aria-hidden="true" /></span>
          <h1 className="logo-title">
            Arena<span className="highlight">Mind</span>
          </h1>
        </div>
        <div className="fifa-badge">FIFA World Cup 2026</div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-menu" aria-label="Workspace views">

        <button
          className={`menu-item ${currentRole === 'fan' ? 'active' : ''}`}
          onClick={() => setRole('fan')}
          id="btn-fan-hub"
          title="Fan Experience Hub"
        >
          <Compass size={18} />
          <span>Fan Hub</span>
        </button>

        <button
          className={`menu-item ${currentRole === 'operator' ? 'active' : ''}`}
          onClick={() => setRole('operator')}
          id="btn-ops-command"
          title="Operations Command Center"
        >
          <LayoutDashboard size={18} />
          <span>Ops Command</span>
          {notificationsCount > 0 && (
            <span className="menu-badge">{notificationsCount}</span>
          )}
        </button>
      </nav>

      {/* Security Status Box */}
      <div className="security-status-badge sidebar-security" aria-label="Workspace security status">
        <div className="sec-header">
          <ShieldCheck size={14} className="text-emerald" />
          <span>Secure Mode</span>
        </div>
        <div className="sec-body font-mono text-[9px] text-slate-500">
          <div>Action token active</div>
          <div className="text-emerald truncate">Rotates on workspace change</div>
        </div>
      </div>

      {/* Bottom Profile Section */}
      {session && (
        <div className="sidebar-profile">
          <div className="flex items-center gap-2">
            <div className="profile-avatar">
              {session.userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="profile-details">
              <span className="username">{session.userName}</span>
              <span className="user-role">{session.role.toUpperCase()}</span>
            </div>
          </div>
          <button
            onClick={() => SessionManager.endSession()}
            className="sidebar-logout-btn"
            id="btn-logout"
            title="Sign out securely"
            aria-label="Sign out securely"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
};
