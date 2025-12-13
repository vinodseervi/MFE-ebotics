import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SearchableDropdown from './SearchableDropdown';
import './AdvancedFilterDrawer.css';

const AdvancedFilterDrawer = ({ isOpen, onClose, filters, onApplyFilters, onResetFilters, isClarifications = false }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [users, setUsers] = useState([]);
  const [practices, setPractices] = useState([]);
  const [locations, setLocations] = useState([]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Date input type="date" already provides YYYY-MM-DD format
    setLocalFilters(prev => ({
      ...prev,
      [field]: value || ''
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
      <div 
        className="drawer-overlay" 
        onClick={(e) => {
          // Don't close if clicking on a dropdown popup
          if (!e.target.closest('.searchable-dropdown-popup')) {
            onClose();
          }
        }}
      ></div>
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
            <SearchableDropdown
              options={[
                { value: '', label: 'All Statuses' },
                ...(isClarifications ? [
                  { value: 'OPEN', label: 'Open' },
                  { value: 'RESOLVED', label: 'Resolved' }
                ] : [
                  { value: 'NOT_STARTED', label: 'Not Started' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'UNDER_CLARIFICATION', label: 'Under Clarification' },
                  { value: 'COMPLETE', label: 'Complete' }
                ])
              ]}
              value={localFilters.status || ''}
              onChange={(value) => handleChange('status', value)}
              placeholder="All Statuses"
            />
          </div>

          {!isClarifications && (
            <>
              <div className="filter-group">
                <label>Practice</label>
                <SearchableDropdown
                  options={[
                    { value: '', label: 'All Practices' },
                    ...practices
                      .filter(p => p.isActive !== false)
                      .map(practice => ({
                        value: practice.code,
                        label: practice.name || practice.code
                      }))
                  ]}
                  value={localFilters.practiceCode || ''}
                  onChange={(value) => handleChange('practiceCode', value)}
                  placeholder="All Practices"
                />
              </div>

              <div className="filter-group">
                <label>Location</label>
                <SearchableDropdown
                  options={[
                    { value: '', label: 'All Locations' },
                    ...locations
                      .filter(l => l.isActive !== false)
                      .map(location => ({
                        value: location.code,
                        label: location.name || location.code
                      }))
                  ]}
                  value={localFilters.locationCode || ''}
                  onChange={(value) => handleChange('locationCode', value)}
                  placeholder="All Locations"
                  disabled={!localFilters.practiceCode}
                />
              </div>
            </>
          )}

          <div className="filter-group">
            <label>Assignee</label>
            <SearchableDropdown
              options={[
                { value: '', label: 'All Assignees' },
                ...users.map(user => ({
                  value: user.userId || user.id,
                  label: user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || 'Unknown User'
                }))
              ]}
              value={localFilters.assigneeId || ''}
              onChange={(value) => handleChange('assigneeId', value)}
              placeholder="All Assignees"
            />
          </div>

          <div className="filter-group">
            <label>Reporter</label>
            <SearchableDropdown
              options={[
                { value: '', label: 'All Reporters' },
                ...users.map(user => ({
                  value: user.userId || user.id,
                  label: user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email || 'Unknown User'
                }))
              ]}
              value={localFilters.reporterId || ''}
              onChange={(value) => handleChange('reporterId', value)}
              placeholder="All Reporters"
            />
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
            <label>Start Date</label>
            <input
              type="date"
              value={localFilters.startDate || ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={localFilters.endDate || ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Month</label>
            <SearchableDropdown
              options={[
                { value: '', label: 'All Months' },
                ...Array.from({ length: 12 }, (_, i) => i + 1).map(month => ({
                  value: month,
                  label: new Date(2000, month - 1).toLocaleString('en-US', { month: 'long' })
                }))
              ]}
              value={localFilters.month || ''}
              onChange={(value) => handleChange('month', value ? parseInt(value) : null)}
              placeholder="All Months"
            />
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

