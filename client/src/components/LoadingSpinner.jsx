// ====================================================
// Loading Spinner Component
//
// This is a simple visual loading indicator shown to users during API data fetches.
//
// Features:
// - Spinning CSS circle animation container.
// - Centered relative to its parent container.
//
// Used by:
// - Home.jsx, Jobs.jsx, Profile.jsx, and RecruiterDashboard.jsx during state loading cycles.
// ====================================================

import React from 'react';

// Purpose:
// Renders the centered spinning loading ring.
//
// Input:
// None.
//
// Output:
// Returns the spinner HTML nodes.
const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner;
