// ====================================================
// Login Page Component
//
// This component lets users (both Candidates and Recruiters) log into the app.
// It verifies their credentials by sending their email and password to the server.
//
// Features:
// - Validates email format and password field on the client side.
// - Supports a "Remember Session" checkbox, which stores JWT in localStorage instead of sessionStorage.
// - Provides a direct link to redirect users to the Forgot Password screen.
//
// Used by:
// - App.jsx (loaded when visual state path equals '/login')
// ====================================================

import React, { useState } from 'react';
import { api } from '../services/api';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

// Purpose:
// Renders the Login form and processes user sign-in.
//
// Input:
// - onPageChange (function): Navigation callback to switch screens.
// - onAuthSuccess (function): Callback that updates the main app state with the authenticated user and token.
//
// Output:
// Renders the login card visual layout.
const Login = ({ onPageChange, onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Purpose:
  // Validates inputs client-side before communicating with the login server.
  //
  // Input:
  // None (reads email and password state).
  //
  // Output:
  // Returns true if inputs are valid, false otherwise. Populates errors state.
  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    
    // Ensure email exists and matches format regex pattern
    if (!email.trim()) {
      tempErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Please provide a valid email address';
    }

    // Ensure password is not empty
    if (!password) {
      tempErrors.password = 'Password is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Purpose:
  // Sends login request payload to the authentication API.
  //
  // Input:
  // e (Event) - Submit event.
  //
  // Output:
  // Stores session keys, calls onAuthSuccess helper, and navigates candidate/recruiter inside App.jsx.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return; // Stop if form inputs are empty or invalid

    try {
      setLoading(true);
      const res = await api.login(email.trim(), password);
      
      // Store token and user details based on Remember Me checkbox choice
      if (rememberMe) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        // Clear temporary session keys to prevent duplicate logins
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('user', JSON.stringify(res.user));
        // Clear persistent local keys to prevent duplicate logins
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      // Trigger App's auth success handler to refresh header menu
      onAuthSuccess(res.user, res.token);
    } catch (err) {
      setApiError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const angle = 8;
    const rotateX = (yc - y) / yc * angle;
    const rotateY = (x - xc) / xc * angle;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    card.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.2), 0 0 30px rgba(163, 230, 53, 0.15)`;
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
    card.style.boxShadow = '';
  };

  return (
    <div className="auth-page-container container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 160px)', padding: '2rem 1.5rem', position: 'relative' }}>
      <div className="glow-orb-container">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
      </div>
      <div 
        className="auth-card card-3d-ats glass-panel-ats"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Login to access your JobPortal Pro dashboard</p>
        </div>

        {apiError && (
          <div className="auth-alert-error">
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="email"
                className={`form-input auth-input ${errors.email ? 'input-error' : ''}`}
                placeholder="rahul@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && <span className="form-error-msg">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-input auth-input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="form-error-msg">{errors.password}</span>}
          </div>

          {/* Remember Session & Forgot Password */}
          <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.25rem 0' }}>
            <label className="filter-checkbox-label" style={{ fontWeight: 500, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <span>Remember Session</span>
            </label>
            <button
              type="button"
              onClick={() => onPageChange('/forgot-password')}
              className="auth-link-btn"
              style={{ fontSize: '0.9rem', fontWeight: 600, padding: 0 }}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer-link">
          Don't have an account?{' '}
          <button onClick={() => onPageChange('/signup')} className="auth-link-btn">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
