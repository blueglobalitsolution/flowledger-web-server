import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Server,
  Activity,
  DollarSign,
  Building2,
  Users,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { getAdminTelemetry } from '@shared/api';
import { AdminTelemetryResponse, AuthUser } from '@shared/types';

interface AdminDashboardProps {
  session: { user: AuthUser };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ session }) => {
  const [data, setData] = useState<AdminTelemetryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminTelemetry()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <Activity className="w-4 h-4 animate-spin mr-2" /> Loading telemetry...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-200 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-rose-400" />
        <div>
          <h3 className="font-bold text-sm">Access Denied or Unavailable</h3>
          <p className="text-xs text-rose-300/80">{error || 'No telemetry data received.'}</p>
        </div>
      </div>
    );
  }

  const { tenants, roster, telemetry } = data;
  const isSuperAdmin = session.user.role === 'superadmin';

  return (
    <div className="space-y-6 pb-12 text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Business Admin Dashboard</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                  {session.user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-tenant organization overview for <strong>{session.user.tenantName || 'Your Business'}</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span>Active Session: <strong>{session.user.name}</strong></span>
            <span className="text-slate-400 font-mono">({session.user.email})</span>
          </div>
          <div className="font-mono text-[11px]">
            <span className="text-slate-400">Tenant:</span>{' '}
            <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-semibold text-emerald-300">
              {session.user.tenantName || 'Global Platform'}
            </span>
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-2xl p-4 text-amber-200 text-xs flex items-center gap-3">
          <Cpu className="w-5 h-5 text-amber-400" />
          <span>
            Full multi-tenant visibility active. Super Admin root controls live in the{' '}
            <a href="/superadmin" className="font-bold underline underline-offset-2">Super Admin Portal</a>.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-slate-400 text-xs flex justify-between">
            <span>GPU Load (Ollama Qwen)</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{telemetry.gpuLoad} Load</div>
          <div className="text-[10px] text-slate-400">2.1 GB VRAM / 8.0 GB Allocated</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-slate-400 text-xs flex justify-between">
            <span>FastAPI CPU Load</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{telemetry.cpuLoad}</div>
          <div className="text-[10px] text-slate-400">8 Workers Active on Cloud Run</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-slate-400 text-xs flex justify-between">
            <span>Total AI Tokens Processed</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">{telemetry.tokensProcessed}</div>
          <div className="text-[10px] text-slate-400">{telemetry.jsonCompliance} JSON Mode Compliance</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-slate-400 text-xs flex justify-between">
            <span>Monthly SaaS MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">${telemetry.monthlyMrr.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">{tenants.length} Active Enterprise Business Tenants</div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>SaaS Tenant Businesses ({tenants.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {isSuperAdmin ? 'Full Multi-Tenant Access' : 'Business Tenant View'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                <th className="p-3">Tenant Business Name</th>
                <th className="p-3">Users</th>
                <th className="p-3">Monthly Transactions</th>
                <th className="p-3">AI Requests</th>
                <th className="p-3">MRR ($)</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenants.map((ten) => (
                <tr key={ten.tenantName} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                    <span>{ten.tenantName}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-300">{ten.usersCount}</td>
                  <td className="p-3 font-mono text-slate-300">{ten.transactionsThisMonth.toLocaleString()}</td>
                  <td className="p-3 font-mono text-amber-300">{ten.aiParseRequests.toLocaleString()}</td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">${ten.monthlySpendUSD}</td>
                  <td className="p-3 text-right font-mono">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                      {ten.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Organization User Roster & RBAC Roles</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{roster.length} Accounts Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                <th className="p-3">User Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {roster.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-white">{u.name}</td>
                  <td className="p-3 font-mono text-slate-300">{u.email}</td>
                  <td className="p-3 font-mono">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        u.role === 'superadmin'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : u.role === 'admin'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-400">{u.department}</td>
                  <td className="p-3 text-right font-mono">
                    <span className="text-emerald-400 font-bold">● {u.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
