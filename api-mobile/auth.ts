import { Request, Response, Router } from 'express';
import type { AuthSession, AuthUser, UserRole } from '@shared/types';
import nodemailer from 'nodemailer';

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
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `Your FlowLedger Login OTP: ${otp}`,
      text: `Your login code is ${otp}. It is valid for 1 minute.`,
      html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #333;">FlowLedger Verification</h2>
        <p style="color: #555; font-size: 16px;">Use the code below to log in to your account. This code is valid for 1 minute.</p>
        <div style="background-color: #f4f4f4; padding: 15px; margin: 20px 0; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 4px;">
          ${otp}
        </div>
        <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    });

    console.log(`[SMTP] OTP sent to ${email} (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[SMTP ERROR] Failed to send OTP to ${email}:`, error);
    return false;
  }
}

// Mobile Registration - Sign Up
authRouter.post('/mobile-signup', (req: Request, res: Response) => {
  const { name, email } = req.body ?? {};
  const lowerEmail = (email || '').toLowerCase().trim();

  if (!lowerEmail || !name) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  if (DEMO_ACCOUNTS[lowerEmail]) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  // Create new user in memory
  DEMO_ACCOUNTS[lowerEmail] = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: lowerEmail,
    role: 'user',
    tenantName: 'Personal Wallet',
    twoFactorEnabled: false,
    biometricRegistered: false,
    plan: 'Free Plan',
  };

  console.log(`[MOBILE AUTH] New user registered: ${lowerEmail}`);
  res.json({ success: true, message: 'Account created successfully.' });
});

// Mobile OTP Login - Step 1: Request OTP
authRouter.post('/mobile-login-request', async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  const lowerEmail = (email || '').toLowerCase().trim();

  const user = DEMO_ACCOUNTS[lowerEmail];
  if (!user) {
    return res.status(404).json({ error: 'You are not an authorized user.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 60 * 1000; // 1 minute expiration
  otpStore.set(lowerEmail, { otp, expiresAt, verified: false });

  console.log(`[MOBILE AUTH] OTP generated for ${lowerEmail}: ${otp}`);
  
  // Send OTP via Email
  const isSent = await sendOtpEmail(lowerEmail, otp);
  
  if (!isSent) {
    // If SMTP is not configured, we still succeed but warn the user.
    console.warn('[MOBILE AUTH] SMTP not configured. OTP printed in server console.');
  }

  res.json({ success: true, message: 'OTP sent to your email.' });
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
