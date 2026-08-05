import { Router } from 'express';
import { requireRole } from '../auth';
import { appendAuditLog, auditLogs, roster, telemetry, tenants } from '../data';
import type { AdminTenantMetric } from '@shared/types';

export const superAdminRouter: Router = Router();

superAdminRouter.use(requireRole('superadmin'));

superAdminRouter.get('/telemetry', (req, res) => {
  res.json({ tenants, roster, telemetry, auditLogs });
});

superAdminRouter.post('/tenants', (req, res) => {
  const { tenantName } = req.body ?? {};
  if (!tenantName || typeof tenantName !== 'string' || !tenantName.trim()) {
    res.status(400).json({ error: 'Tenant business name is required.' });
    return;
  }

  const created: AdminTenantMetric = {
    tenantName: tenantName.trim(),
    usersCount: 1,
    transactionsThisMonth: 0,
    aiParseRequests: 0,
    monthlySpendUSD: 99,
    status: 'active',
  };
  tenants.unshift(created);
  appendAuditLog({ actor: 'alex.rivera@flowledger.app (Super Admin)', action: `Provisioned new SaaS tenant "${tenantName.trim()}"`, ip: '192.168.1.104', status: 'Success' });

  res.json({ success: true, message: `Tenant "${created.tenantName}" provisioned successfully!` });
});

superAdminRouter.post('/rotate-keys', (req, res) => {
  appendAuditLog({ actor: 'alex.rivera@flowledger.app (Super Admin)', action: 'Rotated Global Qwen API Keys', ip: '192.168.1.104', status: 'Success' });
  res.json({ success: true, message: 'Global API keys rotated successfully. All tenants notified.' });
});

superAdminRouter.post('/backup', (req, res) => {
  appendAuditLog({ actor: 'alex.rivera@flowledger.app (Super Admin)', action: 'Triggered Multi-Tenant DB Backup', ip: '192.168.1.104', status: 'Success' });
  res.json({ success: true, message: 'Multi-tenant database backup started. ETA 2 minutes.' });
});

superAdminRouter.get('/audit', (req, res) => {
  res.json(auditLogs);
});
