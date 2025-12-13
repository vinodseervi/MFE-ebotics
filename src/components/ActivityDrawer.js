import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { formatDateTime } from '../utils/dateUtils';
import './ActivityDrawer.css';

const ActivityDrawer = ({ isOpen, onClose, checkId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [userNames, setUserNames] = useState({});
  const size = 20;

  useEffect(() => {
    if (isOpen && checkId) {
      fetchActivities();
    }
  }, [isOpen, checkId, page]);

  useEffect(() => {
    if (activities.length > 0) {
      fetchUserNames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.getCheckActivities(checkId, page, size);
      setActivities(response.items || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNames = async () => {
    const uniqueUserIds = [...new Set(activities.map(a => a.createdBy).filter(Boolean))];
    const userIdsToFetch = uniqueUserIds.filter(id => !userNames[id]);
    
    if (userIdsToFetch.length === 0) return;

    const userPromises = userIdsToFetch.map(async (userId) => {
      try {
        const user = await api.getUserById(userId);
        return { userId, name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User' };
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return { userId, name: 'Unknown User' };
      }
    });

    const userResults = await Promise.all(userPromises);
    const newUserNames = {};
    userResults.forEach(({ userId, name }) => {
      newUserNames[userId] = name;
    });

    setUserNames(prev => ({ ...prev, ...newUserNames }));
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

        <div className="drawer-content">
          {loading ? (
            <div className="loading-state">Loading activities...</div>
          ) : activities.length === 0 ? (
            <div className="empty-state">No activities found</div>
          ) : (
            <div className="activities-list">
              {activities.map((activity) => {
                const userName = userNames[activity.createdBy] || 'Loading...';
                return (
                  <div key={activity.activityId} className="activity-item">
                    {activity.summary && (
                      <div className="activity-summary">{activity.summary}</div>
                    )}
                    <div className="activity-meta">
                      <span className="activity-user">{userName}</span>
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
