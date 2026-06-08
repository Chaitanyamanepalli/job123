// ====================================================
// Navbar (Header Navigation Component)
//
// This component renders the main header navigation menu.
// It detects the logged-in user role and displays appropriate action options.
//
// Features:
// - Role-based layout structure (different links for guest, candidate, and recruiter roles).
// - Theme switch toggling integration (communicates with ThemeContext).
// - Responsive layout toggles (collapses into hamburger menu on mobile sizes).
//
// Used by:
// - App.jsx (fixed layout placement at the top of the viewport)
// ====================================================

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X, User, LogOut, Shield } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--accent)' }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Purpose:
// Renders the main application header and navigation paths triggers.
//
// Input:
// currentPage (string) - Active page path string.
// onPageChange (function) - Handles page redirection.
// user (Object) - Logged in user details.
// onLogout (function) - Log out trigger callback.
//
// Output:
// Returns the header Navbar JSX structure.
const Navbar = ({ currentPage, onPageChange, user, onLogout, socket }) => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Close the mobile slide menu and trigger redirection action
  const handleLinkClick = (page) => {
    onPageChange(page);
    setIsMenuOpen(false);
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    alert('JobPortal Pro is a premium job discovery platform designed to connect top tier talent with global companies.');
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-content">
        {/* Brand Logo */}
        <a href="/" className="brand-logo" onClick={(e) => { e.preventDefault(); handleLinkClick('home'); }}>
          <LogoIcon />
          <span>JOBPORTAL <span className="brand-accent-text" style={{ color: 'var(--accent)' }}>PRO</span></span>
        </a>

        {/* Desktop Links (Hidden on mobile) */}
        <nav className="nav-links">
          
          {/* GUEST VIEW NAVIGATION */}
          {!user && (
            <>
              <a href="/" className={`nav-link-item ${currentPage === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/'); }}>
                Home
              </a>
              <a href="/jobs" className={`nav-link-item ${currentPage === 'jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>
                Jobs
              </a>
              <a href="/about" className={`nav-link-item ${currentPage === 'about' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/about'); }}>
                About
              </a>
              <a href="/login" className={`nav-link-item ${currentPage === 'login' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/login'); }}>
                Login
              </a>
              <a href="/signup" className="btn-post-job" style={{ textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); handleLinkClick('/signup'); }}>
                Sign Up
              </a>
            </>
          )}

          {/* CANDIDATE VIEW NAVIGATION */}
          {user && user.role === 'candidate' && (
            <>
              <a href="/candidate/dashboard" className={`nav-link-item ${currentPage === 'candidate-dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/candidate/dashboard'); }}>
                Dashboard
              </a>
              <a href="/jobs" className={`nav-link-item ${currentPage === 'jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>
                Jobs
              </a>
              <a href="/saved-jobs" className={`nav-link-item ${currentPage === 'saved-jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/saved-jobs'); }}>
                Saved Jobs
              </a>
              <a href="/my-applications" className={`nav-link-item ${currentPage === 'my-applications' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/my-applications'); }}>
                Applications
              </a>
              <a href="/chat" className={`nav-link-item ${currentPage === 'chat' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>
                Chat
              </a>
              <a href="/profile" className={`nav-link-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
                Profile
              </a>
              <button onClick={onLogout} className="nav-link-item" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          )}

          {/* RECRUITER VIEW NAVIGATION */}
          {user && user.role === 'recruiter' && (
            <>
              <a href="/recruiter/dashboard" className={`nav-link-item ${currentPage === 'recruiter-dashboard' && window.location.pathname === '/recruiter/dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/dashboard'); }}>
                Dashboard
              </a>
              <a href="/recruiter/jobs" className={`nav-link-item ${currentPage === 'recruiter-dashboard' && window.location.pathname === '/recruiter/jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/jobs'); }}>
                Manage Jobs
              </a>
              <a href="/recruiter/applications" className={`nav-link-item ${currentPage === 'recruiter-dashboard' && window.location.pathname === '/recruiter/applications' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/applications'); }}>
                Applications
              </a>
              <a href="/chat" className={`nav-link-item ${currentPage === 'chat' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>
                Chat
              </a>
              <a href="/profile" className={`nav-link-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
                Profile
              </a>
              <button onClick={onLogout} className="nav-link-item" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          )}

          {/* ADMIN VIEW NAVIGATION */}
          {user && user.role === 'admin' && (
            <>
              <a href="/admin/dashboard" className={`nav-link-item ${currentPage === 'admin-dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/admin/dashboard'); }}>
                Admin Dashboard
              </a>
              <a href="/chat" className={`nav-link-item ${currentPage === 'chat' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>
                Chat
              </a>
              <a href="/profile" className={`nav-link-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
                Profile
              </a>
              <button onClick={onLogout} className="nav-link-item" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          )}

          {/* Notification Center widget */}
          {user && (
            <NotificationCenter socket={socket} user={user} />
          )}

          {/* Theme Mode Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className="theme-switch-btn-nav"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} fill="currentColor" /> : <Sun size={18} />}
          </button>

          {/* User Profile Avatar initials circle */}
          {user && (
            <button 
              className="nav-profile-btn"
              onClick={() => handleLinkClick('/profile')}
              title={`${user.fullName} Profile`}
            >
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--accent)', color: '#111111', fontWeight: 700, fontSize: '0.9rem' }}>
                {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            </button>
          )}
        </nav>

        {/* Mobile Hamburger Menu Actions */}
        <div className="mobile-actions">
          <button 
            onClick={toggleTheme} 
            className="theme-switch-btn-nav" 
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={16} fill="currentColor" /> : <Sun size={16} />}
          </button>
          
          <button className="menu-btn" onClick={toggleMenu} aria-label="Toggle Menu" style={{ color: '#ffffff' }}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav Menu (Shown when isMenuOpen is true) */}
      <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`} style={{ backgroundColor: '#111111', borderBottomColor: '#27272a' }}>
        
        {/* Guest Mobile Menu */}
        {!user && (
          <>
            <a href="/" className={`nav-link-mobile ${currentPage === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/'); }}>
              Home
            </a>
            <a href="/jobs" className={`nav-link-mobile ${currentPage === 'jobs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>
              Jobs
            </a>
            <a href="/about" className={`nav-link-mobile ${currentPage === 'about' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/about'); }}>
              About
            </a>
            <a href="/login" className={`nav-link-mobile ${currentPage === 'login' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/login'); }}>
              Login
            </a>
            <a href="/signup" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/signup'); }}>
              Sign Up
            </a>
          </>
        )}

        {/* Candidate Mobile Menu */}
        {user && user.role === 'candidate' && (
          <>
            <a href="/candidate/dashboard" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/candidate/dashboard'); }}>
              Dashboard
            </a>
            <a href="/jobs" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/jobs'); }}>
              Jobs
            </a>
            <a href="/saved-jobs" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/saved-jobs'); }}>
              Saved Jobs
            </a>
            <a href="/my-applications" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/my-applications'); }}>
              Applications
            </a>
            <a href="/chat" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>
              Chat
            </a>
            <a href="/profile" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
              Profile
            </a>
            <button onClick={onLogout} className="nav-link-mobile" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 0' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}

        {/* Recruiter Mobile Menu */}
        {user && user.role === 'recruiter' && (
          <>
            <a href="/recruiter/dashboard" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/dashboard'); }}>
              Dashboard
            </a>
            <a href="/recruiter/jobs" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/jobs'); }}>
              Manage Jobs
            </a>
            <a href="/recruiter/applications" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/recruiter/applications'); }}>
              Applications
            </a>
            <a href="/chat" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>
              Chat
            </a>
            <a href="/profile" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
              Profile
            </a>
            <button onClick={onLogout} className="nav-link-mobile" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 0' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}

        {/* Admin Mobile Menu */}
        {user && user.role === 'admin' && (
          <>
            <a href="/admin/dashboard" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/admin/dashboard'); }}>
              Admin Dashboard
            </a>
            <a href="/chat" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/chat'); }}>
              Chat
            </a>
            <a href="/profile" className="nav-link-mobile" onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
              Profile
            </a>
            <button onClick={onLogout} className="nav-link-mobile" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 0' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
