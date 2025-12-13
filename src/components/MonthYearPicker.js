import React, { useState, useRef, useEffect } from 'react';
import { formatDateUS } from '../utils/dateUtils';
import './MonthYearPicker.css';

const MonthYearPicker = ({ selectedMonth, selectedYear, onSelect, onClose }) => {
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'
  const [displayYear, setDisplayYear] = useState(selectedYear);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Check if a month is in the future
  const isMonthDisabled = (month, year) => {
    if (year > currentYear) return true;
    if (year === currentYear && month > currentMonth) return true;
    return false;
  };

  // Check if a year is in the future
  const isYearDisabled = (year) => {
    return year > currentYear;
  };

  // Check if we can navigate to next year
  const canNavigateNextYear = () => {
    return displayYear < currentYear;
  };

  // Check if we can navigate to next month view
  const canNavigateNextMonth = () => {
    if (displayYear < currentYear) return true;
    return false; // If current year, can't go to next year
  };

  const handleMonthSelect = (month) => {
    if (!isMonthDisabled(month, displayYear)) {
      onSelect(month, displayYear);
      onClose();
    }
  };

  const handleYearSelect = (year) => {
    if (!isYearDisabled(year)) {
      setDisplayYear(year);
      setViewMode('month');
    }
  };

  const getMonthRange = (month, year) => {
    const monthStr = String(month).padStart(2, '0');
    const firstDay = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
    return { startDate: firstDay, endDate: lastDayStr };
  };

  return (
    <div className="month-year-picker" ref={pickerRef}>
      {viewMode === 'month' ? (
        <>
          <div className="picker-header">
            <button 
              className="picker-nav-btn"
              onClick={() => setDisplayYear(displayYear - 1)}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button 
              className="picker-year-btn"
              onClick={() => setViewMode('year')}
            >
              {displayYear}
            </button>
            <button 
              className={`picker-nav-btn ${!canNavigateNextMonth() ? 'disabled' : ''}`}
              onClick={() => canNavigateNextMonth() && setDisplayYear(displayYear + 1)}
              disabled={!canNavigateNextMonth()}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="picker-months">
            {months.map((month, index) => {
              const monthNum = index + 1;
              const isSelected = monthNum === selectedMonth && displayYear === selectedYear;
              const isCurrentMonth = monthNum === currentMonth && displayYear === currentYear;
              const isDisabled = isMonthDisabled(monthNum, displayYear);
              
              return (
                <button
                  key={monthNum}
                  className={`picker-month-item ${isSelected ? 'selected' : ''} ${isCurrentMonth ? 'current' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => handleMonthSelect(monthNum)}
                  disabled={isDisabled}
                >
                  {month.substring(0, 3)}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="picker-header">
            <button 
              className="picker-nav-btn"
              onClick={() => setDisplayYear(displayYear - 10)}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="picker-year-range">
              {displayYear - 9} - {displayYear}
            </span>
            <button 
              className={`picker-nav-btn ${!canNavigateNextYear() ? 'disabled' : ''}`}
              onClick={() => canNavigateNextYear() && setDisplayYear(displayYear + 10)}
              disabled={!canNavigateNextYear()}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="picker-years">
            {years.map((year) => {
              const isSelected = year === selectedYear;
              const isCurrentYear = year === currentYear;
              const isDisabled = isYearDisabled(year);
              
              return (
                <button
                  key={year}
                  className={`picker-year-item ${isSelected ? 'selected' : ''} ${isCurrentYear ? 'current' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => handleYearSelect(year)}
                  disabled={isDisabled}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default MonthYearPicker;

