import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BrainCircuit,
  ReceiptText,
  PieChart,
  Table,
  BarChart3,
  Landmark,
  Layers,
  LogOut,
} from 'lucide-react';
import { AuthUser } from '@shared/types';

interface SidebarProps {
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const links = [
    { id: 'dashboard',    path: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'transactions', path: '/transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'spreadsheet',  path: '/spreadsheet',  label: 'Spreadsheet',  icon: Table },
    { id: 'reports',      path: '/reports',      label: 'Reports',      icon: BarChart3 },
    { id: 'budgets',      path: '/budgets',      label: 'Budgets',      icon: PieChart },
    { id: 'accounts',     path: '/accounts',     label: 'Accounts',     icon: Landmark },
    { id: 'ai-sandbox',   path: '/ai-sandbox',   label: 'AI Engine',    icon: BrainCircuit },
  ];

  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        backgroundColor: '#181d27',
        borderRight: '1px solid #252b37',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '28px 16px',
        userSelect: 'none',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #bcfc6a 0%, #8c63e6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: 'rgba(188, 252, 106, 0.3) 0px 4px 12px',
            }}
          >
            <Layers style={{ width: '20px', height: '20px', color: '#000000' }} />
          </div>
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
                lineHeight: '1.2',
                letterSpacing: '-0.5px',
              }}
            >
              FlowLedger
            </h1>
            <span
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
                color: '#bcfc6a',
              }}
            >
              v1.0 SaaS Engine
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.id}
                onClick={() => navigate(link.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: '10px',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: isActive ? '1px solid rgba(188, 252, 106, 0.2)' : '1px solid transparent',
                  background: isActive ? 'rgba(188, 252, 106, 0.1)' : 'transparent',
                  color: isActive ? '#bcfc6a' : '#535862',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = '#ffffff';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = '#535862';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }
                }}
              >
                <Icon
                  style={{
                    width: '16px',
                    height: '16px',
                    color: isActive ? '#bcfc6a' : '#535862',
                    flexShrink: 0,
                  }}
                />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile & Logout */}
      {currentUser && (
        <div
          style={{
            borderTop: '1px solid #252b37',
            paddingTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '100px',
                background: 'linear-gradient(135deg, #bcfc6a, #8c63e6)',
                color: '#000000',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#ffffff',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentUser.name}
              </p>
              <p
                style={{
                  fontSize: '11px',
                  color: '#535862',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                }}
              >
                {currentUser.email}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '10px',
              background: '#252b37',
              color: '#ffffff',
              border: '1px solid #252b37',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#2f3849';
              (e.currentTarget as HTMLElement).style.borderColor = '#3a4255';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#252b37';
              (e.currentTarget as HTMLElement).style.borderColor = '#252b37';
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
