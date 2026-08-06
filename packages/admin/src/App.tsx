import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Shield, ShieldCheck, ArrowRight, LogIn, User, Crown } from 'lucide-react';
import { login, logout, getStoredSession, storeSession } from '@shared/api';
import { AuthSession, UserRole } from '@shared/types';
import { AdminDashboard } from './components/AdminDashboard';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const stored = getStoredSession();
    if (stored && (stored.user.role === 'admin' || stored.user.role === 'superadmin')) return stored;
    return null;
  });

  const handleLogin = (role: UserRole) => {
    login('admin@flowledger.app', role)
      .then((sess) => {
        storeSession(sess);
        setSession(sess);
      })
      .catch((err) => {
        console.error('Login failed:', err);
        setSession(null);
      });
  };

  const handleLogout = () => {
    logout();
    setSession(null);
  };

  return (
    <BrowserRouter basename="/admin">
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3 text-white shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-lg tracking-tight flex items-center gap-2">
                  FlowLedger <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-medium border border-indigo-500/30">Admin Dashboard</span>
                </div>
                <p className="text-xs text-slate-400">Business & Tenant Management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {session && (
                <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs">
                  <span className="font-mono text-slate-300">
                    {session.user.name.split(' ')[0]}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[10px] uppercase font-bold">
                    {session.user.role}
                  </span>
                </div>
              )}
              <a
                href="/"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-md"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                <span>Back to App</span>
              </a>
              {session && (
                <button
                  onClick={handleLogout}
                  className="bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-slate-950 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-6 pb-12">
          <Routes>
            <Route path="/" element={
              session ? (
                <AdminDashboard session={session} />
              ) : (
                <div className="max-w-md mx-auto mt-10">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl text-center">
                    <div className="flex justify-center">
                      <span className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        <ShieldCheck className="w-8 h-8" />
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">Admin Sign In</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Access requires an <strong className="text-indigo-300">Admin</strong> or{' '}
                        <strong className="text-amber-300">Super Admin</strong> role.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => handleLogin('admin')}
                        className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Sign in as Business Admin</span>
                      </button>
                      <button
                        onClick={() => handleLogin('superadmin')}
                        className="w-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Crown className="w-4 h-4" />
                        <span>Sign in as Super Admin</span>
                      </button>
                      <button
                        onClick={() => handleLogin('user')}
                        className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <User className="w-4 h-4" />
                        <span>Sign in as App User (role guard demo)</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1">
                      <LogIn className="w-3 h-3" /> Demo auth — API enforces role server-side
                    </p>
                  </div>
                </div>
              )
            } />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
