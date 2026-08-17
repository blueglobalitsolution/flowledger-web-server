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
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
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

  const navGroups = [
    {
      title: 'Core Platform',
      items: [
        { id: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'transactions', path: '/transactions', label: 'Transactions', icon: ReceiptText, badge: 'Live' },
        { id: 'spreadsheet', path: '/spreadsheet', label: 'Spreadsheet', icon: Table },
      ],
    },
    {
      title: 'Financials & Analytics',
      items: [
        { id: 'reports', path: '/reports', label: 'Reports', icon: BarChart3, badge: 'PDF' },
        { id: 'budgets', path: '/budgets', label: 'Budgets', icon: PieChart },
        { id: 'accounts', path: '/accounts', label: 'Accounts', icon: Landmark },
      ],
    },
    {
      title: 'AI Intelligence',
      items: [
        { id: 'ai-sandbox', path: '/ai-sandbox', label: 'AI Engine', icon: BrainCircuit, badge: 'Qwen 2.5' },
      ],
    },
  ];

  return (
    <aside className="w-64 min-h-screen bg-[#181d27] border-r border-[#252b37] flex flex-col justify-between p-5 select-none font-sans relative z-20 shrink-0">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-[#bcfc6a]/20 shrink-0">
            <img src="/logo.png" alt="FlowLedger" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              FlowLedger
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#bcfc6a] animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-[#bcfc6a]">
                SaaS Gateway v1.0
              </span>
            </div>
          </div>
        </div>

        {/* Categorized Navigation */}
        <nav className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1.5">
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#535862] font-semibold px-2">
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((link) => {
                  const Icon = link.icon;
                  const isActive = currentPath === link.path;
                  return (
                    <button
                      key={link.id}
                      onClick={() => navigate(link.path)}
                      className={`group relative w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-[rgba(188,252,106,0.12)] to-[rgba(140,99,230,0.08)] text-[#bcfc6a] border border-[#bcfc6a]/25 shadow-md shadow-[#bcfc6a]/5'
                          : 'text-[#e2e8f0]/70 hover:text-white hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      {/* Active Left Accent Glow Pill */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#bcfc6a] rounded-r-full shadow-sm shadow-[#bcfc6a]" />
                      )}

                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? 'text-[#bcfc6a]'
                              : 'text-[#535862] group-hover:text-white'
                          }`}
                        />
                        <span>{link.label}</span>
                      </div>

                      {link.badge && (
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? 'bg-[#bcfc6a]/20 text-[#bcfc6a] border border-[#bcfc6a]/30'
                              : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile & Logout Footer */}
      {currentUser && (
        <div className="pt-4 border-t border-[#252b37] space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#bcfc6a] to-[#8c63e6] text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-md shrink-0">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                <span>{currentUser.name}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                {currentUser.email}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#252b37] hover:bg-[#2f3849] border border-slate-700/60 text-slate-200 hover:text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
