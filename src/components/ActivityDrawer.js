import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsers } from '../context/UsersContext';
import { formatDateTime, formatDateUS } from '../utils/dateUtils';
import './ActivityDrawer.css';

const ActivityDrawer = ({ isOpen, onClose, checkId, isDitDrl = false }) => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { getUserName, fetchAllUsers } = useUsers();
  const size = 20;

  const fetchActivities = async () => {
    if (!checkId) return;
    
    setLoading(true);
    try {
      const response = isDitDrl 
        ? await api.getDitDrlActivities(checkId, page, size)
        : await api.getCheckActivities(checkId, page, size);
      setActivities(response.items || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      
      // Ensure users are loaded for display
      await fetchAllUsers(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && checkId) {
      fetchActivities();
    } else if (!isOpen) {
      // Reset search when drawer closes
      setSearchTerm('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, checkId, page]);

  // Filter activities by user name search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredActivities(activities);
      return;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const filtered = activities.filter(activity => {
      const userName = getUserName(activity.createdBy);
      return userName.toLowerCase().includes(searchLower);
    });
    setFilteredActivities(filtered);
  }, [activities, searchTerm, getUserName]);

  const handleBatchClick = (batchId, batchNumber, activityCheckId) => {
    // Navigate to check/DIT/DRL details page with batches tab and batchId for highlighting
    // Use the checkId from activity metadata if available, otherwise use current checkId
    const targetCheckId = activityCheckId || checkId;
    if (isDitDrl) {
      if (targetCheckId && batchId) {
        navigate(`/dit-drl/${targetCheckId}?tab=batches&batchId=${batchId}`);
      } else if (targetCheckId) {
        navigate(`/dit-drl/${targetCheckId}?tab=batches`);
      }
    } else {
      if (targetCheckId && batchId) {
        navigate(`/checks/${targetCheckId}?tab=batches&batchId=${batchId}`);
      } else if (targetCheckId) {
        navigate(`/checks/${targetCheckId}?tab=batches`);
      }
    }
  };

  const handleClarificationClick = (clarificationId, activityCheckId) => {
    // Navigate to check/DIT/DRL details page with clarifications tab and highlight the clarification
    // Use the checkId from activity metadata if available, otherwise use current checkId
    const targetCheckId = activityCheckId || checkId;
    if (isDitDrl) {
      if (targetCheckId) {
        navigate(`/dit-drl/${targetCheckId}?tab=clarifications&clarificationId=${clarificationId}`);
      } else {
        // If no checkId, navigate to clarifications page
        navigate(`/clarifications?clarificationId=${clarificationId}`);
      }
    } else {
      if (targetCheckId) {
        navigate(`/checks/${targetCheckId}?tab=clarifications&clarificationId=${clarificationId}`);
      } else {
        // If no checkId, navigate to clarifications page
        navigate(`/clarifications?clarificationId=${clarificationId}`);
      }
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatFieldName = (field) => {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatValue = (value, fieldName = '') => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    // Check if this is a date field
    const dateFields = ['batchDate', 'date', 'Date', 'createdAt', 'updatedAt', 'openedAt', 'completedDate', 'depositDate', 'receivedDate', 'correctionBatchDate'];
    const isDateField = dateFields.some(df => fieldName.toLowerCase().includes(df.toLowerCase()));
    
    if (isDateField) {
      // Try to format as date
      try {
        // Handle different date formats
        let dateStr = String(value);
        
        // If it's in format like "2025,11,12" or "2025,9,12", convert it
        if (dateStr.includes(',')) {
          const parts = dateStr.split(',').map(p => p.trim());
          if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1].padStart(2, '0');
            const day = parts[2].padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
          }
        }
        
        // If it's already in YYYY-MM-DD format or can be parsed
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}/) || dateStr.match(/^\d{4}-\d{1,2}-\d{1,2}/)) {
          return formatDateUS(dateStr);
        }
        
        // Try parsing as date
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return formatDateUS(date.toISOString().split('T')[0]);
        }
      } catch (e) {
        // If date parsing fails, return as string
      }
    }
    
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  const formatComment = (comment) => {
    if (!comment) return '';
    if (comment.length <= 20) {
      return comment;
    }
    if (comment.length > 28) {
      return comment.substring(0, 28) + '...';
    }
    return comment;
  };

  const formatClarificationId = (clarificationId) => {
    if (!clarificationId) return '';
    if (clarificationId.length > 28) {
      return clarificationId.substring(0, 28) + '...';
    }
    return clarificationId;
  };

  if (!isOpen) return null;

  return (
    <div className="activity-drawer">
      <div className="drawer-header">
        <h2>Activity History</h2>
        <button className="close-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Search Box */}
      {!loading && activities.length > 0 && (
        <div className="drawer-search">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="search-icon">
              <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search by user name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="search-results-info">
              Showing {filteredActivities.length} of {activities.length} activities
            </div>
          )}
        </div>
      )}

      <div className="drawer-content">
        {loading ? (
          <div className="loading-state">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="empty-state">No activities found</div>
        ) : filteredActivities.length === 0 ? (
          <div className="empty-state">No activities match your search</div>
        ) : (
          <div className="activities-list">
            {filteredActivities.map((activity) => {
              const userName = getUserName(activity.createdBy);
              const hasChanges = activity.metadata?.changes && activity.metadata.changes.length > 0;
              
              // Check for batch metadata
              const hasBatchMetadata = activity.metadata?.batchId || activity.metadata?.batchNumber;
              const batchId = activity.metadata?.batchId;
              const batchNumber = activity.metadata?.batchNumber;
              const batchAmount = activity.metadata?.amount;
              const activityCheckId = activity.metadata?.checkId;
              
              // Check for clarification metadata
              const hasClarificationMetadata = activity.metadata?.clarificationId;
              const clarificationId = activity.metadata?.clarificationId;
              const clarificationComment = activity.metadata?.comment;
              
              // Check for bulk assignment metadata
              const hasBulkAssignmentMetadata = activity.metadata?.assigneeId || activity.metadata?.reporterId;
              
              return (
                <div key={activity.activityId} className="activity-item">
                  {activity.summary && (
                    <div className="activity-summary">{activity.summary}</div>
                  )}
                  
                  {/* Batch Metadata */}
                  {hasBatchMetadata && (
                    <div className="activity-metadata">
                      <div className="metadata-item">
                        <span className="metadata-label">Batch:</span>
                        {batchNumber ? (
                          <button 
                            className="metadata-link"
                            onClick={() => handleBatchClick(batchId, batchNumber, activityCheckId)}
                            title="Click to view batch"
                          >
                            {batchNumber}
                          </button>
                        ) : (
                          <span className="metadata-value">{batchId || 'N/A'}</span>
                        )}
                      </div>
                      {batchAmount !== undefined && batchAmount !== null && (
                        <div className="metadata-item">
                          <span className="metadata-label">Amount:</span>
                          <span className="metadata-value">{formatCurrency(batchAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Clarification Metadata */}
                  {hasClarificationMetadata && (
                    <div className="activity-metadata">
                      <div className="metadata-item">
                        <span className="metadata-label">Clarification:</span>
                        <button 
                          className="metadata-link"
                          onClick={() => handleClarificationClick(clarificationId, activityCheckId)}
                          title={clarificationId.length > 28 ? clarificationId : "Click to view clarification"}
                        >
                          {formatClarificationId(clarificationId)}
                        </button>
                      </div>
                      {clarificationComment && (
                        <div className="metadata-item">
                          <span className="metadata-label">Comment:</span>
                          <span className="metadata-value comment-text">{formatComment(clarificationComment)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Bulk Assignment Metadata */}
                  {hasBulkAssignmentMetadata && (
                    <div className="activity-metadata">
                      {activity.metadata.assigneeId && (
                        <div className="metadata-item">
                          <span className="metadata-label">Assignee:</span>
                          <span className="metadata-value">{getUserName(activity.metadata.assigneeId)}</span>
                        </div>
                      )}
                      {activity.metadata.reporterId && (
                        <div className="metadata-item">
                          <span className="metadata-label">Reporter:</span>
                          <span className="metadata-value">{getUserName(activity.metadata.reporterId)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {hasChanges && (
                    <div className="activity-changes">
                      <div className="changes-header">
                        {activity.metadata.changeCount} {activity.metadata.changeCount === 1 ? 'change' : 'changes'}
                      </div>
                      <div className="changes-list">
                        {activity.metadata.changes.map((change, index) => (
                          <div key={index} className="change-item">
                            <div className="change-field">
                              <span className="field-name">{formatFieldName(change.field)}</span>
                              {change.entity && (
                                <span className="field-entity">({change.entity})</span>
                              )}
                            </div>
                            <div className="change-values">
                              <div className="change-value old">
                                <span className="value-label">From:</span>
                                <span className="value-text">{formatValue(change.oldValue, change.field)}</span>
                              </div>
                              <div className="change-arrow">→</div>
                              <div className="change-value new">
                                <span className="value-label">To:</span>
                                <span className="value-text">{formatValue(change.newValue, change.field)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="activity-footer">
                    <span className="activity-user">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="user-icon">
                        <path d="M7 7C8.933 7 10.5 5.433 10.5 3.5C10.5 1.567 8.933 0 7 0C5.067 0 3.5 1.567 3.5 3.5C3.5 5.433 5.067 7 7 7ZM7 8.75C4.653 8.75 0 9.822 0 12.25V14H14V12.25C14 9.822 9.347 8.75 7 8.75Z" fill="currentColor"/>
                      </svg>
                      {userName}
                    </span>
                    <span className="activity-date">{formatDateTime(activity.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="drawer-footer">
          <button 
            className="pagination-btn" 
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {page + 1} of {totalPages} ({totalElements} total)
          </span>
          <button 
            className="pagination-btn" 
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityDrawer;
