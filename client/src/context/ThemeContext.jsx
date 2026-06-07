// ====================================================
// Theme Context (Light / Dark Mode State)
//
// This file manages the visual theme of the application (light or dark mode).
// It stores the user's preference in localStorage to remember it on page refresh.
//
// Features:
// - Initializes theme state from localStorage or browser preferences.
// - Provides a toggle function to switch between light and dark modes.
// - Exports a custom useTheme hook for children components to read the active theme state.
//
// Used by:
// - Navbar.jsx (to trigger theme switches)
// - index.css (defines colors mapping to the data-theme attribute)
// ====================================================

import React, { createContext, useState, useEffect, useContext } from 'react';

// Create the context container
const ThemeContext = createContext();

// Purpose:
// Context Provider wrapper component that manages the theme state.
//
// Input:
// children (React Components) - The child components that can access the theme context.
//
// Output:
// Returns the ThemeContext Provider JSX wrapping the children components.
//
// Usage:
// Wrapped around the main App component in App.jsx.
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check if the user previously selected a theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    // Check the user's operating system dark/light mode preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  // Automatically update the document theme attribute whenever theme changes
  useEffect(() => {
    // Apply data-theme attribute on the <html> tag, which triggers CSS updates
    document.documentElement.setAttribute('data-theme', theme);
    // Remember theme selection for future visits
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Purpose:
  // Toggles the active theme between light and dark modes.
  //
  // Input:
  // None.
  //
  // Output:
  // Toggles theme state value.
  //
  // Usage:
  // Called when clicking the Sun/Moon icons in the Navbar header.
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Purpose:
// Custom hook that allows React components to access the theme state and toggle handler.
//
// Input:
// None.
//
// Output:
// Returns the active theme context object.
//
// Usage:
// Used in the Navbar component to display the theme switch icons.
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
