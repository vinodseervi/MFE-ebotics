import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AdvancedFilterDrawer from '../components/AdvancedFilterDrawer';
import MonthYearPicker from '../components/MonthYearPicker';
import { getCurrentMonthRange, formatDateUS, formatDateRange, formatDateTime, getMonthRange, getCurrentMonthYear } from '../utils/dateUtils';
import './Clarifications.css';

const Clarifications = () => {
  const navigate = useNavigate();
  
  // State management
  const [clarifications, setClarifications] = useState([]);
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
  const [users, setUsers] = useState([]);
  
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
      
      if (page === 0) {
        setClarifications(clarificationsList);
      } else {
        setClarifications(prev => [...prev, ...clarificationsList]);
      }
      
      setTotalPages(totalPages);
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
    fetchClarifications(0);
  }, [selectedStatus, searchTerm, advancedFilters, sortField, sortDirection, selectedMonth, selectedYear]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      fetchClarifications(nextPage);
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
      assigneeId: '',
      reporterId: '',
      checkNumber: '',
      startDate: '',
      endDate: '',
      month: null,
      year: null
    });
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'RESOLVED': 'status-resolved',
      'OPEN': 'status-open'
    };
    return statusMap[status] || 'status-open';
  };

  const formatStatus = (status) => {
    return status || 'OPEN';
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
    if (advancedFilters.startDate && advancedFilters.endDate) {
      return formatDateRange(advancedFilters.startDate, advancedFilters.endDate);
    }
    return formatDateRange(selectedMonthRange.startDate, selectedMonthRange.endDate);
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
        <div>
          <h1 className="page-title">
            Clarifications
            <span className="info-icon">⚠️</span>
          </h1>
          <p className="page-subtitle">Manage and track payment clarifications</p>
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
            placeholder="Search by check number..."
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
            <option value="OPEN">Open</option>
            <option value="RESOLVED">Resolved</option>
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

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="table-section">
        <div className="table-header">
          <h3>{totalElements} Clarifications</h3>
          <div className="table-actions">
            <button className="icon-btn">
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
                <th 
                  className="sortable"
                  onClick={() => handleSort('checkNumber')}
                >
                  Check Number <SortArrow field="checkNumber" />
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('clarificationType')}
                >
                  Type <SortArrow field="clarificationType" />
                </th>
                <th>Details</th>
                <th>Assignee</th>
                <th>Reporter</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('status')}
                >
                  Status <SortArrow field="status" />
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('openedAt')}
                >
                  Opened Date <SortArrow field="openedAt" />
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('resolvedAt')}
                >
                  Resolved Date <SortArrow field="resolvedAt" />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && clarifications.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                    Loading clarifications...
                  </td>
                </tr>
              ) : clarifications.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                    No clarifications found
                  </td>
                </tr>
              ) : (
                clarifications.map((clarification) => (
                  <tr key={clarification.clarificationId}>
                    <td>
                      <button 
                        className="link-btn"
                        onClick={() => navigate(`/checks/${clarification.checkId}`)}
                      >
                        {clarification.checkNumber || 'N/A'}
                      </button>
                    </td>
                    <td>{clarification.clarificationType || 'N/A'}</td>
                    <td className="details-cell">
                      <span title={clarification.details || ''}>
                        {clarification.details ? 
                          (clarification.details.length > 50 
                            ? `${clarification.details.substring(0, 50)}...` 
                            : clarification.details) 
                          : 'N/A'}
                      </span>
                    </td>
                    <td>{getUserName(clarification.assigneeId)}</td>
                    <td>{getUserName(clarification.reporterId)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(clarification.status)}`}>
                        {formatStatus(clarification.status)}
                      </span>
                    </td>
                    <td>{clarification.openedAt ? formatDateTime(clarification.openedAt) : 'N/A'}</td>
                    <td>{clarification.resolvedAt ? formatDateTime(clarification.resolvedAt) : 'N/A'}</td>
                    <td>
                      <button 
                        className="btn-icon view"
                        onClick={() => navigate(`/checks/${clarification.checkId}`)}
                        title="View Check"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path d="M10 3C5 3 1.73 6.11 1 10C1.73 13.89 5 17 10 17C15 17 18.27 13.89 19 10C18.27 6.11 15 3 10 3ZM10 15C7.24 15 5 12.76 5 10C5 7.24 7.24 5 10 5C12.76 5 15 7.24 15 10C15 12.76 12.76 15 10 15ZM10 7C8.34 7 7 8.34 7 10C7 11.66 8.34 13 10 13C11.66 13 13 11.66 13 10C13 8.34 11.66 7 10 7Z" fill="currentColor"/>
                        </svg>
                      </button>
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
        isClarifications={true}
      />
    </div>
  );
};

export default Clarifications;
