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
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', path: '/transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'spreadsheet', path: '/spreadsheet', label: 'Spreadsheet', icon: Table },
    { id: 'reports', path: '/reports', label: 'Reports', icon: BarChart3 },
    { id: 'budgets', path: '/budgets', label: 'Budgets', icon: PieChart },
    { id: 'accounts', path: '/accounts', label: 'Accounts', icon: Landmark },
    { id: 'ai-sandbox', path: '/ai-sandbox', label: 'AI Engine', icon: BrainCircuit },
  ];

  return (
    <aside className="w-[260px] min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6 select-none font-sans text-white">
      {/* Brand logo & header */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight leading-none text-white">
              FlowLedger
            </h1>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">
              v1.0 SaaS Engine
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.id}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg font-medium text-xs transition-all cursor-pointer text-left ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User profile / Logout at the bottom */}
      {currentUser && (
        <div className="border-t border-slate-850 pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-450 truncate font-mono">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-white border border-slate-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-white" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
