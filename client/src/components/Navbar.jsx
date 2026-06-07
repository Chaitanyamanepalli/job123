import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Menu, X, User, LogOut, Shield } from 'lucide-react';

const LogoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--accent)' }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Navbar = ({ currentPage, onPageChange, user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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

        {/* Desktop Links */}
        <nav className="nav-links">
          {/* Guest Navbar */}
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

          {/* Candidate Navbar */}
          {user && user.role === 'candidate' && (
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
              <a href="/my-applications" className={`nav-link-item ${currentPage === 'my-applications' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/my-applications'); }}>
                My Applications
              </a>
              <a href="/profile" className={`nav-link-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
                Profile
              </a>
              <button onClick={onLogout} className="nav-link-item" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          )}

          {/* Recruiter Navbar */}
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
              <a href="/about" className={`nav-link-item ${currentPage === 'about' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/about'); }}>
                About
              </a>
              <a href="/profile" className={`nav-link-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
                Profile
              </a>
              <button onClick={onLogout} className="nav-link-item" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          )}

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="theme-switch-btn-nav"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} fill="currentColor" /> : <Sun size={18} />}
          </button>

          {/* User Profile Avatar Circle (if authenticated) */}
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

        {/* Mobile Hamburger Actions */}
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

      {/* Mobile Dropdown Nav Menu */}
      <nav className={`mobile-nav ${isMenuOpen ? 'open' : ''}`} style={{ backgroundColor: '#111111', borderBottomColor: '#27272a' }}>
        {/* Guest Mobile */}
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

        {/* Candidate Mobile */}
        {user && user.role === 'candidate' && (
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
            <a href="/my-applications" className={`nav-link-mobile ${currentPage === 'my-applications' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/my-applications'); }}>
              My Applications
            </a>
            <a href="/profile" className={`nav-link-mobile ${currentPage === 'profile' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/profile'); }}>
              Profile
            </a>
            <button onClick={onLogout} className="nav-link-mobile" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.75rem 0' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        )}

        {/* Recruiter Mobile */}
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
            <a href="/about" className={`nav-link-mobile ${currentPage === 'about' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); handleLinkClick('/about'); }}>
              About
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
