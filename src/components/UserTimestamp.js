import React from 'react';
import Tooltip from './Tooltip';
import { getRelativeTime, formatDateTimeTooltip } from '../utils/dateUtils';
import './UserTimestamp.css';

/**
 * UserTimestamp component displays a profile circle with user initials
 * and relative time, with a tooltip showing full details on hover
 * @param {string} userId - User ID to get user info
 * @param {string} dateTime - ISO date time string
 * @param {string} action - Action type: 'created' or 'updated'
 * @param {function} getUserName - Function to get user name from user ID
 * @param {function} getUserById - Function to get user object from user ID
 */
const UserTimestamp = ({ userId, dateTime, action = 'created', getUserName, getUserById }) => {
  if (!dateTime) return <span></span>;
  
  const userName = getUserName ? getUserName(userId) : 'Unknown User';
  const user = getUserById ? getUserById(userId) : null;
  const relativeTime = getRelativeTime(dateTime);
  const tooltipTime = formatDateTimeTooltip(dateTime);
  
  // Get user initials (first letter of first name and last name)
  const getInitials = () => {
    if (user && user.firstName && user.lastName) {
      // Use first letter of first name and last name
      return `${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}`;
    }
    
    // Fallback: use name string
    if (!userName || userName === 'Unknown User' || userName === 'N/A') return '??';
    
    // If name is an email, use first two letters
    if (userName.includes('@')) {
      return userName.substring(0, 2).toUpperCase();
    }
    
    // Split by space and get first letter of first and last word
    const parts = userName.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    const firstInitial = parts[0] ? parts[0].charAt(0).toUpperCase() : '';
    const lastInitial = parts[parts.length - 1] ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    
    return (firstInitial + lastInitial) || '??';
  };
  
  const initials = getInitials();
  const tooltipText = `${action === 'created' ? 'Created' : 'Updated'} by ${userName} on ${tooltipTime}`;
  
  return (
    <Tooltip text={tooltipText} position="top">
      <div className="user-timestamp">
        <div className={`user-avatar ${action}`}>
          {initials}
        </div>
        <span className="relative-time">{relativeTime}</span>
      </div>
    </Tooltip>
  );
};

export default UserTimestamp;
