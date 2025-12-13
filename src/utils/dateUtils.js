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
 * Format date time for display (MM/DD/YYYY HH:MM AM/PM)
 * @param {string|Date} dateTime - Date time string or Date object
 * @returns {string} Formatted date time
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

