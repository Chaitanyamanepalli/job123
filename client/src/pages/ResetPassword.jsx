// ====================================================
// Reset Password Page Component
//
// This component lets users create a new password after requesting a password reset.
// It receives a secure token from the reset link they clicked in their email.
//
// Features:
// - Validates that the new password is secure (at least 6 characters).
// - Confirms the second password matches the first one.
// - Sends the token and the new password to the server to update the account.
// - Redirects users automatically to the Login page on success.
//
// Used by:
// - App.jsx (when users load a URL path containing a reset password token)
// ====================================================

import React, { useState } from 'react';
import { api } from '../services/api';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

// Purpose:
// Renders the password reset form and handles submissions.
//
// Input:
// - token (string): The secret token extracted from the URL link.
// - onPageChange (function): Callback to redirect the user to another page.
//
// Output:
// Renders a secure password update card.
//
// Usage:
// <ResetPassword token={token} onPageChange={handleNavigate} />
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

  // Purpose:
  // Checks if the user entered valid passwords in both inputs before sending to server.
  //
  // Input:
  // None (reads newPassword and confirmPassword states).
  //
  // Output:
  // Returns true if both passwords are valid and match, false otherwise. Sets errors state.
  const validateForm = () => {
    const tempErrors = {};

    // Make sure new password is entered and has minimum length
    if (!newPassword) {
      tempErrors.newPassword = 'New Password is required';
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'Password must be at least 6 characters long';
    }

    // Make sure second password is entered and matches the first
    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirm Password is required';
    } else if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Purpose:
  // Handles form submission, calls the API to reset the password, and redirects to Login.
  //
  // Input:
  // e (Event) - Form submission event.
  //
  // Output:
  // Saves changes on server, shows success or error messages, and triggers redirect on success.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMsg('');
    if (!validateForm()) return; // Stop if inputs are invalid

    try {
      setLoading(true);
      // Call api service with token and new password
      const res = await api.resetPassword(token, newPassword);
      setSuccessMsg(res.message || 'Password reset successful! Redirecting to Login...');
      
      // Wait 3 seconds so the user can read the success message before going to login page
      setTimeout(() => {
        onPageChange('/login');
      }, 3000);
    } catch (err) {
      // Capture error from API (e.g. token expired or invalid)
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
