import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

/**
 * Tooltip component that shows text on hover
 * @param {Object} props
 * @param {React.ReactNode} props.children - Element to attach tooltip to
 * @param {string} props.text - Text to show in tooltip
 * @param {string} props.position - Tooltip position: 'top', 'bottom', 'left', 'right' (default: 'top')
 */
const Tooltip = ({ children, text, position = 'top' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (showTooltip && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;

      let top, left;
      const tooltipHeight = 30; // Approximate tooltip height
      const tooltipWidth = 200; // Approximate tooltip width
      const spacing = 8;

      switch (position) {
        case 'top':
          top = rect.top + scrollY - tooltipHeight - spacing;
          left = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case 'bottom':
          top = rect.bottom + scrollY + spacing;
          left = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case 'left':
          top = rect.top + scrollY + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.left + scrollX - tooltipWidth - spacing;
          break;
        case 'right':
          top = rect.top + scrollY + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.right + scrollX + spacing;
          break;
        default:
          top = rect.top + scrollY - tooltipHeight - spacing;
          left = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
      }

      // Adjust if tooltip goes outside viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < 10) left = 10;
      if (left + tooltipWidth > viewportWidth - 10) {
        left = viewportWidth - tooltipWidth - 10;
      }
      if (top < 10) top = 10;
      if (top + tooltipHeight > viewportHeight - 10) {
        top = viewportHeight - tooltipHeight - 10;
      }

      setTooltipPosition({ top, left });
    }
  }, [showTooltip, position]);

  if (!text || text.length <= 15) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ display: 'inline-block' }}
      >
        {children}
      </span>
      {showTooltip && tooltipPosition && createPortal(
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${position}`}
          style={{
            position: 'fixed',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            zIndex: 10000
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
