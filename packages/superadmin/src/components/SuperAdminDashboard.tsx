import React, { useCallback, useEffect, useState } from 'react';
import {
  Crown,
  Building2,
  KeyRound,
  Database,
  Plus,
  CheckCircle2,
  AlertCircle,
  Lock,
  Users,
  Cpu,
  Activity,
} from 'lucide-react';
import { createTenant, getSuperAdminTelemetry, rotateApiKeys, triggerBackup } from '@shared/api';
import { AuthUser, SuperAdminTelemetryResponse } from '@shared/types';

interface SuperAdminDashboardProps {
  session: { user: AuthUser };
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ session }) => {
  const [data, setData] = useState<SuperAdminTelemetryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newTenantName, setNewTenantName] = useState('');
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(() => {
    getSuperAdminTelemetry()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadData, [loadData]);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    try {
      const res = await createTenant(newTenantName);
      setActionMsg({ type: 'success', text: res.message });
      setNewTenantName('');
      setIsAddingTenant(false);
      loadData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  const handleAction = async (fn: () => Promise<{ message: string }>) => {
    try {
      const res = await fn();
      setActionMsg({ type: 'success', text: res.message });
      loadData();
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        <Activity className="w-4 h-4 animate-spin mr-2" /> Loading root telemetry...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-200 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-rose-400" />
        <div>
          <h3 className="font-bold text-sm">Root Access Denied</h3>
          <p className="text-xs text-rose-300/80">{error || 'No telemetry data received.'}</p>
        </div>
      </div>
    );
  }

  const { tenants, auditLogs, telemetry } = data;

  return (
    <div className="space-y-6 pb-12 text-white">
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Crown className="w-5 h-5 text-amber-400" />
            <span>Super Admin Master System Controls</span>
          </div>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/40 font-mono font-bold">
            ROOT PERMISSIONS ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setIsAddingTenant(true)}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New SaaS Tenant</span>
          </button>
          <button
            onClick={() => handleAction(rotateApiKeys)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Rotate Global API Keys</span>
          </button>
          <button
            onClick={() => handleAction(triggerBackup)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Trigger Multi-Tenant DB Backup</span>
          </button>
        </div>

        {isAddingTenant && (
          <form onSubmit={handleAddTenant} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 animate-fade-in">
            <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Provision New Enterprise Tenant Business
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="e.g., Acme Global Industries Ltd."
                value={newTenantName}
                onChange={(e) => setNewTenantName(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
              <button type="submit" className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer hover:bg-emerald-400 transition-all">
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTenant(false)}
                className="bg-slate-800 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs cursor-pointer hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {actionMsg && (
          <div
            className={`p-3 border rounded-xl text-xs font-bold flex items-center gap-2 ${
              actionMsg.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}
          >
            {actionMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{actionMsg.text}</span>
          </div>
        )}

        <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-3 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>Root Session: <strong className="text-amber-300">{session.user.email}</strong></span>
          <span>Tenant: <strong className="text-emerald-300">{session.user.tenantName || 'Global SaaS Platform'}</strong></span>
        </div>
      </div>

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
            <span>AI Tokens Processed</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">{telemetry.tokensProcessed}</div>
          <div className="text-[10px] text-slate-400">{telemetry.jsonCompliance} JSON Mode Compliance</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-slate-400 text-xs flex justify-between">
            <span>Active Tenants</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{tenants.length}</div>
          <div className="text-[10px] text-slate-400">Cross-tenant root visibility</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="text-slate-400 text-xs flex justify-between">
            <span>Monthly SaaS MRR</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">${telemetry.monthlyMrr.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">Aggregated platform billing</div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>All SaaS Tenant Businesses ({tenants.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Full Multi-Tenant Access</span>
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

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Security Audit Log & Authentication Events</span>
        </h3>

        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="space-y-0.5">
                <div className="text-slate-200 font-bold">{log.action}</div>
                <div className="text-[10px] text-slate-400">{log.actor} • IP: {log.ip}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[10px] block">{log.timestamp}</span>
                <span className="text-emerald-400 font-bold text-[10px]">● {log.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Platform RBAC Roster</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">{data.roster.length} Accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono">
                <th className="p-3">User Name</th>
                <th className="p-3">Email Address</th>
                <th className="p-3">Role</th>
                <th className="p-3">Department</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.roster.map((u) => (
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
