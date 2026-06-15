// ====================================================
// Signup Page Component
//
// This component lets users register a new account on JobPortal Pro.
// Users can choose to register as either a Candidate (to apply for jobs)
// or a Recruiter (to post vacancies).
//
// Features:
// - Validates full name, email format, minimum password length, and password match.
// - Provides a tab bar to toggle between the Candidate and Recruiter roles.
// - Automates login on successful registration and updates session state.
//
// Used by:
// - App.jsx (loaded when visual state path equals '/signup')
// ====================================================

import React, { useState } from 'react';
import { api } from '../services/api';
import { User, Mail, Lock, Eye, EyeOff, Briefcase, AlertCircle, ArrowRight } from 'lucide-react';

// Purpose:
// Renders the Signup form and manages user registration.
//
// Input:
// - onPageChange (function): Navigation callback to switch paths.
// - onAuthSuccess (function): Callback that updates active session user details in App.jsx.
//
// Output:
// Renders the registration card visual layout.
const Signup = ({ onPageChange, onAuthSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('candidate'); // default to candidate
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Purpose:
  // Validates inputs client-side before sending registration payload to server.
  //
  // Input:
  // None (reads state fields).
  //
  // Output:
  // Returns true if all fields are valid, false otherwise. Sets errors state.
  const validateForm = () => {
    const tempErrors = {};
    if (!fullName.trim()) tempErrors.fullName = 'Full Name is required';
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!email.trim()) {
      tempErrors.email = 'Email Address is required';
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Please provide a valid email address';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirm Password is required';
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Purpose:
  // Submits signup payload to the server register API.
  //
  // Input:
  // e (Event) - Submit event.
  //
  // Output:
  // Sets session keys, calls onAuthSuccess helper, and routes the new user into their dashboard.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateForm()) return; // Stop if inputs are invalid

    try {
      setLoading(true);
      const res = await api.signup(
        fullName.trim(),
        email.trim(),
        password,
        role
      );
      
      // Store token and user details in sessionStorage (default behavior for signup)
      sessionStorage.setItem('token', res.token);
      sessionStorage.setItem('user', JSON.stringify(res.user));
      
      // Trigger App's auth success handler to refresh menus
      onAuthSuccess(res.user, res.token);
    } catch (err) {
      setApiError(err.message || 'An error occurred during registration.');
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
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join JobPortal Pro to explore opportunities or hire top talent</p>
        </div>

        {apiError && (
          <div className="auth-alert-error">
            <AlertCircle size={18} />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                className={`form-input auth-input ${errors.fullName ? 'input-error' : ''}`}
                placeholder="Rahul Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            {errors.fullName && <span className="form-error-msg">{errors.fullName}</span>}
          </div>

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

          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">Register As</label>
            <div className="auth-role-tabs">
              <button
                type="button"
                className={`auth-role-tab ${role === 'candidate' ? 'active' : ''}`}
                onClick={() => setRole('candidate')}
              >
                <User size={16} />
                <span>Candidate</span>
              </button>
              <button
                type="button"
                className={`auth-role-tab ${role === 'recruiter' ? 'active' : ''}`}
                onClick={() => setRole('recruiter')}
              >
                <Briefcase size={16} />
                <span>Recruiter</span>
              </button>
            </div>
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

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input auth-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-password-toggle"
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
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer-link">
          Already have an account?{' '}
          <button onClick={() => onPageChange('/login')} className="auth-link-btn">
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
