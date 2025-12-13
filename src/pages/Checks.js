import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdvancedFilterDrawer from '../components/AdvancedFilterDrawer';
import MonthYearPicker from '../components/MonthYearPicker';
import { getCurrentMonthRange, formatDateUS, formatDateRange, getMonthRange, getCurrentMonthYear } from '../utils/dateUtils';
import './Checks.css';

const Checks = () => {
  const navigate = useNavigate();
  
  // State management
  const [checks, setChecks] = useState([]);
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
      
      if (searchTerm) {
        params.checkNumber = searchTerm;
      }

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
      
      if (page === 0) {
        setChecks(checksList);
      } else {
        setChecks(prev => [...prev, ...checksList]);
      }
      
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
  }, [selectedStatus, selectedPractice, searchTerm, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  // Fetch checks when filters change (reset to page 0)
  useEffect(() => {
    setCurrentPage(0);
    fetchChecks(0);
  }, [selectedStatus, selectedPractice, searchTerm, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      fetchChecks(nextPage);
    }
  };

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

  const getStatusClass = (status) => {
    const statusMap = {
      'COMPLETE': 'status-complete',
      'UNDER_CLARIFICATION': 'status-clarification',
      'IN_PROGRESS': 'status-progress',
      'NOT_STARTED': 'status-not-started'
    };
    return statusMap[status] || 'status-not-started';
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

  const getDateRangeDisplay = () => {
    if (advancedFilters.startDate && advancedFilters.endDate) {
      return formatDateRange(advancedFilters.startDate, advancedFilters.endDate);
    }
    return formatDateRange(selectedMonthRange.startDate, selectedMonthRange.endDate);
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
        <div>
          <h1 className="page-title">
            Checks
            <span className="info-icon">⚠️</span>
          </h1>
          <p className="page-subtitle">Manage and reconcile payment checks</p>
        </div>
        <div className="header-actions">
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
          <button className="btn-export">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M3 15V17H17V15M10 3V13M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export
          </button>
          <button className="btn-primary" onClick={() => navigate('/check-upload')}>
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
            placeholder="Search checks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdowns">
          <select 
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="UNDER_CLARIFICATION">Under Clarification</option>
            <option value="COMPLETE">Complete</option>
          </select>
          <select 
            className="filter-select"
            value={selectedPractice}
            onChange={(e) => setSelectedPractice(e.target.value)}
          >
            <option value="">All Practices</option>
            {practices.map(practice => (
              <option key={practice.practiceId || practice.id} value={practice.code}>
                {practice.name || practice.code}
              </option>
            ))}
          </select>
          <button 
            className="btn-advanced-filter"
            onClick={() => setShowAdvancedFilters(true)}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M3 5H17M7 10H17M11 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Advanced Filters
          </button>
        </div>
      </div>

      {showBulkActions && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-info">
            <span>{selectedChecks.size} check(s) selected</span>
          </div>
          <div className="bulk-actions-controls">
            <select
              value={bulkAssigneeId}
              onChange={(e) => setBulkAssigneeId(e.target.value)}
              className="bulk-select"
            >
              <option value="">Select Assignee</option>
              {users.map(user => (
                <option key={user.userId || user.id} value={user.userId || user.id}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || 'Unknown User'}
                </option>
              ))}
            </select>
            <select
              value={bulkReporterId}
              onChange={(e) => setBulkReporterId(e.target.value)}
              className="bulk-select"
            >
              <option value="">Select Reporter</option>
              {users.map(user => (
                <option key={user.userId || user.id} value={user.userId || user.id}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || 'Unknown User'}
                </option>
              ))}
            </select>
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
          <h3>{totalElements} Checks</h3>
          <div className="table-actions">
            <button className="icon-btn">
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
                <th colSpan="6">Totals:</th>
                <th>{formatCurrency(totals.totalAmount)}</th>
                <th>{formatCurrency(totals.posted)}</th>
                <th>{formatCurrency(totals.remaining)}</th>
                <th colSpan="3"></th>
              </tr>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={selectedChecks.size === checks.length && checks.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('depositDate')}
                >
                  Deposit Date <SortArrow field="depositDate" />
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('checkNumber')}
                >
                  Check Number <SortArrow field="checkNumber" />
                </th>
                <th>Payer</th>
                <th>Batch Description</th>
                <th>Exchange</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('totalAmount')}
                >
                  Total Amount <SortArrow field="totalAmount" />
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('postedAmount')}
                >
                  Posted <SortArrow field="postedAmount" />
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('remainingAmount')}
                >
                  Remaining <SortArrow field="remainingAmount" />
                </th>
                <th>Status</th>
                <th>Clarifications</th>
                <th>Unknown</th>
              </tr>
            </thead>
            <tbody>
              {loading && checks.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '40px' }}>
                    Loading checks...
                  </td>
                </tr>
              ) : checks.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '40px' }}>
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
                    <td>{check.depositDate ? formatDateUS(check.depositDate) : ''}</td>
                    <td>
                      <button 
                        className="link-btn"
                        onClick={() => navigate(`/checks/${check.checkId}`)}
                      >
                        {check.checkNumber}
                      </button>
                    </td>
                    <td>{check.payer || ''}</td>
                    <td>{check.batchDescription || ''}</td>
                    <td>{check.exchange || ''}</td>
                    <td>{formatCurrency(check.totalAmount)}</td>
                    <td>{formatCurrency(check.postedAmount)}</td>
                    <td>{formatCurrency(check.remainingAmount)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(check.status)}`}>
                        {formatStatus(check.status)}
                      </span>
                    </td>
                    <td>
                      {check.underClarification && (
                        <span className="clarification-count">!</span>
                      )}
                    </td>
                    <td>
                      {/* Unknown indicator if needed */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="load-more-section">
            <button 
              className="btn-load-more"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      <AdvancedFilterDrawer
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onApplyFilters={handleApplyAdvancedFilters}
        onResetFilters={handleResetAdvancedFilters}
      />
    </div>
  );
};

export default Checks;
