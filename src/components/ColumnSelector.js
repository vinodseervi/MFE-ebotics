import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ColumnSelector.css';

/**
 * Column selector component with drag and drop
 * @param {Object} props
 * @param {Array} props.availableColumns - All available columns
 * @param {Array} props.visibleColumns - Currently visible columns
 * @param {Function} props.onChange - Callback when columns change
 * @param {Function} props.onClose - Callback to close the selector
 * @param {Object} props.triggerRef - Ref to the trigger button for positioning
 */
const ColumnSelector = ({ availableColumns, visibleColumns, onChange, onClose, triggerRef }) => {
  const [localVisibleColumns, setLocalVisibleColumns] = useState(visibleColumns);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [position, setPosition] = useState(null);
  const popupRef = React.useRef(null);

  useEffect(() => {
    setLocalVisibleColumns(visibleColumns);
  }, [visibleColumns]);

  // Calculate position with viewport boundary checks
  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      
      const popupWidth = 320;
      const popupHeight = 500; // Approximate max height
      const spacing = 4;
      const margin = 10; // Margin from viewport edges
      
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
      
      // Check if popup would overflow bottom edge
      const viewportHeight = window.innerHeight;
      const bottomSpace = viewportHeight - rect.bottom;
      if (bottomSpace < popupHeight + margin) {
        // Position above trigger instead
        top = rect.top - popupHeight - spacing;
        // If still overflows, align to top edge
        if (top < margin) {
          top = margin;
        }
      }
      
      // Ensure minimum margins from edges
      if (left < margin) left = margin;
      if (top < margin) top = margin;
      
      setPosition({
        top: top,
        left: left,
        width: popupWidth
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
      setLocalVisibleColumns(prev => prev.filter(key => key !== columnKey));
    } else {
      setLocalVisibleColumns(prev => [...prev, columnKey]);
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
    setLocalVisibleColumns(availableColumns.map(col => col.key));
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
            .map(column => (
              <div key={column.key} className="column-item">
                <label className="column-checkbox">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggleColumn(column.key)}
                  />
                  <span>{column.label}</span>
                </label>
              </div>
            ))}
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
