import { Request, Response, NextFunction, Router } from 'express';
import type { AuthSession, AuthUser, UserRole } from '@shared/types';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Helper to load environment variables from .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0]?.trim();
    const value = parts.slice(1).join('=').trim();
    if (key && value) {
      process.env[key] = value.replace(/(^["']|["']$)/g, ''); // strip quotes
    }
  });
}
loadEnv();

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

// Simulated password database
const USER_PASSWORDS: Record<string, string> = {
  'mehul@flowledger.app': 'password123',
  'sarah.jenkins@techcorp.io': 'password123',
  'alex.rivera@flowledger.app': 'password123',
};

// OTP In-Memory Storage
interface OtpEntry {
  otp: string;
  expiresAt: number;
  verified: boolean;
}
const otpStore = new Map<string, OtpEntry>();

// Email sending helper using Nodemailer
async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"FlowLedger" <noreply@flowledger.app>`;

  if (!host || !user || !pass) {
    console.warn(`\n[SMTP NOT CONFIG] OTP for ${email}: ${otp}\n`);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: 'FlowLedger Password Reset OTP',
      text: `Your FlowLedger 6-digit OTP code for password reset is: ${otp}. It will expire in 3 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eff0f0; border-radius: 8px; max-width: 500px;">
          <h2 style="color: #0000ee; font-family: 'Satoshi', sans-serif;">FlowLedger Password Reset</h2>
          <p>You requested to reset your password. Use the following 6-digit OTP code to verify your identity:</p>
          <div style="font-size: 28px; font-weight: bold; color: #0000ee; letter-spacing: 4px; padding: 15px 0; font-family: monospace;">${otp}</div>
          <p>This OTP code is valid for <strong>3 minutes</strong>.</p>
          <p style="color: #666666; font-size: 12px; margin-top: 20px;">If you did not request this reset, you can safely ignore this email.</p>
        </div>
      `,
    });
    console.log(`[SMTP] Successfully sent OTP to ${email}`);
    return true;
  } catch (error) {
    console.error(`[SMTP ERROR] Failed to send email to ${email}:`, error);
    return false;
  }
}

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

// Passwordless Login Step 1: Send OTP
authRouter.post('/login-otp', async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  const lowerEmail = (email || '').toLowerCase().trim();

  const user = Object.values(DEMO_ACCOUNTS).find((acc) => acc.email.toLowerCase() === lowerEmail);
  if (!user) {
    return res.status(404).json({ error: 'Account not found. Please register first.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 3 * 60 * 1000;
  otpStore.set(lowerEmail, { otp, expiresAt, verified: false });

  const isSent = await sendOtpEmail(lowerEmail, otp);

  res.json({
    success: true,
    message: isSent ? 'OTP sent to your email.' : 'OTP generated (SMTP not configured, check console).',
    otp: isSent ? undefined : otp, // send back if dev fallback
  });
});

// Passwordless Login Step 2: Verify OTP and Login
authRouter.post('/verify-login-otp', (req: Request, res: Response) => {
  const { email, otp } = req.body ?? {};
  const lowerEmail = (email || '').toLowerCase().trim();

  const entry = otpStore.get(lowerEmail);
  if (!entry) {
    return res.status(400).json({ error: 'No active OTP verification session found.' });
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(lowerEmail);
    return res.status(400).json({ error: 'The OTP code has expired.' });
  }
  if (entry.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP code.' });
  }

  const userTemplate = Object.values(DEMO_ACCOUNTS).find(acc => acc.email.toLowerCase() === lowerEmail) || DEMO_ACCOUNTS.user;
  const user: AuthUser = {
    ...userTemplate,
    email: lowerEmail,
    id: `usr-${Date.now()}`,
  };

  const token = Buffer.from(JSON.stringify({ sub: user.email, role: user.role } satisfies AuthPayload)).toString('base64');
  const session: AuthSession = { user, token };

  otpStore.delete(lowerEmail);
  res.json(session);
});


// Forgot Password Step 1: Send OTP email
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  const lowerEmail = (email || '').toLowerCase().trim();

  // 1. Verify if email exists in database
  const user = Object.values(DEMO_ACCOUNTS).find((acc) => acc.email.toLowerCase() === lowerEmail);
  if (!user) {
    return res.status(404).json({ error: 'You are not an authorized user.' });
  }

  // 2. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. Store OTP in-memory with 3-minute expiry
  const expiresAt = Date.now() + 3 * 60 * 1000;
  otpStore.set(lowerEmail, { otp, expiresAt, verified: false });

  // 4. Send email
  const isSent = await sendOtpEmail(lowerEmail, otp);

  // Return generated OTP in response for easy dev testing if SMTP not configured
  res.json({
    success: true,
    message: isSent ? 'OTP sent to your email.' : 'OTP generated (SMTP not configured, checked console).',
    otp: isSent ? undefined : otp, // send back if dev fallback
  });
});

// Forgot Password Step 2: Verify OTP code
authRouter.post('/verify-otp', (req: Request, res: Response) => {
  const { email, otp } = req.body ?? {};
  const lowerEmail = (email || '').toLowerCase().trim();

  const entry = otpStore.get(lowerEmail);
  if (!entry) {
    return res.status(400).json({ error: 'No active OTP verification session found.' });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(lowerEmail);
    return res.status(400).json({ error: 'The OTP code has expired. OTP is only valid for 3 minutes.' });
  }

  if (entry.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP code. Please check and try again.' });
  }

  // Mark verified
  entry.verified = true;
  res.json({ success: true, message: 'OTP verified successfully.' });
});

// Forgot Password Step 3: Reset password
authRouter.post('/reset-password', (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body ?? {};
  const lowerEmail = (email || '').toLowerCase().trim();

  const entry = otpStore.get(lowerEmail);
  if (!entry || !entry.verified || entry.otp !== otp) {
    return res.status(400).json({ error: 'Unauthorized reset request. Please verify OTP first.' });
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(lowerEmail);
    return res.status(400).json({ error: 'Session expired. Please request a new OTP.' });
  }

  // Update password
  USER_PASSWORDS[lowerEmail] = newPassword;
  otpStore.delete(lowerEmail);

  console.log(`[AUTH] Password updated successfully for user: ${lowerEmail} -> ${newPassword}`);
  res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
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
