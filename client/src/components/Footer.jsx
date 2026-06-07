// ====================================================
// Footer Component
//
// This file renders the standard page footer structure at the bottom of the viewport.
// It maps links to static pages or shows alert prompts for placeholder sections.
//
// Features:
// - Dynamic copyright year display using JavaScript.
// - Integration with the global `onPageChange` routing method.
//
// Used by:
// - App.jsx (shared layout rendering)
// ====================================================

import React from 'react';

// Purpose:
// Renders the footer container layout.
//
// Input:
// onPageChange (function) - Callback navigation action.
//
// Output:
// Returns the footer JSX layout.
const Footer = ({ onPageChange }) => {
  // Alert wrapper to signify incomplete placeholder features
  const handleFooterClick = (e, name) => {
    e.preventDefault();
    alert(`${name} section is coming soon! Thank you for exploring JobPortal Pro.`);
  };

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }} className="footer-logo-area">
          <div className="brand-logo" style={{ cursor: 'pointer' }} onClick={() => onPageChange('home')}>
            JobPortal <span className="brand-dot"></span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Elevating the recruitment experience.
          </p>
        </div>
        
        <div className="footer-nav">
          <a href="/about" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }} onClick={(e) => { e.preventDefault(); onPageChange('/about'); }}>About Us</a>
          <a href="#contact" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }} onClick={(e) => handleFooterClick(e, 'Contact Us')}>Contact Us</a>
          <a href="#privacy" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }} onClick={(e) => handleFooterClick(e, 'Privacy Policy')}>Privacy Policy</a>
          <a href="#terms" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }} onClick={(e) => handleFooterClick(e, 'Terms & Conditions')}>Terms & Conditions</a>
          <a href="#support" className="footer-link" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }} onClick={(e) => handleFooterClick(e, 'Support')}>Support</a>
        </div>
        
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} JobPortal Pro. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
