// ====================================================
// Custom Select Dropdown Component
//
// This is a premium-styled custom dropdown selector.
// It includes keyboard accessibility (arrow navigation, Enter activation) and closes on clicks outside.
//
// Features:
// - Custom HTML list elements styling matching premium themes.
// - Closes on backdrop mouse clicks.
// - Keyboard arrow key option traversal support.
//
// Used by:
// - Jobs.jsx (for Sort and Jobs Filter selections)
// - MyApplications.jsx (for Dashboard table filter selectors)
// ====================================================

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

// Purpose:
// Renders an accessible, stylable dropdown list.
//
// Input:
// value (string) - Active selection value.
// onChange (function) - Selection change handler callback.
// options (Array of objects) - Dropdown item lists containing `{ value, label }`.
// className (string) - Optional additional CSS class.
//
// Output:
// Returns the CustomSelect dropdown triggers and option items list.
const CustomSelect = ({ value, onChange, options = [], className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Identify active label details matching the current value parameter
  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  // Close dropdown menu if user clicks anywhere outside the component boundary
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => setIsOpen(!isOpen);

  // Set the selected value and trigger parent callback
  const handleSelect = (val) => {
    onChange({ target: { value: val } });
    setIsOpen(false);
  };

  // Keyboard navigation control (Arrow keys, Spacebar, Enter, Escape)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      // Move highlight focus downwards
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const nextIndex = (currentIndex + 1) % options.length;
      handleSelect(options[nextIndex].value);
    } else if (e.key === 'ArrowUp' && isOpen) {
      e.preventDefault();
      // Move highlight focus upwards
      const currentIndex = options.findIndex((opt) => opt.value === value);
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      handleSelect(options[prevIndex].value);
    }
  };

  return (
    <div 
      className={`custom-select-container ${className} ${isOpen ? 'is-open' : ''}`} 
      ref={dropdownRef}
    >
      {/* Clickable select trigger head */}
      <button
        type="button"
        className="custom-select-trigger"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-label">{selectedOption ? selectedOption.label : ''}</span>
        <ChevronDown size={16} className="custom-select-chevron" />
      </button>

      {/* Floating option list card */}
      {isOpen && (
        <ul className="custom-select-options" role="listbox">
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`custom-select-option ${opt.value === value ? 'is-selected' : ''}`}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
