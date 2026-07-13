import React from 'react';
import { ShieldCheck, User, Users, LogOut, Bell } from 'lucide-react';
import { SessionManager } from '../utils/security';
import type { SecureSession } from '../utils/security';

interface NavigationProps {
  currentRole: 'fan' | 'operator';
  setRole: (role: 'fan' | 'operator') => void;
  session: SecureSession | null;
  csrfToken: string;
  notificationsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentRole,
  setRole,
  session,
  csrfToken,
  notificationsCount,
}) => {
  return (
    <header className="navbar-container">
      <div className="navbar-brand">
        <div className="brand-logo">
          <span className="logo-icon">🏟️</span>
          <h1 className="logo-title">
            Arena<span className="highlight">Mind</span> <span className="version">2026</span>
          </h1>
        </div>
        <div className="fifa-badge">FIFA World Cup Venue Assistant</div>
      </div>

      <div className="navbar-actions">
        {/* Security Shield Banner - Displays active security controls (CWE-200 / Security transparency) */}
        <div className="security-status-badge tooltip" data-tooltip="Active CSP, HTTPS, and CSRF Shield enabled">
          <ShieldCheck size={16} className="text-emerald animate-pulse" />
          <span className="sec-label">Secure Mode</span>
          <span className="sec-details text-xs">
            CSRF: <code className="text-emerald">{csrfToken.slice(0, 8)}...</code>
          </span>
        </div>

        {/* View Switcher */}
        <div className="view-switcher">
          <button
            className={`switch-btn ${currentRole === 'fan' ? 'active' : ''}`}
            onClick={() => setRole('fan')}
            title="Switch to Fan & Visitor Experience Hub"
            id="btn-fan-hub"
          >
            <User size={15} />
            <span>Fan Hub</span>
          </button>
          <button
            className={`switch-btn ${currentRole === 'operator' ? 'active' : ''}`}
            onClick={() => setRole('operator')}
            title="Switch to Operations Command Center"
            id="btn-ops-command"
          >
            <Users size={15} />
            <span>Ops Command</span>
          </button>
        </div>

        {/* User Session Info */}
        {session && (
          <div className="user-profile">
            <div className="profile-details">
              <span className="username">{session.userName}</span>
              <span className="user-role badge-blue">{session.role.toUpperCase()}</span>
            </div>
            {notificationsCount > 0 && (
              <div className="notification-bell relative cursor-pointer">
                <Bell size={18} className="text-gray-300 hover:text-emerald" />
                <span className="bell-badge">{notificationsCount}</span>
              </div>
            )}
            <button
              onClick={() => SessionManager.endSession()}
              className="logout-btn tooltip"
              data-tooltip="Logout and clear secure memory"
              id="btn-logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
