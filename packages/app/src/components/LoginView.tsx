import React, { useState } from 'react';
import { AuthUser, UserRole } from '@shared/types';
import { login, forgotPassword, verifyOtp, resetPassword } from '@shared/api';

interface LoginViewProps {
  onLogin: (user: AuthUser) => void;
}

export const DEMO_USERS: Record<UserRole, AuthUser> = {
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

type Step = 'login' | 'forgot-email' | 'forgot-otp' | 'forgot-reset';

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(DEMO_USERS.user.email);
  const [password, setPassword] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password reset state
  const [step, setStep] = useState<Step>('login');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      setAuthSuccessMsg(`Login verified for ${email}`);
      const session = await login(email, 'user');
      setTimeout(() => {
        onLogin(session.user);
      }, 500);
    } catch (err: any) {
      setAuthSuccessMsg(null);
      setErrorMsg(err.message || 'Login failed. Please try again.');
    }
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAuthSuccessMsg(null);
    setSimulatedOtp(null);
    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setAuthSuccessMsg(res.otp ? 'OTP code generated.' : 'OTP code sent to your email.');
        if (res.otp) {
          setSimulatedOtp(res.otp);
        }
        setStep('forgot-otp');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request password reset.');
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAuthSuccessMsg(null);
    try {
      const res = await verifyOtp(email, otp);
      if (res.success) {
        setAuthSuccessMsg('OTP verified successfully.');
        setStep('forgot-reset');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAuthSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      const res = await resetPassword(email, otp, newPassword);
      if (res.success) {
        setAuthSuccessMsg('Password updated successfully! You can now log in.');
        setStep('login');
        setPassword('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setSimulatedOtp(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-sans">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 lg:px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm space-y-6">
          
          {/* Header Title */}
          <h2 className="text-balance text-center font-display font-semibold text-white text-xl">
            {step === 'login' && 'Log in or create account'}
            {step === 'forgot-email' && 'Reset your password'}
            {step === 'forgot-otp' && 'Verify OTP Code'}
            {step === 'forgot-reset' && 'Choose a new password'}
          </h2>

          {/* Success and Error messages */}
          {authSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-bold text-center">
              {authSuccessMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* Simulated OTP Notification Banner */}
          {simulatedOtp && (
            <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-xs text-indigo-300 font-bold text-center">
              [DEVELOPER SIMULATION]<br/>
              SMTP not configured. OTP sent: <strong className="text-white text-sm select-all">{simulatedOtp}</strong>
            </div>
          )}

          {/* STEP 1: Login Form */}
          {step === 'login' && (
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block font-medium text-slate-300 text-sm" htmlFor="email-login">
                  Email
                </label>
                <input
                  autoComplete="email"
                  required
                  className="mt-2 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  id="email-login"
                  name="email"
                  placeholder="ephraim@blocks.so"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-slate-300 text-sm" htmlFor="password-login">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setAuthSuccessMsg(null);
                      setStep('forgot-email');
                    }}
                    className="text-xs text-[#0000ee] hover:underline cursor-pointer font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  autoComplete="current-password"
                  required
                  className="mt-2 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  id="password-login"
                  name="password"
                  placeholder="**************"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button
                className="mt-6 w-full rounded-lg bg-white hover:bg-slate-200 text-black py-2.5 font-semibold text-sm transition-all cursor-pointer shadow-lg"
                type="submit"
              >
                Sign in
              </button>
            </form>
          )}

          {/* STEP 2: Forgot Password - Enter Email */}
          {step === 'forgot-email' && (
            <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed text-center">
                Enter your email address. If the account exists, we will send you a 6-digit OTP code to reset your password.
              </p>
              <div>
                <label className="block font-medium text-slate-300 text-sm" htmlFor="forgot-email-input">
                  Email Address
                </label>
                <input
                  required
                  className="mt-2 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  id="forgot-email-input"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  className="w-full rounded-lg bg-white hover:bg-slate-200 text-black py-2.5 font-semibold text-sm transition-all cursor-pointer shadow-lg"
                  type="submit"
                >
                  Send OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthSuccessMsg(null);
                    setStep('login');
                  }}
                  className="w-full text-xs text-slate-450 hover:text-white transition-all cursor-pointer py-1 text-center font-medium"
                >
                  Back to Log In
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Forgot Password - Verify OTP */}
          {step === 'forgot-otp' && (
            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed text-center">
                We have generated a 6-digit verification code. Please enter the OTP below. It is valid for exactly <strong>3 minutes</strong>.
              </p>
              <div>
                <label className="block font-medium text-slate-300 text-sm" htmlFor="otp-input">
                  Enter 6-digit OTP
                </label>
                <input
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  className="mt-2 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2.5 text-center text-lg tracking-widest text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  id="otp-input"
                  placeholder="000000"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  className="w-full rounded-lg bg-white hover:bg-slate-200 text-black py-2.5 font-semibold text-sm transition-all cursor-pointer shadow-lg"
                  type="submit"
                >
                  Verify Code
                </button>
                <button
                  type="button"
                  onClick={handleForgotEmailSubmit}
                  className="w-full text-xs text-[#0000ee] hover:underline transition-all cursor-pointer py-1 text-center font-semibold"
                >
                  Resend OTP Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthSuccessMsg(null);
                    setStep('forgot-email');
                  }}
                  className="w-full text-xs text-slate-450 hover:text-white transition-all cursor-pointer py-1 text-center font-medium"
                >
                  Change Email
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Forgot Password - Reset Password */}
          {step === 'forgot-reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed text-center">
                Your email is verified. Please enter and confirm a new password for your account.
              </p>
              <div>
                <label className="block font-medium text-slate-300 text-sm" htmlFor="new-password">
                  New Password
                </label>
                <input
                  required
                  minLength={6}
                  className="mt-2 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  id="new-password"
                  placeholder="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 text-sm" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <input
                  required
                  className="mt-2 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  id="confirm-password"
                  placeholder="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  className="w-full rounded-lg bg-white hover:bg-slate-200 text-black py-2.5 font-semibold text-sm transition-all cursor-pointer shadow-lg"
                  type="submit"
                >
                  Reset Password
                </button>
              </div>
            </form>
          )}

          {/* Quick Demo Login Link Helper */}
          {step === 'login' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setEmail(DEMO_USERS.user.email)}
                className="text-xs text-slate-400 hover:text-emerald-400 underline transition-all cursor-pointer"
              >
                Use demo account email ({DEMO_USERS.user.email})
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-slate-500 text-xs leading-relaxed">
            By signing in, you agree to our{' '}
            <a className="underline underline-offset-4 hover:text-slate-300" href="#">
              terms of service
            </a>{' '}
            and{' '}
            <a className="underline underline-offset-4 hover:text-slate-300" href="#">
              privacy policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
