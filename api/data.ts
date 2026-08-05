import type { AdminTenantMetric, AuditLogEntry, RosterUser, SystemTelemetry } from '@shared/types';

export const tenants: AdminTenantMetric[] = [
  { tenantName: 'TechCorp Pvt Ltd', usersCount: 42, transactionsThisMonth: 12450, aiParseRequests: 3200, monthlySpendUSD: 249, status: 'active' },
  { tenantName: 'Apex Financial Services', usersCount: 18, transactionsThisMonth: 8900, aiParseRequests: 2100, monthlySpendUSD: 149, status: 'active' },
  { tenantName: 'Chai Stall Chain Solutions', usersCount: 8, transactionsThisMonth: 3400, aiParseRequests: 1800, monthlySpendUSD: 49, status: 'active' },
  { tenantName: 'Global Logistics Corp', usersCount: 110, transactionsThisMonth: 48200, aiParseRequests: 14200, monthlySpendUSD: 899, status: 'active' },
];

export const roster: RosterUser[] = [
  { id: 'u1', name: 'Mehul Solanki', email: 'mehul@flowledger.app', role: 'user', department: 'Finance', status: 'Active' },
  { id: 'u2', name: 'Sarah Jenkins', email: 'sarah.jenkins@techcorp.io', role: 'admin', department: 'Operations', status: 'Active' },
  { id: 'u3', name: 'Alex Rivera', email: 'alex.rivera@flowledger.app', role: 'superadmin', department: 'Executive', status: 'Active' },
  { id: 'u4', name: 'Rohan Sharma', email: 'rohan@techcorp.io', role: 'user', department: 'Accounting', status: 'Active' },
];

export const auditLogs: AuditLogEntry[] = [
  { id: 'log-1', timestamp: '2026-08-02 02:14:02', actor: 'alex.rivera@flowledger.app (Super Admin)', action: 'Rotated Global Qwen API Keys', ip: '192.168.1.104', status: 'Success' },
  { id: 'log-2', timestamp: '2026-08-02 01:52:19', actor: 'sarah.jenkins@techcorp.io (Admin)', action: 'Updated Enterprise Monthly AI Limit to 15,000', ip: '10.0.4.12', status: 'Success' },
  { id: 'log-3', timestamp: '2026-08-02 00:30:11', actor: 'mehul@flowledger.app (User)', action: 'Executed AI Natural Language Parse', ip: '172.16.0.8', status: 'Success' },
];

export const telemetry: SystemTelemetry = {
  gpuLoad: '32%',
  cpuLoad: '14.2%',
  tokensProcessed: '1.42M',
  monthlyMrr: 1346,
  jsonCompliance: '99.2%',
};

export function appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const log: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };
  auditLogs.unshift(log);
  return log;
}
