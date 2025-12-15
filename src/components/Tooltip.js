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
      const calculatePosition = () => {
        if (!triggerRef.current) return;
        
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollX = window.scrollX || window.pageXOffset;

        // Estimate tooltip dimensions based on text
        const estimatedCharWidth = 7.5; // Average character width in pixels
        const estimatedLineHeight = 20;
        const padding = 24; // 12px left + 12px right
        const verticalPadding = 16; // 8px top + 8px bottom
        const arrowHeight = 6;
        
        const textWidth = Math.min(text.length * estimatedCharWidth, 300);
        const tooltipWidth = Math.max(textWidth + padding, 80);
        const tooltipHeight = verticalPadding + estimatedLineHeight + arrowHeight;

        let top, left;
        const spacing = 6; // Space between element and tooltip

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
            top = rect.bottom + scrollY + spacing;
            left = rect.left + scrollX + (rect.width / 2) - (tooltipWidth / 2);
        }

        // Adjust if tooltip goes outside viewport
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 10;

        // Horizontal adjustments
        if (left < margin) {
          left = margin;
        } else if (left + tooltipWidth > viewportWidth - margin) {
          left = viewportWidth - tooltipWidth - margin;
        }

        // Vertical adjustments
        if (top < margin) {
          top = margin;
        } else if (top + tooltipHeight > viewportHeight - margin) {
          top = viewportHeight - tooltipHeight - margin;
        }

        setTooltipPosition({ top, left });
      };

      // Initial calculation
      calculatePosition();

      // Recalculate after a brief delay to get actual tooltip dimensions
      const timeoutId = setTimeout(() => {
        if (tooltipRef.current && triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;

          let top, left;
          const spacing = 6;

          switch (position) {
            case 'top':
              top = rect.top + scrollY - tooltipRect.height - spacing;
              left = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2);
              break;
            case 'bottom':
              top = rect.bottom + scrollY + spacing;
              left = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2);
              break;
            case 'left':
              top = rect.top + scrollY + (rect.height / 2) - (tooltipRect.height / 2);
              left = rect.left + scrollX - tooltipRect.width - spacing;
              break;
            case 'right':
              top = rect.top + scrollY + (rect.height / 2) - (tooltipRect.height / 2);
              left = rect.right + scrollX + spacing;
              break;
            default:
              top = rect.bottom + scrollY + spacing;
              left = rect.left + scrollX + (rect.width / 2) - (tooltipRect.width / 2);
          }

          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          const margin = 10;

          if (left < margin) left = margin;
          if (left + tooltipRect.width > viewportWidth - margin) {
            left = viewportWidth - tooltipRect.width - margin;
          }
          if (top < margin) top = margin;
          if (top + tooltipRect.height > viewportHeight - margin) {
            top = viewportHeight - tooltipRect.height - margin;
          }

          setTooltipPosition({ top, left });
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [showTooltip, position, text]);

  if (!text || text.length <= 12) {
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
      {showTooltip && createPortal(
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${position}`}
          style={{
            position: 'fixed',
            top: tooltipPosition ? `${tooltipPosition.top}px` : '-9999px',
            left: tooltipPosition ? `${tooltipPosition.left}px` : '-9999px',
            zIndex: 10000,
            visibility: tooltipPosition ? 'visible' : 'hidden'
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="tooltip-content">{text}</div>
          {position === 'bottom' && <div className="tooltip-arrow tooltip-arrow-top"></div>}
          {position === 'top' && <div className="tooltip-arrow tooltip-arrow-bottom"></div>}
          {position === 'left' && <div className="tooltip-arrow tooltip-arrow-right"></div>}
          {position === 'right' && <div className="tooltip-arrow tooltip-arrow-left"></div>}
        </div>,
        document.body
      )}
    </>
  );
};

export default Tooltip;
