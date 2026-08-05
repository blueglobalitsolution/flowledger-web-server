import { Request, Response, NextFunction, Router } from 'express';
import type { AuthSession, AuthUser, UserRole } from '@shared/types';

const DEMO_ACCOUNTS: Record<UserRole, AuthUser> = {
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

export interface AuthPayload {
  sub: string;
  role: UserRole;
}

export const authRouter: Router = Router();

authRouter.post('/login', (req: Request, res: Response) => {
  const { email, role } = req.body ?? {};
  const requestedRole: UserRole = (['user', 'admin', 'superadmin'] as UserRole[]).includes(role)
    ? role
    : 'user';

  const user: AuthUser = {
    ...DEMO_ACCOUNTS[requestedRole],
    email: email || DEMO_ACCOUNTS[requestedRole].email,
    id: `usr-${Date.now()}`,
  };

  const token = Buffer.from(JSON.stringify({ sub: user.email, role: user.role } satisfies AuthPayload)).toString('base64');

  const session: AuthSession = { user, token };
  res.json(session);
});

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    try {
      const payload = JSON.parse(Buffer.from(header.replace('Bearer ', ''), 'base64').toString()) as AuthPayload;
      if (!roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Insufficient role permissions for this module.' });
      }
      (req as Request & { auth: AuthPayload }).auth = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }
  };
}
