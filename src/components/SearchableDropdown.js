import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './SearchableDropdown.css';

/**
 * Reusable searchable dropdown component
 * @param {Object} props
 * @param {Array} props.options - Array of options {value, label}
 * @param {string} props.value - Selected value
 * @param {Function} props.onChange - Callback when value changes
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether dropdown is disabled
 * @param {Function} props.getDisplayValue - Optional function to get display value for selected option
 * @param {number} props.maxVisibleItems - Maximum visible items before scroll (default: 10)
 */
const SearchableDropdown = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  disabled = false,
  getDisplayValue,
  maxVisibleItems = 10,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Calculate dropdown position with viewport boundary checks
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      // Use a small delay to ensure DOM is fully updated
      const timeoutId = setTimeout(() => {
        if (!triggerRef.current) return;
        
        const rect = triggerRef.current.getBoundingClientRect();
        const spacing = 4;
        const margin = 10;
        const popupWidth = Math.max(rect.width, 280);
        const estimatedHeight = 300; // Approximate dropdown height
        
        // Calculate initial position (using fixed positioning)
        // getBoundingClientRect() gives viewport coordinates, perfect for fixed positioning
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
        if (bottomSpace < estimatedHeight + margin) {
          // Position above trigger instead
          top = rect.top - estimatedHeight - spacing;
          // If still overflows, align to top edge
          if (top < margin) {
            top = margin;
          }
        } else {
          // Prefer positioning below the trigger
          top = rect.bottom + spacing;
        }
        
        // Ensure minimum margins from edges
        if (left < margin) left = margin;
        if (top < margin) top = margin;
        
        setDropdownPosition({
          top: top,
          left: left,
          width: popupWidth
        });
      }, 0);
      
      return () => clearTimeout(timeoutId);
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Listen for close all dropdowns event
  useEffect(() => {
    const handleCloseAll = (event) => {
      if (event.detail?.excludeTrigger !== triggerRef.current && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    window.addEventListener('closeAllDropdowns', handleCloseAll);
    return () => {
      window.removeEventListener('closeAllDropdowns', handleCloseAll);
    };
  }, [isOpen]);

  // Close dropdown when clicking outside or on another dropdown trigger
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if clicking on another dropdown trigger
      const clickedTrigger = event.target.closest('.searchable-dropdown-trigger');
      const isAnotherDropdownTrigger = clickedTrigger && clickedTrigger !== triggerRef.current;
      
      // Check if clicking on another dropdown popup
      const clickedPopup = event.target.closest('.searchable-dropdown-popup');
      const isAnotherDropdownPopup = clickedPopup && clickedPopup !== dropdownRef.current;
      
      // Close if clicking on another dropdown trigger
      if (isAnotherDropdownTrigger) {
        setIsOpen(false);
        setSearchTerm('');
        return;
      }
      
      if (
        !isAnotherDropdownPopup &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      // Use a small delay to avoid immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    if (!searchTerm) return true;
    const label = option.label || option.name || String(option.value || '');
    return label.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Get display value for selected option
  const getSelectedDisplayValue = () => {
    if (!value) return placeholder;
    
    const selectedOption = options.find(opt => String(opt.value) === String(value));
    if (selectedOption) {
      if (getDisplayValue) {
        return getDisplayValue(selectedOption);
      }
      return selectedOption.label || selectedOption.name || String(selectedOption.value);
    }
    return placeholder;
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = (e) => {
    if (!disabled) {
      e.stopPropagation(); // Prevent event bubbling to drawer overlay
      
      // Close all other dropdowns first by dispatching a custom event
      window.dispatchEvent(new CustomEvent('closeAllDropdowns', { 
        detail: { excludeTrigger: triggerRef.current } 
      }));
      
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`searchable-dropdown-trigger ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''} ${compact ? 'compact' : ''}`}
        onClick={handleToggle}
      >
        <span className="dropdown-value">{getSelectedDisplayValue()}</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 20 20" 
          fill="none"
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
        >
          <path 
            d="M5 7.5L10 12.5L15 7.5" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="searchable-dropdown-popup"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            zIndex: 10000
          }}
        >
          <div className="dropdown-search">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 15L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="dropdown-search-input"
            />
          </div>
          <div className="dropdown-options" style={{ maxHeight: `${maxVisibleItems * 40}px` }}>
            {filteredOptions.length === 0 ? (
              <div className="dropdown-no-results">No results found</div>
            ) : (
              filteredOptions.map((option) => {
                const optionValue = String(option.value);
                const isSelected = String(value) === optionValue;
                const label = option.label || option.name || String(option.value);
                
                return (
                  <div
                    key={optionValue}
                    className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option.value);
                    }}
                  >
                    {label}
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path 
                          d="M16.6667 5L7.50004 14.1667L3.33337 10" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default SearchableDropdown;
