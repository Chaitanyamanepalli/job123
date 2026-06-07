// ====================================================
// Reusable Modal Component
//
// This is a generic modal overlay that pops up on top of the screen content.
// It handles closing on Escape key press, clicking outside the modal, and disables document scrolling when open.
//
// Features:
// - Dimmed background overlay wrapper.
// - Pressing 'ESC' triggers closure.
// - Clicking background backdrop overlay triggers closure.
// - Smooth entry animation.
//
// Used by:
// - RecruiterDashboard.jsx (candidate application logs details table viewer)
// - App.jsx (Logout confirmation dialog modal)
// ====================================================

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// Purpose:
// Generic container that renders children elements inside a floating modal card dialog.
//
// Input:
// isOpen (boolean) - Toggles visibility.
// onClose (function) - Triggered when modal is requested to close.
// title (string) - Display text on header.
// children (React elements) - Body text or input forms.
// footer (React elements) - Action buttons at bottom.
//
// Output:
// Returns the modal backdrop and overlay card if isOpen is true, otherwise null.
const Modal = ({ isOpen, onClose, title, children, footer }) => {
  // Close on ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      // Prevent parent document scroll when modal is active
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Handles clicking the dark backdrop outside the modal content container
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className="modal-content-wrapper">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {/* Clickable cross button to dismiss */}
          <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
