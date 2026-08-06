import React, { useState } from 'react';
import { AuthUser, UserRole } from '@shared/types';
import { login, forgotPassword, verifyOtp, resetPassword } from '@shared/api';
import { Layers } from 'lucide-react';

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

// ── Shared style helpers ──
const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: '#252b37',
  border: '1px solid #252b37',
  borderRadius: '10px',
  color: '#ffffff',
  fontFamily: "'Inter', sans-serif",
  fontSize: '14px',
  padding: '12px 16px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  marginTop: '8px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#ffffff',
};

const primaryBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 24px',
  background: '#bcfc6a',
  color: '#000000',
  border: 'none',
  borderRadius: '100px',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  transition: 'background 0.2s ease, box-shadow 0.2s ease',
  boxShadow: 'rgba(188, 252, 106, 0.2) 0px 4px 16px',
};

const ghostBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  background: 'transparent',
  color: '#535862',
  border: 'none',
  borderRadius: '100px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
  transition: 'color 0.2s ease',
  textAlign: 'center' as const,
};

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState(DEMO_USERS.user.email);
  const [password, setPassword] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('login');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setAuthSuccessMsg(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      setAuthSuccessMsg(`Verifying login for ${email}…`);
      const session = await login(email, 'user');
      setTimeout(() => onLogin(session.user), 400);
    } catch (err: any) {
      setAuthSuccessMsg(null);
      setErrorMsg(err.message || 'Login failed. Please try again.');
    }
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setSimulatedOtp(null);
    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setAuthSuccessMsg(res.otp ? 'OTP code generated.' : 'OTP code sent to your email.');
        if (res.otp) setSimulatedOtp(res.otp);
        setStep('forgot-otp');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request password reset.');
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    try {
      const res = await verifyOtp(email, otp);
      if (res.success) {
        setAuthSuccessMsg('OTP verified.');
        setStep('forgot-reset');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired OTP.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    try {
      const res = await resetPassword(email, otp, newPassword);
      if (res.success) {
        setAuthSuccessMsg('Password updated! You can now log in.');
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

  const titles: Record<Step, string> = {
    'login': 'Welcome back',
    'forgot-email': 'Reset your password',
    'forgot-otp': 'Enter verification code',
    'forgot-reset': 'Choose a new password',
  };

  const subtitles: Record<Step, string> = {
    'login': 'Sign in to your FlowLedger account',
    'forgot-email': "We'll send a 6-digit OTP to your email",
    'forgot-otp': `Code sent to ${email} — valid for 3 minutes`,
    'forgot-reset': 'Your identity is verified — set a new password',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#181d27',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #bcfc6a 0%, #8c63e6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'rgba(188, 252, 106, 0.3) 0px 4px 16px',
            }}
          >
            <Layers style={{ width: '22px', height: '22px', color: '#000000' }} />
          </div>
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.5px',
                lineHeight: '1.2',
              }}
            >
              FlowLedger
            </div>
            <div style={{ fontSize: '11px', color: '#bcfc6a', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
              v1.0 SaaS Engine
            </div>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#252b37',
            borderRadius: '24px',
            padding: '36px',
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'rgba(0,0,0,0.3) 0px 24px 48px',
          }}
        >
          {/* Title */}
          <div style={{ marginBottom: '28px' }}>
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.5px',
                lineHeight: '1.3',
              }}
            >
              {titles[step]}
            </h2>
            <p style={{ fontSize: '14px', color: '#535862', margin: '6px 0 0 0', lineHeight: '1.5' }}>
              {subtitles[step]}
            </p>
          </div>

          {/* Feedback messages */}
          {authSuccessMsg && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(188, 252, 106, 0.08)',
                border: '1px solid rgba(188, 252, 106, 0.25)',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#bcfc6a',
                fontWeight: 500,
                marginBottom: '20px',
                lineHeight: '1.5',
              }}
            >
              {authSuccessMsg}
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                fontSize: '13px',
                color: '#f87171',
                fontWeight: 500,
                marginBottom: '20px',
                lineHeight: '1.5',
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* SMTP fallback OTP banner */}
          {simulatedOtp && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(140, 99, 230, 0.12)',
                border: '1px solid rgba(140, 99, 230, 0.3)',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#c4b5fd',
                fontWeight: 500,
                marginBottom: '20px',
                lineHeight: '1.6',
                textAlign: 'center',
              }}
            >
              [DEVELOPER MODE] SMTP not configured<br />
              OTP:{' '}
              <strong style={{ color: '#ffffff', fontSize: '18px', letterSpacing: '4px', fontFamily: 'monospace' }}>
                {simulatedOtp}
              </strong>
            </div>
          )}

          {/* ─── LOGIN FORM ─── */}
          {step === 'login' && (
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle} htmlFor="email-login">Email address</label>
                <input
                  id="email-login"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#bcfc6a'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#252b37'; }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={labelStyle} htmlFor="password-login">Password</label>
                  <button
                    type="button"
                    onClick={() => { clearMessages(); setStep('forgot-email'); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#bcfc6a',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password-login"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#bcfc6a'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#252b37'; }}
                />
              </div>
              <button
                type="submit"
                style={{ ...primaryBtnStyle, marginTop: '8px' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#a8e85c';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(188, 252, 106, 0.35) 0px 6px 24px';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#bcfc6a';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(188, 252, 106, 0.2) 0px 4px 16px';
                }}
              >
                Sign in
              </button>
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setEmail(DEMO_USERS.user.email)}
                  style={ghostBtnStyle}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#535862'; }}
                >
                  Use demo: {DEMO_USERS.user.email}
                </button>
              </div>
            </form>
          )}

          {/* ─── FORGOT EMAIL FORM ─── */}
          {step === 'forgot-email' && (
            <form onSubmit={handleForgotEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle} htmlFor="forgot-email-input">Email address</label>
                <input
                  id="forgot-email-input"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#bcfc6a'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#252b37'; }}
                />
              </div>
              <button type="submit" style={{ ...primaryBtnStyle, marginTop: '8px' }}>
                Send OTP
              </button>
              <button
                type="button"
                onClick={() => { clearMessages(); setStep('login'); }}
                style={ghostBtnStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#535862'; }}
              >
                ← Back to Sign In
              </button>
            </form>
          )}

          {/* ─── OTP VERIFY FORM ─── */}
          {step === 'forgot-otp' && (
            <form onSubmit={handleVerifyOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle} htmlFor="otp-input">6-digit verification code</label>
                <input
                  id="otp-input"
                  type="text"
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{
                    ...inputStyle,
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '8px',
                    fontFamily: 'monospace',
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#bcfc6a'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#252b37'; }}
                />
              </div>
              <button type="submit" style={{ ...primaryBtnStyle, marginTop: '8px' }}>
                Verify Code
              </button>
              <button
                type="button"
                onClick={handleForgotEmailSubmit}
                style={{ ...ghostBtnStyle, color: '#bcfc6a' }}
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => { clearMessages(); setStep('forgot-email'); }}
                style={ghostBtnStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#535862'; }}
              >
                Change email
              </button>
            </form>
          )}

          {/* ─── RESET PASSWORD FORM ─── */}
          {step === 'forgot-reset' && (
            <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle} htmlFor="new-password">New password</label>
                <input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#bcfc6a'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#252b37'; }}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="confirm-password">Confirm password</label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#bcfc6a'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#252b37'; }}
                />
              </div>
              <button type="submit" style={{ ...primaryBtnStyle, marginTop: '8px' }}>
                Reset Password
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '12px',
            color: '#535862',
            lineHeight: '1.6',
          }}
        >
          By signing in, you agree to our{' '}
          <a href="#" style={{ color: '#bcfc6a', textDecoration: 'none' }}>Terms of Service</a>{' '}
          and{' '}
          <a href="#" style={{ color: '#bcfc6a', textDecoration: 'none' }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default LoginView;
