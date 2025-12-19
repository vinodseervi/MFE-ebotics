import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUsers } from '../context/UsersContext';
import { usePermissions, PERMISSIONS } from '../hooks/usePermissions';
import PermissionGuard from '../components/PermissionGuard';
import { formatDateUS, parseDateUS } from '../utils/dateUtils';
import SearchableDropdown from '../components/SearchableDropdown';
import USDateInput from '../components/USDateInput';
import UserTimestamp from '../components/UserTimestamp';
import { filterEmojis } from '../utils/emojiFilter';
import './CheckDetails.css';

const DitDrlDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Check both id param and pathname to handle /dit-drl/new route
  const isNew = id === 'new' || window.location.pathname === '/dit-drl/new' || window.location.pathname.endsWith('/dit-drl/new');
  
  // State management
  const [ditDrl, setDitDrl] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading, will be set to false for new items
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false); // Will be set to true for new items in useEffect
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const { users, getUserName, getUserById } = useUsers();
  const { isSuperAdmin, can } = usePermissions();
  const [batchValidationErrors, setBatchValidationErrors] = useState({});
  const [batchSortField, setBatchSortField] = useState('batchDate');
  const [batchSortDirection, setBatchSortDirection] = useState('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmBatchId, setDeleteConfirmBatchId] = useState(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveBatchId, setArchiveBatchId] = useState(null);
  const [archiveBatchIsArchived, setArchiveBatchIsArchived] = useState(false);
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMessages, setValidationErrorMessages] = useState([]);
  
  // Navigation state (for potential future navigation features)
  // eslint-disable-next-line no-unused-vars
  const [ditDrlIds, setDitDrlIds] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // Form data
  const [formData, setFormData] = useState({
    siteCode: '',
    dateReceived: '',
    ccReceived: 0,
    echeckReceived: 0,
    cashPaperReceived: 0,
    sitePostingTotal: 0,
    nonArMedicalRecords: 0,
    miscAmount: 0,
    assigneeId: '',
    reporterId: ''
  });
  
  const [batchFormData, setBatchFormData] = useState({
    batchNumber: '',
    batchDate: '',
    batchAmount: '',
    batchNotes: '',
    batchSource: 'ONSHORE'
  });

  // Load DIT/DRL Payment IDs from sessionStorage
  useEffect(() => {
    if (!isNew) {
      const storedIds = sessionStorage.getItem('ditDrlNavigationIds');
      if (storedIds) {
        try {
          const ids = JSON.parse(storedIds);
          setDitDrlIds(ids);
          const index = ids.findIndex(ditDrlId => ditDrlId === id);
          setCurrentIndex(index);
        } catch (err) {
          console.error('Error parsing stored DIT/DRL Payment IDs:', err);
        }
      }
    }
  }, [id, isNew]);

  // Fetch DIT/DRL Payment details
  useEffect(() => {
    // Re-check isNew based on current pathname (in case route changed)
    const currentPath = window.location.pathname;
    const isNewCheck = id === 'new' || currentPath === '/dit-drl/new' || currentPath.endsWith('/dit-drl/new');
    
    if (isNewCheck) {
      setLoading(false);
      setIsEditMode(true);
      setError(null);
      // Reset form data for new item
      const newFormData = {
        siteCode: '',
        dateReceived: '',
        ccReceived: 0,
        echeckReceived: 0,
        cashPaperReceived: 0,
        sitePostingTotal: 0,
        nonArMedicalRecords: 0,
        miscAmount: 0,
        assigneeId: '',
        reporterId: ''
      };
      setFormData(newFormData);
    } else if (id && id !== 'new') {
      fetchDitDrlDetails();
    } else {
      // If we're on /dit-drl/new but id is undefined, treat as new
      if (currentPath === '/dit-drl/new' || currentPath.endsWith('/dit-drl/new')) {
        setLoading(false);
        setIsEditMode(true);
        setError(null);
        setFormData({
          siteCode: '',
          dateReceived: '',
          ccReceived: 0,
          echeckReceived: 0,
          cashPaperReceived: 0,
          sitePostingTotal: 0,
          nonArMedicalRecords: 0,
          miscAmount: 0,
          assigneeId: '',
          reporterId: ''
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const fetchDitDrlDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDitDrlById(id);
      setDitDrl(data);
      setFormData({
        siteCode: data.siteCode || '',
        dateReceived: data.dateReceived || '',
        ccReceived: data.ccReceived || 0,
        echeckReceived: data.echeckReceived || 0,
        cashPaperReceived: data.cashPaperReceived || 0,
        sitePostingTotal: data.sitePostingTotal || 0,
        nonArMedicalRecords: data.nonArMedicalRecords || 0,
        miscAmount: data.miscAmount || 0,
        assigneeId: data.assigneeId || '',
        reporterId: data.reporterId || ''
      });
    } catch (err) {
      console.error('Error fetching DIT/DRL Payment details:', err);
      setError('Failed to load DIT/DRL Payment details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    const filteredValue = typeof value === 'string' ? filterEmojis(value) : value;
    setFormData(prev => ({
      ...prev,
      [field]: filteredValue
    }));
  };

  const handleSave = async () => {
    try {
      // Convert null values to 0 for numeric fields
      const dataToSave = {
        ...formData,
        ccReceived: formData.ccReceived === null || formData.ccReceived === undefined ? 0 : formData.ccReceived,
        echeckReceived: formData.echeckReceived === null || formData.echeckReceived === undefined ? 0 : formData.echeckReceived,
        cashPaperReceived: formData.cashPaperReceived === null || formData.cashPaperReceived === undefined ? 0 : formData.cashPaperReceived,
        sitePostingTotal: formData.sitePostingTotal === null || formData.sitePostingTotal === undefined ? 0 : formData.sitePostingTotal,
        nonArMedicalRecords: formData.nonArMedicalRecords === null || formData.nonArMedicalRecords === undefined ? 0 : formData.nonArMedicalRecords,
        miscAmount: formData.miscAmount === null || formData.miscAmount === undefined ? 0 : formData.miscAmount,
      };
      
      if (isNew) {
        const newDitDrl = await api.createDitDrl(dataToSave);
        navigate(`/dit-drl/${newDitDrl.ditDrlId}`);
      } else {
        await api.updateDitDrl(id, dataToSave);
        await fetchDitDrlDetails();
        setIsEditMode(false);
      }
    } catch (err) {
      console.error('Error saving DIT/DRL Payment:', err);
      alert('Failed to save DIT/DRL Payment. Please try again.');
    }
  };

  const handleCancel = () => {
    if (isNew) {
      navigate('/dit-drl');
    } else {
      setIsEditMode(false);
      fetchDitDrlDetails();
    }
  };

  // Batch management functions
  const handleBatchFormChange = (field, value) => {
    const filteredValue = typeof value === 'string' ? filterEmojis(value) : value;
    setBatchFormData(prev => {
      const newData = {
        ...prev,
        [field]: filteredValue
      };
      
      // Clear validation errors when field changes
      if (batchValidationErrors[field]) {
        setBatchValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
      
      return newData;
    });
  };
  
  // Validate batch number uniqueness
  const validateBatchUniqueness = () => {
    const errors = {};
    const existingBatches = ditDrl?.batches || [];
    const currentBatchId = editingBatchId;
    
    // Check batch number uniqueness
    if (batchFormData.batchNumber && batchFormData.batchNumber.trim()) {
      const duplicateBatch = existingBatches.find(
        b => b.batchNumber && b.batchNumber.trim() === batchFormData.batchNumber.trim() && 
        b.batchId !== currentBatchId
      );
      if (duplicateBatch) {
        errors.batchNumber = 'Batch Number must be unique';
      }
    }
    
    setBatchValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate on form change
  useEffect(() => {
    if (batchFormData.batchNumber) {
      validateBatchUniqueness();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchFormData.batchNumber, editingBatchId]);

  const handleAddBatch = async () => {
    // Validate uniqueness
    if (!validateBatchUniqueness()) {
      const errorMessages = [];
      if (batchValidationErrors.batchNumber) {
        errorMessages.push(batchValidationErrors.batchNumber);
      }
      if (errorMessages.length > 0) {
        setValidationErrorMessages(errorMessages);
        setShowValidationError(true);
      }
      return;
    }
    
    try {
      const batchData = {
        ...batchFormData,
        batchDate: batchFormData.batchDate ? (parseDateUS(batchFormData.batchDate) || batchFormData.batchDate) : '',
        batchAmount: parseFloat(batchFormData.batchAmount) || 0
      };
      await api.createDitDrlBatch(id, batchData);
      await fetchDitDrlDetails();
      setIsAddingBatch(false);
      setBatchValidationErrors({});
      setBatchFormData({
        batchNumber: '',
        batchDate: '',
        batchAmount: '',
        batchNotes: '',
        batchSource: 'ONSHORE'
      });
    } catch (err) {
      console.error('Error creating batch:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to create batch. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatchId(batch.batchId);
    setBatchFormData({
      batchNumber: batch.batchNumber || '',
      batchDate: batch.batchDate || '',
      batchAmount: batch.batchAmount || '',
      batchNotes: batch.batchNotes || '',
      batchSource: batch.batchSource || 'ONSHORE'
    });
    setBatchValidationErrors({});
  };

  const handleUpdateBatch = async () => {
    // Validate uniqueness
    if (!validateBatchUniqueness()) {
      const errorMessages = [];
      if (batchValidationErrors.batchNumber) {
        errorMessages.push(batchValidationErrors.batchNumber);
      }
      if (errorMessages.length > 0) {
        setValidationErrorMessages(errorMessages);
        setShowValidationError(true);
      }
      return;
    }
    
    try {
      const batchData = {
        ...batchFormData,
        batchDate: batchFormData.batchDate ? (parseDateUS(batchFormData.batchDate) || batchFormData.batchDate) : '',
        batchAmount: parseFloat(batchFormData.batchAmount) || 0
      };
      await api.updateDitDrlBatch(id, editingBatchId, batchData);
      await fetchDitDrlDetails();
      setEditingBatchId(null);
      setBatchValidationErrors({});
      setBatchFormData({
        batchNumber: '',
        batchDate: '',
        batchAmount: '',
        batchNotes: '',
        batchSource: 'ONSHORE'
      });
    } catch (err) {
      console.error('Error updating batch:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to update batch. Please try again.';
      alert(errorMessage);
    }
  };

  const handleArchiveBatchClick = (batchId, isArchived) => {
    setArchiveBatchId(batchId);
    setArchiveBatchIsArchived(isArchived);
    setShowArchiveConfirm(true);
  };
  
  const handleArchiveBatchConfirm = async () => {
    if (!archiveBatchId) return;
    
    // Check permission
    if (!can(PERMISSIONS.PAYMENT_BATCH_UPDATE)) {
      alert('You do not have permission to archive/unarchive batches.');
      setShowArchiveConfirm(false);
      setArchiveBatchId(null);
      setArchiveBatchIsArchived(false);
      return;
    }
    
    try {
      await api.archiveDitDrlBatch(id, archiveBatchId, !archiveBatchIsArchived);
      await fetchDitDrlDetails();
      setShowArchiveConfirm(false);
      setArchiveBatchId(null);
      setArchiveBatchIsArchived(false);
    } catch (err) {
      console.error('Error archiving batch:', err);
      const errorMessage = err?.data?.message || err?.message || `Failed to ${archiveBatchIsArchived ? 'unarchive' : 'archive'} batch. Please try again.`;
      alert(errorMessage);
    }
  };
  
  const handleArchiveBatchCancel = () => {
    setShowArchiveConfirm(false);
    setArchiveBatchId(null);
    setArchiveBatchIsArchived(false);
  };

  const handleDeleteBatch = async (batchId, isArchived) => {
    if (!isSuperAdmin) {
      alert('Only Super Admin can delete batches.');
      return;
    }
    
    // Check if batch is archived
    if (!isArchived) {
      alert('Only archived batches can be deleted. Please archive the batch first before deleting.');
      return;
    }
    
    // Show delete confirmation modal
    setDeleteConfirmBatchId(batchId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmBatchId) return;
    
    try {
      await api.deleteDitDrlBatch(id, deleteConfirmBatchId);
      await fetchDitDrlDetails();
      setShowDeleteConfirm(false);
      setDeleteConfirmBatchId(null);
    } catch (err) {
      console.error('Error deleting batch:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to delete batch. Please try again.';
      alert(errorMessage);
      setShowDeleteConfirm(false);
      setDeleteConfirmBatchId(null);
    }
  };

  const handleDeleteConfirmCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmBatchId(null);
  };

  const handleCancelBatch = () => {
    setIsAddingBatch(false);
    setEditingBatchId(null);
    setBatchFormData({
      batchNumber: '',
      batchDate: '',
      batchAmount: '',
      batchNotes: '',
      batchSource: 'ONSHORE'
    });
    setBatchValidationErrors({});
  };

  const handleSortBatches = (field) => {
    if (batchSortField === field) {
      setBatchSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setBatchSortField(field);
      setBatchSortDirection('asc');
    }
  };
  
  const getSortArrow = (field) => {
    if (batchSortField !== field) return null;
    return <span className="sort-arrow">{batchSortDirection === 'asc' ? '↑' : '↓'}</span>;
  };
  
  // Get sorted batches
  const getSortedBatches = () => {
    if (!ditDrl?.batches || ditDrl.batches.length === 0) return [];
    
    const batches = [...ditDrl.batches];
    return batches.sort((a, b) => {
      let aVal = a[batchSortField];
      let bVal = b[batchSortField];
      
      if (batchSortField === 'batchDate' || batchSortField === 'createdAt' || batchSortField === 'updatedAt') {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
      } else if (batchSortField === 'batchAmount') {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else {
        aVal = aVal || '';
        bVal = bVal || '';
      }
      
      if (batchSortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  };

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
      'UNDER_CLARIFICATIONS': 'Under Clarifications',
      'IN_PROGRESS': 'In Progress',
      'NOT_STARTED': 'Not Started',
      'OVER_POSTED': 'Over Posted'
    };
    return statusMap[status] || status;
  };

  // Re-check isNew based on current pathname
  const currentPath = window.location.pathname;
  const isNewCheck = isNew || currentPath === '/dit-drl/new' || currentPath.endsWith('/dit-drl/new');

  if (loading) {
    return (
      <div className="check-details-page">
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

  if (error || (!isNewCheck && !ditDrl)) {
    return (
      <div className="check-details-page">
        <div className="error-state">
          <p>{error || 'DIT/DRL Payment not found'}</p>
          <button className="btn-primary" onClick={() => navigate('/dit-drl')}>
            Back to DIT/DRL Payments
          </button>
        </div>
      </div>
    );
  }

  const displayData = isNewCheck ? formData : ditDrl;

  return (
    <div className="check-details-page" data-testid="dit-drl-details-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <div className="header-top-row">
            <button className="back-btn" onClick={() => navigate('/dit-drl')}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to DIT/DRL Payments
            </button>
            <div className="title-row">
              <h1 className="page-title">
                {isNewCheck ? 'New DIT/DRL Payment' : (displayData?.siteCode || 'DIT/DRL Payment Details')}
              </h1>
              {!isNewCheck && displayData?.status && (
                <span className={`status-badge-large ${getStatusClass(displayData.status)}`}>
                  {formatStatus(displayData.status)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Card */}
      {!isNewCheck && (
          <div className="financial-summary-card merged">
          <div className="financial-sections">
            <div className="financial-section">
              <h3 className="section-title">DIT/DRL Payment Summary</h3>
              <div className="financial-grid compact">
                <div className="financial-item">
                  <span className="financial-label">Date Received</span>
                  <span className="financial-value">
                    {displayData.dateReceived ? formatDateUS(displayData.dateReceived) : 'N/A'}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Completed Date</span>
                  <span className="financial-value">
                    {displayData.completedDate ? formatDateUS(displayData.completedDate) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="financial-section posting-section">
              <h3 className="section-title">Posting Summary</h3>
              <div className="financial-grid posting-grid">
                <div className="financial-item">
                  <span className="financial-label">Total DRL Received</span>
                  <span className="financial-value primary">
                    {formatCurrency(displayData.totalDrlReceived || 0)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Site Posting Total</span>
                  <span className="financial-value">
                    {formatCurrency(displayData.sitePostingTotal || 0)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Posted Onshore</span>
                  <span className="financial-value success">
                    {formatCurrency(displayData.postedOnshore || 0)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Posted CCMG</span>
                  <span className="financial-value success">
                    {formatCurrency(displayData.postedCcmg || 0)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Total Posted</span>
                  <span className="financial-value success">
                    {formatCurrency(displayData.totalPosted || 0)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Remaining Amount</span>
                  <span className="financial-value">
                    {formatCurrency(displayData.remainingAmount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          {!isNewCheck && (
            <>
              <button 
                className={`tab ${activeTab === 'batches' ? 'active' : ''}`}
                onClick={() => setActiveTab('batches')}
              >
                Batches ({displayData.batches?.length || 0})
              </button>
              <button 
                className={`tab ${activeTab === 'clarifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('clarifications')}
              >
                Clarifications ({displayData.clarifications?.length || 0})
              </button>
            </>
          )}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="details-card">
              <div className="card-header-with-action">
                <h3 className="card-title">DIT/DRL Payment Details</h3>
                {!isEditMode && !isNewCheck ? (
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
                  <label>Site Code</label>
                  <input 
                    type="text" 
                    value={formData?.siteCode || ''}
                    onChange={(e) => handleFormChange('siteCode', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Date Received</label>
                  <USDateInput
                    name="dateReceived"
                    value={formData.dateReceived || ''}
                    onChange={(e) => handleFormChange('dateReceived', e.target.value)}
                    placeholder="MM/DD/YYYY"
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>CC Received</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.ccReceived !== undefined && formData.ccReceived !== null
                          ? (formData.ccReceived === 0 ? '' : formData.ccReceived)
                          : (displayData?.ccReceived && displayData.ccReceived !== 0 ? displayData.ccReceived : '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('ccReceived', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('ccReceived', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(displayData?.ccReceived || 0)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>E-Check Received</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.echeckReceived !== undefined && formData.echeckReceived !== null
                          ? (formData.echeckReceived === 0 ? '' : formData.echeckReceived)
                          : (displayData?.echeckReceived && displayData.echeckReceived !== 0 ? displayData.echeckReceived : '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('echeckReceived', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('echeckReceived', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(displayData?.echeckReceived || 0)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>Cash Paper Received</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.cashPaperReceived !== undefined && formData.cashPaperReceived !== null
                          ? (formData.cashPaperReceived === 0 ? '' : formData.cashPaperReceived)
                          : (displayData?.cashPaperReceived && displayData.cashPaperReceived !== 0 ? displayData.cashPaperReceived : '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('cashPaperReceived', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('cashPaperReceived', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(displayData?.cashPaperReceived || 0)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>Site Posting Total</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.sitePostingTotal !== undefined && formData.sitePostingTotal !== null
                          ? (formData.sitePostingTotal === 0 ? '' : formData.sitePostingTotal)
                          : (displayData?.sitePostingTotal && displayData.sitePostingTotal !== 0 ? displayData.sitePostingTotal : '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('sitePostingTotal', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('sitePostingTotal', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(displayData?.sitePostingTotal || 0)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>Non-AR Medical Records</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.nonArMedicalRecords !== undefined && formData.nonArMedicalRecords !== null
                          ? (formData.nonArMedicalRecords === 0 ? '' : formData.nonArMedicalRecords)
                          : (displayData?.nonArMedicalRecords && displayData.nonArMedicalRecords !== 0 ? displayData.nonArMedicalRecords : '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('nonArMedicalRecords', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('nonArMedicalRecords', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(displayData?.nonArMedicalRecords || 0)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>Misc Amount</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.miscAmount !== undefined && formData.miscAmount !== null
                          ? (formData.miscAmount === 0 ? '' : formData.miscAmount)
                          : (displayData?.miscAmount && displayData.miscAmount !== 0 ? displayData.miscAmount : '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('miscAmount', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('miscAmount', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(displayData?.miscAmount || 0)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>Assignee</label>
                  {isEditMode ? (
                    <SearchableDropdown
                      options={(users || []).map(user => ({
                        value: user.userId || user.id,
                        label: user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email || 'Unknown User'
                      }))}
                      value={formData.assigneeId || ''}
                      onChange={(val) => handleFormChange('assigneeId', val)}
                      placeholder="Select Assignee"
                      maxVisibleItems={5}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={displayData.assigneeId ? (getUserName ? getUserName(displayData.assigneeId) : 'N/A') : 'N/A'}
                      disabled
                    />
                  )}
                </div>
                <div className="form-group">
                  <label>Reporter</label>
                  {isEditMode ? (
                    <SearchableDropdown
                      options={(users || []).map(user => ({
                        value: user.userId || user.id,
                        label: user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email || 'Unknown User'
                      }))}
                      value={formData.reporterId || ''}
                      onChange={(val) => handleFormChange('reporterId', val)}
                      placeholder="Select Reporter"
                      maxVisibleItems={5}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={displayData.reporterId ? (getUserName ? getUserName(displayData.reporterId) : 'N/A') : 'N/A'}
                      disabled
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Batches Tab */}
        {!isNewCheck && activeTab === 'batches' && (
          <div className="tab-content">
            <div className="batches-card">
              <div className="card-header">
                <h3 className="card-title">Batches</h3>
                {!isAddingBatch && !editingBatchId && (
                  <button className="btn-secondary" onClick={() => {
                    setBatchFormData({
                      batchNumber: '',
                      batchDate: '',
                      batchAmount: '',
                      batchNotes: '',
                      batchSource: 'ONSHORE'
                    });
                    setIsAddingBatch(true);
                  }}>
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
                      {batchValidationErrors.batchNumber && (
                        <span className="error-text" style={{ color: '#dc2626', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                          {batchValidationErrors.batchNumber}
                        </span>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Batch Date (MM/DD/YYYY)</label>
                      <USDateInput
                        name="batchDate"
                        value={batchFormData.batchDate}
                        onChange={(e) => handleBatchFormChange('batchDate', e.target.value)}
                        placeholder="MM/DD/YYYY"
                      />
                    </div>
                    <div className="form-group">
                      <label>Batch Source</label>
                      <select
                        value={batchFormData.batchSource}
                        onChange={(e) => handleBatchFormChange('batchSource', e.target.value)}
                      >
                        <option value="ONSHORE">ONSHORE</option>
                        <option value="CCMG">CCMG</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Batch Amount</label>
                      <input 
                        type="number" 
                        step="0.01"
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
                      <th className="sortable" onClick={() => handleSortBatches('batchNumber')}>
                        Batch Number {getSortArrow('batchNumber')}
                      </th>
                      <th className="sortable" onClick={() => handleSortBatches('batchDate')}>
                        Date {getSortArrow('batchDate')}
                      </th>
                      <th className="sortable" onClick={() => handleSortBatches('batchSource')}>
                        Source {getSortArrow('batchSource')}
                      </th>
                      <th className="sortable" onClick={() => handleSortBatches('batchAmount')}>
                        Amount {getSortArrow('batchAmount')}
                      </th>
                      <th>Notes</th>
                      <th className="sortable" onClick={() => handleSortBatches('createdAt')}>
                        Created At {getSortArrow('createdAt')}
                      </th>
                      <th className="sortable" onClick={() => handleSortBatches('updatedAt')}>
                        Updated At {getSortArrow('updatedAt')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ditDrl.batches && ditDrl.batches.length > 0 ? (
                      getSortedBatches().map((batch) => (
                        editingBatchId === batch.batchId ? (
                          <tr key={batch.batchId} className="editing-row">
                            <td>
                              <input 
                                type="text" 
                                value={batchFormData.batchNumber}
                                onChange={(e) => handleBatchFormChange('batchNumber', e.target.value)}
                                className="inline-input"
                              />
                              {batchValidationErrors.batchNumber && (
                                <span className="error-text" style={{ color: '#dc2626', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                                  {batchValidationErrors.batchNumber}
                                </span>
                              )}
                            </td>
                            <td>
                              <USDateInput
                                name="batchDate"
                                value={batchFormData.batchDate}
                                onChange={(e) => handleBatchFormChange('batchDate', e.target.value)}
                                placeholder="MM/DD/YYYY"
                                className="inline-input"
                              />
                            </td>
                            <td>
                              <select
                                value={batchFormData.batchSource}
                                onChange={(e) => handleBatchFormChange('batchSource', e.target.value)}
                                className="inline-input"
                              >
                                <option value="ONSHORE">ONSHORE</option>
                                <option value="CCMG">CCMG</option>
                              </select>
                            </td>
                            <td>
                              <input 
                                type="number" 
                                step="0.01"
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
                              <UserTimestamp
                                userId={batch.createdBy}
                                dateTime={batch.createdAt}
                                action="created"
                                getUserName={getUserName}
                                getUserById={getUserById}
                              />
                            </td>
                            <td>
                              <UserTimestamp
                                userId={batch.updatedBy}
                                dateTime={batch.updatedAt}
                                action="updated"
                                getUserName={getUserName}
                                getUserById={getUserById}
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
                          <tr key={batch.batchId} data-batch-id={batch.batchId} className={batch.isArchived ? 'batch-archived' : ''}>
                            <td>{batch.batchNumber || 'N/A'}</td>
                            <td>{batch.batchDate ? formatDateUS(batch.batchDate) : 'N/A'}</td>
                            <td>{batch.batchSource || 'N/A'}</td>
                            <td>{formatCurrency(batch.batchAmount)}</td>
                            <td>{batch.batchNotes || 'N/A'}</td>
                            <td>
                              <UserTimestamp
                                userId={batch.createdBy}
                                dateTime={batch.createdAt}
                                action="created"
                                getUserName={getUserName}
                                getUserById={getUserById}
                              />
                            </td>
                            <td>
                              <UserTimestamp
                                userId={batch.updatedBy}
                                dateTime={batch.updatedAt}
                                action="updated"
                                getUserName={getUserName}
                                getUserById={getUserById}
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                                <PermissionGuard permission={PERMISSIONS.PAYMENT_BATCH_UPDATE}>
                                  <button 
                                    className={`btn-icon archive ${batch.isArchived ? 'archived' : ''}`}
                                    onClick={() => handleArchiveBatchClick(batch.batchId, batch.isArchived)}
                                    title={batch.isArchived ? 'Unarchive' : 'Archive'}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                      {batch.isArchived ? (
                                        <path d="M3 4H17M4 4V17C4 17.5304 4.21071 18.0391 4.58579 18.4142C4.96086 18.7893 5.46957 19 6 19H14C14.5304 19 15.0391 18.7893 15.4142 18.4142C15.7893 18.0391 16 17.5304 16 17V4M7 8L10 11L13 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      ) : (
                                        <path d="M3 4H17M4 4V17C4 17.5304 4.21071 18.0391 4.58579 18.4142C4.96086 18.7893 5.46957 19 6 19H14C14.5304 19 15.0391 18.7893 15.4142 18.4142C15.7893 18.0391 16 17.5304 16 17V4M7 8L10 5L13 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      )}
                                    </svg>
                                  </button>
                                </PermissionGuard>
                                {isSuperAdmin && (
                                  <button 
                                    className="btn-icon delete"
                                    onClick={() => handleDeleteBatch(batch.batchId, batch.isArchived)}
                                    title="Delete (Super Admin only)"
                                    style={{ color: '#dc2626' }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                      <path d="M3 6H5H17M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96086 12 3.46957 12 4V6M15 6V16C15 16.5304 14.7893 17.0391 14.4142 17.4142C14.0391 17.7893 13.5304 18 13 18H7C6.46957 18 5.96086 17.7893 5.58579 17.4142C5.21071 17.0391 5 16.5304 5 16V6H15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="empty-state">No batches found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!isNewCheck && activeTab === 'clarifications' && (
          <div className="tab-content">
            <div className="details-card">
              <h3 className="card-title">Clarifications</h3>
              {displayData.clarifications && displayData.clarifications.length > 0 ? (
                <div className="clarifications-list-redesigned">
                  {displayData.clarifications.map((clarification) => (
                    <div key={clarification.clarificationId} className="clarification-item">
                      <div className="clarification-row-1">
                        <div className="clarification-main-info">
                          <span className="clarification-type">{clarification.clarificationType || 'N/A'}</span>
                          <span className={`clarification-status ${clarification.status?.toLowerCase()}`}>
                            {clarification.status || 'OPEN'}
                          </span>
                        </div>
                      </div>
                      <div className="clarification-row-2">
                        <div className="clarification-details-full">
                          <span className="field-label-inline">Details:</span>
                          <span className="field-value-inline">{clarification.details || 'No details provided'}</span>
                        </div>
                      </div>
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

      {/* Archive/Unarchive Confirmation Modal */}
      {showArchiveConfirm && (
        <div 
          className="modal-overlay"
          onClick={handleArchiveBatchCancel}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              {archiveBatchIsArchived ? 'Unarchive Batch' : 'Archive Batch'}
            </h3>
            <p style={{ marginBottom: '24px', color: '#374151', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to {archiveBatchIsArchived ? 'unarchive' : 'archive'} this batch?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-cancel" 
                onClick={handleArchiveBatchCancel}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleArchiveBatchConfirm}
              >
                {archiveBatchIsArchived ? 'Unarchive' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="modal-overlay"
          onClick={handleDeleteConfirmCancel}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#DC2626' }}>
                  <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96086 12 3.46957 12 4V6M15 6V16C15 16.5304 14.7893 17.0391 14.4142 17.4142C14.0391 17.7893 13.5304 18 13 18H7C6.46957 18 5.96086 17.7893 5.58579 17.4142C5.21071 17.0391 5 16.5304 5 16V6H15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                Delete Batch
              </h3>
            </div>
            <p style={{ marginBottom: '24px', marginLeft: '52px', color: '#374151', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to delete this batch? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-cancel" 
                onClick={handleDeleteConfirmCancel}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleDeleteConfirm}
                style={{ background: '#DC2626', color: 'white' }}
                onMouseEnter={(e) => e.target.style.background = '#B91C1C'}
                onMouseLeave={(e) => e.target.style.background = '#DC2626'}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error Modal */}
      {showValidationError && (
        <div 
          className="modal-overlay"
          onClick={() => setShowValidationError(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#FEF2F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: '#DC2626' }}>
                  <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                Validation Failed
              </h3>
            </div>
            <div style={{ marginBottom: '24px', marginLeft: '52px' }}>
              <p style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px', lineHeight: '1.5' }}>
                The following errors were found:
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#DC2626', fontSize: '14px', lineHeight: '1.8' }}>
                {validationErrorMessages.map((message, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{message}</li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-primary" 
                onClick={() => setShowValidationError(false)}
                style={{ minWidth: '80px' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DitDrlDetails;
