import React, { useState } from 'react';
import { api } from '../services/api';
import { Mail, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

const ForgotPassword = ({ onPageChange }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

    if (!email.trim()) {
      tempErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Please provide a valid email address';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMsg('');
    if (!validateForm()) return;

    try {
      setLoading(true);
      const res = await api.forgotPassword(email.trim());
      setSuccessMsg(res.message || 'Password reset link sent to your email address!');
    } catch (err) {
      setApiError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 160px)', padding: '2rem 1.5rem' }}>
      <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
        <button
          type="button"
          onClick={() => onPageChange('/login')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem', padding: 0 }}
        >
          <ArrowLeft size={16} />
          <span>Back to Login</span>
        </button>

        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <h2 className="auth-title">Forgot Password</h2>
          <p className="auth-subtitle">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        {apiError && (
          <div className="auth-alert-error" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--error)', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--success)', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 500 }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="email"
                className={`form-input auth-input ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your registered email"
                value={email}
                disabled={loading || successMsg !== ''}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <span className="form-error-msg">{errors.email}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading || successMsg !== ''}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
