import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDateUS, parseDateUS } from '../utils/dateUtils';
import { MdOutlineHistory } from 'react-icons/md';
import ActivityDrawer from '../components/ActivityDrawer';
import './CheckDetails.css';

const CheckDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [check, setCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [users, setUsers] = useState([]);
  
  // Clarifications state
  const [clarifications, setClarifications] = useState([]);
  const [loadingClarifications, setLoadingClarifications] = useState(false);
  const [isAddingClarification, setIsAddingClarification] = useState(false);
  const [editingClarificationId, setEditingClarificationId] = useState(null);
  const [expandedClarificationId, setExpandedClarificationId] = useState(null);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  
  // Navigation state
  const [checkIds, setCheckIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [navigationLoading, setNavigationLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({});
  const [batchFormData, setBatchFormData] = useState({
    batchRunNumber: '',
    batchNumber: '',
    batchDate: '',
    batchType: '',
    batchAmount: '',
    batchNotes: ''
  });
  const [clarificationFormData, setClarificationFormData] = useState({
    clarificationType: '',
    details: '',
    assigneeId: '',
    reporterId: '',
    status: 'OPEN'
  });
  const [commentText, setCommentText] = useState({});

  // Load check IDs from sessionStorage and find current position
  useEffect(() => {
    const storedCheckIds = sessionStorage.getItem('checksNavigationIds');
    const storedFilters = sessionStorage.getItem('checksNavigationFilters');
    
    if (storedCheckIds) {
      try {
        const ids = JSON.parse(storedCheckIds);
        setCheckIds(ids);
        const index = ids.findIndex(checkId => checkId === id);
        setCurrentIndex(index);
      } catch (err) {
        console.error('Error parsing stored check IDs:', err);
      }
    } else {
      // If no stored IDs, try to fetch current page
      if (storedFilters) {
        try {
          const filters = JSON.parse(storedFilters);
          const params = {
            ...filters,
            page: filters.page || 0,
            size: 50
          };
          api.getChecksDashboard(params).then(response => {
            const checksList = response.items || [];
            const ids = checksList.map(c => c.checkId);
            setCheckIds(ids);
            const index = ids.findIndex(checkId => checkId === id);
            setCurrentIndex(index);
            // Update sessionStorage
            sessionStorage.setItem('checksNavigationIds', JSON.stringify(ids));
          }).catch(err => {
            console.error('Error fetching checks for navigation:', err);
          });
        } catch (err) {
          console.error('Error parsing stored filters:', err);
        }
      }
    }
  }, [id]);

  // Fetch check details
  useEffect(() => {
    if (id) {
      fetchCheckDetails();
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch clarifications when clarifications tab is active
  useEffect(() => {
    if (id && activeTab === 'clarifications') {
      fetchClarifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeTab]);

  const fetchCheckDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCheckById(id);
      setCheck(data);
      setFormData({
        altCheckNumber: data.altCheckNumber || '',
        receivedDate: data.receivedDate || '',
        exchange: data.exchange || '',
        batchDescription: data.batchDescription || '',
        payer: data.payer || '',
        bankTrnRef: data.bankTrnRef || '',
        assigneeId: data.assigneeId || '',
        checkType: data.checkType || '',
        interestAmount: data.interestAmount || 0,
        nonArAmount: data.nonArAmount || 0,
        medicalRecordsFee: data.medicalRecordsFee || 0,
        correctionsAmount: data.correctionsAmount || 0,
        legacyNotes: data.legacyNotes || '',
        againstCheckAdditional: data.againstCheckAdditional || ''
      });
    } catch (err) {
      console.error('Error fetching check details:', err);
      setError('Failed to load check details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.getAllUsers();
      const usersList = Array.isArray(response) ? response : (response?.items || []);
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchClarifications = async () => {
    setLoadingClarifications(true);
    try {
      const data = await api.getClarifications(id);
      setClarifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching clarifications:', err);
    } finally {
      setLoadingClarifications(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBatchFormChange = (field, value) => {
    setBatchFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      await api.updateCheck(id, formData);
      await fetchCheckDetails();
      setIsEditMode(false);
    } catch (err) {
      console.error('Error updating check:', err);
      alert('Failed to update check. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    fetchCheckDetails(); // Reset form data
  };

  const handleAddBatch = async () => {
    try {
      const batchData = {
        ...batchFormData,
        batchDate: parseDateUS(batchFormData.batchDate) || batchFormData.batchDate,
        batchAmount: parseFloat(batchFormData.batchAmount) || 0
      };
      await api.createBatch(id, batchData);
      await fetchCheckDetails();
      setIsAddingBatch(false);
      setBatchFormData({
        batchRunNumber: '',
        batchNumber: '',
        batchDate: '',
        batchType: '',
        batchAmount: '',
        batchNotes: ''
      });
    } catch (err) {
      console.error('Error creating batch:', err);
      alert('Failed to create batch. Please try again.');
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatchId(batch.batchId);
    setBatchFormData({
      batchRunNumber: batch.batchRunNumber || '',
      batchNumber: batch.batchNumber || '',
      batchDate: batch.batchDate ? formatDateUS(batch.batchDate) : '',
      batchType: batch.batchType || '',
      batchAmount: batch.batchAmount || '',
      batchNotes: batch.batchNotes || ''
    });
  };

  const handleUpdateBatch = async () => {
    try {
      const batchData = {
        ...batchFormData,
        batchDate: parseDateUS(batchFormData.batchDate) || batchFormData.batchDate,
        batchAmount: parseFloat(batchFormData.batchAmount) || 0
      };
      await api.updateBatch(id, editingBatchId, batchData);
      await fetchCheckDetails();
      setEditingBatchId(null);
      setBatchFormData({
        batchRunNumber: '',
        batchNumber: '',
        batchDate: '',
        batchType: '',
        batchAmount: '',
        batchNotes: ''
      });
    } catch (err) {
      console.error('Error updating batch:', err);
      alert('Failed to update batch. Please try again.');
    }
  };

  const handleCancelBatch = () => {
    setIsAddingBatch(false);
    setEditingBatchId(null);
    setBatchFormData({
      batchRunNumber: '',
      batchNumber: '',
      batchDate: '',
      batchType: '',
      batchAmount: '',
      batchNotes: ''
    });
  };

  // Clarification handlers
  const handleClarificationFormChange = (field, value) => {
    setClarificationFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddClarification = async () => {
    try {
      await api.createClarification(id, clarificationFormData);
      await fetchClarifications();
      setIsAddingClarification(false);
      setClarificationFormData({
        clarificationType: '',
        details: '',
        assigneeId: '',
        reporterId: '',
        status: 'OPEN'
      });
    } catch (err) {
      console.error('Error creating clarification:', err);
      alert('Failed to create clarification. Please try again.');
    }
  };

  const handleEditClarification = (clarification) => {
    setEditingClarificationId(clarification.clarificationId);
    setClarificationFormData({
      clarificationType: clarification.clarificationType || '',
      details: clarification.details || '',
      assigneeId: clarification.assigneeId || '',
      reporterId: clarification.reporterId || '',
      status: clarification.status || 'OPEN'
    });
  };

  const handleUpdateClarification = async () => {
    try {
      await api.updateClarification(id, editingClarificationId, clarificationFormData);
      await fetchClarifications();
      setEditingClarificationId(null);
      setClarificationFormData({
        clarificationType: '',
        details: '',
        assigneeId: '',
        reporterId: '',
        status: 'OPEN'
      });
    } catch (err) {
      console.error('Error updating clarification:', err);
      alert('Failed to update clarification. Please try again.');
    }
  };

  const handleCancelClarification = () => {
    setIsAddingClarification(false);
    setEditingClarificationId(null);
    setClarificationFormData({
      clarificationType: '',
      details: '',
      assigneeId: '',
      reporterId: '',
      status: 'OPEN'
    });
  };

  const handleAddComment = async (clarificationId) => {
    const comment = commentText[clarificationId];
    if (!comment || !comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      await api.updateClarification(id, clarificationId, {
        newComment: comment
      });
      await fetchClarifications();
      setCommentText(prev => ({
        ...prev,
        [clarificationId]: ''
      }));
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
  };

  const toggleClarificationExpanded = (clarificationId) => {
    setExpandedClarificationId(prev => 
      prev === clarificationId ? null : clarificationId
    );
  };

  // Navigation functions
  const handlePreviousCheck = async () => {
    if (currentIndex > 0 && checkIds.length > 0) {
      const previousId = checkIds[currentIndex - 1];
      setNavigationLoading(true);
      navigate(`/checks/${previousId}`);
    } else if (currentIndex === 0 && checkIds.length > 0) {
      // Try to fetch previous page
      const storedFilters = sessionStorage.getItem('checksNavigationFilters');
      if (storedFilters) {
        try {
          const filters = JSON.parse(storedFilters);
          const currentPage = filters.page || 0;
          if (currentPage > 0) {
            // Fetch previous page
            const params = {
              ...filters,
              page: currentPage - 1,
              size: 50
            };
            setNavigationLoading(true);
            const response = await api.getChecksDashboard(params);
            const checksList = response.items || [];
            if (checksList.length > 0) {
              const lastCheckId = checksList[checksList.length - 1].checkId;
              // Update sessionStorage - prepend previous page checks
              const allIds = [...checksList.map(c => c.checkId), ...checkIds];
              sessionStorage.setItem('checksNavigationIds', JSON.stringify(allIds));
              sessionStorage.setItem('checksNavigationFilters', JSON.stringify({ ...filters, page: currentPage - 1 }));
              navigate(`/checks/${lastCheckId}`);
            } else {
              setNavigationLoading(false);
            }
          } else {
            setNavigationLoading(false);
          }
        } catch (err) {
          console.error('Error fetching previous page:', err);
          setNavigationLoading(false);
        }
      } else {
        setNavigationLoading(false);
      }
    } else {
      setNavigationLoading(false);
    }
  };

  const handleNextCheck = async () => {
    if (currentIndex >= 0 && currentIndex < checkIds.length - 1) {
      const nextId = checkIds[currentIndex + 1];
      setNavigationLoading(true);
      navigate(`/checks/${nextId}`);
    } else if (currentIndex === checkIds.length - 1 && checkIds.length > 0) {
      // Try to fetch next page
      const storedFilters = sessionStorage.getItem('checksNavigationFilters');
      if (storedFilters) {
        try {
          const filters = JSON.parse(storedFilters);
          const currentPage = filters.page || 0;
          const params = {
            ...filters,
            page: currentPage + 1,
            size: 50
          };
          setNavigationLoading(true);
          const response = await api.getChecksDashboard(params);
          const checksList = response.items || [];
          if (checksList.length > 0) {
            const firstCheckId = checksList[0].checkId;
            // Update sessionStorage - append next page checks
            const allIds = [...checkIds, ...checksList.map(c => c.checkId)];
            sessionStorage.setItem('checksNavigationIds', JSON.stringify(allIds));
            sessionStorage.setItem('checksNavigationFilters', JSON.stringify({ ...filters, page: currentPage + 1 }));
            navigate(`/checks/${firstCheckId}`);
          } else {
            setNavigationLoading(false);
          }
        } catch (err) {
          console.error('Error fetching next page:', err);
          setNavigationLoading(false);
        }
      } else {
        setNavigationLoading(false);
      }
    } else {
      setNavigationLoading(false);
    }
  };

  // Reset navigation loading when check changes
  useEffect(() => {
    setNavigationLoading(false);
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'COMPLETED': 'status-complete',
      'UNDER_CLARIFICATION': 'status-clarification',
      'IN_PROGRESS': 'status-progress',
      'NOT_STARTED': 'status-not-started',
      'OVER_POSTED': 'status-over-posted'
    };
    return statusMap[status] || 'status-not-started';
  };

  const formatStatus = (status) => {
    const statusMap = {
      'COMPLETED': 'Completed',
      'UNDER_CLARIFICATION': 'Under Clarification',
      'IN_PROGRESS': 'In Progress',
      'NOT_STARTED': 'Not Started',
      'OVER_POSTED': 'Over Posted'
    };
    return statusMap[status] || status;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Navigation loading overlay
  if (navigationLoading) {
    return (
      <div className={`check-details-page ${showActivityDrawer ? 'activity-sidebar-open' : ''}`}>
        <div className="navigation-loading-overlay">
          <div className="navigation-loading-content">
            <div className="navigation-loading-spinner"></div>
            <p className="navigation-loading-text">Loading check details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Skeleton loader
  if (loading) {
    return (
      <div className={`check-details-page ${showActivityDrawer ? 'activity-sidebar-open' : ''}`}>
        <div className="skeleton-loader">
          <div className="skeleton-header"></div>
          <div className="skeleton-card">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !check) {
    return (
      <div className={`check-details-page ${showActivityDrawer ? 'activity-sidebar-open' : ''}`}>
        <div className="error-state">
          <p>{error || 'Check not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/checks')}>
            Back to Checks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`check-details-page ${showActivityDrawer ? 'activity-sidebar-open' : ''}`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-top-row">
            <button className="back-btn" onClick={() => navigate('/checks')}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <div className="title-row">
              <h1 className="page-title">Check Details</h1>
              <span className={`status-badge-large ${getStatusClass(check.status)}`}>
                {formatStatus(check.status)}
              </span>
            </div>
          </div>
          <div className="metadata">
            <span>Payer: {check.payer || 'N/A'}</span>
            <span>Practice: {check.practiceCode || 'N/A'}</span>
            <span>Location: {check.locationCode || 'N/A'}</span>
          </div>
        </div>
        <div className="header-right">
          <div className="navigation-arrows">
            <button 
              className="nav-arrow-btn"
              onClick={handlePreviousCheck}
              disabled={navigationLoading || (currentIndex <= 0 && checkIds.length > 0)}
              title="Previous check"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Previous</span>
            </button>
            <button 
              className="nav-arrow-btn"
              onClick={handleNextCheck}
              disabled={navigationLoading || (currentIndex >= checkIds.length - 1 && checkIds.length > 0)}
              title="Next check"
            >
              <span>Next</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <button 
            className="activity-btn" 
            onClick={() => setShowActivityDrawer(true)}
            title="View Activity History"
          >
            <MdOutlineHistory size={20} />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Card */}
      <div className="financial-summary-card">
        <h3 className="card-title">Financial Summary</h3>
        <div className="financial-grid">
          <div className="financial-item">
            <span className="financial-label">Check Number</span>
            <span className="financial-value">{check.checkNumber || 'N/A'}</span>
          </div>
          <div className="financial-item">
            <span className="financial-label">Deposit Date</span>
            <span className="financial-value">{check.depositDate ? formatDateUS(check.depositDate) : 'N/A'}</span>
          </div>
          <div className="financial-item">
            <span className="financial-label">Total Amount</span>
            <span className="financial-value primary">{formatCurrency(check.totalAmount)}</span>
          </div>
          <div className="financial-item">
            <span className="financial-label">Posted Amount</span>
            <span className="financial-value">{formatCurrency(check.postedAmount)}</span>
          </div>
          <div className="financial-item">
            <span className="financial-label">Remaining Amount</span>
            <span className={`financial-value ${check.remainingAmount === 0 ? 'success' : ''}`}>
              {formatCurrency(check.remainingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'batches' ? 'active' : ''}`}
            onClick={() => setActiveTab('batches')}
          >
            Batches ({check.batches?.length || 0})
          </button>
          <button 
            className={`tab ${activeTab === 'clarifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('clarifications')}
          >
            Clarifications ({check.clarifications?.length || 0})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="details-card">
              <div className="card-header-with-action">
                <h3 className="card-title">Check Information</h3>
                {!isEditMode ? (
                  <button className="btn-primary" onClick={() => setIsEditMode(true)}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M11 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V15C3 15.5304 3.21071 16.0391 3.58579 16.4142C3.96086 16.7893 4.46957 17 5 17H15C15.5304 17 16.0391 16.7893 16.4142 16.4142C16.7893 16.0391 17 15.5304 17 15V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M14.5 1.5L18.5 5.5L11 13H7V9L14.5 1.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </button>
                ) : (
                  <div className="edit-actions-header">
                    <button className="btn-cancel" onClick={handleCancel}>
                      Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave}>
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path d="M17 3H3C2.44772 3 2 3.44772 2 4V16C2 16.5523 2.44772 17 3 17H17C17.5523 17 18 16.5523 18 16V4C18 3.44772 17.5523 3 17 3Z" stroke="currentColor" strokeWidth="2"/>
                        <path d="M6 9L9 12L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Save
                    </button>
                  </div>
                )}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Alt. Check Number</label>
                  <input 
                    type="text" 
                    value={formData.altCheckNumber || ''}
                    onChange={(e) => handleFormChange('altCheckNumber', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Received Date</label>
                  <input 
                    type="text" 
                    value={formData.receivedDate ? formatDateUS(formData.receivedDate) : ''}
                    onChange={(e) => handleFormChange('receivedDate', parseDateUS(e.target.value) || e.target.value)}
                    placeholder="MM/DD/YYYY"
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Check Type</label>
                  <select 
                    value={formData.checkType || ''}
                    onChange={(e) => handleFormChange('checkType', e.target.value)}
                    disabled={!isEditMode}
                  >
                    <option value="">Select Type</option>
                    <option value="EFT">EFT</option>
                    <option value="Paper">Paper</option>
                    <option value="ERA">ERA</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Exchange</label>
                  <input 
                    type="text" 
                    value={formData.exchange || ''}
                    onChange={(e) => handleFormChange('exchange', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Payer</label>
                  <input 
                    type="text" 
                    value={formData.payer || ''}
                    onChange={(e) => handleFormChange('payer', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Bank TRN Ref</label>
                  <input 
                    type="text" 
                    value={formData.bankTrnRef || ''}
                    onChange={(e) => handleFormChange('bankTrnRef', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Batch Description</label>
                  <input 
                    type="text" 
                    value={formData.batchDescription || ''}
                    onChange={(e) => handleFormChange('batchDescription', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Assignee</label>
                  <select 
                    value={formData.assigneeId || ''}
                    onChange={(e) => handleFormChange('assigneeId', e.target.value)}
                    disabled={!isEditMode}
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
                </div>
                <div className="form-group">
                  <label>Practice Code</label>
                  <input type="text" value={check.practiceCode || ''} disabled />
                </div>
                <div className="form-group">
                  <label>Location Code</label>
                  <input type="text" value={check.locationCode || ''} disabled />
                </div>
              </div>
            </div>

            <div className="details-card">
              <h3 className="card-title">Additional Information</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Legacy Notes</label>
                  <textarea 
                    value={formData.legacyNotes || ''}
                    onChange={(e) => handleFormChange('legacyNotes', e.target.value)}
                    disabled={!isEditMode}
                    rows="4"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Against Check Additional</label>
                  <textarea 
                    value={formData.againstCheckAdditional || ''}
                    onChange={(e) => handleFormChange('againstCheckAdditional', e.target.value)}
                    disabled={!isEditMode}
                    rows="4"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Financial Parameters */}
            <div className="details-card">
              <h3 className="card-title">Advanced Financial Parameters</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Interest Amount</label>
                  <input type="text" value={formatCurrency(check.interestAmount)} disabled />
                </div>
                <div className="form-group">
                  <label>Non-AR Amount</label>
                  <input type="text" value={formatCurrency(check.nonArAmount)} disabled />
                </div>
                <div className="form-group">
                  <label>Medical Records Fee</label>
                  <input type="text" value={formatCurrency(check.medicalRecordsFee)} disabled />
                </div>
                <div className="form-group">
                  <label>Corrections Amount</label>
                  <input type="text" value={formatCurrency(check.correctionsAmount)} disabled />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batches Tab */}
        {activeTab === 'batches' && (
          <div className="tab-content">
            <div className="batches-card">
              <div className="card-header">
                <h3 className="card-title">Batches</h3>
                {!isAddingBatch && !editingBatchId && (
                  <button className="btn-secondary" onClick={() => setIsAddingBatch(true)}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add Batch
                  </button>
                )}
              </div>

              {/* Add Batch Form */}
              {isAddingBatch && (
                <div className="batch-form-card">
                  <h4>Add New Batch</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Batch Number</label>
                      <input 
                        type="text" 
                        value={batchFormData.batchNumber}
                        onChange={(e) => handleBatchFormChange('batchNumber', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Batch Run Number</label>
                      <input 
                        type="text" 
                        value={batchFormData.batchRunNumber}
                        onChange={(e) => handleBatchFormChange('batchRunNumber', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Batch Date (MM/DD/YYYY)</label>
                      <input 
                        type="text" 
                        value={batchFormData.batchDate}
                        onChange={(e) => handleBatchFormChange('batchDate', e.target.value)}
                        placeholder="MM/DD/YYYY"
                      />
                    </div>
                    <div className="form-group">
                      <label>Batch Type</label>
                      <input 
                        type="text" 
                        value={batchFormData.batchType}
                        onChange={(e) => handleBatchFormChange('batchType', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Batch Amount</label>
                      <input 
                        type="number" 
                        value={batchFormData.batchAmount}
                        onChange={(e) => handleBatchFormChange('batchAmount', e.target.value)}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Batch Notes</label>
                      <textarea 
                        value={batchFormData.batchNotes}
                        onChange={(e) => handleBatchFormChange('batchNotes', e.target.value)}
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn-cancel" onClick={handleCancelBatch}>Cancel</button>
                    <button className="btn-save" onClick={handleAddBatch}>Save Batch</button>
                  </div>
                </div>
              )}

              {/* Batches Table */}
              <div className="batches-table-wrapper">
                <table className="batches-table">
                  <thead>
                    <tr>
                      <th>Batch Number</th>
                      <th>Run Number</th>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {check.batches && check.batches.length > 0 ? (
                      check.batches.map((batch) => (
                        editingBatchId === batch.batchId ? (
                          <tr key={batch.batchId} className="editing-row">
                            <td>
                              <input 
                                type="text" 
                                value={batchFormData.batchNumber}
                                onChange={(e) => handleBatchFormChange('batchNumber', e.target.value)}
                                className="inline-input"
                              />
                            </td>
                            <td>
                              <input 
                                type="text" 
                                value={batchFormData.batchRunNumber}
                                onChange={(e) => handleBatchFormChange('batchRunNumber', e.target.value)}
                                className="inline-input"
                              />
                            </td>
                            <td>
                              <input 
                                type="text" 
                                value={batchFormData.batchDate}
                                onChange={(e) => handleBatchFormChange('batchDate', e.target.value)}
                                placeholder="MM/DD/YYYY"
                                className="inline-input"
                              />
                            </td>
                            <td>
                              <input 
                                type="text" 
                                value={batchFormData.batchType}
                                onChange={(e) => handleBatchFormChange('batchType', e.target.value)}
                                className="inline-input"
                              />
                            </td>
                            <td>
                              <input 
                                type="number" 
                                value={batchFormData.batchAmount}
                                onChange={(e) => handleBatchFormChange('batchAmount', e.target.value)}
                                className="inline-input"
                              />
                            </td>
                            <td>
                              <input 
                                type="text" 
                                value={batchFormData.batchNotes}
                                onChange={(e) => handleBatchFormChange('batchNotes', e.target.value)}
                                className="inline-input"
                              />
                            </td>
                            <td>
                              <div className="inline-actions">
                                <button className="btn-icon save" onClick={handleUpdateBatch} title="Save">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                    <path d="M6 9L9 12L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                <button className="btn-icon cancel" onClick={handleCancelBatch} title="Cancel">
                                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                    <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          <tr key={batch.batchId}>
                            <td>{batch.batchNumber || 'N/A'}</td>
                            <td>{batch.batchRunNumber || 'N/A'}</td>
                            <td>{batch.batchDate ? formatDateUS(batch.batchDate) : 'N/A'}</td>
                            <td>{batch.batchType || 'N/A'}</td>
                            <td>{formatCurrency(batch.batchAmount)}</td>
                            <td>{batch.batchNotes || 'N/A'}</td>
                            <td>
                              <button 
                                className="btn-icon edit"
                                onClick={() => handleEditBatch(batch)}
                                title="Edit"
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                  <path d="M11 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V15C3 15.5304 3.21071 16.0391 3.58579 16.4142C3.96086 16.7893 4.46957 17 5 17H15C15.5304 17 16.0391 16.7893 16.4142 16.4142C16.7893 16.0391 17 15.5304 17 15V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M14.5 1.5L18.5 5.5L11 13H7V9L14.5 1.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        )
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="empty-state">No batches found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Clarifications Tab */}
        {activeTab === 'clarifications' && (
          <div className="tab-content">
            <div className="clarifications-card">
              <div className="card-header">
                <h3 className="card-title">Clarifications</h3>
                {!isAddingClarification && !editingClarificationId && (
                  <button className="btn-secondary" onClick={() => setIsAddingClarification(true)}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add Clarification
                  </button>
                )}
              </div>

              {/* Add Clarification Form */}
              {isAddingClarification && (
                <div className="clarification-form-card">
                  <h4>Add New Clarification</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Clarification Type</label>
                      <input 
                        type="text" 
                        value={clarificationFormData.clarificationType}
                        onChange={(e) => handleClarificationFormChange('clarificationType', e.target.value)}
                        placeholder="Enter type"
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        value={clarificationFormData.status}
                        onChange={(e) => handleClarificationFormChange('status', e.target.value)}
                      >
                        <option value="OPEN">Open</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Assignee</label>
                      <select 
                        value={clarificationFormData.assigneeId}
                        onChange={(e) => handleClarificationFormChange('assigneeId', e.target.value)}
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
                    </div>
                    <div className="form-group">
                      <label>Reporter</label>
                      <select 
                        value={clarificationFormData.reporterId}
                        onChange={(e) => handleClarificationFormChange('reporterId', e.target.value)}
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
                    </div>
                    <div className="form-group full-width">
                      <label>Details</label>
                      <textarea 
                        value={clarificationFormData.details}
                        onChange={(e) => handleClarificationFormChange('details', e.target.value)}
                        rows="4"
                        placeholder="Enter clarification details"
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn-cancel" onClick={handleCancelClarification}>Cancel</button>
                    <button className="btn-save" onClick={handleAddClarification}>Save Clarification</button>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loadingClarifications ? (
                <div className="empty-state">Loading clarifications...</div>
              ) : clarifications.length > 0 ? (
                <div className="clarifications-list">
                  {clarifications.map((clarification) => (
                    <div key={clarification.clarificationId} className="clarification-card">
                      {editingClarificationId === clarification.clarificationId ? (
                        // Edit Mode
                        <div className="clarification-edit-form">
                          <h4>Edit Clarification</h4>
                          <div className="form-grid">
                            <div className="form-group">
                              <label>Clarification Type</label>
                              <input 
                                type="text" 
                                value={clarificationFormData.clarificationType}
                                onChange={(e) => handleClarificationFormChange('clarificationType', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label>Status</label>
                              <select 
                                value={clarificationFormData.status}
                                onChange={(e) => handleClarificationFormChange('status', e.target.value)}
                              >
                                <option value="OPEN">Open</option>
                                <option value="RESOLVED">Resolved</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Assignee</label>
                              <select 
                                value={clarificationFormData.assigneeId}
                                onChange={(e) => handleClarificationFormChange('assigneeId', e.target.value)}
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
                            </div>
                            <div className="form-group">
                              <label>Reporter</label>
                              <select 
                                value={clarificationFormData.reporterId}
                                onChange={(e) => handleClarificationFormChange('reporterId', e.target.value)}
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
                            </div>
                            <div className="form-group full-width">
                              <label>Details</label>
                              <textarea 
                                value={clarificationFormData.details}
                                onChange={(e) => handleClarificationFormChange('details', e.target.value)}
                                rows="4"
                              />
                            </div>
                          </div>
                          <div className="form-actions">
                            <button className="btn-cancel" onClick={handleCancelClarification}>Cancel</button>
                            <button className="btn-save" onClick={handleUpdateClarification}>Update</button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="clarification-header">
                            <div className="clarification-info">
                              <span className="clarification-type">{clarification.clarificationType || 'General'}</span>
                              <span className={`clarification-status ${clarification.status?.toLowerCase()}`}>
                                {clarification.status || 'OPEN'}
                              </span>
                            </div>
                            <div className="clarification-actions">
                              <button 
                                className="btn-icon edit"
                                onClick={() => handleEditClarification(clarification)}
                                title="Edit"
                              >
                                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                  <path d="M11 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V15C3 15.5304 3.21071 16.0391 3.58579 16.4142C3.96086 16.7893 4.46957 17 5 17H15C15.5304 17 16.0391 16.7893 16.4142 16.4142C16.7893 16.0391 17 15.5304 17 15V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                  <path d="M14.5 1.5L18.5 5.5L11 13H7V9L14.5 1.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="clarification-meta">
                            <span>Opened: {formatDateTime(clarification.openedAt)}</span>
                            {clarification.resolvedAt && (
                              <span>Resolved: {formatDateTime(clarification.resolvedAt)}</span>
                            )}
                          </div>
                          <div className="clarification-details">
                            <p>{clarification.details || 'No details provided'}</p>
                          </div>
                          
                          {/* Comments Section */}
                          <div className="clarification-comments">
                            <div className="comments-header">
                              <h4>Comments ({clarification.comments?.length || 0})</h4>
                              <button 
                                className="btn-link"
                                onClick={() => toggleClarificationExpanded(clarification.clarificationId)}
                              >
                                {expandedClarificationId === clarification.clarificationId ? 'Collapse' : 'Expand'}
                              </button>
                            </div>
                            
                            {(expandedClarificationId === clarification.clarificationId || (clarification.comments && clarification.comments.length > 0)) && (
                              <>
                                {clarification.comments && clarification.comments.length > 0 && (
                                  <div className="comments-list">
                                    {clarification.comments.map((comment) => (
                                      <div key={comment.commentId} className="comment-item">
                                        <div className="comment-header">
                                          <span className="comment-author">{comment.userDisplayName || 'Unknown'}</span>
                                          <span className="comment-date">{formatDateTime(comment.commentedAt)}</span>
                                        </div>
                                        <div className="comment-text">{comment.comment}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Add Comment Form */}
                                <div className="add-comment-form">
                                  <textarea 
                                    placeholder="Add a comment..."
                                    value={commentText[clarification.clarificationId] || ''}
                                    onChange={(e) => setCommentText(prev => ({
                                      ...prev,
                                      [clarification.clarificationId]: e.target.value
                                    }))}
                                    rows="3"
                                  />
                                  <button 
                                    className="btn-secondary"
                                    onClick={() => handleAddComment(clarification.clarificationId)}
                                  >
                                    Add Comment
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No clarifications found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity Drawer */}
      <ActivityDrawer
        isOpen={showActivityDrawer}
        onClose={() => setShowActivityDrawer(false)}
        checkId={check?.checkId}
      />
    </div>
  );
};

export default CheckDetails;
