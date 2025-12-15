import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdvancedFilterDrawer from '../components/AdvancedFilterDrawer';
import MonthYearPicker from '../components/MonthYearPicker';
import SearchableDropdown from '../components/SearchableDropdown';
import ColumnSelector from '../components/ColumnSelector';
import Tooltip from '../components/Tooltip';
import { formatDateRange, formatDateTime, getMonthRange, getCurrentMonthYear, formatMonthYear } from '../utils/dateUtils';
import { filterEmojis } from '../utils/emojiFilter';
import './Clarifications.css';

const Clarifications = () => {
  const navigate = useNavigate();
  
  // State management
  const [clarifications, setClarifications] = useState([]);
  const [allClarifications, setAllClarifications] = useState([]); // Store all fetched clarifications before filtering
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Default filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [users, setUsers] = useState([]);
  
  // Column selector
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnSelectorTriggerRef = useRef(null);
  
  // Available columns
  const allColumns = [
    { key: 'checkNumber', label: 'Check Number' },
    { key: 'clarificationType', label: 'Type' },
    { key: 'details', label: 'Details' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'reporter', label: 'Reporter' },
    { key: 'status', label: 'Status' },
    { key: 'openedAt', label: 'Opened Date' },
    { key: 'resolvedAt', label: 'Resolved Date' },
    { key: 'actions', label: 'Actions', alwaysVisible: true }
  ];

  // Initialize visible columns
  const [visibleColumns, setVisibleColumns] = useState(() => {
    return allColumns.map(col => col.key);
  });
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: '',
    assigneeId: '',
    reporterId: '',
    checkNumber: '',
    startDate: '',
    endDate: '',
    month: null,
    year: null
  });
  
  // Sorting
  const [sortField, setSortField] = useState('openedAt');
  const [sortDirection, setSortDirection] = useState('desc'); // Default: newest first

  // Month/Year selection
  const currentMonthYear = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear.month);
  const [selectedYear, setSelectedYear] = useState(currentMonthYear.year);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  
  // Get selected month range
  const getSelectedMonthRange = () => {
    return getMonthRange(selectedMonth, selectedYear);
  };
  
  const selectedMonthRange = getSelectedMonthRange();

  const handleMonthYearSelect = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setShowMonthPicker(false);
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getAllUsers();
      const usersList = Array.isArray(response) ? response : (response?.items || []);
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchClarifications = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build filter parameters
      const params = {
        page: page,
        size: 50
      };

      // Default filters
      if (selectedStatus) {
        params.status = selectedStatus;
      }
      
      if (searchTerm) {
        params.checkNumber = searchTerm;
      }

      // Advanced filters
      if (advancedFilters.status) {
        params.status = advancedFilters.status;
      }
      
      if (advancedFilters.assigneeId) {
        params.assigneeId = advancedFilters.assigneeId;
      }
      
      if (advancedFilters.reporterId) {
        params.reporterId = advancedFilters.reporterId;
      }
      
      if (advancedFilters.checkNumber) {
        params.checkNumber = advancedFilters.checkNumber;
      }
      
      if (advancedFilters.startDate) {
        params.startDate = advancedFilters.startDate;
      }
      
      if (advancedFilters.endDate) {
        params.endDate = advancedFilters.endDate;
      }
      
      if (advancedFilters.month) {
        params.month = advancedFilters.month;
      }
      
      if (advancedFilters.year) {
        params.year = advancedFilters.year;
      }

      // Default to selected month if no date filters
      if (!params.startDate && !params.endDate && !params.month && !params.year) {
        params.month = selectedMonth;
        params.year = selectedYear;
      }

      const response = await api.getClarificationsDashboard(params);
      
      let clarificationsList = response.items || [];
      const totalPages = response.totalPages || 0;
      const totalElements = response.totalElements || 0;
      
      // Client-side sorting
      if (sortField && clarificationsList.length > 0) {
        clarificationsList = [...clarificationsList].sort((a, b) => {
          let aVal = a[sortField];
          let bVal = b[sortField];
          
          if (sortField === 'openedAt' || sortField === 'resolvedAt') {
            aVal = aVal ? new Date(aVal) : new Date(0);
            bVal = bVal ? new Date(bVal) : new Date(0);
          } else {
            aVal = aVal || '';
            bVal = bVal || '';
          }
          
          if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          } else {
            return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
          }
        });
      }
      
      // Store all fetched clarifications
      setAllClarifications(clarificationsList);
      
      setTotalElements(totalElements);
      setHasMore(page < totalPages - 1);
      setCurrentPage(page);
      
    } catch (err) {
      console.error('Error fetching clarifications:', err);
      setError('Failed to load clarifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchTerm, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  // Fetch clarifications when filters change (reset to page 0)
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedStatus, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  // Fetch clarifications when page or filters change (excluding searchTerm - handled client-side)
  useEffect(() => {
    fetchClarifications(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedStatus, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  const handlePreviousPage = () => {
    if (currentPage > 0 && !loading) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasMore && !loading) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Calculate pagination display values
  const pageSize = 50;
  // If search is active, show filtered results count, otherwise show total from API
  const displayTotal = searchTerm ? clarifications.length : totalElements;
  const startIndex = searchTerm ? 1 : (currentPage * pageSize + 1);
  const endIndex = searchTerm ? clarifications.length : Math.min((currentPage + 1) * pageSize, totalElements);

  // Client-side filtering for search term
  useEffect(() => {
    if (!searchTerm) {
      setClarifications(allClarifications);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = allClarifications.filter(clarification => {
      // Search by check number
      if (clarification.checkNumber && clarification.checkNumber.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by clarification type
      if (clarification.clarificationType && clarification.clarificationType.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by details
      if (clarification.details && clarification.details.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });

    setClarifications(filtered);
  }, [searchTerm, allClarifications]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleApplyAdvancedFilters = (filters) => {
    setAdvancedFilters(filters);
  };

  const handleResetAdvancedFilters = () => {
    setAdvancedFilters({
      status: '',
      assigneeId: '',
      reporterId: '',
      checkNumber: '',
      startDate: '',
      endDate: '',
      month: null,
      year: null
    });
  };

  const handleClearAllFilters = () => {
    // Reset advanced filters
    handleResetAdvancedFilters();
    // Reset basic filters
    setSelectedStatus('');
    setSearchTerm('');
    // Close advanced filter drawer
    setShowAdvancedFilters(false);
  };

  // Check if any advanced filter is active
  const hasAdvancedFilters = () => {
    return !!(
      advancedFilters.status ||
      advancedFilters.assigneeId ||
      advancedFilters.reporterId ||
      advancedFilters.checkNumber ||
      advancedFilters.startDate ||
      advancedFilters.endDate ||
      advancedFilters.month ||
      advancedFilters.year
    );
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'RESOLVED': 'status-resolved',
      'OPEN': 'status-open'
    };
    return statusMap[status] || 'status-open';
  };

  const formatStatus = (status) => {
    const statusMap = {
      'OPEN': 'Open',
      'RESOLVED': 'Resolved'
    };
    return statusMap[status] || status || 'Open';
  };

  const getUserName = (userId) => {
    if (!userId) return 'N/A';
    const user = users.find(u => (u.userId || u.id) === userId);
    if (user) {
      return user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.email || 'Unknown User';
    }
    return 'N/A';
  };

  const getDateRangeDisplay = () => {
    // If both start and end dates are selected, show the date range
    if (advancedFilters.startDate && advancedFilters.endDate) {
      return formatDateRange(advancedFilters.startDate, advancedFilters.endDate);
    }
    // If advanced filters are active (but no date range), show custom range
    if (hasAdvancedFilters()) {
      return 'Custom Range';
    }
    // Show month/year format instead of date range
    return formatMonthYear(selectedMonth, selectedYear);
  };

  // Truncate text and show tooltip on hover
  const TruncatedText = ({ text, maxLength = 50 }) => {
    if (!text) return <span></span>;
    
    const shouldTruncate = text.length > maxLength;
    const displayText = shouldTruncate ? text.substring(0, maxLength) + '...' : text;
    
    if (shouldTruncate) {
      return (
        <Tooltip text={text} position="bottom">
          <span className="truncated-text">
            {displayText}
          </span>
        </Tooltip>
      );
    }
    
    return <span>{displayText}</span>;
  };


  const SortArrow = ({ field }) => {
    if (sortField !== field) return null;
    return (
      <span className="sort-arrow">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="clarifications-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Clarifications</h1>
          <p className="page-subtitle">Manage and track payment clarifications</p>
        </div>
        <div className="header-actions">
          {!hasAdvancedFilters() && (
            <div className="date-range-container">
              <button 
                className="date-range-btn"
                onClick={() => setShowMonthPicker(!showMonthPicker)}
              >
                {getDateRangeDisplay()}
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ marginLeft: '8px' }}>
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showMonthPicker && (
                <MonthYearPicker
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  onSelect={handleMonthYearSelect}
                  onClose={() => setShowMonthPicker(false)}
                />
              )}
            </div>
          )}
          {hasAdvancedFilters() && (
            <div className="date-range-container">
              <div className="date-range-display">
                {getDateRangeDisplay()}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 15L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search by check number, type, details..."
            value={searchTerm}
            onChange={(e) => {
              const filteredValue = filterEmojis(e.target.value);
              setSearchTerm(filteredValue);
            }}
          />
        </div>
        <div className="filter-dropdowns">
          <SearchableDropdown
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'OPEN', label: 'Open' },
              { value: 'RESOLVED', label: 'Resolved' }
            ]}
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            placeholder="All Statuses"
            maxVisibleItems={5}
          />
          <button 
            className={`btn-advanced-filter ${hasAdvancedFilters() ? 'active' : ''}`}
            onClick={() => setShowAdvancedFilters(true)}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M3 5H17M7 10H17M11 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Advanced Filters
          </button>
        </div>
      </div>

      {/* Active Filters Indicator */}
      {(hasAdvancedFilters() || selectedStatus || searchTerm) && (
        <div className="active-filters-section">
          <div className="active-filters-label">Active Filters:</div>
          <div className="active-filters-chips">
            {searchTerm && (
              <div className="filter-chip">
                <span>Search: {searchTerm}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => setSearchTerm('')}
                  title="Remove search filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            {selectedStatus && (
              <div className="filter-chip">
                <span>Status: {[
                  { value: 'OPEN', label: 'Open' },
                  { value: 'RESOLVED', label: 'Resolved' }
                ].find(s => s.value === selectedStatus)?.label || selectedStatus}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => setSelectedStatus('')}
                  title="Remove status filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            {advancedFilters.status && (
              <div className="filter-chip">
                <span>Status: {[
                  { value: 'OPEN', label: 'Open' },
                  { value: 'RESOLVED', label: 'Resolved' }
                ].find(s => s.value === advancedFilters.status)?.label || advancedFilters.status}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({ ...prev, status: '' }));
                  }}
                  title="Remove status filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            {advancedFilters.checkNumber && (
              <div className="filter-chip">
                <span>Check: {advancedFilters.checkNumber}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({ ...prev, checkNumber: '' }));
                  }}
                  title="Remove check number filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            {(advancedFilters.startDate || advancedFilters.endDate) && (
              <div className="filter-chip">
                <span>Date Range: {formatDateRange(advancedFilters.startDate || '', advancedFilters.endDate || '')}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
                  }}
                  title="Remove date range filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            {(advancedFilters.month || advancedFilters.year) && (
              <div className="filter-chip">
                <span>Period: {formatMonthYear(advancedFilters.month || selectedMonth, advancedFilters.year || selectedYear)}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({ ...prev, month: null, year: null }));
                  }}
                  title="Remove period filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            <button
              className="clear-all-filters-btn"
              onClick={handleClearAllFilters}
              title="Clear all filters"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="table-section">
        <div className="table-header">
          <div className="table-header-left">
            {totalElements > 0 && (
              <div className="pagination-info">
                <button
                  className="pagination-arrow"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0 || loading}
                  title="Previous page"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <span className="pagination-text">
                  {startIndex} - {endIndex}, of {displayTotal}
                </span>
                <button
                  className="pagination-arrow"
                  onClick={handleNextPage}
                  disabled={!hasMore || loading}
                  title="Next page"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="table-actions">
            <button 
              ref={columnSelectorTriggerRef}
              className="icon-btn"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="clarifications-table">
            <thead>
              <tr>
                {visibleColumns.map(colKey => {
                  const column = allColumns.find(col => col.key === colKey);
                  if (!column) return null;

                  switch (colKey) {
                    case 'checkNumber':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('checkNumber')}
                        >
                          Check Number <SortArrow field="checkNumber" />
                        </th>
                      );
                    case 'clarificationType':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('clarificationType')}
                        >
                          Type <SortArrow field="clarificationType" />
                        </th>
                      );
                    case 'details':
                      return <th key={colKey}>Details</th>;
                    case 'assignee':
                      return <th key={colKey}>Assignee</th>;
                    case 'reporter':
                      return <th key={colKey}>Reporter</th>;
                    case 'status':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('status')}
                        >
                          Status <SortArrow field="status" />
                        </th>
                      );
                    case 'openedAt':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('openedAt')}
                        >
                          Opened Date <SortArrow field="openedAt" />
                        </th>
                      );
                    case 'resolvedAt':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('resolvedAt')}
                        >
                          Resolved Date <SortArrow field="resolvedAt" />
                        </th>
                      );
                    case 'actions':
                      return <th key={colKey}>Actions</th>;
                    default:
                      return null;
                  }
                })}
              </tr>
            </thead>
            <tbody>
              {loading && clarifications.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} style={{ textAlign: 'center', padding: '40px' }}>
                    Loading clarifications...
                  </td>
                </tr>
              ) : clarifications.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} style={{ textAlign: 'center', padding: '40px' }}>
                    No clarifications found
                  </td>
                </tr>
              ) : (
                clarifications.map((clarification) => (
                  <tr key={clarification.clarificationId}>
                    {visibleColumns.map(colKey => {
                      switch (colKey) {
                        case 'checkNumber':
                          return (
                            <td key={colKey}>
                              <button 
                                className="link-btn"
                                onClick={() => navigate(`/checks/${clarification.checkId}?clarificationId=${clarification.clarificationId}&source=clarifications`)}
                              >
                                {clarification.checkNumber || 'N/A'}
                              </button>
                            </td>
                          );
                        case 'clarificationType':
                          return (
                            <td key={colKey}>
                              {clarification.clarificationType || 'N/A'}
                            </td>
                          );
                        case 'details':
                          return (
                            <td key={colKey} className="details-cell">
                              <TruncatedText text={clarification.details || ''} maxLength={50} />
                            </td>
                          );
                        case 'assignee':
                          return (
                            <td key={colKey}>
                              {getUserName(clarification.assigneeId)}
                            </td>
                          );
                        case 'reporter':
                          return (
                            <td key={colKey}>
                              {getUserName(clarification.reporterId)}
                            </td>
                          );
                        case 'status':
                          return (
                            <td key={colKey}>
                              <span className={`status-badge ${getStatusClass(clarification.status)}`}>
                                {formatStatus(clarification.status)}
                              </span>
                            </td>
                          );
                        case 'openedAt':
                          return (
                            <td key={colKey}>
                              {clarification.openedAt ? formatDateTime(clarification.openedAt) : 'N/A'}
                            </td>
                          );
                        case 'resolvedAt':
                          return (
                            <td key={colKey}>
                              {clarification.resolvedAt ? formatDateTime(clarification.resolvedAt) : 'N/A'}
                            </td>
                          );
                        case 'actions':
                          return (
                            <td key={colKey}>
                              <button 
                                className="btn-icon view"
                                onClick={() => navigate(`/checks/${clarification.checkId}?clarificationId=${clarification.clarificationId}&source=clarifications`)}
                                title="View Check"
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                  <path d="M10 3C5 3 1.73 6.11 1 10C1.73 13.89 5 17 10 17C15 17 18.27 13.89 19 10C18.27 6.11 15 3 10 3ZM10 15C7.24 15 5 12.76 5 10C5 7.24 7.24 5 10 5C12.76 5 15 7.24 15 10C15 12.76 12.76 15 10 15ZM10 7C8.34 7 7 8.34 7 10C7 11.66 8.34 13 10 13C11.66 13 13 11.66 13 10C13 8.34 11.66 7 10 7Z" fill="currentColor"/>
                                </svg>
                              </button>
                            </td>
                          );
                        default:
                          return null;
                      }
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      <AdvancedFilterDrawer
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onApplyFilters={handleApplyAdvancedFilters}
        onResetFilters={handleResetAdvancedFilters}
        isClarifications={true}
      />

      {showColumnSelector && (
        <ColumnSelector
          availableColumns={allColumns}
          visibleColumns={visibleColumns}
          onChange={setVisibleColumns}
          onClose={() => setShowColumnSelector(false)}
          triggerRef={columnSelectorTriggerRef}
        />
      )}
    </div>
  );
};

export default Clarifications;
