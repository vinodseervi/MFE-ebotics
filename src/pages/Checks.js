import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsers } from '../context/UsersContext';
import AdvancedFilterDrawer from '../components/AdvancedFilterDrawer';
import MonthYearPicker from '../components/MonthYearPicker';
import SearchableDropdown from '../components/SearchableDropdown';
import ColumnSelector from '../components/ColumnSelector';
import Tooltip from '../components/Tooltip';
import UserTimestamp from '../components/UserTimestamp';
import BulkActionModal from '../components/BulkActionModal';
import { Info } from 'lucide-react';
import { formatDateUS, formatDateRange, getCurrentMonthYear, formatMonthYear, getMonthRange } from '../utils/dateUtils';
import { filterEmojis } from '../utils/emojiFilter';
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
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Default filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPractice, setSelectedPractice] = useState('');
  const [practices, setPractices] = useState([]);
  
  // Advanced filters - now support arrays for multiple selections
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    statuses: [], // Array for multiple status selections
    practiceCodes: [], // Array for multiple practice selections
    locationCodes: [], // Array for multiple location selections
    assigneeIds: [], // Array for multiple assignee selections
    reporterIds: [], // Array for multiple reporter selections
    checkNumber: '',
    depositDateFrom: '',
    depositDateTo: '',
    receivedDateFrom: '',
    receivedDateTo: '',
    completedDateFrom: '',
    completedDateTo: '',
    month: null,
    year: null
  });
  
  // Sorting
  const [sortField, setSortField] = useState('depositDate');
  const [sortDirection, setSortDirection] = useState('asc'); // Default: oldest first (by Deposit Date)
  
  // Bulk actions
  const [selectedChecks, setSelectedChecks] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkActionModal, setShowBulkActionModal] = useState(false);
  const [bulkUpdateMessage, setBulkUpdateMessage] = useState(null);
  const [bulkUpdateMessageType, setBulkUpdateMessageType] = useState('success');
  const { users, getUserName, getUserById } = useUsers(); // Get users from context

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
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' }
  ];

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

  // Initialize visible columns with default columns
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);

  // Month/Year selection
  const currentMonthYear = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear.month);
  const [selectedYear, setSelectedYear] = useState(currentMonthYear.year);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  

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
      // Build search parameters for POST request
      const searchParams = {
        page: page,
        size: 50,
        unknown: false  // Always false for Checks page
      };

      // Collect statuses from both default and advanced filters
      const statuses = [];
      if (selectedStatus) {
        statuses.push(selectedStatus);
      }
      if (advancedFilters.statuses && advancedFilters.statuses.length > 0) {
        statuses.push(...advancedFilters.statuses);
      }
      // Remove duplicates
      if (statuses.length > 0) {
        searchParams.statuses = [...new Set(statuses)];
      }

      // Collect practice codes
      const practiceCodes = [];
      if (selectedPractice) {
        practiceCodes.push(selectedPractice);
      }
      if (advancedFilters.practiceCodes && advancedFilters.practiceCodes.length > 0) {
        practiceCodes.push(...advancedFilters.practiceCodes);
      }
      // Remove duplicates
      if (practiceCodes.length > 0) {
        searchParams.practiceCodes = [...new Set(practiceCodes)];
      }

      // Location codes (array)
      if (advancedFilters.locationCodes && advancedFilters.locationCodes.length > 0) {
        searchParams.locationCodes = [...new Set(advancedFilters.locationCodes)];
      }

      // Assignee IDs (array)
      if (advancedFilters.assigneeIds && advancedFilters.assigneeIds.length > 0) {
        searchParams.assigneeIds = [...new Set(advancedFilters.assigneeIds)];
      }

      // Reporter IDs (array)
      if (advancedFilters.reporterIds && advancedFilters.reporterIds.length > 0) {
        searchParams.reporterIds = [...new Set(advancedFilters.reporterIds)];
      }

      // Check number (supports wildcards)
      // Convert pattern like "ch*" to "*CHE" format
      const formatCheckNumberPattern = (input) => {
        if (!input || input.trim() === '') return '';
        let pattern = input.trim().toUpperCase();
        // If pattern ends with *, remove it and add * at the beginning
        if (pattern.endsWith('*')) {
          pattern = '*' + pattern.slice(0, -1);
        } else if (!pattern.startsWith('*')) {
          // If pattern doesn't start with *, add it
          pattern = '*' + pattern;
        }
        return pattern;
      };

      if (advancedFilters.checkNumber) {
        searchParams.checkNumber = formatCheckNumberPattern(advancedFilters.checkNumber);
      }
      // Note: searchTerm is handled client-side after fetching (see useEffect for client-side filtering)

      // Date filters - map to new field names
      // If no explicit deposit date filters, use selected month
      // Get month range once for both From and To dates
      const monthRange = getMonthRange(selectedMonth, selectedYear);
      
      if (advancedFilters.depositDateFrom) {
        searchParams.depositDateFrom = advancedFilters.depositDateFrom;
      } else {
        // Use selected month for deposit date filter (e.g., Nov 2025 = 2025-11-01 to 2025-11-30)
        searchParams.depositDateFrom = monthRange.startDate;
      }
      
      if (advancedFilters.depositDateTo) {
        searchParams.depositDateTo = advancedFilters.depositDateTo;
      } else {
        // Use selected month for deposit date filter (e.g., Nov 2025 = 2025-11-01 to 2025-11-30)
        searchParams.depositDateTo = monthRange.endDate;
      }
      if (advancedFilters.receivedDateFrom) {
        searchParams.receivedDateFrom = advancedFilters.receivedDateFrom;
      }
      if (advancedFilters.receivedDateTo) {
        searchParams.receivedDateTo = advancedFilters.receivedDateTo;
      }
      if (advancedFilters.completedDateFrom) {
        searchParams.completedDateFrom = advancedFilters.completedDateFrom;
      }
      if (advancedFilters.completedDateTo) {
        searchParams.completedDateTo = advancedFilters.completedDateTo;
      }

      // Legacy date filters mapping
      if (advancedFilters.startDate && !searchParams.depositDateFrom) {
        searchParams.depositDateFrom = advancedFilters.startDate;
      }
      if (advancedFilters.endDate && !searchParams.depositDateTo) {
        searchParams.depositDateTo = advancedFilters.endDate;
      }

      // Use POST endpoint with search
      const response = await api.searchChecksDashboard(searchParams);
      
      let checksList = response.items || [];
      const totalElements = response.totalElements || 0;
      
      // Client-side sorting (if backend doesn't support it)
      if (sortField && checksList.length > 0) {
        checksList = [...checksList].sort((a, b) => {
          let aVal = a[sortField];
          let bVal = b[sortField];
          
          if (sortField === 'depositDate') {
            aVal = aVal ? new Date(aVal) : new Date(0);
            bVal = bVal ? new Date(bVal) : new Date(0);
          } else if (sortField === 'createdAt' || sortField === 'updatedAt') {
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
      
      setTotalElements(totalElements);
      setHasMore(page < (response.totalPages || 0) - 1);
      setCurrentPage(page);
      
    } catch (err) {
      console.error('Error fetching checks:', err);
      setError('Failed to load checks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedPractice, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  // Fetch checks when filters change (reset to page 0)
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedStatus, selectedPractice, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  // Fetch checks when page or filters change (excluding searchTerm - handled client-side)
  useEffect(() => {
    fetchChecks(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedStatus, selectedPractice, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);


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
      
      // Search by batch number (from batchDescription or batches)
      if (check.batchDescription && check.batchDescription.toLowerCase().includes(searchLower)) {
        return true;
      }
      // Also check batches array if available
      if (check.batches && Array.isArray(check.batches)) {
        const hasMatchingBatch = check.batches.some(batch => 
          batch.batchNumber && batch.batchNumber.toLowerCase().includes(searchLower)
        );
        if (hasMatchingBatch) return true;
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
      statuses: [],
      practiceCodes: [],
      locationCodes: [],
      assigneeIds: [],
      reporterIds: [],
      checkNumber: '',
      depositDateFrom: '',
      depositDateTo: '',
      receivedDateFrom: '',
      receivedDateTo: '',
      completedDateFrom: '',
      completedDateTo: '',
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

  const handleBulkUpdate = async (payload) => {
    if (selectedChecks.size === 0) return;
    
    try {
      const checkIds = Array.from(selectedChecks);
      const response = await api.bulkUpdateChecks({
        checkIds,
        ...payload
      });
      
      // Show success message from API response
      if (response) {
        setBulkUpdateMessage(response.message || `Successfully updated ${response.succeeded || checkIds.length} check(s)`);
        setBulkUpdateMessageType(response.failed > 0 ? 'warning' : 'success');
        
        // Auto-hide message after 5 seconds
        setTimeout(() => {
          setBulkUpdateMessage(null);
        }, 5000);
      }
      
      // Refresh checks
      await fetchChecks(currentPage);
      setSelectedChecks(new Set());
      setShowBulkActions(false);
      setShowBulkActionModal(false);
    } catch (error) {
      console.error('Error bulk updating checks:', error);
      const errorMessage = error?.data?.message || error?.message || 'Failed to update checks. Please try again.';
      setBulkUpdateMessage(errorMessage);
      setBulkUpdateMessageType('error');
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setBulkUpdateMessage(null);
      }, 5000);
    }
  };

  // Removed: Users are now loaded from context on login, no need to fetch here

  useEffect(() => {
    setShowBulkActions(selectedChecks.size > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChecks]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Truncate text and show tooltip on hover
  const TruncatedText = ({ text, maxLength = 12 }) => {
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
      'COMPLETED': 'status-complete',
      'UNDER_CLARIFICATIONS': 'status-clarification',
      'IN_PROGRESS': 'status-progress',
      'NOT_STARTED': 'status-not-started',
      'OVER_POSTED': 'status-over-posted'
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
      'COMPLETED': 'Completed',
      // Show shorter label in list view; filters/details keep full text
      'UNDER_CLARIFICATIONS': 'Clarifications',
      'IN_PROGRESS': 'In Progress',
      'NOT_STARTED': 'Not Started',
      'OVER_POSTED': 'Over Posted'
    };
    return statusMap[status] || status;
  };

  // Check if any advanced filter is active
  const hasAdvancedFilters = () => {
    return (
      (advancedFilters.statuses && advancedFilters.statuses.length > 0) ||
      (advancedFilters.practiceCodes && advancedFilters.practiceCodes.length > 0) ||
      (advancedFilters.locationCodes && advancedFilters.locationCodes.length > 0) ||
      (advancedFilters.assigneeIds && advancedFilters.assigneeIds.length > 0) ||
      (advancedFilters.reporterIds && advancedFilters.reporterIds.length > 0) ||
      (advancedFilters.checkNumber && advancedFilters.checkNumber.trim() !== '') ||
      (advancedFilters.depositDateFrom && advancedFilters.depositDateFrom.trim() !== '') ||
      (advancedFilters.depositDateTo && advancedFilters.depositDateTo.trim() !== '') ||
      (advancedFilters.receivedDateFrom && advancedFilters.receivedDateFrom.trim() !== '') ||
      (advancedFilters.receivedDateTo && advancedFilters.receivedDateTo.trim() !== '') ||
      (advancedFilters.completedDateFrom && advancedFilters.completedDateFrom.trim() !== '') ||
      (advancedFilters.completedDateTo && advancedFilters.completedDateTo.trim() !== '') ||
      (advancedFilters.startDate && advancedFilters.startDate.trim() !== '') ||
      (advancedFilters.endDate && advancedFilters.endDate.trim() !== '') ||
      advancedFilters.month ||
      advancedFilters.year
    );
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
            placeholder="Search by check number, batch number, payer, amount..."
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
              { value: 'NOT_STARTED', label: 'Not Started' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'UNDER_CLARIFICATIONS', label: 'Under Clarifications' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'OVER_POSTED', label: 'Over Posted' }
            ]}
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            placeholder="All Statuses"
            maxVisibleItems={5}
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
                  { value: 'UNDER_CLARIFICATIONS', label: 'Under Clarifications' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'OVER_POSTED', label: 'Over Posted' }
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
            {/* Multiple Status Filters */}
            {advancedFilters.statuses && advancedFilters.statuses.length > 0 && advancedFilters.statuses.map((status) => {
              const statusLabels = {
                'NOT_STARTED': 'Not Started',
                'IN_PROGRESS': 'In Progress',
                'UNDER_CLARIFICATIONS': 'Under Clarifications',
                'COMPLETED': 'Completed',
                'OVER_POSTED': 'Over Posted'
              };
              return (
                <div key={status} className="filter-chip">
                  <span>Status: {statusLabels[status] || status}</span>
                  <button
                    className="chip-close-btn"
                    onClick={() => {
                      setAdvancedFilters(prev => ({
                        ...prev,
                        statuses: prev.statuses.filter(s => s !== status)
                      }));
                    }}
                    title="Remove status filter"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              );
            })}
            {/* Multiple Practice Filters */}
            {advancedFilters.practiceCodes && advancedFilters.practiceCodes.length > 0 && advancedFilters.practiceCodes.map((practiceCode) => (
              <div key={practiceCode} className="filter-chip">
                <span>Practice: {practices.find(p => p.code === practiceCode)?.name || practiceCode}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      practiceCodes: prev.practiceCodes.filter(p => p !== practiceCode),
                      locationCodes: prev.locationCodes.filter(loc => {
                        // Remove locations that belong to this practice
                        const practice = practices.find(p => p.code === practiceCode);
                        if (practice && practice.practiceId) {
                          // This would need location data to check, for now just remove all
                          return false;
                        }
                        return true;
                      })
                    }));
                  }}
                  title="Remove practice filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
            {/* Multiple Location Filters */}
            {advancedFilters.locationCodes && advancedFilters.locationCodes.length > 0 && advancedFilters.locationCodes.map((locationCode) => (
              <div key={locationCode} className="filter-chip">
                <span>Location: {locationCode}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      locationCodes: prev.locationCodes.filter(l => l !== locationCode)
                    }));
                  }}
                  title="Remove location filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
            {/* Multiple Assignee Filters */}
            {advancedFilters.assigneeIds && advancedFilters.assigneeIds.length > 0 && advancedFilters.assigneeIds.map((assigneeId) => (
              <div key={assigneeId} className="filter-chip">
                <span>Assignee: {getUserName(assigneeId)}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      assigneeIds: prev.assigneeIds.filter(id => id !== assigneeId)
                    }));
                  }}
                  title="Remove assignee filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
            {/* Multiple Reporter Filters */}
            {advancedFilters.reporterIds && advancedFilters.reporterIds.length > 0 && advancedFilters.reporterIds.map((reporterId) => (
              <div key={reporterId} className="filter-chip">
                <span>Reporter: {getUserName(reporterId)}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      reporterIds: prev.reporterIds.filter(id => id !== reporterId)
                    }));
                  }}
                  title="Remove reporter filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
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
            <button className="btn-bulk-update" onClick={() => setShowBulkActionModal(true)}>
              Update
            </button>
            <button className="btn-bulk-cancel" onClick={() => setSelectedChecks(new Set())}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <BulkActionModal
        isOpen={showBulkActionModal}
        onClose={() => setShowBulkActionModal(false)}
        onSave={handleBulkUpdate}
        selectedCount={selectedChecks.size}
        users={users}
      />

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {bulkUpdateMessage && (
        <div className={`bulk-update-message ${bulkUpdateMessageType}`}>
          <div className="message-content">
            <span>{bulkUpdateMessage}</span>
            <button 
              className="message-close-btn"
              onClick={() => setBulkUpdateMessage(null)}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
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
                <th>
                  <Tooltip text="Totals reflect only the rows currently displayed on this page" position="top">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Info 
                        size={16} 
                        style={{ 
                          color: '#374151', 
                          cursor: 'pointer',
                          transition: 'color 0.2s',
                          fontWeight: 'bold',
                          strokeWidth: 2.5,
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#0d9488'}
                        onMouseLeave={(e) => e.target.style.color = '#374151'}
                      />
                      Totals:
                    </span>
                  </Tooltip>
                </th>
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
                    case 'createdAt':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('createdAt')}
                        >
                          Created At <SortArrow field="createdAt" />
                        </th>
                      );
                    case 'updatedAt':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('updatedAt')}
                        >
                          Updated At <SortArrow field="updatedAt" />
                        </th>
                      );
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
                                onClick={() => {
                                  // Store check IDs and filters for navigation
                                  const checkIds = checks.map(c => c.checkId);
                                  const filters = {
                                    status: selectedStatus || advancedFilters.status || '',
                                    practiceCode: selectedPractice || advancedFilters.practiceCode || '',
                                    locationCode: advancedFilters.locationCode || '',
                                    assigneeId: advancedFilters.assigneeId || '',
                                    reporterId: advancedFilters.reporterId || '',
                                    checkNumber: advancedFilters.checkNumber || '',
                                    startDate: advancedFilters.startDate || '',
                                    endDate: advancedFilters.endDate || '',
                                    month: advancedFilters.month || selectedMonth,
                                    year: advancedFilters.year || selectedYear,
                                    page: currentPage,
                                    size: 50
                                  };
                                  sessionStorage.setItem('checksNavigationIds', JSON.stringify(checkIds));
                                  sessionStorage.setItem('checksNavigationFilters', JSON.stringify(filters));
                                  navigate(`/checks/${check.checkId}`);
                                }}
                              >
                                <TruncatedText text={check.checkNumber || ''} maxLength={12} />
                              </button>
                            </td>
                          );
                        case 'altCheckNumber':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={check.altCheckNumber || ''} maxLength={12} />
                            </td>
                          );
                        case 'payer':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={check.payer || ''} maxLength={12} />
                            </td>
                          );
                        case 'batchDescription':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={check.batchDescription || ''} maxLength={12} />
                            </td>
                          );
                        case 'exchange':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={check.exchange || ''} maxLength={12} />
                            </td>
                          );
                        case 'checkType':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCheckType(check.checkType)} maxLength={12} />
                            </td>
                          );
                        case 'practiceCode':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={check.practiceCode || ''} maxLength={12} />
                            </td>
                          );
                        case 'locationCode':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={check.locationCode || ''} maxLength={12} />
                            </td>
                          );
                        case 'totalAmount':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCurrency(check.totalAmount)} maxLength={12} />
                            </td>
                          );
                        case 'postedAmount':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCurrency(check.postedAmount)} maxLength={12} />
                            </td>
                          );
                        case 'remainingAmount':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCurrency(check.remainingAmount)} maxLength={12} />
                            </td>
                          );
                        case 'status':
                          return (
                            <td key={colKey}>
                              <span className={`status-badge ${getStatusClass(check.status)}`}>
                                {formatStatus(check.status)}
                              </span>
                            </td>
                          );
                        case 'createdAt':
                          return (
                            <td key={colKey}>
                              <UserTimestamp
                                userId={check.createdBy}
                                dateTime={check.createdAt}
                                action="created"
                                getUserName={getUserName}
                                getUserById={getUserById}
                              />
                            </td>
                          );
                        case 'updatedAt':
                          return (
                            <td key={colKey}>
                              <UserTimestamp
                                userId={check.updatedBy}
                                dateTime={check.updatedAt}
                                action="updated"
                                getUserName={getUserName}
                                getUserById={getUserById}
                              />
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
          defaultColumns={defaultColumns}
          onChange={setVisibleColumns}
          onClose={() => setShowColumnSelector(false)}
          triggerRef={columnSelectorTriggerRef}
        />
      )}
    </div>
  );
};

export default Checks;
