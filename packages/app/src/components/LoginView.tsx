import React, { useState } from 'react';
import { AuthUser, UserRole } from '@shared/types';
import { requestLoginOtp, verifyLoginOtp, register } from '@shared/api';

interface LoginViewProps {
  onLogin: (user: AuthUser) => void;
}

type Step = 'login-email' | 'login-otp';

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
  const [email, setEmail] = useState('');

  const [otp, setOtp] = useState('');
  
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [step, setStep] = useState<Step>('login-email');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMsg(null);
    setAuthSuccessMsg(null);
  };



  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setSimulatedOtp(null);
    
    if (!email) {
      setErrorMsg('Please enter your email.');
      return;
    }

    try {
      const res = await requestLoginOtp(email);
      if (res.success) {
        setAuthSuccessMsg(res.otp ? 'OTP code generated.' : 'OTP code sent to your email.');
        if (res.otp) setSimulatedOtp(res.otp);
        setStep('login-otp');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request OTP. Ensure you are registered.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (otp.length < 6) {
      setErrorMsg('Please enter the full 6-digit OTP.');
      return;
    }

    try {
      setAuthSuccessMsg(`Verifying OTP...`);
      const session = await verifyLoginOtp(email, otp);
      setAuthSuccessMsg(`Success! Logging in...`);
      setTimeout(() => onLogin(session.user), 500);
    } catch (err: any) {
      setAuthSuccessMsg(null);
      setErrorMsg(err.message || 'Invalid or expired OTP.');
    }
  };

  const titles: Record<Step, string> = {
    'login-email': 'Welcome back',
    'login-otp': 'Enter verification code',
  };

  const subtitles: Record<Step, string> = {
    'login-email': 'Enter your registered email to sign in via OTP',
    'login-otp': `Code sent to ${email} — valid for 1 minute`,
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
          <img
            src="/logo.png"
            alt="FlowLedger"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              objectFit: 'cover',
              boxShadow: 'rgba(188, 252, 106, 0.3) 0px 4px 16px',
            }}
          />
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
              Code:{' '}
              <strong style={{ color: '#ffffff', fontSize: '18px', letterSpacing: '4px', fontFamily: 'monospace' }}>
                {simulatedOtp}
              </strong>
            </div>
          )}



          {/* ─── EMAIL INPUT FORM (LOGIN) ─── */}
          {step === 'login-email' && (
            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle} htmlFor="email-login">Email Address</label>
                <input
                  id="email-login"
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
                Send OTP
              </button>

            </form>
          )}

          {/* ─── OTP VERIFY FORM ─── */}
          {step === 'login-otp' && (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                Verify & Login
              </button>
              <button
                type="button"
                onClick={handleRequestOtp}
                style={{ ...ghostBtnStyle, color: '#bcfc6a' }}
              >
                Resend OTP
              </button>
              <button
                type="button"
                onClick={() => { clearMessages(); setStep('login-email'); }}
                style={ghostBtnStyle}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#ffffff'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#535862'; }}
              >
                Change Email
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
