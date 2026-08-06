import React from 'react';
import { Cpu, Activity, Layers, User, Shield, Crown, LogIn } from 'lucide-react';
import { AIEngineConfig, AuthUser } from '@shared/types';

interface NavbarProps {
  activeEngine: AIEngineConfig;
  quickParseCount: number;
  currentUser: AuthUser | null;
  lastSyncedAt: Date | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeEngine,
  quickParseCount,
  currentUser,
  lastSyncedAt,
  onLogout,
}) => {
  const syncedLabel = lastSyncedAt
    ? `Live • ${lastSyncedAt.toLocaleTimeString()}`
    : 'Live';
  return (
    <header id="flowledger-navbar" className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3 text-white shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
                FlowLedger <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium border border-emerald-500/30">v1.0 SaaS</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">AI-Powered Financial Engine • Modular Model Service</p>
          </div>
        </div>

        {/* AI Engine Layer Badge, Metrics & User Auth Profile Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div id="ai-engine-selector-container" className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs" title={activeEngine.description}>
            <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-400 font-medium">AI Engine:</span>
            <span className="font-semibold text-emerald-300">{activeEngine.name}</span>
            <span className="text-[10px] font-mono text-slate-500">({activeEngine.latencyMs}ms)</span>
          </div>

          {/* Quick Metrics */}
          <div className="hidden lg:flex items-center gap-3 text-xs border-l border-slate-800 pl-3">
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Parsed: <strong className="text-white font-mono">{quickParseCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/30" title="Auto-updates when data changes on any device">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono">{syncedLabel}</span>
            </div>
          </div>

          {/* User / Admin / Super Admin Login Profile Pill */}
          <button
            onClick={currentUser ? onLogout : undefined}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-md group"
          >
            {currentUser ? (
              <>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] border border-emerald-500/30">
                  {currentUser.role === 'superadmin' ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  ) : currentUser.role === 'admin' ? (
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <div className="text-left font-mono leading-tight">
                  <div className="font-bold text-white text-[11px] group-hover:text-emerald-300">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold">
                    {currentUser.role === 'superadmin'
                      ? '👑 Super Admin'
                      : currentUser.role === 'admin'
                      ? '🛡️ Admin'
                      : '👤 User'}
                  </div>
                </div>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">Login / Roles</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

