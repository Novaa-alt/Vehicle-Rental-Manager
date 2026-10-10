import React, { useState } from 'react';
import { ShieldCheck, Phone, User, KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthPage({ apiBaseUrl, onLoginSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Request OTP from backend (which calls Minimoth /v1/otp/send)
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!phone || phone.trim().length < 8) {
      setError('Please enter a valid phone number with country code (e.g. +91 9876543210).');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP.');
      }

      setSuccessMsg(data.message || 'OTP sent successfully to your WhatsApp / SMS!');
      setPhone(data.phone || phone.trim());
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Error sending OTP. Please check your network and phone number.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP via backend (which calls Minimoth /v1/otp/verify)
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!otp || otp.trim().length < 4) {
      setError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          code: otp.trim(),
          name: name.trim() || undefined
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP code.');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-header">
        <div className="auth-logo-badge">
          <ShieldCheck size={32} />
        </div>
        <h2 className="auth-title">
          {step === 'phone' ? 'Sign in with Phone' : 'Enter Verification Code'}
        </h2>
        <p className="auth-desc">
          {step === 'phone'
            ? 'Fast & passwordless login powered by Minimoth OTP via WhatsApp / SMS'
            : `We sent a 6-digit code to ${phone}`}
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <label className="form-label" htmlFor="user-name">Full Name (Optional)</label>
            <div style={{ position: 'relative' }}>
              <input
                id="user-name"
                type="text"
                className="form-input"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-help">Used for your rental agreement and booking receipts.</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="user-phone">Phone Number *</label>
            <input
              id="user-phone"
              type="tel"
              className="form-input"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <div className="form-help">Include country code (e.g., +91 for India, +1 for US/CA).</div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spin" /> Sending OTP...
              </>
            ) : (
              <>
                Get OTP via WhatsApp / SMS <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <div className="otp-box">
            <p className="otp-box-text">Check your WhatsApp or SMS messages for the code.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="otp-code">6-Digit Code</label>
            <input
              id="otp-code"
              type="text"
              maxLength={6}
              className="form-input otp-input"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoFocus
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spin" /> Verifying...
              </>
            ) : (
              'Verify & Access Rentals'
            )}
          </button>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.8rem' }}
              onClick={() => {
                setStep('phone');
                setError('');
                setSuccessMsg('');
              }}
            >
              Change Phone Number
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
