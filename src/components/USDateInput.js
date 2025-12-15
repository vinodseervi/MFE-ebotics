import React, { useState, useRef, useEffect } from 'react';
import { formatDateUS, parseDateUS } from '../utils/dateUtils';
import './USDateInput.css';

const USDateInput = ({ value, onChange, placeholder = 'MM/DD/YYYY', max, min, required, className = '', id, name }) => {
  const [displayValue, setDisplayValue] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const dateInputRef = useRef(null);
  const containerRef = useRef(null);

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
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus the hidden date input to show calendar
      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.showPicker?.();
        }
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

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
    if (dateValue) {
      setDisplayValue(formatDateUS(dateValue));
      onChange({ target: { name, value: dateValue } });
    }
    setShowCalendar(false);
  };

  const handleCalendarClick = () => {
    setShowCalendar(true);
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
