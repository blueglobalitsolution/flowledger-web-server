import { Router } from 'express';
import { requireRole } from '../auth';
import { roster, telemetry, tenants } from '../data';

export const adminRouter: Router = Router();

adminRouter.use(requireRole('admin', 'superadmin'));

adminRouter.get('/telemetry', (req, res) => {
  res.json({ tenants, roster, telemetry });
});
