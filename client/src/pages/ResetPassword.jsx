import React, { useState } from 'react';
import { api } from '../services/api';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

const ResetPassword = ({ token, onPageChange }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const tempErrors = {};

    if (!newPassword) {
      tempErrors.newPassword = 'New Password is required';
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirm Password is required';
    } else if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
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
      const res = await api.resetPassword(token, newPassword);
      setSuccessMsg(res.message || 'Password reset successful! Redirecting to Login...');
      setTimeout(() => {
        onPageChange('/login');
      }, 3000);
    } catch (err) {
      setApiError(err.message || 'Failed to reset password. Token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 160px)', padding: '2rem 1.5rem' }}>
      <div className="auth-card" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Create a new secure password for your account.</p>
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
          {/* New Password */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">New Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input auth-input ${errors.newPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={newPassword}
                disabled={loading || successMsg !== ''}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-password-toggle"
                disabled={loading || successMsg !== ''}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && <span className="form-error-msg">{errors.newPassword}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">Confirm Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input auth-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                disabled={loading || successMsg !== ''}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-password-toggle"
                disabled={loading || successMsg !== ''}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="form-error-msg">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading || successMsg !== ''}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            {loading ? 'Updating...' : 'Update Password'}
            <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
