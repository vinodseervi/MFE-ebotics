import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdvancedFilterDrawer from '../components/AdvancedFilterDrawer';
import MonthYearPicker from '../components/MonthYearPicker';
import SearchableDropdown from '../components/SearchableDropdown';
import ColumnSelector from '../components/ColumnSelector';
import Tooltip from '../components/Tooltip';
import { getCurrentMonthRange, formatDateUS, formatDateRange, getMonthRange, getCurrentMonthYear, formatMonthYear } from '../utils/dateUtils';
import './Checks.css';

const Checks = () => {
  const navigate = useNavigate();
  
  // State management
  const [checks, setChecks] = useState([]);
  const [allChecks, setAllChecks] = useState([]); // Store all fetched checks before filtering
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Default filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPractice, setSelectedPractice] = useState('');
  const [practices, setPractices] = useState([]);
  
  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: '',
    practiceCode: '',
    locationCode: '',
    assigneeId: '',
    reporterId: '',
    checkNumber: '',
    startDate: '',
    endDate: '',
    month: null,
    year: null
  });
  
  // Sorting
  const [sortField, setSortField] = useState('depositDate');
  const [sortDirection, setSortDirection] = useState('desc'); // Default: newest first
  
  // Bulk actions
  const [selectedChecks, setSelectedChecks] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [users, setUsers] = useState([]);
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');
  const [bulkReporterId, setBulkReporterId] = useState('');

  // Column selector
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnSelectorTriggerRef = useRef(null);
  
  // Available columns - defined as constant array
  const allColumns = [
    { key: 'checkbox', label: 'Select', alwaysVisible: true },
    { key: 'depositDate', label: 'Deposit Date' },
    { key: 'checkNumber', label: 'Check Number' },
    { key: 'altCheckNumber', label: 'Alt. Check Number' },
    { key: 'payer', label: 'Payer' },
    { key: 'batchDescription', label: 'Batch Description' },
    { key: 'exchange', label: 'Exchange' },
    { key: 'checkType', label: 'Check Type' },
    { key: 'practiceCode', label: 'Practice Code' },
    { key: 'locationCode', label: 'Location Code' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'postedAmount', label: 'Posted' },
    { key: 'remainingAmount', label: 'Remaining' },
    { key: 'status', label: 'Status' }
  ];

  // Initialize visible columns with default columns (excluding new optional columns)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Default visible columns (exclude altCheckNumber, checkType, practiceCode, locationCode)
    const defaultColumns = [
      'depositDate',
      'checkNumber',
      'payer',
      'batchDescription',
      'exchange',
      'totalAmount',
      'postedAmount',
      'remainingAmount',
      'status'
    ];
    return defaultColumns;
  });

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

  // Fetch practices on mount
  useEffect(() => {
    fetchPractices();
  }, []);

  const fetchPractices = async () => {
    try {
      const response = await api.getAllPractices();
      const practicesList = Array.isArray(response) ? response : (response?.items || []);
      setPractices(practicesList.filter(p => p.isActive !== false));
    } catch (error) {
      console.error('Error fetching practices:', error);
    }
  };

  const fetchChecks = useCallback(async (page = 0) => {
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
      
      if (selectedPractice) {
        params.practiceCode = selectedPractice;
      }
      
      // Note: searchTerm will be handled client-side for multiple fields
      // Don't send searchTerm to API as checkNumber anymore

      // Advanced filters
      if (advancedFilters.status) {
        params.status = advancedFilters.status;
      }
      
      if (advancedFilters.practiceCode) {
        params.practiceCode = advancedFilters.practiceCode;
      }
      
      if (advancedFilters.locationCode) {
        params.locationCode = advancedFilters.locationCode;
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

      // Note: Sorting would typically be handled by backend, but for now we'll sort client-side
      // In a real implementation, you'd add sort params to the API call

      const response = await api.getChecksDashboard(params);
      
      let checksList = response.items || [];
      const totalPages = response.totalPages || 0;
      const totalElements = response.totalElements || 0;
      
      // Client-side sorting (if backend doesn't support it)
      if (sortField && checksList.length > 0) {
        checksList = [...checksList].sort((a, b) => {
          let aVal = a[sortField];
          let bVal = b[sortField];
          
          if (sortField === 'depositDate') {
            aVal = aVal ? new Date(aVal) : new Date(0);
            bVal = bVal ? new Date(bVal) : new Date(0);
          } else if (sortField === 'totalAmount' || sortField === 'postedAmount' || sortField === 'remainingAmount') {
            aVal = aVal || 0;
            bVal = bVal || 0;
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
      
      // Store all fetched checks
      setAllChecks(checksList);
      
      setTotalPages(totalPages);
      setTotalElements(totalElements);
      setHasMore(page < totalPages - 1);
      setCurrentPage(page);
      
    } catch (err) {
      console.error('Error fetching checks:', err);
      setError('Failed to load checks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, selectedPractice, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  // Fetch checks when filters change (reset to page 0)
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedStatus, selectedPractice, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  // Fetch checks when page or filters change (excluding searchTerm - handled client-side)
  useEffect(() => {
    fetchChecks(currentPage);
  }, [currentPage, selectedStatus, selectedPractice, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      fetchChecks(nextPage);
    }
  };

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
  const displayTotal = searchTerm ? checks.length : totalElements;
  const startIndex = searchTerm ? 1 : (currentPage * pageSize + 1);
  const endIndex = searchTerm ? checks.length : Math.min((currentPage + 1) * pageSize, totalElements);

  // Client-side filtering for search term (check number, payer, amount)
  useEffect(() => {
    if (!searchTerm) {
      setChecks(allChecks);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = allChecks.filter(check => {
      // Search by check number
      if (check.checkNumber && check.checkNumber.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by payer
      if (check.payer && check.payer.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by amount (totalAmount, postedAmount, remainingAmount)
      const totalAmount = String(check.totalAmount || '');
      const postedAmount = String(check.postedAmount || '');
      const remainingAmount = String(check.remainingAmount || '');
      
      if (totalAmount.includes(searchLower) || 
          postedAmount.includes(searchLower) || 
          remainingAmount.includes(searchLower)) {
        return true;
      }
      
      return false;
    });

    setChecks(filtered);
  }, [searchTerm, allChecks]);

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
      practiceCode: '',
      locationCode: '',
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
    setSelectedPractice('');
    setSearchTerm('');
    // Close advanced filter drawer
    setShowAdvancedFilters(false);
  };

  const handleSelectCheck = (checkId) => {
    setSelectedChecks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(checkId)) {
        newSet.delete(checkId);
      } else {
        newSet.add(checkId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedChecks.size === checks.length) {
      setSelectedChecks(new Set());
    } else {
      setSelectedChecks(new Set(checks.map(c => c.checkId)));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedChecks.size === 0) return;
    
    try {
      await api.bulkAssignChecks(
        Array.from(selectedChecks),
        bulkAssigneeId || null,
        bulkReporterId || null
      );
      
      // Refresh checks
      fetchChecks(true);
      setSelectedChecks(new Set());
      setShowBulkActions(false);
      setBulkAssigneeId('');
      setBulkReporterId('');
    } catch (error) {
      console.error('Error bulk assigning checks:', error);
      alert('Failed to assign checks. Please try again.');
    }
  };

  useEffect(() => {
    if (showBulkActions && users.length === 0) {
      api.getAllUsers().then(response => {
        const usersList = Array.isArray(response) ? response : (response?.items || []);
        setUsers(usersList);
      }).catch(err => console.error('Error fetching users:', err));
    }
  }, [showBulkActions]);

  useEffect(() => {
    setShowBulkActions(selectedChecks.size > 0);
  }, [selectedChecks]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Truncate text and show tooltip on hover
  const TruncatedText = ({ text, maxLength = 15 }) => {
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

  const getStatusClass = (status) => {
    const statusMap = {
      'COMPLETE': 'status-complete',
      'UNDER_CLARIFICATION': 'status-clarification',
      'IN_PROGRESS': 'status-progress',
      'NOT_STARTED': 'status-not-started'
    };
    return statusMap[status] || 'status-not-started';
  };

  const formatCheckType = (checkType) => {
    if (!checkType) return '';
    return checkType
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatStatus = (status) => {
    const statusMap = {
      'COMPLETE': 'Complete',
      'UNDER_CLARIFICATION': 'Under Clarification',
      'IN_PROGRESS': 'In Progress',
      'NOT_STARTED': 'Not Started'
    };
    return statusMap[status] || status;
  };

  // Check if any advanced filter is active
  const hasAdvancedFilters = () => {
    return !!(
      advancedFilters.status ||
      advancedFilters.practiceCode ||
      advancedFilters.locationCode ||
      advancedFilters.assigneeId ||
      advancedFilters.reporterId ||
      advancedFilters.checkNumber ||
      advancedFilters.startDate ||
      advancedFilters.endDate ||
      advancedFilters.month ||
      advancedFilters.year
    );
  };

  const getDateRangeDisplay = () => {
    // If advanced filters are active, don't show month/year picker
    if (hasAdvancedFilters()) {
      if (advancedFilters.startDate && advancedFilters.endDate) {
        return formatDateRange(advancedFilters.startDate, advancedFilters.endDate);
      }
      if (advancedFilters.month && advancedFilters.year) {
        return formatMonthYear(advancedFilters.month, advancedFilters.year);
      }
      return 'Custom Range';
    }
    // Show month/year format instead of date range
    return formatMonthYear(selectedMonth, selectedYear);
  };


  const totals = checks.reduce((acc, check) => ({
    totalAmount: acc.totalAmount + (check.totalAmount || 0),
    posted: acc.posted + (check.postedAmount || 0),
    remaining: acc.remaining + (check.remainingAmount || 0)
  }), { totalAmount: 0, posted: 0, remaining: 0 });

  const SortArrow = ({ field }) => {
    if (sortField !== field) return null;
    return (
      <span className="sort-arrow">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="checks-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Checks</h1>
          <p className="page-subtitle">Manage and reconcile payment checks</p>
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
          <button className="btn-primary" onClick={() => navigate('/checks/new')}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Check
          </button>
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
            placeholder="Search by check number, payer, amount..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdowns">
          <SearchableDropdown
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'NOT_STARTED', label: 'Not Started' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'UNDER_CLARIFICATION', label: 'Under Clarification' },
              { value: 'COMPLETE', label: 'Complete' }
            ]}
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            placeholder="All Statuses"
          />
          <SearchableDropdown
            options={[
              { value: '', label: 'All Practices' },
              ...practices.map(practice => ({
                value: practice.code,
                label: practice.name || practice.code
              }))
            ]}
            value={selectedPractice}
            onChange={(value) => setSelectedPractice(value)}
            placeholder="All Practices"
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
      {(hasAdvancedFilters() || selectedStatus || selectedPractice || searchTerm) && (
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
                  { value: 'NOT_STARTED', label: 'Not Started' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'UNDER_CLARIFICATION', label: 'Under Clarification' },
                  { value: 'COMPLETE', label: 'Complete' }
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
            {selectedPractice && (
              <div className="filter-chip">
                <span>Practice: {practices.find(p => p.code === selectedPractice)?.name || selectedPractice}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => setSelectedPractice('')}
                  title="Remove practice filter"
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
                  { value: 'NOT_STARTED', label: 'Not Started' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'UNDER_CLARIFICATION', label: 'Under Clarification' },
                  { value: 'COMPLETE', label: 'Complete' }
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
            {advancedFilters.practiceCode && (
              <div className="filter-chip">
                <span>Practice: {practices.find(p => p.code === advancedFilters.practiceCode)?.name || advancedFilters.practiceCode}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({ ...prev, practiceCode: '', locationCode: '' }));
                  }}
                  title="Remove practice filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            {advancedFilters.locationCode && (
              <div className="filter-chip">
                <span>Location: {advancedFilters.locationCode}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({ ...prev, locationCode: '' }));
                  }}
                  title="Remove location filter"
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

      {showBulkActions && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-info">
            <span>{selectedChecks.size} check(s) selected</span>
          </div>
          <div className="bulk-actions-controls">
            <SearchableDropdown
              options={[
                { value: '', label: 'Select Assignee' },
                ...users.map(user => ({
                  value: user.userId || user.id,
                  label: user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || 'Unknown User'
                }))
              ]}
              value={bulkAssigneeId}
              onChange={(value) => setBulkAssigneeId(value)}
              placeholder="Select Assignee"
            />
            <SearchableDropdown
              options={[
                { value: '', label: 'Select Reporter' },
                ...users.map(user => ({
                  value: user.userId || user.id,
                  label: user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || 'Unknown User'
                }))
              ]}
              value={bulkReporterId}
              onChange={(value) => setBulkReporterId(value)}
              placeholder="Select Reporter"
            />
            <button className="btn-bulk-assign" onClick={handleBulkAssign}>
              Assign
            </button>
            <button className="btn-bulk-cancel" onClick={() => setSelectedChecks(new Set())}>
              Cancel
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
          <table className="checks-table">
            <thead>
              <tr className="totals-row">
                <th>Totals:</th>
                {visibleColumns.map(colKey => {
                  switch (colKey) {
                    case 'totalAmount':
                      return <th key={colKey}>{formatCurrency(totals.totalAmount)}</th>;
                    case 'postedAmount':
                      return <th key={colKey}>{formatCurrency(totals.posted)}</th>;
                    case 'remainingAmount':
                      return <th key={colKey}>{formatCurrency(totals.remaining)}</th>;
                    default:
                      return <th key={colKey}></th>;
                  }
                })}
              </tr>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={selectedChecks.size === checks.length && checks.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                {visibleColumns.map(colKey => {
                  const column = allColumns.find(col => col.key === colKey);
                  if (!column) return null;

                  switch (colKey) {
                    case 'depositDate':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('depositDate')}
                        >
                          Deposit Date <SortArrow field="depositDate" />
                        </th>
                      );
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
                    case 'altCheckNumber':
                      return <th key={colKey}>Alt. Check Number</th>;
                    case 'payer':
                      return <th key={colKey}>Payer</th>;
                    case 'batchDescription':
                      return <th key={colKey}>Batch Description</th>;
                    case 'exchange':
                      return <th key={colKey}>Exchange</th>;
                    case 'checkType':
                      return <th key={colKey}>Check Type</th>;
                    case 'practiceCode':
                      return <th key={colKey}>Practice Code</th>;
                    case 'locationCode':
                      return <th key={colKey}>Location Code</th>;
                    case 'totalAmount':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('totalAmount')}
                        >
                          Total Amount <SortArrow field="totalAmount" />
                        </th>
                      );
                    case 'postedAmount':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('postedAmount')}
                        >
                          Posted <SortArrow field="postedAmount" />
                        </th>
                      );
                    case 'remainingAmount':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('remainingAmount')}
                        >
                          Remaining <SortArrow field="remainingAmount" />
                        </th>
                      );
                    case 'status':
                      return <th key={colKey}>Status</th>;
                    default:
                      return null;
                  }
                })}
              </tr>
            </thead>
            <tbody>
              {loading && checks.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} style={{ textAlign: 'center', padding: '40px' }}>
                    Loading checks...
                  </td>
                </tr>
              ) : checks.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} style={{ textAlign: 'center', padding: '40px' }}>
                    No checks found
                  </td>
                </tr>
              ) : (
                checks.map((check) => (
                  <tr key={check.checkId}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedChecks.has(check.checkId)}
                        onChange={() => handleSelectCheck(check.checkId)}
                      />
                    </td>
                    {visibleColumns.map(colKey => {
                      switch (colKey) {
                        case 'depositDate':
                          return (
                            <td key={colKey}>
                              {check.depositDate ? formatDateUS(check.depositDate) : ''}
                            </td>
                          );
                        case 'checkNumber':
                          return (
                            <td key={colKey}>
                              <button 
                                className="link-btn"
                                onClick={() => navigate(`/checks/${check.checkId}`)}
                              >
                                {check.checkNumber}
                              </button>
                            </td>
                          );
                        case 'altCheckNumber':
                          return (
                            <td key={colKey}>
                              {check.altCheckNumber || ''}
                            </td>
                          );
                        case 'payer':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={check.payer || ''} maxLength={15} />
                            </td>
                          );
                        case 'batchDescription':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={check.batchDescription || ''} maxLength={15} />
                            </td>
                          );
                        case 'exchange':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={check.exchange || ''} maxLength={15} />
                            </td>
                          );
                        case 'checkType':
                          return (
                            <td key={colKey}>
                              {formatCheckType(check.checkType)}
                            </td>
                          );
                        case 'practiceCode':
                          return (
                            <td key={colKey}>
                              {check.practiceCode || ''}
                            </td>
                          );
                        case 'locationCode':
                          return (
                            <td key={colKey}>
                              {check.locationCode || ''}
                            </td>
                          );
                        case 'totalAmount':
                          return <td key={colKey}>{formatCurrency(check.totalAmount)}</td>;
                        case 'postedAmount':
                          return <td key={colKey}>{formatCurrency(check.postedAmount)}</td>;
                        case 'remainingAmount':
                          return <td key={colKey}>{formatCurrency(check.remainingAmount)}</td>;
                        case 'status':
                          return (
                            <td key={colKey}>
                              <span className={`status-badge ${getStatusClass(check.status)}`}>
                                {formatStatus(check.status)}
                              </span>
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

export default Checks;
