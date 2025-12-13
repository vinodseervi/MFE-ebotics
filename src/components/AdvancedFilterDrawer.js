import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatDateUS, parseDateUS } from '../utils/dateUtils';
import './AdvancedFilterDrawer.css';

const AdvancedFilterDrawer = ({ isOpen, onClose, filters, onApplyFilters, onResetFilters, isClarifications = false }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [users, setUsers] = useState([]);
  const [practices, setPractices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      fetchUsers();
      if (!isClarifications) {
        fetchPractices();
      }
    }
  }, [isOpen, filters, isClarifications]);

  useEffect(() => {
    if (!isClarifications && localFilters.practiceCode && practices.length > 0) {
      fetchLocations(localFilters.practiceCode);
    } else {
      setLocations([]);
    }
  }, [localFilters.practiceCode, practices, isClarifications]);

  const fetchUsers = async () => {
    try {
      const response = await api.getAllUsers();
      if (response && Array.isArray(response)) {
        setUsers(response);
      } else if (response && response.items) {
        setUsers(response.items);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPractices = async () => {
    try {
      const response = await api.getAllPractices();
      if (response && Array.isArray(response)) {
        setPractices(response);
      } else if (response && response.items) {
        setPractices(response.items);
      }
    } catch (error) {
      console.error('Error fetching practices:', error);
    }
  };

  const fetchLocations = async (practiceCode) => {
    try {
      const practice = practices.find(p => p.code === practiceCode);
      if (practice && practice.practiceId) {
        const response = await api.getPracticeLocations(practice.practiceId);
        if (response && Array.isArray(response)) {
          setLocations(response);
        } else if (response && response.items) {
          setLocations(response.items);
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear location if practice changes
    if (field === 'practiceCode' && value !== localFilters.practiceCode) {
      setLocalFilters(prev => ({
        ...prev,
        locationCode: ''
      }));
    }
  };

  const handleDateChange = (field, value) => {
    // Convert MM/DD/YYYY to YYYY-MM-DD for API
    const apiDate = parseDateUS(value);
    setLocalFilters(prev => ({
      ...prev,
      [field]: apiDate || value
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = isClarifications ? {
      status: '',
      assigneeId: '',
      reporterId: '',
      checkNumber: '',
      startDate: '',
      endDate: '',
      month: null,
      year: null
    } : {
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
    };
    setLocalFilters(resetFilters);
    onResetFilters();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className="advanced-filter-drawer">
        <div className="drawer-header">
          <h2>Advanced Filters</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="drawer-content">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={localFilters.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {isClarifications ? (
                <>
                  <option value="OPEN">Open</option>
                  <option value="RESOLVED">Resolved</option>
                </>
              ) : (
                <>
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="UNDER_CLARIFICATION">Under Clarification</option>
                  <option value="COMPLETE">Complete</option>
                </>
              )}
            </select>
          </div>

          {!isClarifications && (
            <>
              <div className="filter-group">
                <label>Practice</label>
                <select
                  value={localFilters.practiceCode || ''}
                  onChange={(e) => handleChange('practiceCode', e.target.value)}
                >
                  <option value="">All Practices</option>
                  {practices
                    .filter(p => p.isActive !== false)
                    .map(practice => (
                      <option key={practice.practiceId || practice.id} value={practice.code}>
                        {practice.name || practice.code}
                      </option>
                    ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Location</label>
                <select
                  value={localFilters.locationCode || ''}
                  onChange={(e) => handleChange('locationCode', e.target.value)}
                  disabled={!localFilters.practiceCode}
                >
                  <option value="">All Locations</option>
                  {locations
                    .filter(l => l.isActive !== false)
                    .map(location => (
                      <option key={location.locationId || location.id} value={location.code}>
                        {location.name || location.code}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          <div className="filter-group">
            <label>Assignee</label>
            <select
              value={localFilters.assigneeId || ''}
              onChange={(e) => handleChange('assigneeId', e.target.value)}
            >
              <option value="">All Assignees</option>
              {users.map(user => (
                <option key={user.userId || user.id} value={user.userId || user.id}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || 'Unknown User'}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Reporter</label>
            <select
              value={localFilters.reporterId || ''}
              onChange={(e) => handleChange('reporterId', e.target.value)}
            >
              <option value="">All Reporters</option>
              {users.map(user => (
                <option key={user.userId || user.id} value={user.userId || user.id}>
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || 'Unknown User'}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Check Number</label>
            <input
              type="text"
              value={localFilters.checkNumber || ''}
              onChange={(e) => handleChange('checkNumber', e.target.value)}
              placeholder="Enter check number"
            />
          </div>

          <div className="filter-group">
            <label>Start Date (MM/DD/YYYY)</label>
            <input
              type="text"
              value={localFilters.startDate ? formatDateUS(localFilters.startDate) : ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              placeholder="MM/DD/YYYY"
            />
          </div>

          <div className="filter-group">
            <label>End Date (MM/DD/YYYY)</label>
            <input
              type="text"
              value={localFilters.endDate ? formatDateUS(localFilters.endDate) : ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              placeholder="MM/DD/YYYY"
            />
          </div>

          <div className="filter-group">
            <label>Month</label>
            <select
              value={localFilters.month || ''}
              onChange={(e) => handleChange('month', e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Year</label>
            <input
              type="number"
              value={localFilters.year || ''}
              onChange={(e) => handleChange('year', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="YYYY"
              min="2000"
              max="2100"
            />
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn-reset" onClick={handleReset}>
            Reset Filters
          </button>
          <button className="btn-apply" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default AdvancedFilterDrawer;

