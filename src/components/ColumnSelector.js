import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ColumnSelector.css';

/**
 * Column selector component with drag and drop
 * @param {Object} props
 * @param {Array} props.availableColumns - All available columns
 * @param {Array} props.visibleColumns - Currently visible columns
 * @param {Array} props.defaultColumns - Default columns to reset to
 * @param {Function} props.onChange - Callback when columns change
 * @param {Function} props.onClose - Callback to close the selector
 * @param {Object} props.triggerRef - Ref to the trigger button for positioning
 */
const ColumnSelector = ({ availableColumns, visibleColumns, defaultColumns, onChange, onClose, triggerRef }) => {
  const [localVisibleColumns, setLocalVisibleColumns] = useState(visibleColumns);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [position, setPosition] = useState(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showLimitMessage, setShowLimitMessage] = useState(false);
  const popupRef = React.useRef(null);
  
  const MAX_COLUMNS = 10; // Maximum number of columns user can select

  // Check if we're on a small screen (matching media queries)
  useEffect(() => {
    const checkScreenSize = () => {
      // Match the media queries used in App.css: max-width: 1024px or max-width: 768px
      const isSmall = window.innerWidth <= 1024;
      setIsSmallScreen(isSmall);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    setLocalVisibleColumns(visibleColumns);
  }, [visibleColumns]);

  // Calculate position with viewport boundary checks
  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      const popupWidth = 320;
      const popupHeight = 500; // Slightly taller, while still keeping footer visible
      const spacing = 4;
      const margin = 12; // General margin from viewport edges
      const bottomGap = 40; // Extra space from bottom of screen for OS/taskbar
      
      // Calculate initial position (using getBoundingClientRect which gives viewport-relative coords)
      let top = rect.bottom + spacing;
      let left = rect.left;
      
      // Check if popup would overflow right edge
      const viewportWidth = window.innerWidth;
      if (left + popupWidth > viewportWidth - margin) {
        // Position to the left of trigger instead
        left = rect.right - popupWidth;
        // If still overflows, align to right edge of viewport
        if (left < margin) {
          left = viewportWidth - popupWidth - margin;
        }
      }
      
      // Check if popup would overflow bottom edge and constrain height
      const viewportHeight = window.innerHeight;
      const maxAvailableHeight = viewportHeight - margin * 2 - bottomGap;
      
      // Calculate available space below the button
      const spaceBelow = viewportHeight - rect.bottom - bottomGap - spacing;
      
      // Prefer positioning below button - constrain height to available space
      let effectiveHeight;
      if (spaceBelow >= popupHeight * 0.5) {
        // Good space below - use full or near-full height
        effectiveHeight = Math.min(popupHeight, maxAvailableHeight);
        top = rect.bottom + spacing;
      } else if (spaceBelow > 200) {
        // Some space below - use what's available
        effectiveHeight = Math.min(popupHeight, spaceBelow);
        top = rect.bottom + spacing;
      } else {
        // Very little space below - try above button
        const spaceAbove = rect.top - margin - spacing;
        if (spaceAbove >= popupHeight * 0.5) {
          effectiveHeight = Math.min(popupHeight, maxAvailableHeight);
          top = rect.top - effectiveHeight - spacing;
          if (top < margin) {
            top = margin;
            effectiveHeight = Math.min(effectiveHeight, viewportHeight - top - bottomGap);
          }
        } else {
          // Limited space everywhere - position below with constrained height
          effectiveHeight = Math.max(200, Math.min(popupHeight, spaceBelow));
          top = rect.bottom + spacing;
        }
      }
      
      // Final check: ensure popup doesn't overflow bottom
      if (top + effectiveHeight > viewportHeight - bottomGap) {
        effectiveHeight = viewportHeight - top - bottomGap;
        if (effectiveHeight < 200) {
          // If too constrained, try moving up
          effectiveHeight = Math.min(popupHeight, maxAvailableHeight);
          top = viewportHeight - effectiveHeight - bottomGap;
          if (top < margin) {
            top = margin;
            effectiveHeight = Math.min(effectiveHeight, viewportHeight - top - bottomGap);
          }
        }
      }

      // Ensure minimum horizontal margins from edges
      if (left < margin) left = margin;
      
      setPosition({
        top,
        left,
        width: popupWidth,
        height: effectiveHeight
      });
    }
  }, [triggerRef]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, triggerRef]);

  const handleToggleColumn = (columnKey) => {
    // Don't allow toggling always visible columns
    const column = availableColumns.find(col => col.key === columnKey);
    if (column && column.alwaysVisible) return;

    const isVisible = localVisibleColumns.includes(columnKey);
    if (isVisible) {
      // Allow removing columns
      setLocalVisibleColumns(prev => prev.filter(key => key !== columnKey));
      setShowLimitMessage(false); // Hide message when removing columns
    } else {
      // Check if adding this column would exceed the limit
      const currentVisibleCount = localVisibleColumns.length;
      
      if (currentVisibleCount >= MAX_COLUMNS) {
        // Show message that limit is reached
        setShowLimitMessage(true);
        // Hide message after 3 seconds
        setTimeout(() => setShowLimitMessage(false), 3000);
        return; // Don't add, already at limit
      }
      
      setLocalVisibleColumns(prev => [...prev, columnKey]);
      setShowLimitMessage(false); // Hide message when successfully adding
    }
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...localVisibleColumns];
    const draggedItem = newColumns[draggedIndex];
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedItem);
    setLocalVisibleColumns(newColumns);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleApply = () => {
    onChange(localVisibleColumns);
    onClose();
  };

  const handleReset = () => {
    // Reset to default columns, ensuring always-visible columns are included
    if (!defaultColumns) {
      // Fallback: reset to all columns if no defaultColumns provided
      let resetColumns = availableColumns.map(col => col.key);
      
      // Limit to MAX_COLUMNS
      if (resetColumns.length > MAX_COLUMNS) {
        resetColumns = resetColumns.slice(0, MAX_COLUMNS);
      }
      
      setLocalVisibleColumns(resetColumns);
      setShowLimitMessage(false);
      return;
    }
    
    // Get default columns as a set for quick lookup
    const defaultSet = new Set(defaultColumns);
    
    // Build reset columns by going through availableColumns in order
    // Include columns that are either always-visible OR in defaultColumns
    let resetColumns = availableColumns
      .filter(col => col.alwaysVisible || defaultSet.has(col.key))
      .map(col => col.key);
    
    // Limit to MAX_COLUMNS
    if (resetColumns.length > MAX_COLUMNS) {
      resetColumns = resetColumns.slice(0, MAX_COLUMNS);
    }
    
    setLocalVisibleColumns(resetColumns);
    setShowLimitMessage(false);
  };

  if (!position) return null;

  return createPortal(
    <div
      ref={popupRef}
      className="column-selector-popup"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        maxHeight: `${position.height}px`,
        zIndex: 1000
      }}
    >
      <div className="column-selector-header">
        <h3>Select Columns</h3>
        <button className="close-btn" onClick={onClose}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="column-selector-content">
        <div className="column-selector-info">
          Drag to reorder, check to show/hide
          <div style={{ marginTop: '6px', fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
            Maximum {MAX_COLUMNS} columns allowed
          </div>
          {showLimitMessage && (
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#ef4444', fontWeight: '500' }}>
              You can only select {MAX_COLUMNS} columns maximum
            </div>
          )}
        </div>
        <div className="column-list">
          {localVisibleColumns.map((columnKey, index) => {
            const column = availableColumns.find(col => col.key === columnKey);
            if (!column) return null;
            const isAlwaysVisible = column.alwaysVisible;

            return (
              <div
                key={columnKey}
                className={`column-item ${draggedIndex === index ? 'dragging' : ''} ${isAlwaysVisible ? 'always-visible' : ''}`}
                draggable={!isAlwaysVisible}
                onDragStart={() => !isAlwaysVisible && handleDragStart(index)}
                onDragOver={(e) => !isAlwaysVisible && handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                {!isAlwaysVisible && (
                  <div className="drag-handle">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M7 5H13M7 10H13M7 15H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
                <label className="column-checkbox">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => handleToggleColumn(columnKey)}
                    disabled={isAlwaysVisible}
                  />
                  <span>{column.label}</span>
                  {isAlwaysVisible && (
                    <span className="always-visible-badge">(Always visible)</span>
                  )}
                </label>
              </div>
            );
          })}
        </div>

        <div className="column-list-hidden">
          <div className="hidden-columns-title">Hidden Columns</div>
          {availableColumns
            .filter(col => !localVisibleColumns.includes(col.key))
            .map(column => {
              // Check if we're at the limit
              const isDisabled = localVisibleColumns.length >= MAX_COLUMNS;
              
              return (
                <div key={column.key} className={`column-item ${isDisabled ? 'disabled' : ''}`}>
                  <label className="column-checkbox" style={{ opacity: isDisabled ? 0.5 : 1 }}>
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => handleToggleColumn(column.key)}
                      disabled={isDisabled}
                    />
                    <span>{column.label}</span>
                  </label>
                </div>
              );
            })}
        </div>
      </div>

      <div className="column-selector-footer">
        <button className="btn-reset" onClick={handleReset}>
          Reset
        </button>
        <button className="btn-apply" onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>,
    document.body
  );
};

export default ColumnSelector;
