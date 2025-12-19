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
import { Info } from 'lucide-react';
import { formatDateUS, formatDateRange, getCurrentMonthYear, formatMonthYear, getMonthRange } from '../utils/dateUtils';
import { filterEmojis } from '../utils/emojiFilter';
import './DitDrl.css';

const DitDrl = () => {
  const navigate = useNavigate();
  
  // State management
  const [ditDrls, setDitDrls] = useState([]);
  const [allDitDrls, setAllDitDrls] = useState([]); // Store all fetched DIT/DRL Payments before filtering
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Default filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSiteCode, setSelectedSiteCode] = useState('');
  const [siteCodes, setSiteCodes] = useState([]);
  
  // Advanced filters - now support arrays for multiple selections
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    statuses: [], // Array for multiple status selections
    siteCodes: [], // Array for multiple site code selections
    assigneeIds: [], // Array for multiple assignee selections
    reporterIds: [], // Array for multiple reporter selections
    siteCode: '',
    batchNumber: '',
    dateReceivedFrom: '',
    dateReceivedTo: '',
    completedDateFrom: '',
    completedDateTo: '',
    month: null,
    year: null
  });
  
  // Sorting
  const [sortField, setSortField] = useState('dateReceived');
  const [sortDirection, setSortDirection] = useState('asc'); // Default: oldest first (by Date Received)
  
  const { users, getUserName, getUserById } = useUsers(); // Get users from context

  // Column selector
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const columnSelectorTriggerRef = useRef(null);
  
  // Available columns - defined as constant array
  const allColumns = [
    { key: 'dateReceived', label: 'Date Received' },
    { key: 'siteCode', label: 'Site Code' },
    { key: 'totalDrlReceived', label: 'Total DRL Received' },
    { key: 'sitePostingTotal', label: 'Site Posting Total' },
    { key: 'postedOnshore', label: 'Posted Onshore' },
    { key: 'postedCcmg', label: 'Posted CCMG' },
    { key: 'totalPosted', label: 'Total Posted' },
    { key: 'remainingAmount', label: 'Remaining' },
    { key: 'status', label: 'Status' },
    { key: 'underClarification', label: 'Under Clarification' },
    { key: 'completedDate', label: 'Completed Date' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'updatedAt', label: 'Updated At' }
  ];

  // Default visible columns
  const defaultColumns = [
    'dateReceived',
    'siteCode',
    'totalDrlReceived',
    'sitePostingTotal',
    'postedOnshore',
    'postedCcmg',
    'totalPosted',
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

  // Fetch site codes on mount (we'll extract unique site codes from fetched data)
  useEffect(() => {
    // Site codes will be populated from fetched data
  }, []);

  const fetchDitDrls = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build search parameters for POST request
      const searchParams = {
        page: page,
        size: 50
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

      // Collect site codes
      const siteCodesList = [];
      if (selectedSiteCode) {
        siteCodesList.push(selectedSiteCode);
      }
      if (advancedFilters.siteCodes && advancedFilters.siteCodes.length > 0) {
        siteCodesList.push(...advancedFilters.siteCodes);
      }
      // Remove duplicates
      if (siteCodesList.length > 0) {
        searchParams.siteCodes = [...new Set(siteCodesList)];
      }

      // Assignee IDs (array)
      if (advancedFilters.assigneeIds && advancedFilters.assigneeIds.length > 0) {
        searchParams.assigneeIds = [...new Set(advancedFilters.assigneeIds)];
      }

      // Reporter IDs (array)
      if (advancedFilters.reporterIds && advancedFilters.reporterIds.length > 0) {
        searchParams.reporterIds = [...new Set(advancedFilters.reporterIds)];
      }

      // Site code (supports wildcards)
      if (advancedFilters.siteCode && advancedFilters.siteCode.trim() !== '') {
        searchParams.siteCode = advancedFilters.siteCode.trim();
      }
      
      // Batch number (supports wildcards)
      if (advancedFilters.batchNumber && advancedFilters.batchNumber.trim() !== '') {
        searchParams.batchNumber = advancedFilters.batchNumber.trim();
      }

      // Date filters - map to DIT/DRL Payment field names
      // If no explicit date received filters, use selected month
      const monthRange = getMonthRange(selectedMonth, selectedYear);
      
      if (advancedFilters.dateReceivedFrom) {
        searchParams.dateReceivedFrom = advancedFilters.dateReceivedFrom;
      } else {
        // Use selected month for date received filter
        searchParams.dateReceivedFrom = monthRange.startDate;
      }
      
      if (advancedFilters.dateReceivedTo) {
        searchParams.dateReceivedTo = advancedFilters.dateReceivedTo;
      } else {
        // Use selected month for date received filter
        searchParams.dateReceivedTo = monthRange.endDate;
      }
      
      if (advancedFilters.completedDateFrom) {
        searchParams.completedDateFrom = advancedFilters.completedDateFrom;
      }
      if (advancedFilters.completedDateTo) {
        searchParams.completedDateTo = advancedFilters.completedDateTo;
      }

      // Use POST endpoint with search
      const response = await api.searchDitDrlDashboard(searchParams);
      
      let ditDrlsList = response.items || [];
      const totalElements = response.totalElements || 0;
      
      // Extract unique site codes from fetched data
      const uniqueSiteCodes = [...new Set(ditDrlsList.map(item => item.siteCode).filter(Boolean))];
      setSiteCodes(uniqueSiteCodes.sort());
      
      // Client-side sorting (if backend doesn't support it)
      if (sortField && ditDrlsList.length > 0) {
        ditDrlsList = [...ditDrlsList].sort((a, b) => {
          let aVal = a[sortField];
          let bVal = b[sortField];
          
          if (sortField === 'dateReceived' || sortField === 'completedDate') {
            aVal = aVal ? new Date(aVal) : new Date(0);
            bVal = bVal ? new Date(bVal) : new Date(0);
          } else if (sortField === 'createdAt' || sortField === 'updatedAt') {
            aVal = aVal ? new Date(aVal) : new Date(0);
            bVal = bVal ? new Date(bVal) : new Date(0);
          } else if (sortField === 'totalDrlReceived' || sortField === 'sitePostingTotal' || 
                     sortField === 'postedOnshore' || sortField === 'postedCcmg' || 
                     sortField === 'totalPosted' || sortField === 'remainingAmount') {
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
      
      // Store all fetched DIT/DRL Payments
      setAllDitDrls(ditDrlsList);
      
      setTotalElements(totalElements);
      setHasMore(page < (response.totalPages || 0) - 1);
      setCurrentPage(page);
      
    } catch (err) {
      console.error('Error fetching DIT/DRL Payments:', err);
      setError('Failed to load DIT/DRL Payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedSiteCode, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  // Fetch DIT/DRL Payments when filters change (reset to page 0)
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedStatus, selectedSiteCode, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  // Fetch DIT/DRL Payments when page or filters change (excluding searchTerm - handled client-side)
  useEffect(() => {
    fetchDitDrls(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedStatus, selectedSiteCode, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);


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
  const displayTotal = searchTerm ? ditDrls.length : totalElements;
  const startIndex = searchTerm ? 1 : (currentPage * pageSize + 1);
  const endIndex = searchTerm ? ditDrls.length : Math.min((currentPage + 1) * pageSize, totalElements);

  // Client-side filtering for search term (site code, batch number, amount)
  useEffect(() => {
    if (!searchTerm) {
      setDitDrls(allDitDrls);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = allDitDrls.filter(ditDrl => {
      // Search by site code
      if (ditDrl.siteCode && ditDrl.siteCode.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by batch number (from batches)
      if (ditDrl.batches && Array.isArray(ditDrl.batches)) {
        const hasMatchingBatch = ditDrl.batches.some(batch => 
          batch.batchNumber && batch.batchNumber.toLowerCase().includes(searchLower)
        );
        if (hasMatchingBatch) return true;
      }
      
      // Search by amount (totalDrlReceived, totalPosted, remainingAmount)
      const totalDrlReceived = String(ditDrl.totalDrlReceived || '');
      const totalPosted = String(ditDrl.totalPosted || '');
      const remainingAmount = String(ditDrl.remainingAmount || '');
      
      if (totalDrlReceived.includes(searchLower) || 
          totalPosted.includes(searchLower) || 
          remainingAmount.includes(searchLower)) {
        return true;
      }
      
      return false;
    });

    setDitDrls(filtered);
  }, [searchTerm, allDitDrls]);

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
      siteCodes: [],
      assigneeIds: [],
      reporterIds: [],
      siteCode: '',
      batchNumber: '',
      dateReceivedFrom: '',
      dateReceivedTo: '',
      completedDateFrom: '',
      completedDateTo: '',
      month: null,
      year: null
    });
  };

  const handleClearAllFilters = () => {
    // Reset advanced filters
    handleResetAdvancedFilters();
    // Reset basic filters
    setSelectedStatus('');
    setSelectedSiteCode('');
    setSearchTerm('');
    // Close advanced filter drawer
    setShowAdvancedFilters(false);
  };

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

  const formatStatus = (status) => {
    const statusMap = {
      'COMPLETED': 'Completed',
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
      (advancedFilters.siteCodes && advancedFilters.siteCodes.length > 0) ||
      (advancedFilters.assigneeIds && advancedFilters.assigneeIds.length > 0) ||
      (advancedFilters.reporterIds && advancedFilters.reporterIds.length > 0) ||
      (advancedFilters.siteCode && advancedFilters.siteCode.trim() !== '') ||
      (advancedFilters.batchNumber && advancedFilters.batchNumber.trim() !== '') ||
      (advancedFilters.dateReceivedFrom && advancedFilters.dateReceivedFrom.trim() !== '') ||
      (advancedFilters.dateReceivedTo && advancedFilters.dateReceivedTo.trim() !== '') ||
      (advancedFilters.completedDateFrom && advancedFilters.completedDateFrom.trim() !== '') ||
      (advancedFilters.completedDateTo && advancedFilters.completedDateTo.trim() !== '') ||
      advancedFilters.month ||
      advancedFilters.year
    );
  };

  const getDateRangeDisplay = () => {
    // If both start and end dates are selected, show the date range
    if (advancedFilters.dateReceivedFrom && advancedFilters.dateReceivedTo) {
      return formatDateRange(advancedFilters.dateReceivedFrom, advancedFilters.dateReceivedTo);
    }
    // If advanced filters are active (but no date range), show custom range
    if (hasAdvancedFilters()) {
      return 'Custom Range';
    }
    // Show month/year format instead of date range
    return formatMonthYear(selectedMonth, selectedYear);
  };


  const totals = ditDrls.reduce((acc, ditDrl) => ({
    totalDrlReceived: acc.totalDrlReceived + (ditDrl.totalDrlReceived || 0),
    sitePostingTotal: acc.sitePostingTotal + (ditDrl.sitePostingTotal || 0),
    postedOnshore: acc.postedOnshore + (ditDrl.postedOnshore || 0),
    postedCcmg: acc.postedCcmg + (ditDrl.postedCcmg || 0),
    totalPosted: acc.totalPosted + (ditDrl.totalPosted || 0),
    remaining: acc.remaining + (ditDrl.remainingAmount || 0)
  }), { totalDrlReceived: 0, sitePostingTotal: 0, postedOnshore: 0, postedCcmg: 0, totalPosted: 0, remaining: 0 });

  const SortArrow = ({ field }) => {
    if (sortField !== field) return null;
    return (
      <span className="sort-arrow">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="dit-drl-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">DIT/DRL Payments</h1>
          <p className="page-subtitle">Manage and reconcile DIT/DRL payment records</p>
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
          <button 
            className="btn-primary" 
            onClick={() => navigate('/dit-drl/new')}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New DIT/DRL Payment
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
            placeholder="Search by site code, batch number, amount..."
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
              { value: '', label: 'All Site Codes' },
              ...siteCodes.map(siteCode => ({
                value: siteCode,
                label: siteCode
              }))
            ]}
            value={selectedSiteCode}
            onChange={(value) => setSelectedSiteCode(value)}
            placeholder="All Site Codes"
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
      {(hasAdvancedFilters() || selectedStatus || selectedSiteCode || searchTerm) && (
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
            {selectedSiteCode && (
              <div className="filter-chip">
                <span>Site Code: {selectedSiteCode}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => setSelectedSiteCode('')}
                  title="Remove site code filter"
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
            {/* Multiple Site Code Filters */}
            {advancedFilters.siteCodes && advancedFilters.siteCodes.length > 0 && advancedFilters.siteCodes.map((siteCode) => (
              <div key={siteCode} className="filter-chip">
                <span>Site Code: {siteCode}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      siteCodes: prev.siteCodes.filter(s => s !== siteCode)
                    }));
                  }}
                  title="Remove site code filter"
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
            {advancedFilters.siteCode && (
              <div className="filter-chip">
                <span>Site Code: {advancedFilters.siteCode}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({ ...prev, siteCode: '' }));
                  }}
                  title="Remove site code filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            {advancedFilters.batchNumber && (
              <div className="filter-chip">
                <span>Batch: {advancedFilters.batchNumber}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({ ...prev, batchNumber: '' }));
                  }}
                  title="Remove batch number filter"
                >
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
            {(advancedFilters.dateReceivedFrom || advancedFilters.dateReceivedTo) && (
              <div className="filter-chip">
                <span>Date Range: {formatDateRange(advancedFilters.dateReceivedFrom || '', advancedFilters.dateReceivedTo || '')}</span>
                <button
                  className="chip-close-btn"
                  onClick={() => {
                    setAdvancedFilters(prev => ({ ...prev, dateReceivedFrom: '', dateReceivedTo: '' }));
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
          <table className="dit-drl-table">
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
                    case 'totalDrlReceived':
                      return <th key={colKey}>{formatCurrency(totals.totalDrlReceived)}</th>;
                    case 'sitePostingTotal':
                      return <th key={colKey}>{formatCurrency(totals.sitePostingTotal)}</th>;
                    case 'postedOnshore':
                      return <th key={colKey}>{formatCurrency(totals.postedOnshore)}</th>;
                    case 'postedCcmg':
                      return <th key={colKey}>{formatCurrency(totals.postedCcmg)}</th>;
                    case 'totalPosted':
                      return <th key={colKey}>{formatCurrency(totals.totalPosted)}</th>;
                    case 'remainingAmount':
                      return <th key={colKey}>{formatCurrency(totals.remaining)}</th>;
                    default:
                      return <th key={colKey}></th>;
                  }
                })}
              </tr>
              <tr>
                {visibleColumns.map(colKey => {
                  const column = allColumns.find(col => col.key === colKey);
                  if (!column) return null;

                  switch (colKey) {
                    case 'dateReceived':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('dateReceived')}
                        >
                          Date Received <SortArrow field="dateReceived" />
                        </th>
                      );
                    case 'siteCode':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('siteCode')}
                        >
                          Site Code <SortArrow field="siteCode" />
                        </th>
                      );
                    case 'totalDrlReceived':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('totalDrlReceived')}
                        >
                          Total DRL Received <SortArrow field="totalDrlReceived" />
                        </th>
                      );
                    case 'sitePostingTotal':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('sitePostingTotal')}
                        >
                          Site Posting Total <SortArrow field="sitePostingTotal" />
                        </th>
                      );
                    case 'postedOnshore':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('postedOnshore')}
                        >
                          Posted Onshore <SortArrow field="postedOnshore" />
                        </th>
                      );
                    case 'postedCcmg':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('postedCcmg')}
                        >
                          Posted CCMG <SortArrow field="postedCcmg" />
                        </th>
                      );
                    case 'totalPosted':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('totalPosted')}
                        >
                          Total Posted <SortArrow field="totalPosted" />
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
                    case 'underClarification':
                      return <th key={colKey}>Under Clarification</th>;
                    case 'completedDate':
                      return (
                        <th 
                          key={colKey}
                          className="sortable"
                          onClick={() => handleSort('completedDate')}
                        >
                          Completed Date <SortArrow field="completedDate" />
                        </th>
                      );
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
              {loading && ditDrls.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} style={{ textAlign: 'center', padding: '40px' }}>
                    Loading DIT/DRL Payments...
                  </td>
                </tr>
              ) : ditDrls.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} style={{ textAlign: 'center', padding: '40px' }}>
                    No DIT/DRL Payments found
                  </td>
                </tr>
              ) : (
                ditDrls.map((ditDrl) => (
                  <tr key={ditDrl.ditDrlId}>
                    {visibleColumns.map(colKey => {
                      switch (colKey) {
                        case 'dateReceived':
                          return (
                            <td key={colKey}>
                              {ditDrl.dateReceived ? formatDateUS(ditDrl.dateReceived) : ''}
                            </td>
                          );
                        case 'siteCode':
                          return (
                            <td key={colKey}>
                              <button 
                                className="link-btn"
                                onClick={() => {
                                  // Store DIT/DRL Payment IDs and filters for navigation
                                  const ditDrlIds = ditDrls.map(d => d.ditDrlId);
                                  const filters = {
                                    status: selectedStatus || advancedFilters.status || '',
                                    siteCode: selectedSiteCode || advancedFilters.siteCode || '',
                                    assigneeId: advancedFilters.assigneeId || '',
                                    reporterId: advancedFilters.reporterId || '',
                                    batchNumber: advancedFilters.batchNumber || '',
                                    dateReceivedFrom: advancedFilters.dateReceivedFrom || '',
                                    dateReceivedTo: advancedFilters.dateReceivedTo || '',
                                    month: advancedFilters.month || selectedMonth,
                                    year: advancedFilters.year || selectedYear,
                                    page: currentPage,
                                    size: 50
                                  };
                                  sessionStorage.setItem('ditDrlNavigationIds', JSON.stringify(ditDrlIds));
                                  sessionStorage.setItem('ditDrlNavigationFilters', JSON.stringify(filters));
                                  navigate(`/dit-drl/${ditDrl.ditDrlId}`);
                                }}
                              >
                                <TruncatedText text={ditDrl.siteCode || ''} maxLength={12} />
                              </button>
                            </td>
                          );
                        case 'totalDrlReceived':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCurrency(ditDrl.totalDrlReceived)} maxLength={12} />
                            </td>
                          );
                        case 'sitePostingTotal':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCurrency(ditDrl.sitePostingTotal)} maxLength={12} />
                            </td>
                          );
                        case 'postedOnshore':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCurrency(ditDrl.postedOnshore)} maxLength={12} />
                            </td>
                          );
                        case 'postedCcmg':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCurrency(ditDrl.postedCcmg)} maxLength={12} />
                            </td>
                          );
                        case 'totalPosted':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCurrency(ditDrl.totalPosted)} maxLength={12} />
                            </td>
                          );
                        case 'remainingAmount':
                          return (
                            <td key={colKey}>
                              <TruncatedText text={formatCurrency(ditDrl.remainingAmount)} maxLength={12} />
                            </td>
                          );
                        case 'status':
                          return (
                            <td key={colKey}>
                              <span className={`status-badge ${getStatusClass(ditDrl.status)}`}>
                                {formatStatus(ditDrl.status)}
                              </span>
                            </td>
                          );
                        case 'underClarification':
                          return (
                            <td key={colKey}>
                              {ditDrl.underClarification ? (
                                <span className="status-badge status-clarification">Yes</span>
                              ) : (
                                <span>No</span>
                              )}
                            </td>
                          );
                        case 'completedDate':
                          return (
                            <td key={colKey}>
                              {ditDrl.completedDate ? formatDateUS(ditDrl.completedDate) : ''}
                            </td>
                          );
                        case 'createdAt':
                          return (
                            <td key={colKey}>
                              <UserTimestamp
                                userId={ditDrl.createdBy}
                                dateTime={ditDrl.createdAt}
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
                                userId={ditDrl.updatedBy}
                                dateTime={ditDrl.updatedAt}
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
        isDitDrl={true}
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

export default DitDrl;
