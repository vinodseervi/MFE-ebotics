import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useUsers } from '../context/UsersContext';
import { usePermissions, PERMISSIONS } from '../hooks/usePermissions';
import PermissionGuard from '../components/PermissionGuard';
import { formatDateUS, parseDateUS, formatDateTime, formatDateTimeTooltip } from '../utils/dateUtils';
import { MdOutlineHistory } from 'react-icons/md';
import { Info } from 'lucide-react';
import ActivityDrawer from '../components/ActivityDrawer';
import SearchableDropdown from '../components/SearchableDropdown';
import USDateInput from '../components/USDateInput';
import UserTimestamp from '../components/UserTimestamp';
import Tooltip from '../components/Tooltip';
import { filterEmojis } from '../utils/emojiFilter';
import './CheckDetails.css';

const CheckDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // State management
  const [check, setCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState(null);
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [practices, setPractices] = useState([]);
  const { users, getUserName, getUserById } = useUsers(); // Get users from context
  const { isSuperAdmin, can } = usePermissions(); // Get Super Admin status and permission checker
  const [batchValidationErrors, setBatchValidationErrors] = useState({});
  const [batchSortField, setBatchSortField] = useState('batchDate');
  const [batchSortDirection, setBatchSortDirection] = useState('desc');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveBatchId, setArchiveBatchId] = useState(null);
  const [archiveBatchIsArchived, setArchiveBatchIsArchived] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmBatchId, setDeleteConfirmBatchId] = useState(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMessages, setValidationErrorMessages] = useState([]);
  
  // Clarifications state
  const [isAddingClarification, setIsAddingClarification] = useState(false);
  const [editingClarificationId, setEditingClarificationId] = useState(null);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const hasScrolledToClarification = useRef(false);
  const hasScrolledToBatch = useRef(false);
  const lastClarificationId = useRef(null);
  const lastBatchId = useRef(null);
  
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
    batchType: 'MANUAL', // Default to MANUAL
    batchAmount: '',
    batchNotes: '',
    invoiceNumber: ''
  });
  const [clarificationFormData, setClarificationFormData] = useState({
    clarificationType: '',
    details: '',
    assignee: 'ON-SHORE', // Default assignee
    reportee: 'EBOTICS', // Default reportee
    assigneeId: '', // Not required for default assignment
    reporterId: '', // Not required for default assignment
    status: 'OPEN'
  });
  const [expandedCommentsClarificationId, setExpandedCommentsClarificationId] = useState(null);
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

  // Fetch practices
  useEffect(() => {
    const fetchPractices = async () => {
      try {
        const response = await api.getAllPractices();
        const practicesList = Array.isArray(response) ? response : (response?.items || []);
        setPractices(practicesList.filter(p => p.isActive !== false));
      } catch (error) {
        console.error('Error fetching practices:', error);
      }
    };
    fetchPractices();
  }, []);

  // Fetch check details
  useEffect(() => {
    if (id) {
      fetchCheckDetails();
      // Removed: Users are now loaded from context on login
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Check for tab, clarificationId, or batchId in URL and auto-switch tabs
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const clarificationIdParam = searchParams.get('clarificationId');
    const batchIdParam = searchParams.get('batchId');
    
    if (tabParam && ['overview', 'batches', 'clarifications'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (clarificationIdParam && id) {
      setActiveTab('clarifications');
    } else if (batchIdParam && id) {
      setActiveTab('batches');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, id]);

  // Reset scroll flags when check ID changes
  useEffect(() => {
    hasScrolledToClarification.current = false;
    hasScrolledToBatch.current = false;
    lastClarificationId.current = null;
    lastBatchId.current = null;
  }, [id]);

  // Expand specific clarification after clarifications are loaded
  useEffect(() => {
    const clarificationIdParam = searchParams.get('clarificationId');
    const clarifications = check?.clarifications || [];
    if (clarificationIdParam && clarifications.length > 0 && activeTab === 'clarifications') {
      const clarification = clarifications.find(c => c.clarificationId === clarificationIdParam);
      if (clarification) {
        // Only scroll if this is a new clarification ID or we haven't scrolled yet
        const isNewClarification = lastClarificationId.current !== clarificationIdParam;
        if (isNewClarification || !hasScrolledToClarification.current) {
          lastClarificationId.current = clarificationIdParam;
          hasScrolledToClarification.current = false; // Reset to allow scroll
          
          // Scroll to the clarification card after a short delay to ensure it's rendered
          setTimeout(() => {
            const element = document.querySelector(`[data-clarification-id="${clarificationIdParam}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight the clarification briefly
              element.style.backgroundColor = '#fef3c7';
              setTimeout(() => {
                element.style.backgroundColor = '';
              }, 2000);
              hasScrolledToClarification.current = true;
            }
          }, 300);
        }
      }
    } else if (!clarificationIdParam) {
      // Reset when clarificationId is removed from URL
      hasScrolledToClarification.current = false;
      lastClarificationId.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check?.clarifications, searchParams, activeTab]);

  // Highlight specific batch after batches are loaded
  useEffect(() => {
    const batchIdParam = searchParams.get('batchId');
    if (batchIdParam && check?.batches && check.batches.length > 0 && activeTab === 'batches') {
      const batch = check.batches.find(b => b.batchId === batchIdParam);
      if (batch) {
        // Only scroll if this is a new batch ID or we haven't scrolled yet
        const isNewBatch = lastBatchId.current !== batchIdParam;
        if (isNewBatch || !hasScrolledToBatch.current) {
          lastBatchId.current = batchIdParam;
          hasScrolledToBatch.current = false; // Reset to allow scroll
          
          // Scroll to the batch row after a short delay to ensure it's rendered
          setTimeout(() => {
            const element = document.querySelector(`[data-batch-id="${batchIdParam}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight the batch row briefly
              element.style.backgroundColor = '#fef3c7';
              setTimeout(() => {
                element.style.backgroundColor = '';
              }, 2000);
              hasScrolledToBatch.current = true;
            }
          }, 300);
        }
      }
    } else if (!batchIdParam) {
      // Reset when batchId is removed from URL
      hasScrolledToBatch.current = false;
      lastBatchId.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check?.batches, searchParams, activeTab]);

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
        againstCheckAdditional: data.againstCheckAdditional || '',
        correctionBatchDate: data.correctionBatchDate || '',
        edmNumber: data.edmNumber || '',
        transferInFrom: data.transferInFrom || '',
        transferInAmount: data.transferInAmount || 0,
        transferOutFrom: data.transferOutFrom || '',
        transferOutAmount: data.transferOutAmount || 0
      });
    } catch (err) {
      console.error('Error fetching check details:', err);
      setError('Failed to load check details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Removed: Users are now loaded from context on login, no need to fetch here
  // Removed: Clarifications are now included in check details, no need for separate API call

  const handleFormChange = (field, value) => {
    // Filter emojis from string inputs
    const filteredValue = typeof value === 'string' ? filterEmojis(value) : value;
    setFormData(prev => ({
      ...prev,
      [field]: filteredValue
    }));
  };

  // Generate a unique random hexadecimal number for batchRunNumber
  const generateUniqueRandomHex = () => {
    const existingBatches = check?.batches || [];
    const existingRunNumbers = existingBatches
      .map(b => b.batchRunNumber)
      .filter(runNum => runNum && runNum.trim());
    
    let randomHex;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop
    
    do {
      // Generate a random 8-character hexadecimal number
      randomHex = Array.from({ length: 8 }, () => 
        Math.floor(Math.random() * 16).toString(16)
      ).join('').toUpperCase();
      attempts++;
    } while (existingRunNumbers.includes(randomHex) && attempts < maxAttempts);
    
    return randomHex;
  };

  const handleBatchFormChange = (field, value) => {
    // Filter emojis from string inputs
    const filteredValue = typeof value === 'string' ? filterEmojis(value) : value;
    setBatchFormData(prev => {
      const newData = {
        ...prev,
        [field]: filteredValue
      };
      
      // If batchType is changed to MANUAL, clear batchRunNumber
      if (field === 'batchType' && filteredValue === 'MANUAL') {
        newData.batchRunNumber = '';
      }
      
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
  
  // Validate batch number and run number uniqueness
  const validateBatchUniqueness = () => {
    const errors = {};
    const existingBatches = check?.batches || [];
    const currentBatchId = editingBatchId; // null when adding, batchId when editing
    
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
    
    // Check run number uniqueness (always required, auto-generated random hex)
    if (batchFormData.batchRunNumber && batchFormData.batchRunNumber.trim()) {
      const duplicateRun = existingBatches.find(
        b => b.batchRunNumber && 
        b.batchRunNumber.trim() === batchFormData.batchRunNumber.trim() && 
        b.batchId !== currentBatchId
      );
      if (duplicateRun) {
        errors.batchRunNumber = 'Run Number must be unique';
      }
    }
    
    setBatchValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Validate on form change
  useEffect(() => {
    if (batchFormData.batchNumber || batchFormData.batchRunNumber) {
      validateBatchUniqueness();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchFormData.batchNumber, batchFormData.batchRunNumber, editingBatchId]);

  const handleSave = async () => {
    try {
      // Convert null values to 0 for numeric fields
      const dataToSave = {
        ...formData,
        interestAmount: formData.interestAmount === null || formData.interestAmount === undefined ? 0 : formData.interestAmount,
        nonArAmount: formData.nonArAmount === null || formData.nonArAmount === undefined ? 0 : formData.nonArAmount,
        medicalRecordsFee: formData.medicalRecordsFee === null || formData.medicalRecordsFee === undefined ? 0 : formData.medicalRecordsFee,
        correctionsAmount: formData.correctionsAmount === null || formData.correctionsAmount === undefined ? 0 : formData.correctionsAmount,
        transferInAmount: formData.transferInAmount === null || formData.transferInAmount === undefined ? 0 : formData.transferInAmount,
        transferOutAmount: formData.transferOutAmount === null || formData.transferOutAmount === undefined ? 0 : formData.transferOutAmount,
      };
      await api.updateCheck(id, dataToSave);
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
    // Validate uniqueness
    if (!validateBatchUniqueness()) {
      // Show notification for validation errors
      const errorMessages = [];
      if (batchValidationErrors.batchNumber) {
        errorMessages.push(batchValidationErrors.batchNumber);
      }
      if (batchValidationErrors.batchRunNumber) {
        errorMessages.push(batchValidationErrors.batchRunNumber);
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
        // USDateInput returns YYYY-MM-DD format, but parseDateUS handles both formats
        batchDate: batchFormData.batchDate ? (parseDateUS(batchFormData.batchDate) || batchFormData.batchDate) : '',
        batchAmount: parseFloat(batchFormData.batchAmount) || 0,
        // batchRunNumber is empty for MANUAL type, otherwise use provided value
        batchRunNumber: batchFormData.batchType === 'MANUAL' ? '' : (batchFormData.batchRunNumber || '')
      };
      await api.createBatch(id, batchData);
      await fetchCheckDetails();
      setIsAddingBatch(false);
      setBatchValidationErrors({});
      setBatchFormData({
        batchRunNumber: '',
        batchNumber: '',
        batchDate: '',
        batchType: 'MANUAL',
        batchAmount: '',
        batchNotes: '',
        invoiceNumber: ''
      });
    } catch (err) {
      console.error('Error creating batch:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to create batch. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEditBatch = (batch) => {
    setEditingBatchId(batch.batchId);
    const batchType = batch.batchType || 'MANUAL';
    setBatchFormData({
      // Clear batchRunNumber if batchType is MANUAL
      batchRunNumber: batchType === 'MANUAL' ? '' : (batch.batchRunNumber || ''),
      batchNumber: batch.batchNumber || '',
      // Keep date in YYYY-MM-DD format for USDateInput (it will display as MM/DD/YYYY)
      batchDate: batch.batchDate || '',
      batchType: batchType,
      batchAmount: batch.batchAmount || '',
      batchNotes: batch.batchNotes || '',
      invoiceNumber: batch.invoiceNumber || ''
    });
    setBatchValidationErrors({});
  };

  const handleUpdateBatch = async () => {
    // Validate uniqueness
    if (!validateBatchUniqueness()) {
      // Show notification for validation errors
      const errorMessages = [];
      if (batchValidationErrors.batchNumber) {
        errorMessages.push(batchValidationErrors.batchNumber);
      }
      if (batchValidationErrors.batchRunNumber) {
        errorMessages.push(batchValidationErrors.batchRunNumber);
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
        // USDateInput returns YYYY-MM-DD format, but parseDateUS handles both formats
        batchDate: batchFormData.batchDate ? (parseDateUS(batchFormData.batchDate) || batchFormData.batchDate) : '',
        batchAmount: parseFloat(batchFormData.batchAmount) || 0,
        // batchRunNumber is empty for MANUAL type, otherwise use provided value
        batchRunNumber: batchFormData.batchType === 'MANUAL' ? '' : (batchFormData.batchRunNumber || '')
      };
      await api.updateBatch(id, editingBatchId, batchData);
      await fetchCheckDetails();
      setEditingBatchId(null);
      setBatchValidationErrors({});
      setBatchFormData({
        batchRunNumber: '',
        batchNumber: '',
        batchDate: '',
        batchType: 'MANUAL',
        batchAmount: '',
        batchNotes: '',
        invoiceNumber: ''
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
      await api.archiveBatch(id, archiveBatchId, !archiveBatchIsArchived);
      await fetchCheckDetails();
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
      setShowDeleteWarning(true);
      return;
    }
    
    // Show delete confirmation modal
    setDeleteConfirmBatchId(batchId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmBatchId) return;
    
    try {
      await api.deleteBatch(id, deleteConfirmBatchId);
      await fetchCheckDetails();
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

  const handleDeleteWarningClose = () => {
    setShowDeleteWarning(false);
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
    if (!check?.batches || check.batches.length === 0) return [];
    
    const batches = [...check.batches];
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

  const handleCancelBatch = () => {
    setIsAddingBatch(false);
    setEditingBatchId(null);
      setBatchFormData({
        batchRunNumber: '',
        batchNumber: '',
        batchDate: '',
        batchType: 'MANUAL',
        batchAmount: '',
        batchNotes: '',
        invoiceNumber: ''
      });
      setBatchValidationErrors({});
  };

  // Clarification handlers
  const handleClarificationFormChange = (field, value) => {
    // Filter emojis from string inputs
    const filteredValue = typeof value === 'string' ? filterEmojis(value) : value;
    
    // Auto-select opposite for assignee/reporter
    if (field === 'assignee' && value) {
      const oppositeReporter = value === 'ON-SHORE' ? 'EBOTICS' : 'ON-SHORE';
      setClarificationFormData(prev => ({
        ...prev,
        [field]: filteredValue,
        reportee: oppositeReporter // Auto-select opposite
      }));
    } else if (field === 'reportee' && value) {
      const oppositeAssignee = value === 'ON-SHORE' ? 'EBOTICS' : 'ON-SHORE';
      setClarificationFormData(prev => ({
        ...prev,
        [field]: filteredValue,
        assignee: oppositeAssignee // Auto-select opposite
      }));
    } else {
      setClarificationFormData(prev => ({
        ...prev,
        [field]: filteredValue
      }));
    }
  };

  const toggleCommentsExpanded = (clarificationId) => {
    setExpandedCommentsClarificationId(prev => 
      prev === clarificationId ? null : clarificationId
    );
  };

  const handleAddClarification = async () => {
    try {
      await api.createClarification(id, clarificationFormData);
      await fetchCheckDetails(); // Refresh check data to get updated clarifications
      setIsAddingClarification(false);
      setClarificationFormData({
        clarificationType: '',
        details: '',
        assignee: 'ON-SHORE', // Default assignee
        reportee: 'EBOTICS', // Default reportee
        assigneeId: '', // Not required for default assignment
        reporterId: '', // Not required for default assignment
        status: 'OPEN'
      });
    } catch (err) {
      console.error('Error creating clarification:', err);
      alert('Failed to create clarification. Please try again.');
    }
  };

  const handleEditClarification = (clarification) => {
    setEditingClarificationId(clarification.clarificationId);
    // Automatically expand comments when editing
    setExpandedCommentsClarificationId(clarification.clarificationId);
    setClarificationFormData({
      clarificationType: clarification.clarificationType || '',
      details: clarification.details || '',
      assignee: clarification.assignee || 'ON-SHORE', // Default to ON-SHORE if not set
      reportee: clarification.reportee || 'EBOTICS', // Default to EBOTICS if not set
      assigneeId: clarification.assigneeId || '',
      reporterId: clarification.reporterId || '',
      status: clarification.status || 'OPEN'
    });
  };

  const handleUpdateClarification = async () => {
    try {
      await api.updateClarification(id, editingClarificationId, clarificationFormData);
      await fetchCheckDetails(); // Refresh check data to get updated clarifications
      const previousClarificationId = editingClarificationId;
      setEditingClarificationId(null);
      // Keep comments expanded after update
      setExpandedCommentsClarificationId(previousClarificationId);
      setClarificationFormData({
        clarificationType: '',
        details: '',
        assignee: 'ON-SHORE', // Default assignee
        reportee: 'EBOTICS', // Default reportee
        assigneeId: '', // Not required for default assignment
        reporterId: '', // Not required for default assignment
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
    // Collapse comments when canceling edit
    setExpandedCommentsClarificationId(null);
    setClarificationFormData({
      clarificationType: '',
      details: '',
      assignee: 'ON-SHORE', // Default assignee
      reportee: 'EBOTICS', // Default reportee
      assigneeId: '', // Not required for default assignment
      reporterId: '', // Not required for default assignment
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
      await fetchCheckDetails(); // Refresh check data to get updated clarifications
      setCommentText(prev => ({
        ...prev,
        [clarificationId]: ''
      }));
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment. Please try again.');
    }
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
          <button 
            className="btn-primary" 
            onClick={() => {
              const source = searchParams.get('source');
              if (source === 'clarifications') {
                navigate('/clarifications');
              } else if (source === 'unknown') {
                navigate('/unknown');
              } else {
                navigate('/checks');
              }
            }}
          >
            Back to {searchParams.get('source') === 'clarifications' ? 'Clarifications' : searchParams.get('source') === 'unknown' ? 'Unknown' : 'Checks'}
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
            <button 
              className="back-btn" 
              onClick={() => {
                const source = searchParams.get('source');
                if (source === 'clarifications') {
                  navigate('/clarifications');
                } else if (source === 'unknown') {
                  navigate('/unknown');
                } else {
                  navigate('/checks');
                }
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <div className="title-row">
              <h1 className="page-title">
                {check.checkNumber || 'Check Details'}
              </h1>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="navigation-arrows">
                <button 
                  className="nav-arrow-btn"
                  onClick={handlePreviousCheck}
                  disabled={navigationLoading || (currentIndex <= 0 && checkIds.length > 0)}
                  title="Previous check"
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
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
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <button 
                className="activity-btn" 
                onClick={() => setShowActivityDrawer(true)}
                title="View Activity History"
              >
                <MdOutlineHistory size={16} />
                <span>Activity</span>
              </button>
            </div>
            {/* Mark as Known Button - Show only if coming from unknown page and check has batch with invoiceNumber */}
            {searchParams.get('source') === 'unknown' && check?.batches && check.batches.some(batch => batch.invoiceNumber) && (
              <button 
                className="btn-primary" 
                onClick={async () => {
                  try {
                    await api.updateCheck(id, { unknown: false });
                    await fetchCheckDetails();
                    // Navigate back to unknown page
                    navigate('/unknown');
                  } catch (err) {
                    console.error('Error marking check as known:', err);
                    alert('Failed to mark check as known. Please try again.');
                  }
                }}
                style={{ width: 'auto' }}
              >
                Mark as Known
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Combined Check & Posting Summary Card */}
      <div className="financial-summary-card merged">
        <div className="financial-sections">
          <div className="financial-section">
            <h3 className="section-title">Check Summary</h3>
            <div className="financial-grid compact">
              <div className="financial-item">
                <span className="financial-label">DOD</span>
                <span className="financial-value">
                  {check.depositDate ? formatDateUS(check.depositDate) : 'N/A'}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Received Date</span>
                <span className="financial-value">
                  {check.receivedDate ? formatDateUS(check.receivedDate) : 'N/A'}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Complete Date</span>
                <span className="financial-value">
                  {check.completedDate ? formatDateUS(check.completedDate) : 'N/A'}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Updated Date</span>
                <span className="financial-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {check.updatedAt ? (
                    <>
                      {formatDateUS(check.updatedAt.split('T')[0])}
                      <Tooltip
                        text={check.updatedBy ? `${getUserName(check.updatedBy)} - ${formatDateTimeTooltip(check.updatedAt)}` : formatDateTimeTooltip(check.updatedAt)}
                        position="top"
                      >
                        <Info
                          size={16}
                          style={{
                            color: '#374151',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#0d9488'}
                          onMouseLeave={(e) => e.target.style.color = '#374151'}
                        />
                      </Tooltip>
                    </>
                  ) : 'N/A'}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-label">TAT by Received</span>
                <span className="financial-value">
                  {typeof check.turnaroundByReceivedDays === 'number'
                    ? `${check.turnaroundByReceivedDays} day${check.turnaroundByReceivedDays === 1 ? '' : 's'}`
                    : 'N/A'}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-label">TAT by Deposit</span>
                <span className="financial-value">
                  {typeof check.turnaroundByDepositDays === 'number'
                    ? `${check.turnaroundByDepositDays} day${check.turnaroundByDepositDays === 1 ? '' : 's'}`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="financial-section posting-section">
            <h3 className="section-title">Posting Summary</h3>
            <div className="financial-grid posting-grid">
              <div className="financial-item">
                <span className="financial-label">Total Amount</span>
                <span className="financial-value primary">
                  {formatCurrency(check?.totalAmount || 0)}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Remaining Amount</span>
                <span className="financial-value">
                  {formatCurrency(check?.remainingAmount || 0)}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Posted Amount</span>
                <span className="financial-value success">
                  {formatCurrency(check?.postedAmount || 0)}
                </span>
              </div>
              <div className="financial-item">
                <span className="financial-label">Other Amount</span>
                <span className="financial-value">
                  {formatCurrency(check?.otherAmount || 0)}
                </span>
              </div>
            </div>
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
                <h3 className="card-title">Check Details</h3>
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
                  <label>Check Type</label>
                  <SearchableDropdown
                    options={[
                      { value: 'EFT', label: 'EFT' },
                      { value: 'ERA', label: 'ERA' },
                      { value: 'DIT/DRL', label: 'DIT/DRL' },
                      { value: 'NON_AR', label: 'NON_AR' },
                      { value: 'REFUND', label: 'REFUND' },
                      { value: 'LOCK_BOX', label: 'LOCK_BOX' },
                      { value: 'DEBIT', label: 'DEBIT' },
                      { value: 'FEE', label: 'FEE' },
                      { value: 'RBO', label: 'RBO' }
                    ]}
                    value={formData.checkType || ''}
                    onChange={(val) => handleFormChange('checkType', val)}
                    placeholder="Select Type"
                    disabled={!isEditMode}
                    maxVisibleItems={5}
                  />
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
                  <SearchableDropdown
                    options={users.map(user => ({
                      value: user.userId || user.id,
                      label: user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email || 'Unknown User'
                    }))}
                    value={formData.assigneeId || ''}
                    onChange={(val) => handleFormChange('assigneeId', val)}
                    placeholder="Select Assignee"
                    disabled={!isEditMode}
                    maxVisibleItems={5}
                  />
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
              <h3 className="card-title">Processing & Status Overview</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Assignee</label>
                  <input 
                    type="text" 
                    value={check.assigneeId ? getUserName(check.assigneeId) : 'N/A'}
                    disabled
                    title={check.assigneeId ? `ID: ${check.assigneeId}` : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Reporter</label>
                  <input 
                    type="text" 
                    value={check.reporterId ? getUserName(check.reporterId) : 'N/A'}
                    disabled
                    title={check.reporterId ? `ID: ${check.reporterId}` : ''}
                  />
                </div>
              </div>
            </div>

            <div className="details-card">
              <h3 className="card-title">Additional Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Legacy Notes</label>
                  <textarea 
                    value={formData.legacyNotes || ''}
                    onChange={(e) => handleFormChange('legacyNotes', e.target.value)}
                    disabled={!isEditMode}
                    rows="1"
                  />
                </div>
                <div className="form-group">
                  <label>Against Check Additional</label>
                  <textarea 
                    value={formData.againstCheckAdditional || ''}
                    onChange={(e) => handleFormChange('againstCheckAdditional', e.target.value)}
                    disabled={!isEditMode}
                    rows="1"
                  />
                </div>
              </div>
            </div>

            {/* Posting Details */}
            <div className="details-card">
              <h3 className="card-title">Posting Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Interest Amount</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.interestAmount !== undefined 
                          ? (formData.interestAmount === 0 || formData.interestAmount === null ? '' : formData.interestAmount)
                          : (check?.interestAmount && check.interestAmount !== 0 ? check.interestAmount : '')
                      } 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('interestAmount', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('interestAmount', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(check?.interestAmount)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>Non-AR Amount</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.nonArAmount !== undefined 
                          ? (formData.nonArAmount === 0 || formData.nonArAmount === null ? '' : formData.nonArAmount)
                          : (check?.nonArAmount && check.nonArAmount !== 0 ? check.nonArAmount : '')
                      } 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('nonArAmount', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('nonArAmount', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(check?.nonArAmount)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>Medical Records Fee</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.medicalRecordsFee !== undefined 
                          ? (formData.medicalRecordsFee === 0 || formData.medicalRecordsFee === null ? '' : formData.medicalRecordsFee)
                          : (check?.medicalRecordsFee && check.medicalRecordsFee !== 0 ? check.medicalRecordsFee : '')
                      } 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('medicalRecordsFee', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('medicalRecordsFee', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(check?.medicalRecordsFee)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>Corrections Amount</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.correctionsAmount !== undefined 
                          ? (formData.correctionsAmount === 0 || formData.correctionsAmount === null ? '' : formData.correctionsAmount)
                          : (check?.correctionsAmount && check.correctionsAmount !== 0 ? check.correctionsAmount : '')
                      } 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('correctionsAmount', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('correctionsAmount', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(check?.correctionsAmount)} disabled />
                  )}
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div className="details-card">
              <h3 className="card-title">Additional Fields</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Correction Batch Date</label>
                  <USDateInput
                    name="correctionBatchDate"
                    value={formData.correctionBatchDate || ''}
                    onChange={(e) => handleFormChange('correctionBatchDate', e.target.value)}
                    placeholder="MM/DD/YYYY"
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>EDM Number</label>
                  <input 
                    type="text" 
                    value={formData.edmNumber || ''}
                    onChange={(e) => handleFormChange('edmNumber', e.target.value)}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="form-group">
                  <label>Transfer In From</label>
                  {isEditMode ? (
                    <SearchableDropdown
                      options={practices.map(p => ({ value: p.code, label: `${p.code} - ${p.name}` }))}
                      value={formData.transferInFrom || ''}
                      onChange={(val) => handleFormChange('transferInFrom', val)}
                      placeholder="Select practice..."
                      maxVisibleItems={5}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={check?.transferInFrom ? (practices.find(p => p.code === check.transferInFrom)?.name || check.transferInFrom) : 'N/A'}
                      disabled
                    />
                  )}
                </div>
                <div className="form-group">
                  <label>Transfer In Amount</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.transferInAmount !== undefined && formData.transferInAmount !== null
                          ? (formData.transferInAmount === 0 ? '' : formData.transferInAmount)
                          : (check?.transferInAmount && check.transferInAmount !== 0 ? check.transferInAmount : '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('transferInAmount', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('transferInAmount', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(check?.transferInAmount || 0)} disabled />
                  )}
                </div>
                <div className="form-group">
                  <label>Transfer Out From</label>
                  {isEditMode ? (
                    <SearchableDropdown
                      options={practices.map(p => ({ value: p.code, label: `${p.code} - ${p.name}` }))}
                      value={formData.transferOutFrom || ''}
                      onChange={(val) => handleFormChange('transferOutFrom', val)}
                      placeholder="Select practice..."
                      maxVisibleItems={5}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={check?.transferOutFrom ? (practices.find(p => p.code === check.transferOutFrom)?.name || check.transferOutFrom) : 'N/A'}
                      disabled
                    />
                  )}
                </div>
                <div className="form-group">
                  <label>Transfer Out Amount</label>
                  {isEditMode ? (
                    <input 
                      type="number" 
                      step="0.01"
                      value={
                        formData.transferOutAmount !== undefined && formData.transferOutAmount !== null
                          ? (formData.transferOutAmount === 0 ? '' : formData.transferOutAmount)
                          : (check?.transferOutAmount && check.transferOutAmount !== 0 ? check.transferOutAmount : '')
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          handleFormChange('transferOutAmount', null);
                        } else {
                          const numVal = parseFloat(val);
                          handleFormChange('transferOutAmount', isNaN(numVal) ? null : numVal);
                        }
                      }}
                      placeholder="0"
                    />
                  ) : (
                    <input type="text" value={formatCurrency(check?.transferOutAmount || 0)} disabled />
                  )}
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
                  <button className="btn-secondary" onClick={() => {
                    const randomHex = generateUniqueRandomHex();
                    setBatchFormData({
                      batchRunNumber: randomHex,
                      batchNumber: '',
                      batchDate: '',
                      batchType: 'MANUAL',
                      batchAmount: '',
                      batchNotes: '',
                      invoiceNumber: ''
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
                      <label>Batch Type</label>
                      <select
                        value={batchFormData.batchType}
                        onChange={(e) => handleBatchFormChange('batchType', e.target.value)}
                      >
                        <option value="MANUAL">MANUAL</option>
                        <option value="AUTO">AUTO</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Batch Run Number</label>
                      <input 
                        type="text" 
                        value={batchFormData.batchRunNumber}
                        onChange={(e) => handleBatchFormChange('batchRunNumber', e.target.value)}
                        disabled={batchFormData.batchType === 'MANUAL'}
                        readOnly={batchFormData.batchType === 'MANUAL'}
                        style={batchFormData.batchType === 'MANUAL' ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                      />
                      {batchValidationErrors.batchRunNumber && (
                        <span className="error-text" style={{ color: '#dc2626', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                          {batchValidationErrors.batchRunNumber}
                        </span>
                      )}
                    </div>
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
                      <label>Batch Amount</label>
                      <input 
                        type="number" 
                        value={batchFormData.batchAmount}
                        onChange={(e) => handleBatchFormChange('batchAmount', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Invoice Number</label>
                      <input 
                        type="text" 
                        value={batchFormData.invoiceNumber}
                        onChange={(e) => handleBatchFormChange('invoiceNumber', e.target.value)}
                        disabled={searchParams.get('source') !== 'unknown'}
                        readOnly={searchParams.get('source') !== 'unknown'}
                        style={searchParams.get('source') !== 'unknown' ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
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
                      <th className="sortable" onClick={() => handleSortBatches('batchType')}>
                        Type {getSortArrow('batchType')}
                      </th>
                      <th className="sortable" onClick={() => handleSortBatches('batchRunNumber')}>
                        Run Number {getSortArrow('batchRunNumber')}
                      </th>
                      <th className="sortable" onClick={() => handleSortBatches('batchNumber')}>
                        Batch Number {getSortArrow('batchNumber')}
                      </th>
                      <th className="sortable" onClick={() => handleSortBatches('batchDate')}>
                        Date {getSortArrow('batchDate')}
                      </th>
                      <th className="sortable" onClick={() => handleSortBatches('batchAmount')}>
                        Amount {getSortArrow('batchAmount')}
                      </th>
                      <th className="sortable" onClick={() => handleSortBatches('invoiceNumber')}>
                        Invoice Number {getSortArrow('invoiceNumber')}
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
                    {check.batches && check.batches.length > 0 ? (
                      getSortedBatches().map((batch) => (
                        editingBatchId === batch.batchId ? (
                          <tr key={batch.batchId} className="editing-row">
                            <td>
                              <select
                                value={batchFormData.batchType}
                                onChange={(e) => handleBatchFormChange('batchType', e.target.value)}
                                className="inline-input"
                              >
                                <option value="MANUAL">MANUAL</option>
                                <option value="AUTO">AUTO</option>
                              </select>
                            </td>
                            <td>
                              <input 
                                type="text" 
                                value={batchFormData.batchRunNumber}
                                onChange={(e) => handleBatchFormChange('batchRunNumber', e.target.value)}
                                className="inline-input"
                                disabled={batchFormData.batchType === 'MANUAL'}
                                readOnly={batchFormData.batchType === 'MANUAL'}
                                style={batchFormData.batchType === 'MANUAL' ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
                              />
                              {batchValidationErrors.batchRunNumber && (
                                <span className="error-text" style={{ color: '#dc2626', fontSize: '11px', display: 'block', marginTop: '2px' }}>
                                  {batchValidationErrors.batchRunNumber}
                                </span>
                              )}
                            </td>
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
                                value={batchFormData.invoiceNumber}
                                onChange={(e) => handleBatchFormChange('invoiceNumber', e.target.value)}
                                className="inline-input"
                                disabled={searchParams.get('source') !== 'unknown'}
                                readOnly={searchParams.get('source') !== 'unknown'}
                                style={searchParams.get('source') !== 'unknown' ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
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
                            <td>{batch.batchType || 'N/A'}</td>
                            <td>{batch.batchRunNumber || 'N/A'}</td>
                            <td>{batch.batchNumber || 'N/A'}</td>
                            <td>{batch.batchDate ? formatDateUS(batch.batchDate) : 'N/A'}</td>
                            <td>{formatCurrency(batch.batchAmount)}</td>
                            <td>{batch.invoiceNumber || 'N/A'}</td>
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
                        <td colSpan={10} className="empty-state">No batches found</td>
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
                        value={clarificationFormData.assignee || 'ON-SHORE'}
                        onChange={(e) => handleClarificationFormChange('assignee', e.target.value)}
                      >
                        <option value="ON-SHORE">ON-SHORE</option>
                        <option value="EBOTICS">EBOTICS</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Reporter</label>
                      <select 
                        value={clarificationFormData.reportee || 'EBOTICS'}
                        onChange={(e) => handleClarificationFormChange('reportee', e.target.value)}
                      >
                        <option value="ON-SHORE">ON-SHORE</option>
                        <option value="EBOTICS">EBOTICS</option>
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

              {/* Clarifications List */}
              {check?.clarifications && check.clarifications.length > 0 ? (
                <div className="clarifications-list-redesigned">
                  {check.clarifications.map((clarification) => (
                    <div 
                      key={clarification.clarificationId}
                      className={`clarification-item ${editingClarificationId === clarification.clarificationId ? 'editing' : ''}`}
                      data-clarification-id={clarification.clarificationId}
                    >
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
                                value={clarificationFormData.assignee || 'ON-SHORE'}
                                onChange={(e) => handleClarificationFormChange('assignee', e.target.value)}
                              >
                                <option value="ON-SHORE">ON-SHORE</option>
                                <option value="EBOTICS">EBOTICS</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Reporter</label>
                              <select 
                                value={clarificationFormData.reportee || 'EBOTICS'}
                                onChange={(e) => handleClarificationFormChange('reportee', e.target.value)}
                              >
                                <option value="ON-SHORE">ON-SHORE</option>
                                <option value="EBOTICS">EBOTICS</option>
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
                          {/* Row 1: Type, Status, Assignee, Reporter, Opened, Actions */}
                          <div className="clarification-row-1">
                            <div className="clarification-main-info">
                              <span className="clarification-type">{clarification.clarificationType || 'N/A'}</span>
                              <span className={`clarification-status ${clarification.status?.toLowerCase()}`}>
                                {clarification.status || 'OPEN'}
                              </span>
                              <span className="clarification-field-inline">
                                <span className="field-label-inline">Assignee:</span>
                                <span className="field-value-inline">{clarification.assignee || 'N/A'}</span>
                              </span>
                              <span className="clarification-field-inline">
                                <span className="field-label-inline">Reporter:</span>
                                <span className="field-value-inline">{clarification.reportee || 'N/A'}</span>
                              </span>
                              <span className="clarification-field-inline">
                                <span className="field-label-inline">Opened:</span>
                                <span className="field-value-inline">{clarification.openedAt ? formatDateUS(clarification.openedAt.split('T')[0]) : 'N/A'}</span>
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

                          {/* Row 2: Details */}
                          <div className="clarification-row-2">
                            <div className="clarification-details-full">
                              <span className="field-label-inline">Details:</span>
                              <span className="field-value-inline">{clarification.details || 'No details provided'}</span>
                            </div>
                          </div>

                          {/* Row 3: Comments Section (minimized by default) */}
                          <div className="clarification-row-3">
                            <button 
                              className="comments-toggle-btn-below"
                              onClick={() => toggleCommentsExpanded(clarification.clarificationId)}
                              title={expandedCommentsClarificationId === clarification.clarificationId ? 'Hide comments' : 'Show comments'}
                            >
                              <span className="comments-label">Comments</span>
                              <span className="comments-count">({clarification.comments?.length || 0})</span>
                              <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 20 20" 
                                fill="none"
                                className={`comments-arrow ${expandedCommentsClarificationId === clarification.clarificationId ? 'expanded' : ''}`}
                              >
                                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                            
                            {expandedCommentsClarificationId === clarification.clarificationId && (
                              <div className="comments-section-expanded">
                                <div className="comments-list">
                                  {clarification.comments && clarification.comments.length > 0 ? (
                                    clarification.comments.map((comment) => (
                                      <div key={comment.commentId} className="comment-item">
                                        <div className="comment-header">
                                          <span className="comment-author">{comment.userDisplayName || 'Unknown'}</span>
                                          <span className="comment-date">{formatDateTime(comment.commentedAt)}</span>
                                        </div>
                                        <div className="comment-text">{comment.comment}</div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="comments-empty-state">No comments yet</div>
                                  )}
                                </div>
                                
                                {/* Add Comment Form */}
                                <div className="add-comment-form">
                                  <textarea 
                                    placeholder="Add a comment..."
                                    value={commentText[clarification.clarificationId] || ''}
                                    onChange={(e) => {
                                      const filteredValue = filterEmojis(e.target.value);
                                      setCommentText(prev => ({
                                        ...prev,
                                        [clarification.clarificationId]: filteredValue
                                      }));
                                    }}
                                    rows="3"
                                  />
                                  <button 
                                    className="btn-secondary"
                                    onClick={() => handleAddComment(clarification.clarificationId)}
                                  >
                                    Add Comment
                                  </button>
                                </div>
                              </div>
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

      {/* Delete Warning Modal - Non-Archived Batch */}
      {showDeleteWarning && (
        <div 
          className="modal-overlay"
          onClick={handleDeleteWarningClose}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title-warning">
              Cannot Delete Batch
            </h3>
            <p className="modal-message">
              Only archived batches can be deleted. Please archive the batch first before deleting.
            </p>
            <div className="modal-actions-center">
              <button 
                className="btn-ok" 
                onClick={handleDeleteWarningClose}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Archived Batch */}
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
              Are you sure you want to delete this archived batch? This action cannot be undone.
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

export default CheckDetails;
