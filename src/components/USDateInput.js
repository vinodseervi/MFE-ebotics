import React, { useState, useRef, useEffect } from 'react';
import { formatDateUS, parseDateUS } from '../utils/dateUtils';
import './USDateInput.css';

const USDateInput = ({ value, onChange, placeholder = 'MM/DD/YYYY', max, min, required, className = '', id, name }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const dateInputRef = useRef(null);
  const containerRef = useRef(null);
  const isInteractingWithPicker = useRef(false);
  const lastDateValue = useRef(value || '');
  const dateSelectionTimeout = useRef(null);

  useEffect(() => {
    if (value) {
      // If value is in YYYY-MM-DD format, convert to MM/DD/YYYY for display
      if (value.includes('-') && value.length === 10) {
        setDisplayValue(formatDateUS(value));
      } else if (value.includes('/')) {
        // Already in US format
        setDisplayValue(value);
      } else {
        setDisplayValue(value);
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  useEffect(() => {
    let clickTimeout;
    let blurTimeout;

    const handleMouseDown = (event) => {
      // Check if click is within our container
      const isInsideContainer = containerRef.current && containerRef.current.contains(event.target);
      
      // Check if click is on a date input (native picker UI)
      const target = event.target;
      const isDateInput = target.tagName === 'INPUT' && target.type === 'date';
      
      // Don't close if clicking on date input or inside container
      if (isInsideContainer || isDateInput) {
        isInteractingWithPicker.current = true;
        return;
      }
      
      // Clear any pending timeout
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
      
      // Use a longer delay to allow date picker month navigation
      // The native date picker UI is rendered outside our DOM
      clickTimeout = setTimeout(() => {
        // Double-check that we're still supposed to be open and focus hasn't moved to date input
        const activeElement = document.activeElement;
        const isDateInputFocused = activeElement && activeElement.tagName === 'INPUT' && activeElement.type === 'date';
        
        if (!isDateInputFocused && !isInteractingWithPicker.current) {
          setShowCalendar(false);
        }
      }, 500);
    };

    const handleBlur = () => {
      // Clear any pending timeout
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
      
      // Use a much longer delay to allow date picker interactions (month navigation)
      blurTimeout = setTimeout(() => {
        const activeElement = document.activeElement;
        const isInsideContainer = containerRef.current && containerRef.current.contains(activeElement);
        const isDateInput = activeElement && activeElement.tagName === 'INPUT' && activeElement.type === 'date';
        
        // Only close if focus is truly outside and not on date input
        // Also check if we're still interacting (user might be navigating months)
        if (!isInsideContainer && !isDateInput && !isInteractingWithPicker.current) {
          setShowCalendar(false);
        }
      }, 600);
    };

    const handleFocus = () => {
      // When date input gets focus, we're interacting with picker
      isInteractingWithPicker.current = true;
      // Clear any pending blur timeout
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
    };

    // Capture the ref value at the start of the effect
    const currentDateInput = dateInputRef.current;

    if (showCalendar) {
      // Store the current value when calendar opens
      lastDateValue.current = value || '';
      
      // Use a longer delay before adding click listener to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleMouseDown, true);
      }, 150);
      
      // Focus the hidden date input to show calendar
      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.showPicker?.();
          dateInputRef.current.addEventListener('blur', handleBlur);
          dateInputRef.current.addEventListener('focus', handleFocus);
          isInteractingWithPicker.current = true;
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleMouseDown, true);
      // Use the captured ref value from the start of the effect
      if (currentDateInput) {
        currentDateInput.removeEventListener('blur', handleBlur);
        currentDateInput.removeEventListener('focus', handleFocus);
      }
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
      if (dateSelectionTimeout.current) {
        clearTimeout(dateSelectionTimeout.current);
      }
    };
  }, [showCalendar, value]);

  const handleTextChange = (e) => {
    let inputValue = e.target.value;
    
    // Remove non-numeric and non-slash characters
    inputValue = inputValue.replace(/[^\d/]/g, '');
    
    // Auto-format as user types
    if (inputValue.length <= 2) {
      setDisplayValue(inputValue);
    } else if (inputValue.length <= 5) {
      // Add first slash
      if (inputValue.length === 3 && !inputValue.includes('/')) {
        inputValue = inputValue.slice(0, 2) + '/' + inputValue.slice(2);
      }
      setDisplayValue(inputValue);
    } else if (inputValue.length <= 10) {
      // Add second slash
      if (inputValue.length === 6 && inputValue.split('/').length === 2) {
        inputValue = inputValue.slice(0, 5) + '/' + inputValue.slice(5);
      }
      setDisplayValue(inputValue);
    } else {
      // Limit to 10 characters (MM/DD/YYYY)
      setDisplayValue(inputValue.slice(0, 10));
    }

    // Convert to YYYY-MM-DD format for onChange
    if (inputValue.length === 10) {
      const apiDate = parseDateUS(inputValue);
      if (apiDate) {
        onChange({ target: { name, value: apiDate } });
      }
    } else if (inputValue.length === 0) {
      onChange({ target: { name, value: '' } });
    }
  };

  const handleTextBlur = (e) => {
    const inputValue = e.target.value;
    if (inputValue && inputValue.length === 10) {
      const apiDate = parseDateUS(inputValue);
      if (apiDate) {
        setDisplayValue(formatDateUS(apiDate));
        onChange({ target: { name, value: apiDate } });
      }
    }
  };

  const handleDateInputChange = (e) => {
    const dateValue = e.target.value;
    
    // Clear any pending timeout
    if (dateSelectionTimeout.current) {
      clearTimeout(dateSelectionTimeout.current);
    }
    
    if (dateValue) {
      // Check if the value actually changed (user selected a date, not just navigated)
      const valueChanged = dateValue !== lastDateValue.current;
      
      if (valueChanged) {
        // Value changed - this is likely an actual date selection
        setDisplayValue(formatDateUS(dateValue));
        onChange({ target: { name, value: dateValue } });
        lastDateValue.current = dateValue;
        
        // Close calendar after a short delay to ensure selection is complete
        dateSelectionTimeout.current = setTimeout(() => {
          setShowCalendar(false);
          isInteractingWithPicker.current = false;
        }, 200);
      } else {
        // Value didn't change - this might be month navigation
        // Don't close the calendar, just keep it open
        isInteractingWithPicker.current = true;
      }
    }
  };

  const handleCalendarClick = () => {
    setShowCalendar(true);
    isInteractingWithPicker.current = true;
    // Store current value when opening calendar
    lastDateValue.current = value || '';
  };

  return (
    <div ref={containerRef} className={`us-date-input-container ${className}`}>
      <div className="us-date-input-wrapper">
        <input
          type="text"
          value={displayValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          placeholder={placeholder}
          maxLength={10}
          className={`us-date-text-input ${className.includes('error') ? 'error' : ''}`}
          id={id}
          name={name}
          required={required}
        />
        <button
          type="button"
          className="us-date-calendar-btn"
          onClick={handleCalendarClick}
          tabIndex={-1}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M6 2V4M14 2V4M3 8H17M4 4H16C16.5523 4 17 4.44772 17 5V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V5C3 4.44772 3.44772 4 4 4Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {showCalendar && (
        <input
          ref={dateInputRef}
          type="date"
          value={value || ''}
          onChange={handleDateInputChange}
          max={max}
          min={min}
          className="us-date-hidden-input"
        />
      )}
    </div>
  );
};

export default USDateInput;
