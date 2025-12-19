import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useUsers } from '../context/UsersContext';
import SearchableDropdown from './SearchableDropdown';
import USDateInput from './USDateInput';
import { filterEmojis } from '../utils/emojiFilter';
import './AdvancedFilterDrawer.css';

const AdvancedFilterDrawer = ({ isOpen, onClose, filters, onApplyFilters, onResetFilters, isClarifications = false, isDitDrl = false }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const { users } = useUsers(); // Get users from context
  const [practices, setPractices] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
      // Removed: Users are now loaded from context on login
      if (!isClarifications && !isDitDrl) {
        fetchPractices();
      }
    }
  }, [isOpen, filters, isClarifications, isDitDrl]);

  useEffect(() => {
    if (!isClarifications && !isDitDrl && localFilters.practiceCodes && localFilters.practiceCodes.length > 0 && practices.length > 0) {
      // Fetch locations for all selected practices
      const fetchAllLocations = async () => {
        const allLocations = [];
        for (const practiceCode of localFilters.practiceCodes) {
          try {
            const practice = practices.find(p => p.code === practiceCode);
            if (practice && practice.practiceId) {
              const response = await api.getPracticeLocations(practice.practiceId);
              const locationsList = Array.isArray(response) ? response : (response?.items || []);
              allLocations.push(...locationsList);
            }
          } catch (error) {
            console.error(`Error fetching locations for practice ${practiceCode}:`, error);
          }
        }
        setLocations(allLocations);
      };
      fetchAllLocations();
    } else {
      setLocations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFilters.practiceCodes, practices, isClarifications, isDitDrl]);

  // Removed: Users are now loaded from context on login, no need to fetch here

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

  const handleChange = (field, value) => {
    // Filter emojis from string inputs
    const filteredValue = typeof value === 'string' ? filterEmojis(value) : value;
    
    // For array fields, don't update directly - use handleAddToArray instead
    const arrayFields = ['statuses', 'practiceCodes', 'locationCodes', 'assigneeIds', 'reporterIds'];
    if (arrayFields.includes(field)) {
      // This is handled by handleAddToArray
      return;
    }
    
    setLocalFilters(prev => ({
      ...prev,
      [field]: filteredValue
    }));

    // Clear location if practice changes
    if (field === 'practiceCode' && filteredValue !== localFilters.practiceCode) {
      setLocalFilters(prev => ({
        ...prev,
        locationCode: ''
      }));
    }
  };

  const handleAddToArray = (field, value) => {
    if (!value || value === '') return;
    
    setLocalFilters(prev => {
      const currentArray = prev[field] || [];
      // Don't add if already exists
      if (currentArray.includes(value)) {
        return prev;
      }
      return {
        ...prev,
        [field]: [...currentArray, value]
      };
    });
  };

  const handleRemoveFromArray = (field, value) => {
    setLocalFilters(prev => {
      const currentArray = prev[field] || [];
      return {
        ...prev,
        [field]: currentArray.filter(item => item !== value)
      };
    });
    
    // Clear locations if removing a practice
    if (field === 'practiceCodes') {
      setLocalFilters(prev => ({
        ...prev,
        locationCodes: []
      }));
    }
  };

  const handleDateChange = (field, value) => {
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
      statuses: [],
      assigneeIds: [],
      reporterIds: [],
      checkNumber: '',
      batchNumber: '',
      openedDateFrom: '',
      openedDateTo: '',
      startDate: '',
      endDate: '',
      month: null,
      year: null
    } : isDitDrl ? {
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
    } : {
      statuses: [],
      practiceCodes: [],
      locationCodes: [],
      assigneeIds: [],
      reporterIds: [],
      checkNumber: '',
      batchNumber: '',
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
            <div className="multi-select-wrapper">
              <div className="multi-select-input">
                <SearchableDropdown
                  options={[
                    { value: '', label: 'Select Status' },
                    ...(isClarifications ? [
                      { value: 'OPEN', label: 'Open' },
                      { value: 'RESOLVED', label: 'Resolved' }
                    ] : [
                      { value: 'NOT_STARTED', label: 'Not Started' },
                      { value: 'IN_PROGRESS', label: 'In Progress' },
                      { value: 'UNDER_CLARIFICATIONS', label: 'Under Clarifications' },
                      { value: 'COMPLETED', label: 'Completed' },
                      { value: 'OVER_POSTED', label: 'Over Posted' }
                    ])
                  ].filter(opt => opt.value === '' || !localFilters.statuses || !localFilters.statuses.includes(opt.value))}
                  value=""
                  onChange={(value) => {
                    if (value) {
                      handleAddToArray('statuses', value);
                    }
                  }}
                  placeholder="Select Status"
                  maxVisibleItems={5}
                />
              </div>
              {localFilters.statuses && localFilters.statuses.length > 0 && (
                <div className="selected-chips">
                  {localFilters.statuses.map((status) => {
                    const statusOptions = isClarifications ? [
                      { value: 'OPEN', label: 'Open' },
                      { value: 'RESOLVED', label: 'Resolved' }
                    ] : [
                      { value: 'NOT_STARTED', label: 'Not Started' },
                      { value: 'IN_PROGRESS', label: 'In Progress' },
                      { value: 'UNDER_CLARIFICATIONS', label: 'Under Clarifications' },
                      { value: 'COMPLETED', label: 'Completed' },
                      { value: 'OVER_POSTED', label: 'Over Posted' }
                    ];
                    const label = statusOptions.find(opt => opt.value === status)?.label || status;
                    return (
                      <div key={status} className="selected-chip">
                        <span>{label}</span>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={() => handleRemoveFromArray('statuses', status)}
                          title="Remove"
                        >
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {!isClarifications && !isDitDrl && (
            <>
              <div className="filter-group">
                <label>Practice</label>
                <div className="multi-select-wrapper">
                  <div className="multi-select-input">
                    <SearchableDropdown
                      options={[
                        { value: '', label: 'Select Practice' },
                        ...practices
                          .filter(p => p.isActive !== false)
                          .filter(p => !localFilters.practiceCodes || !localFilters.practiceCodes.includes(p.code))
                          .map(practice => ({
                            value: practice.code,
                            label: practice.name || practice.code
                          }))
                      ]}
                      value=""
                      onChange={(value) => {
                        if (value) {
                          handleAddToArray('practiceCodes', value);
                        }
                      }}
                      placeholder="Select Practice"
                      maxVisibleItems={5}
                    />
                  </div>
                  {localFilters.practiceCodes && localFilters.practiceCodes.length > 0 && (
                    <div className="selected-chips">
                      {localFilters.practiceCodes.map((practiceCode) => {
                        const practice = practices.find(p => p.code === practiceCode);
                        const label = practice?.name || practiceCode;
                        return (
                          <div key={practiceCode} className="selected-chip">
                            <span>{label}</span>
                            <button
                              type="button"
                              className="chip-remove-btn"
                              onClick={() => handleRemoveFromArray('practiceCodes', practiceCode)}
                              title="Remove"
                            >
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="filter-group">
                <label>Location</label>
                <div className="multi-select-wrapper">
                  <div className="multi-select-input">
                    <SearchableDropdown
                      options={[
                        { value: '', label: 'Select Location' },
                        ...locations
                          .filter(l => l.isActive !== false)
                          .filter(l => !localFilters.locationCodes || !localFilters.locationCodes.includes(l.code))
                          .map(location => ({
                            value: location.code,
                            label: location.name || location.code
                          }))
                      ]}
                      value=""
                      onChange={(value) => {
                        if (value) {
                          handleAddToArray('locationCodes', value);
                        }
                      }}
                      placeholder="Select Location"
                      disabled={!localFilters.practiceCodes || localFilters.practiceCodes.length === 0}
                      maxVisibleItems={5}
                    />
                  </div>
                  {localFilters.locationCodes && localFilters.locationCodes.length > 0 && (
                    <div className="selected-chips">
                      {localFilters.locationCodes.map((locationCode) => {
                        const location = locations.find(l => l.code === locationCode);
                        const label = location?.name || locationCode;
                        return (
                          <div key={locationCode} className="selected-chip">
                            <span>{label}</span>
                            <button
                              type="button"
                              className="chip-remove-btn"
                              onClick={() => handleRemoveFromArray('locationCodes', locationCode)}
                              title="Remove"
                            >
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="filter-group">
            <label>Assignee</label>
            <div className="multi-select-wrapper">
              <div className="multi-select-input">
                <SearchableDropdown
                  options={[
                    { value: '', label: 'Select Assignee' },
                    ...users
                      .filter(user => !localFilters.assigneeIds || !localFilters.assigneeIds.includes(user.userId || user.id))
                      .map(user => ({
                        value: user.userId || user.id,
                        label: user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email || 'Unknown User'
                      }))
                  ]}
                  value=""
                  onChange={(value) => {
                    if (value) {
                      handleAddToArray('assigneeIds', value);
                    }
                  }}
                  placeholder="Select Assignee"
                  maxVisibleItems={5}
                />
              </div>
              {localFilters.assigneeIds && localFilters.assigneeIds.length > 0 && (
                <div className="selected-chips">
                  {localFilters.assigneeIds.map((assigneeId) => {
                    const user = users.find(u => (u.userId || u.id) === assigneeId);
                    const label = user && user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || assigneeId;
                    return (
                      <div key={assigneeId} className="selected-chip">
                        <span>{label}</span>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={() => handleRemoveFromArray('assigneeIds', assigneeId)}
                          title="Remove"
                        >
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label>Reporter</label>
            <div className="multi-select-wrapper">
              <div className="multi-select-input">
                <SearchableDropdown
                  options={[
                    { value: '', label: 'Select Reporter' },
                    ...users
                      .filter(user => !localFilters.reporterIds || !localFilters.reporterIds.includes(user.userId || user.id))
                      .map(user => ({
                        value: user.userId || user.id,
                        label: user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email || 'Unknown User'
                      }))
                  ]}
                  value=""
                  onChange={(value) => {
                    if (value) {
                      handleAddToArray('reporterIds', value);
                    }
                  }}
                  placeholder="Select Reporter"
                  maxVisibleItems={5}
                />
              </div>
              {localFilters.reporterIds && localFilters.reporterIds.length > 0 && (
                <div className="selected-chips">
                  {localFilters.reporterIds.map((reporterId) => {
                    const user = users.find(u => (u.userId || u.id) === reporterId);
                    const label = user && user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email || reporterId;
                    return (
                      <div key={reporterId} className="selected-chip">
                        <span>{label}</span>
                        <button
                          type="button"
                          className="chip-remove-btn"
                          onClick={() => handleRemoveFromArray('reporterIds', reporterId)}
                          title="Remove"
                        >
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {isDitDrl ? (
            <>
              <div className="filter-group">
                <label>Site Code (Wildcard)</label>
                <input
                  type="text"
                  value={localFilters.siteCode || ''}
                  onChange={(e) => handleChange('siteCode', e.target.value)}
                  placeholder="Enter site code (e.g., *ANN or ANN)"
                />
              </div>
              <div className="filter-group">
                <label>Site Codes</label>
                <div className="multi-select-wrapper">
                  <div className="multi-select-input">
                    <input
                      type="text"
                      placeholder="Enter site code and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          handleAddToArray('siteCodes', e.target.value.trim().toUpperCase());
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                  {localFilters.siteCodes && localFilters.siteCodes.length > 0 && (
                    <div className="selected-chips">
                      {localFilters.siteCodes.map((siteCode) => (
                        <div key={siteCode} className="selected-chip">
                          <span>{siteCode}</span>
                          <button
                            type="button"
                            className="chip-remove-btn"
                            onClick={() => handleRemoveFromArray('siteCodes', siteCode)}
                            title="Remove"
                          >
                            <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="filter-group">
                <label>Batch Number</label>
                <input
                  type="text"
                  value={localFilters.batchNumber || ''}
                  onChange={(e) => handleChange('batchNumber', e.target.value)}
                  placeholder="Enter batch number (e.g., B-00* or B-00)"
                />
              </div>
            </>
          ) : (
            <>
              <div className="filter-group">
                <label>Check Number</label>
                <input
                  type="text"
                  value={localFilters.checkNumber || ''}
                  onChange={(e) => handleChange('checkNumber', e.target.value)}
                  placeholder="Enter check number (e.g., ch* or ch)"
                />
              </div>

              {!isClarifications && (
                <div className="filter-group">
                  <label>Batch Number</label>
                  <input
                    type="text"
                    value={localFilters.batchNumber || ''}
                    onChange={(e) => handleChange('batchNumber', e.target.value)}
                    placeholder="Enter batch number (e.g., B-00* or B-00)"
                  />
                </div>
              )}
            </>
          )}

          {isClarifications ? (
            <>
              <div className="filter-group">
                <label>Opened Date From</label>
                <USDateInput
                  name="openedDateFrom"
                  value={localFilters.openedDateFrom || ''}
                  onChange={(e) => handleDateChange('openedDateFrom', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Opened Date To</label>
                <USDateInput
                  name="openedDateTo"
                  value={localFilters.openedDateTo || ''}
                  onChange={(e) => handleDateChange('openedDateTo', e.target.value)}
                  min={localFilters.openedDateFrom || undefined}
                />
              </div>
            </>
          ) : isDitDrl ? (
            <>
              <div className="filter-group">
                <label>Date Received From</label>
                <USDateInput
                  name="dateReceivedFrom"
                  value={localFilters.dateReceivedFrom || ''}
                  onChange={(e) => handleDateChange('dateReceivedFrom', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Date Received To</label>
                <USDateInput
                  name="dateReceivedTo"
                  value={localFilters.dateReceivedTo || ''}
                  onChange={(e) => handleDateChange('dateReceivedTo', e.target.value)}
                  min={localFilters.dateReceivedFrom || undefined}
                />
              </div>

              <div className="filter-group">
                <label>Completed Date From</label>
                <USDateInput
                  name="completedDateFrom"
                  value={localFilters.completedDateFrom || ''}
                  onChange={(e) => handleDateChange('completedDateFrom', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Completed Date To</label>
                <USDateInput
                  name="completedDateTo"
                  value={localFilters.completedDateTo || ''}
                  onChange={(e) => handleDateChange('completedDateTo', e.target.value)}
                  min={localFilters.completedDateFrom || undefined}
                />
              </div>
            </>
          ) : (
            <>
              <div className="filter-group">
                <label>Deposit Date From</label>
                <USDateInput
                  name="depositDateFrom"
                  value={localFilters.depositDateFrom || ''}
                  onChange={(e) => handleDateChange('depositDateFrom', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Deposit Date To</label>
                <USDateInput
                  name="depositDateTo"
                  value={localFilters.depositDateTo || ''}
                  onChange={(e) => handleDateChange('depositDateTo', e.target.value)}
                  min={localFilters.depositDateFrom || undefined}
                />
              </div>

              <div className="filter-group">
                <label>Received Date From</label>
                <USDateInput
                  name="receivedDateFrom"
                  value={localFilters.receivedDateFrom || ''}
                  onChange={(e) => handleDateChange('receivedDateFrom', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Received Date To</label>
                <USDateInput
                  name="receivedDateTo"
                  value={localFilters.receivedDateTo || ''}
                  onChange={(e) => handleDateChange('receivedDateTo', e.target.value)}
                  min={localFilters.receivedDateFrom || undefined}
                />
              </div>

              <div className="filter-group">
                <label>Completed Date From</label>
                <USDateInput
                  name="completedDateFrom"
                  value={localFilters.completedDateFrom || ''}
                  onChange={(e) => handleDateChange('completedDateFrom', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label>Completed Date To</label>
                <USDateInput
                  name="completedDateTo"
                  value={localFilters.completedDateTo || ''}
                  onChange={(e) => handleDateChange('completedDateTo', e.target.value)}
                  min={localFilters.completedDateFrom || undefined}
                />
              </div>
            </>
          )}

          {/* Month and Year filters removed from Advanced Filter as requested */}
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

