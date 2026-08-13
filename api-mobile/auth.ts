import { Request, Response, Router } from 'express';
import type { AuthSession, AuthUser, UserRole } from '@shared/types';

// Duplicated from main API for the standalone mobile backend
const DEMO_ACCOUNTS: Record<string, AuthUser> = {
  'mehul@flowledger.app': {
    id: 'usr-001',
    name: 'Mehul Solanki',
    email: 'mehul@flowledger.app',
    role: 'user',
    tenantName: 'Personal Wallet',
    twoFactorEnabled: true,
    biometricRegistered: true,
    plan: 'Pro Plan',
  }
};

interface OtpEntry {
  otp: string;
  expiresAt: number;
  verified: boolean;
}
const otpStore = new Map<string, OtpEntry>();

export interface AuthPayload {
  sub: string;
  role: UserRole;
}

export const authRouter: Router = Router();

// Mobile OTP Login - Step 1: Request OTP
authRouter.post('/mobile-login-request', (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  const lowerEmail = (email || '').toLowerCase().trim();

  const user = DEMO_ACCOUNTS[lowerEmail];
  if (!user) {
    return res.status(404).json({ error: 'You are not an authorized user.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 3 * 60 * 1000;
  otpStore.set(lowerEmail, { otp, expiresAt, verified: false });

  console.log(`[MOBILE AUTH] OTP generated for ${lowerEmail}: ${otp}`);
  
  // Return OTP directly in response to simulate a push notification on the device
  res.json({ success: true, message: 'OTP generated', otp });
});

// Mobile OTP Login - Step 2: Verify OTP and Login
authRouter.post('/mobile-login-verify', (req: Request, res: Response) => {
  const { email, otp } = req.body ?? {};
  const lowerEmail = (email || '').toLowerCase().trim();

  const entry = otpStore.get(lowerEmail);
  if (!entry) {
    return res.status(400).json({ error: 'No active OTP session found for this email.' });
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(lowerEmail);
    return res.status(400).json({ error: 'The OTP code has expired.' });
  }
  if (entry.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP code.' });
  }

  // OTP is valid!
  otpStore.delete(lowerEmail);

  const baseUser = DEMO_ACCOUNTS[lowerEmail];
  if (!baseUser) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  const user: AuthUser = {
    ...baseUser,
    id: `usr-${Date.now()}`,
  };

  const token = Buffer.from(JSON.stringify({ sub: user.email, role: user.role } satisfies AuthPayload)).toString('base64');
  const session: AuthSession = { user, token };
  
  res.json(session);
});
