/**
 * Date utility functions for US date format handling
 */

/**
 * Convert date to US format (MM/DD/YYYY) for display
 * @param {string|Date} date - Date in YYYY-MM-DD format or Date object
 * @returns {string} Date in MM/DD/YYYY format
 */
export const formatDateUS = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${month}/${day}/${year}`;
};

/**
 * Convert US date format (MM/DD/YYYY) to API format (YYYY-MM-DD)
 * @param {string} dateStr - Date in MM/DD/YYYY format
 * @returns {string} Date in YYYY-MM-DD format
 */
export const parseDateUS = (dateStr) => {
  if (!dateStr) return '';
  
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '';
  
  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  const year = parts[2];
  
  return `${year}-${month}-${day}`;
};

/**
 * Get first day of current month in YYYY-MM-DD format
 * @returns {string} First day of current month
 */
export const getFirstDayOfCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

/**
 * Get last day of current month in YYYY-MM-DD format
 * @returns {string} Last day of current month
 */
export const getLastDayOfCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
  return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
};

/**
 * Get current month date range
 * @returns {Object} Object with startDate and endDate in YYYY-MM-DD format
 */
export const getCurrentMonthRange = () => {
  return {
    startDate: getFirstDayOfCurrentMonth(),
    endDate: getLastDayOfCurrentMonth()
  };
};

/**
 * Get month range for a specific month and year
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {Object} Object with startDate and endDate in YYYY-MM-DD format
 */
export const getMonthRange = (month, year) => {
  // month is 1-12, convert to 0-based for JavaScript Date
  const monthIndex = month - 1;
  const monthStr = String(month).padStart(2, '0');
  const firstDay = `${year}-${monthStr}-01`;
  
  // Get last day of the month: new Date(year, monthIndex + 1, 0) gives last day of monthIndex
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const lastDayStr = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
  
  return {
    startDate: firstDay,
    endDate: lastDayStr
  };
};

/**
 * Get current month and year
 * @returns {Object} Object with month (1-12) and year
 */
export const getCurrentMonthYear = () => {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear()
  };
};

/**
 * Format date range for display (MM/DD/YYYY - MM/DD/YYYY)
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  return `${formatDateUS(startDate)} - ${formatDateUS(endDate)}`;
};

/**
 * Format month and year for display (e.g., "Dec 2025")
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @returns {string} Formatted month year
 */
export const formatMonthYear = (month, year) => {
  if (!month || !year) return '';
  const date = new Date(year, month - 1, 1);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
};

/**
 * Format date time for display (MM/DD/YYYY HH:MM AM/PM)
 * @param {string|Date} dateTime - Date time string or Date object
 * @returns {string} Formatted date time in MM/DD/YYYY HH:MM AM/PM format
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (isNaN(date.getTime())) return '';
  
  // Format date as MM/DD/YYYY
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  
  // Format time as HH:MM AM/PM
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayHoursStr = String(displayHours).padStart(2, '0');
  
  return `${month}/${day}/${year} ${displayHoursStr}:${minutes} ${ampm}`;
};

/**
 * Format date time for tooltip display (e.g., "Jan 12, 2025, 02:42pm")
 * @param {string|Date} dateTime - Date time string or Date object
 * @returns {string} Formatted date time for tooltip
 */
export const formatDateTimeTooltip = (dateTime) => {
  if (!dateTime) return '';
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (isNaN(date.getTime())) return '';
  
  // Format date as "Jan 12, 2025"
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Format time as "02:42pm"
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  const displayHoursStr = String(displayHours).padStart(2, '0');
  
  return `${month} ${day}, ${year}, ${displayHoursStr}:${minutes}${ampm}`;
};

/**
 * Get relative time string (e.g., "2 days ago", "2 months ago")
 * @param {string|Date} dateTime - Date time string or Date object
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateTime) => {
  if (!dateTime) return '';
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  } else {
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
  }
};

