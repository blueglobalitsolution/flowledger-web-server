import React, { useState } from 'react';
import { User, ShieldCheck, KeyRound, Mail, Lock, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { AuthUser, UserRole } from '@shared/types';
import { login } from '@shared/api';

interface LoginViewProps {
  onLogin: (user: AuthUser) => void;
}

export const DEMO_USERS: Record<UserRole, AuthUser> = {
  user: {
    id: 'usr-001',
    name: 'Mehul Solanki',
    email: 'mehul@flowledger.app',
    role: 'user',
    tenantName: 'Personal Wallet',
    twoFactorEnabled: true,
    biometricRegistered: true,
    plan: 'Pro Plan',
  },
  admin: {
    id: 'usr-002',
    name: 'Sarah Jenkins (TechCorp Admin)',
    email: 'sarah.jenkins@techcorp.io',
    role: 'admin',
    tenantName: 'TechCorp Pvt Ltd',
    twoFactorEnabled: true,
    biometricRegistered: true,
    plan: 'Enterprise Admin',
  },
  superadmin: {
    id: 'usr-003',
    name: 'Alex Rivera (Root Super Admin)',
    email: 'alex.rivera@flowledger.app',
    role: 'superadmin',
    tenantName: 'FlowLedger SaaS Infrastructure',
    twoFactorEnabled: true,
    biometricRegistered: true,
    plan: 'Super Admin Root Access',
  },
};

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(DEMO_USERS.user.email);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  const handleQuickLogin = async () => {
    const userToLogin = DEMO_USERS.user;
    setAuthSuccessMsg(`Successfully authenticated as ${userToLogin.name}`);
    const session = await login(userToLogin.email, userToLogin.role);
    setTimeout(() => {
      onLogin(session.user);
    }, 500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthSuccessMsg(`Login verified for ${email}`);
    const session = await login(email, 'user');
    setTimeout(() => {
      onLogin(session.user);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative text-white animate-fade-in">

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">FlowLedger Sign In</h2>
          </div>
          <p className="text-xs text-slate-400">App User access to your personal financial ledger.</p>
        </div>

        {authSuccessMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{authSuccessMsg}</span>
          </div>
        )}

        {/* current user block removed */}

        <button
          onClick={handleQuickLogin}
          className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 p-3 rounded-xl text-left transition-all cursor-pointer group flex items-center gap-3"
        >
          <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <User className="w-4 h-4" />
          </span>
          <div>
            <div className="text-[11px] font-bold text-emerald-400">One-Click App User</div>
            <div className="text-[10px] text-slate-400 font-mono">{DEMO_USERS.user.email}</div>
          </div>
        </button>

        <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
          <div>
            <label className="block text-slate-400 text-xs mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                defaultValue="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                maxLength={6}
                defaultValue="748201"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
            <button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
