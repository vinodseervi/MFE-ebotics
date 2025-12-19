import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useUsers } from '../context/UsersContext';
import SearchableDropdown from '../components/SearchableDropdown';
import Tooltip from '../components/Tooltip';
import { formatDateUS } from '../utils/dateUtils';
import * as XLSX from 'xlsx';
import './CheckUpload.css';

const CheckUpload = () => {
  const { users } = useUsers();
  
  // Dashboard state
  const [dashboardJobs, setDashboardJobs] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [jobName, setJobName] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [columnValidationError, setColumnValidationError] = useState(null);
  
  // Checks state
  const [checks, setChecks] = useState([]);
  const [loadingChecks, setLoadingChecks] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Edit state
  const [editingCheck, setEditingCheck] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [localEdits, setLocalEdits] = useState({}); // Store local edits by stagingCheckId
  const [expandedComments, setExpandedComments] = useState(new Set()); // Track expanded comment rows
  
  // Job update state
  const [revalidating, setRevalidating] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  
  // Delete state
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [messageType, setMessageType] = useState('success'); // 'success' or 'warning' (for invalid status)

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch dashboard jobs
  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setError(null);
    try {
      const jobs = await api.getBulkImportDashboard();
      setDashboardJobs(jobs || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      // Extract error message from API response
      const errorMessage = err.data?.message || err.message || 'Failed to load jobs. Please try again.';
      setError(errorMessage);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // Fetch job details and checks
  const fetchJobChecks = useCallback(async (jobId, page = 0) => {
    setLoadingChecks(true);
    setError(null);
    try {
      // Fetch job details
      const jobDetails = await api.getBulkImportJob(jobId);
      setSelectedJob(jobDetails);
      
      // Fetch checks
      const response = await api.getBulkImportJobChecks(jobId, page, 50);
      setChecks(response.items || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching job checks:', err);
      // Extract error message from API response
      const errorMessage = err.data?.message || err.message || 'Failed to load checks. Please try again.';
      setError(errorMessage);
    } finally {
      setLoadingChecks(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // File upload handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || 
          droppedFile.type === 'application/vnd.ms-excel' ||
          droppedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          droppedFile.name.endsWith('.csv') || 
          droppedFile.name.endsWith('.xlsx')) {
        
        setColumnValidationError(null);
        setError(null);
        
        // Validate columns
        try {
          await validateFileColumns(droppedFile);
          setFile(droppedFile);
        } catch (validationErr) {
          setColumnValidationError(validationErr.message);
          setFile(null);
        }
      } else {
        setError('Please select a CSV or XLSX file');
        setFile(null);
      }
    }
  };

  // Required columns for validation
  const requiredColumns = [
    'Check Number',
    'Date of Deposit',
    'Check Amount',
    'Payer',
    'Location',
    'Practice'
  ];

  // Validate file columns
  const validateFileColumns = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          let rows = [];
          
          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const lines = data.split('\n');
            if (lines.length > 0) {
              const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
              rows = headers;
            }
          } else if (file.name.endsWith('.xlsx')) {
            // Parse XLSX
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (jsonData.length > 0) {
              rows = jsonData[0];
            }
          }
          
          // Normalize column names (case-insensitive, trim spaces)
          const normalizedRows = rows.map(col => col.trim());
          const normalizedRequired = requiredColumns.map(col => col.trim().toLowerCase());
          
          // Check for missing columns
          const missingColumns = requiredColumns.filter(reqCol => {
            const normalizedReq = reqCol.trim().toLowerCase();
            return !normalizedRows.some(col => col.trim().toLowerCase() === normalizedReq);
          });
          
          if (missingColumns.length > 0) {
            reject({
              message: `Missing required columns: ${missingColumns.join(', ')}`,
              missingColumns: missingColumns
            });
          } else {
            resolve({ valid: true, columns: rows });
          }
        } catch (err) {
          reject({ message: 'Error reading file: ' + err.message });
        }
      };
      
      reader.onerror = () => {
        reject({ message: 'Error reading file' });
      };
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleFileInput = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || 
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          selectedFile.name.endsWith('.csv') || 
          selectedFile.name.endsWith('.xlsx')) {
        
        setColumnValidationError(null);
        setError(null);
        
        // Validate columns
        try {
          await validateFileColumns(selectedFile);
          setFile(selectedFile);
        } catch (validationErr) {
          setColumnValidationError(validationErr.message);
          setFile(null);
          // Reset file input
          e.target.value = '';
        }
      } else {
        setError('Please select a CSV or XLSX file');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setSuccessMessage(null);
    setColumnValidationError(null);
    
    try {
      const response = await api.uploadBulkImportFile(file, jobName || null, assigneeId || null);
      setMessageType('success');
      setSuccessMessage('File uploaded successfully!');
      setFile(null);
      setJobName('');
      setAssigneeId('');
      setShowUploadModal(false);
      
      // Refresh dashboard and load the new job
      await fetchDashboard();
      if (response.job) {
        await fetchJobChecks(response.job.jobId, 0);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      // Extract error message from API response
      const errorMessage = err.data?.message || err.message || 'Failed to upload file. Please try again.';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Check if any blocking operation is in progress
  const isProcessing = uploading || revalidating || deleting;
  const processingMessage = uploading ? 'Processing and validating file...' : revalidating ? 'Re-validating checks...' : deleting ? 'Deleting job...' : '';

  const handleSelectJob = async (job) => {
    setSelectedJob(job);
    setLocalEdits({}); // Clear local edits when switching jobs
    await fetchJobChecks(job.jobId, 0);
  };

  const handlePreviousPage = () => {
    if (currentPage > 0 && selectedJob) {
      fetchJobChecks(selectedJob.jobId, currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && selectedJob) {
      fetchJobChecks(selectedJob.jobId, currentPage + 1);
    }
  };

  const handleEditCheck = (check) => {
    const checkId = check.stagingCheckId;
    // Merge original check data with any existing local edits
    const existingEdit = localEdits[checkId] || {};
    setEditingCheck(checkId);
    setEditFormData({
      location: existingEdit.location !== undefined ? existingEdit.location : (check.location || ''),
      practice: existingEdit.practice !== undefined ? existingEdit.practice : (check.practice || ''),
      checkNumber: existingEdit.checkNumber !== undefined ? existingEdit.checkNumber : (check.checkNumber || ''),
      dateOfDeposit: existingEdit.dateOfDeposit !== undefined ? existingEdit.dateOfDeposit : (check.dateOfDeposit || ''),
      checkAmount: existingEdit.checkAmount !== undefined ? existingEdit.checkAmount : (check.checkAmount || 0),
      exchangeDescription: existingEdit.exchangeDescription !== undefined ? existingEdit.exchangeDescription : (check.exchangeDescription || ''),
      bankStatementTrnDetails: existingEdit.bankStatementTrnDetails !== undefined ? existingEdit.bankStatementTrnDetails : (check.bankStatementTrnDetails || ''),
      comments: existingEdit.comments !== undefined ? existingEdit.comments : (check.comments || ''),
      type: existingEdit.type !== undefined ? existingEdit.type : (check.type || ''),
      payer: existingEdit.payer !== undefined ? existingEdit.payer : (check.payer || ''),
      assigneeId: existingEdit.assigneeId !== undefined ? existingEdit.assigneeId : (check.assigneeId || ''),
      reporterId: existingEdit.reporterId !== undefined ? existingEdit.reporterId : (check.reporterId || ''),
      validationErrors: check.validationErrors || []
    });
  };

  const handleCancelEdit = () => {
    setEditingCheck(null);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    if (!editingCheck || !selectedJob) return;
    
    setRevalidating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Find the original check to get stagingCheckId
      const originalCheck = checks.find(c => c.stagingCheckId === editingCheck);
      if (!originalCheck) {
        setError('Check not found');
        setRevalidating(false);
        return;
      }

      // Prepare the update payload according to API spec
      // Use edited values if provided, otherwise fall back to original check values
      const updateItem = {
        stagingCheckId: editingCheck,
        location: editFormData.location !== undefined ? editFormData.location : (originalCheck.location || ''),
        practice: editFormData.practice !== undefined ? editFormData.practice : (originalCheck.practice || ''),
        checkNumber: editFormData.checkNumber !== undefined ? editFormData.checkNumber : (originalCheck.checkNumber || ''),
        dateOfDeposit: editFormData.dateOfDeposit || originalCheck.dateOfDeposit || '',
        checkAmount: editFormData.checkAmount !== undefined ? editFormData.checkAmount : (originalCheck.checkAmount || 0),
        exchangeDescription: editFormData.exchangeDescription !== undefined ? editFormData.exchangeDescription : (originalCheck.exchangeDescription || ''),
        bankStatementTrnDetails: editFormData.bankStatementTrnDetails !== undefined ? editFormData.bankStatementTrnDetails : (originalCheck.bankStatementTrnDetails || ''),
        comments: editFormData.comments !== undefined ? editFormData.comments : (originalCheck.comments || ''),
        type: editFormData.type !== undefined ? editFormData.type : (originalCheck.type || ''),
        payer: editFormData.payer !== undefined ? editFormData.payer : (originalCheck.payer || ''),
        assigneeId: editFormData.assigneeId || originalCheck.assigneeId || '',
        reporterId: editFormData.reporterId || originalCheck.reporterId || ''
      };

      // Call bulk update API which also re-validates
      const updatedJob = await api.bulkUpdateStagedChecks(selectedJob.jobId, [updateItem]);
      setSelectedJob(updatedJob);
      
      // Clear local edits for this check
      setLocalEdits(prev => {
        const newEdits = { ...prev };
        delete newEdits[editingCheck];
        return newEdits;
      });
      
      // Refresh checks to get updated validation status
      const response = await api.getBulkImportJobChecks(selectedJob.jobId, currentPage, 50);
      const updatedChecks = response.items || [];
      
      // Find the updated check to check its validation status
      const updatedCheck = updatedChecks.find(c => c.stagingCheckId === editingCheck);
      
      // Update checks state
      setChecks(updatedChecks);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      
      // Show appropriate message based on validation status
      if (updatedCheck) {
        const isNowValid = updatedCheck.valid === true || updatedCheck.rowStatus === 'VALID';
        const wasValid = originalCheck.valid === true || originalCheck.rowStatus === 'VALID';
        
        if (isNowValid) {
          setMessageType('success');
          if (wasValid) {
            setSuccessMessage('Check updated and remains VALID.');
          } else {
            setSuccessMessage('Check updated and is now VALID! ✓');
          }
        } else {
          setMessageType('warning');
          if (wasValid) {
            setSuccessMessage('Check updated but is now INVALID. Please review the errors.');
          } else {
            setSuccessMessage('Check updated but remains INVALID. Please review the errors.');
          }
        }
      } else {
        setMessageType('success');
        setSuccessMessage('Check updated and re-validated successfully!');
      }
      
      setEditingCheck(null);
      setEditFormData({});
    } catch (err) {
      console.error('Error updating check:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to update check. Please try again.';
      setError(errorMessage);
    } finally {
      setRevalidating(false);
    }
  };

  const handleRevalidate = async () => {
    if (!selectedJob) return;
    
    setRevalidating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // First, apply all local edits to the server using bulk update
      const editEntries = Object.entries(localEdits);
      if (editEntries.length > 0) {
        // Prepare bulk update items
        const updateItems = editEntries.map(([stagingCheckId, editData]) => {
          const originalCheck = checks.find(c => c.stagingCheckId === stagingCheckId);
          return {
            stagingCheckId: stagingCheckId,
            location: editData.location !== undefined ? editData.location : (originalCheck?.location || ''),
            practice: editData.practice !== undefined ? editData.practice : (originalCheck?.practice || ''),
            checkNumber: editData.checkNumber !== undefined ? editData.checkNumber : (originalCheck?.checkNumber || ''),
            dateOfDeposit: editData.dateOfDeposit !== undefined ? editData.dateOfDeposit : (originalCheck?.dateOfDeposit || ''),
            checkAmount: editData.checkAmount !== undefined ? editData.checkAmount : (originalCheck?.checkAmount || 0),
            exchangeDescription: editData.exchangeDescription !== undefined ? editData.exchangeDescription : (originalCheck?.exchangeDescription || ''),
            bankStatementTrnDetails: editData.bankStatementTrnDetails !== undefined ? editData.bankStatementTrnDetails : (originalCheck?.bankStatementTrnDetails || ''),
            comments: editData.comments !== undefined ? editData.comments : (originalCheck?.comments || ''),
            type: editData.type !== undefined ? editData.type : (originalCheck?.type || ''),
            payer: editData.payer !== undefined ? editData.payer : (originalCheck?.payer || ''),
            assigneeId: editData.assigneeId !== undefined ? editData.assigneeId : (originalCheck?.assigneeId || ''),
            reporterId: editData.reporterId !== undefined ? editData.reporterId : (originalCheck?.reporterId || '')
          };
        });
        
        // Bulk update and re-validate in one call
        const updatedJob = await api.bulkUpdateStagedChecks(selectedJob.jobId, updateItems);
        setSelectedJob(updatedJob);
        
        // Clear local edits after successful update
        setLocalEdits({});
        
        setMessageType('success');
        setSuccessMessage('Checks updated and job re-validated successfully!');
      } else {
        // No local edits, just re-validate
        const updatedJob = await api.revalidateBulkImportJob(selectedJob.jobId);
        setSelectedJob(updatedJob);
        setMessageType('success');
        setSuccessMessage('Job re-validated successfully!');
      }
      
      // Refresh checks
      await fetchJobChecks(selectedJob.jobId, currentPage);
    } catch (err) {
      console.error('Error re-validating job:', err);
      // Extract error message from API response
      const errorMessage = err.data?.message || err.message || 'Failed to re-validate job. Please try again.';
      setError(errorMessage);
    } finally {
      setRevalidating(false);
    }
  };

  const handlePromoteClick = () => {
    if (!selectedJob) return;
    setShowPromoteConfirm(true);
  };

  const handlePromoteConfirm = async () => {
    if (!selectedJob) return;
    
    setShowPromoteConfirm(false);
    setPromoting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const updatedJob = await api.promoteBulkImportJob(selectedJob.jobId, false);
      setSelectedJob(updatedJob);
      setMessageType('success');
      setSuccessMessage(`Successfully promoted ${updatedJob.promotedRows || 0} checks!`);
      // Refresh dashboard and checks
      await fetchDashboard();
      await fetchJobChecks(selectedJob.jobId, currentPage);
    } catch (err) {
      console.error('Error promoting job:', err);
      // Extract error message from API response
      const errorMessage = err.data?.message || err.message || 'Failed to promote checks. Please try again.';
      setError(errorMessage);
    } finally {
      setPromoting(false);
    }
  };

  const handlePromoteCancel = () => {
    setShowPromoteConfirm(false);
  };

  const handleDeleteClick = (job, e) => {
    e.stopPropagation();
    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    
    setDeleting(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await api.deleteBulkImportJob(jobToDelete.jobId);
      setMessageType('success');
      setSuccessMessage(`Job "${jobToDelete.jobName || 'Unnamed Job'}" deleted successfully!`);
      
      // If the deleted job was selected, clear selection
      if (selectedJob && selectedJob.jobId === jobToDelete.jobId) {
        setSelectedJob(null);
        setChecks([]);
        setLocalEdits({});
      }
      
      // Refresh dashboard
      await fetchDashboard();
      
      setShowDeleteConfirm(false);
      setJobToDelete(null);
    } catch (err) {
      console.error('Error deleting job:', err);
      const errorMessage = err.data?.message || err.message || 'Failed to delete job. Please try again.';
      setError(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setJobToDelete(null);
  };

  const handleDownloadInvalidChecks = async () => {
    if (!selectedJob) return;
    
    try {
      // Fetch all invalid checks (we'll need to get all pages or use a different endpoint)
      // For now, let's get all checks and filter invalid ones
      let allInvalidChecks = [];
      let currentPageNum = 0;
      let hasMore = true;
      
      while (hasMore) {
        const response = await api.getBulkImportJobChecks(selectedJob.jobId, currentPageNum, 100);
        const pageChecks = response.items || [];
        const invalidChecks = pageChecks.filter(check => 
          check.valid === false || check.rowStatus === 'INVALID'
        );
        allInvalidChecks = [...allInvalidChecks, ...invalidChecks];
        
        hasMore = currentPageNum < (response.totalPages - 1);
        currentPageNum++;
        
        // Limit to prevent infinite loops
        if (currentPageNum > 100) break;
      }
      
      if (allInvalidChecks.length === 0) {
        setError('No invalid checks to download.');
        return;
      }
      
      // Prepare data for Excel - match the original upload format
      const excelData = allInvalidChecks.map(check => ({
        'Row #': check.sheetRowNumber || '',
        'Check Number': check.checkNumber || '',
        'Date of Deposit': check.dateOfDeposit || '',
        'Check Amount': check.checkAmount || '',
        'Payer': check.payer || '',
        'Location': check.location || '',
        'Practice': check.practice || '',
        'Type': check.type || '',
        'Exchange Description': check.exchangeDescription || '',
        'Bank Statement TRN Details': check.bankStatementTrnDetails || '',
        'Comments': check.comments || '',
        'Assignee ID': check.assigneeId || '',
        'Reporter ID': check.reporterId || '',
        'Error': check.validationErrors && check.validationErrors.length > 0 
          ? check.validationErrors.join('; ') 
          : 'Invalid check'
      }));
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
        { wch: 8 },   // Row #
        { wch: 20 },  // Check Number
        { wch: 15 },  // Date of Deposit
        { wch: 15 },  // Check Amount
        { wch: 20 },  // Payer
        { wch: 15 },  // Location
        { wch: 15 },  // Practice
        { wch: 15 },  // Type
        { wch: 25 },  // Exchange Description
        { wch: 30 },  // Bank Statement TRN Details
        { wch: 30 },  // Comments
        { wch: 20 },  // Assignee ID
        { wch: 20 },  // Reporter ID
        { wch: 50 }   // Error
      ];
      ws['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Invalid Checks');
      
      // Generate filename
      const fileName = `${selectedJob.jobName || 'InvalidChecks'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Write file
      XLSX.writeFile(wb, fileName);
      
      setMessageType('success');
      setSuccessMessage(`Downloaded ${allInvalidChecks.length} invalid check(s) to ${fileName}`);
    } catch (err) {
      console.error('Error downloading invalid checks:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to download invalid checks. Please try again.';
      setError(errorMessage);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Format row number: 3 digits for 1-999 (001, 002, ..., 999), full number for 1000+
  const formatRowNumber = (rowNumber) => {
    if (rowNumber === null || rowNumber === undefined) return '-';
    const num = Number(rowNumber);
    if (isNaN(num)) return String(rowNumber);
    
    // For numbers 1000 and above, show full number (no padding)
    if (num >= 1000) {
      return String(num);
    }
    
    // For numbers 1-999, pad to 3 digits
    return String(num).padStart(3, '0');
  };

  const getRowStatusStyle = (rowStatus) => {
    const status = rowStatus || 'UNKNOWN';
    const statusMap = {
      'PROMOTED': { background: '#dbeafe', color: '#1e40af' },
      'VALID': { background: '#d1fae5', color: '#059669' },
      'INVALID': { background: '#fee2e2', color: '#dc2626' },
      'PENDING': { background: '#fef3c7', color: '#d97706' }
    };
    return statusMap[status] || { background: '#f3f4f6', color: '#6b7280' };
  };

  const formatRowStatus = (rowStatus) => {
    if (!rowStatus) return 'UNKNOWN';
    return rowStatus;
  };

  const getJobStatusStyle = (status) => {
    const jobStatus = status || 'PENDING';
    const statusMap = {
      'PROMOTED': { background: '#dbeafe', color: '#1e40af' },
      'PARTIAL_PROMOTED': { background: '#dbeafe', color: '#3b82f6' },
      'READY_TO_PROMOTE': { background: '#d1fae5', color: '#059669' },
      'CORRECTION_REQUIRED': { background: '#fee2e2', color: '#dc2626' },
      'COMPLETED': { background: '#d1fae5', color: '#059669' },
      'FAILED': { background: '#fee2e2', color: '#dc2626' },
      'PENDING': { background: '#fef3c7', color: '#d97706' }
    };
    return statusMap[jobStatus] || { background: '#f3f4f6', color: '#6b7280' };
  };

  const formatJobStatus = (status) => {
    if (!status) return 'PENDING';
    // Convert snake_case to Title Case
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  // Truncate text and show tooltip on hover (similar to Checks page)
  const TruncatedText = ({ text, maxLength = 25 }) => {
    if (!text) return <span>-</span>;
    
    const shouldTruncate = text.length > maxLength;
    const displayText = shouldTruncate ? text.substring(0, maxLength) + '...' : text;
    
    if (shouldTruncate) {
      return (
        <Tooltip text={text} position="bottom">
          <span className="truncated-text">
            {displayText}
          </span>
        </Tooltip>
      );
    }
    
    return <span>{displayText}</span>;
  };

  // User options for dropdowns
  const userOptions = [
    { value: '', label: 'None' },
    ...users.map(user => ({
      value: user.userId || user.id,
      label: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName} (${user.email})`
        : user.email || user.userId
    }))
  ];

  const startIndex = currentPage * 50 + 1;
  const endIndex = Math.min((currentPage + 1) * 50, totalElements);

  return (
    <div className="check-upload-page">
      {/* Full-screen processing overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="processing-spinner">
              <svg className="spinner" viewBox="0 0 50 50">
                <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
              </svg>
            </div>
            <h3 className="processing-title">{processingMessage}</h3>
            <p className="processing-subtitle">Please wait, this may take a few moments...</p>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Check Upload</h1>
          <p className="page-subtitle">Bulk import checks from CSV/XLSX files</p>
        </div>
        {!selectedJob && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn-upload-small" 
              onClick={() => setShowUploadModal(true)}
              disabled={isProcessing}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ marginRight: '6px' }}>
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 13H8M12 9V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Check Upload
            </button>
            <Tooltip text="Bulk import checks from CSV/XLSX files for upload" position="bottom">
              <div className="info-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 14V10M10 6H10.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </Tooltip>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button 
            className="message-close-btn"
            onClick={() => setError(null)}
            style={{ 
              float: 'right', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: '1',
              padding: '0',
              marginLeft: '12px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div 
          className={messageType === 'warning' ? 'warning-message' : 'success-message'}
          style={messageType === 'warning' ? {
            marginBottom: '20px',
            padding: '12px',
            background: '#fee2e2',
            color: '#dc2626',
            borderRadius: '6px',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          } : {}}
        >
          <span>{successMessage}</span>
          <button 
            className="message-close-btn"
            onClick={() => {
              setSuccessMessage(null);
              setMessageType('success');
            }}
            style={{ 
              float: 'right', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: '1',
              padding: '0',
              marginLeft: '12px',
              color: 'inherit'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className="modal-overlay"
          onClick={() => {
            if (!uploading) {
              setShowUploadModal(false);
              setFile(null);
              setJobName('');
              setAssigneeId('');
              setColumnValidationError(null);
              setError(null);
            }
          }}
        >
          <div 
            className="upload-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>Upload CSV/XLSX File</h2>
              <button
                onClick={() => {
                  if (!uploading) {
                    setShowUploadModal(false);
                    setFile(null);
                    setJobName('');
                    setAssigneeId('');
                    setColumnValidationError(null);
                    setError(null);
                  }
                }}
                disabled={uploading}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  padding: '0',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !uploading && (e.target.style.background = '#f3f4f6')}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>

            {/* Upload Section */}
            <div className="upload-section-modal">
              <div
              className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-input-modal"
                accept=".csv,.xlsx"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              {!file ? (
                <>
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 13H8M12 9V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="upload-text">
                    <strong>Click to select CSV or XLSX file</strong>
                    <span>or drag and drop here</span>
                  </div>
                  <label htmlFor="file-input-modal" className="upload-label">
                    Select File
                  </label>
                </>
              ) : (
                <div className="file-selected">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div className="file-info">
                    <strong>{file.name}</strong>
                    <span>{(file.size / 1024).toFixed(2)} KB</span>
                  </div>
                  <button className="btn-remove" onClick={() => setFile(null)} disabled={isProcessing}>
                    Remove
                  </button>
                </div>
              )}
            </div>
            
            {file && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Job Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="Enter job name"
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                    Default Assignee (Optional)
                  </label>
                  <SearchableDropdown
                    options={userOptions}
                    value={assigneeId}
                    onChange={setAssigneeId}
                    placeholder="Select assignee"
                  />
                </div>
                <div className="upload-actions">
                  <button className="btn-cancel" onClick={() => { 
                    setFile(null); 
                    setJobName(''); 
                    setAssigneeId(''); 
                    setColumnValidationError(null);
                    setError(null);
                  }} disabled={isProcessing || uploading}>
                    Cancel
                  </button>
                  <button className="btn-upload" onClick={handleUpload} disabled={uploading || isProcessing || !file}>
                    {uploading ? 'Uploading...' : 'Upload & Process'}
                  </button>
                </div>
              </div>
            )}

            {columnValidationError && (
              <div className="error-message" style={{ marginTop: '16px' }}>
                <span>{columnValidationError}</span>
                <button 
                  className="message-close-btn"
                  onClick={() => setColumnValidationError(null)}
                  style={{ 
                    float: 'right', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '18px',
                    lineHeight: '1',
                    padding: '0',
                    marginLeft: '12px'
                  }}
                >
                  ×
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Dashboard View */}
      {!selectedJob && (
        <div>
          {/* Jobs List */}
          <div className="jobs-section" style={{ marginTop: '30px' }}>
            <h2 className="section-title">Import Jobs</h2>
            {loadingDashboard ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading jobs...</div>
            ) : dashboardJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                No import jobs found
              </div>
            ) : (
              <div className="jobs-table-wrapper">
                <table className="jobs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Job Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>File Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Total Rows</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Valid</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Invalid</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Promoted</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Created</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardJobs.map((job) => (
                      <tr 
                        key={job.jobId} 
                        style={{ 
                          borderBottom: '1px solid #e5e7eb', 
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          opacity: isProcessing ? 0.6 : 1
                        }} 
                        onClick={() => !isProcessing && handleSelectJob(job)}
                      >
                        <td style={{ padding: '12px' }}>{job.jobName || 'Unnamed Job'}</td>
                        <td style={{ padding: '12px' }}>{job.uploadedFileName || '-'}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            ...getJobStatusStyle(job.status)
                          }}>
                            {formatJobStatus(job.status)}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{job.totalRows || 0}</td>
                        <td style={{ padding: '12px', color: '#059669' }}>{job.validRows || 0}</td>
                        <td style={{ padding: '12px', color: '#dc2626' }}>{job.invalidRows || 0}</td>
                        <td style={{ padding: '12px', color: '#2563eb' }}>{job.promotedRows || 0}</td>
                        <td style={{ padding: '12px' }}>{formatDateTime(job.createdAt)}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={(e) => { e.stopPropagation(); handleSelectJob(job); }}
                              disabled={isProcessing}
                            >
                              View
                            </button>
                            <button
                              className="btn-primary"
                              style={{ 
                                padding: '6px 8px',
                                fontSize: '12px',
                                color: '#dc2626',
                                border: '1px solid #dc2626',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 'auto'
                              }}
                              onClick={(e) => handleDeleteClick(job, e)}
                              disabled={isProcessing || deleting}
                              title="Delete job"
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                <path d="M3 6H5H17M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2C10.5304 2 11.0391 2.21071 11.4142 2.58579C11.7893 2.96086 12 3.46957 12 4V6M15 6V16C15 16.5304 14.7893 17.0391 14.4142 17.4142C14.0391 17.7893 13.5304 18 13 18H7C6.46957 18 5.96086 17.7893 5.58579 17.4142C5.21071 17.0391 5 16.5304 5 16V6H15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Details View */}
      {selectedJob && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <button 
                className="btn-cancel" 
                onClick={() => { setSelectedJob(null); setChecks([]); setLocalEdits({}); }}
                disabled={isProcessing}
                style={{ marginBottom: '10px' }}
              >
                ← Back to Dashboard
              </button>
              <h2 style={{ margin: '0', fontSize: '24px', fontWeight: '600' }}>
                {selectedJob.jobName || 'Unnamed Job'}
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
                {selectedJob.uploadedFileName} • Created {formatDateTime(selectedJob.createdAt)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {Object.keys(localEdits).length > 0 && (
                <span style={{ fontSize: '14px', color: '#d97706', fontWeight: '500' }}>
                  {Object.keys(localEdits).length} pending edit{Object.keys(localEdits).length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedJob.invalidRows > 0 && (
                <button 
                  className="btn-cancel" 
                  onClick={handleDownloadInvalidChecks}
                  disabled={isProcessing || revalidating}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    padding: '8px 16px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M3 17C3 18.1046 3.89543 19 5 19H15C16.1046 19 17 18.1046 17 17V13M13 10L10 13M10 13L7 10M10 13V1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Download Invalid ({selectedJob.invalidRows})
                </button>
              )}
              <button 
                className="btn-primary" 
                onClick={handleRevalidate}
                disabled={revalidating || isProcessing}
              >
                Re-validate
              </button>
              <button 
                className="btn-upload" 
                onClick={handlePromoteClick}
                disabled={promoting || (selectedJob.validRows === 0) || isProcessing || revalidating}
              >
                {promoting ? 'Promoting...' : `Promote (${selectedJob.validRows || 0})`}
              </button>
            </div>
          </div>

          {/* Job Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total Rows</div>
              <div style={{ fontSize: '24px', fontWeight: '600' }}>{selectedJob.totalRows || 0}</div>
            </div>
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Valid</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>{selectedJob.validRows || 0}</div>
            </div>
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Invalid</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>{selectedJob.invalidRows || 0}</div>
            </div>
            <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Promoted</div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: '#2563eb' }}>{selectedJob.promotedRows || 0}</div>
            </div>
          </div>

          {/* Checks Table */}
          {loadingChecks ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading checks...</div>
          ) : checks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              No checks found
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  Showing {startIndex} - {endIndex} of {totalElements} checks
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0 || loadingChecks}
                    className="btn-cancel"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1 || loadingChecks}
                    className="btn-cancel"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="checks-table-wrapper">
                <table className="checks-table" style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Row #</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Check Number</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Payer</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Location</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Practice</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Comments</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Errors</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((check) => {
                      // Merge local edits with check data for display
                      const localEdit = localEdits[check.stagingCheckId] || {};
                      const displayCheck = {
                        ...check,
                        checkNumber: localEdit.checkNumber !== undefined ? localEdit.checkNumber : check.checkNumber,
                        dateOfDeposit: localEdit.dateOfDeposit !== undefined ? localEdit.dateOfDeposit : check.dateOfDeposit,
                        checkAmount: localEdit.checkAmount !== undefined ? localEdit.checkAmount : check.checkAmount,
                        payer: localEdit.payer !== undefined ? localEdit.payer : check.payer,
                        location: localEdit.location !== undefined ? localEdit.location : check.location,
                        practice: localEdit.practice !== undefined ? localEdit.practice : check.practice,
                        type: localEdit.type !== undefined ? localEdit.type : check.type,
                        comments: localEdit.comments !== undefined ? localEdit.comments : check.comments
                      };
                      const hasLocalEdit = !!localEdits[check.stagingCheckId];
                      const isCommentsExpanded = expandedComments.has(check.stagingCheckId);
                      const commentsText = displayCheck.comments || '';
                      const hasComments = commentsText.trim().length > 0;
                      const maxPreviewLength = 30;
                      const shouldTruncate = commentsText.length > maxPreviewLength;
                      
                      return (
                      <tr key={check.stagingCheckId} style={{ borderBottom: '1px solid #e5e7eb', background: hasLocalEdit ? '#fef3c7' : 'transparent' }}>
                        <td style={{ padding: '12px', minWidth: '80px', width: '80px', whiteSpace: 'nowrap' }}>{formatRowNumber(check.sheetRowNumber)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            ...getRowStatusStyle(check.rowStatus)
                          }}>
                            {formatRowStatus(check.rowStatus)}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{displayCheck.checkNumber || '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.dateOfDeposit ? formatDateUS(displayCheck.dateOfDeposit) : '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.checkAmount ? formatCurrency(displayCheck.checkAmount) : '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.payer || '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.location || '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.practice || '-'}</td>
                        <td style={{ padding: '12px', maxWidth: '200px' }}>
                          {hasComments ? (
                            <div style={{ fontSize: '12px', color: '#374151' }}>
                              {isCommentsExpanded ? (
                                <div>
                                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '4px' }}>
                                    {commentsText}
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedComments);
                                      newExpanded.delete(check.stagingCheckId);
                                      setExpandedComments(newExpanded);
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#2563eb',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      padding: '0',
                                      textDecoration: 'underline'
                                    }}
                                  >
                                    Show less
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <span>{shouldTruncate ? commentsText.substring(0, maxPreviewLength) + '...' : commentsText}</span>
                                  {shouldTruncate && (
                                    <button
                                      onClick={() => {
                                        const newExpanded = new Set(expandedComments);
                                        newExpanded.add(check.stagingCheckId);
                                        setExpandedComments(newExpanded);
                                      }}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#2563eb',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        padding: '0 0 0 4px',
                                        textDecoration: 'underline'
                                      }}
                                    >
                                      Show more
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {check.validationErrors && check.validationErrors.length > 0 ? (
                            <div style={{ fontSize: '12px', color: '#dc2626' }}>
                              <TruncatedText text={check.validationErrors.join(', ')} maxLength={25} />
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={() => handleEditCheck(check)}
                            disabled={isProcessing}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Promote Confirmation Modal */}
      {showPromoteConfirm && (
        <div style={{
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
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>
              Confirm Promotion
            </h3>
            <p style={{ marginBottom: '24px', color: '#374151', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to promote valid checks? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-cancel" 
                onClick={handlePromoteCancel}
                disabled={promoting || isProcessing}
              >
                Cancel
              </button>
              <button 
                className="btn-upload" 
                onClick={handlePromoteConfirm}
                disabled={promoting || isProcessing}
              >
                {promoting ? 'Promoting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
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
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '20px', fontWeight: '600', color: '#dc2626' }}>
              Confirm Delete
            </h3>
            <p style={{ marginBottom: '24px', color: '#374151', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to delete the job "{jobToDelete?.jobName || 'Unnamed Job'}"? This will permanently delete the job and all staged rows. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-cancel" 
                onClick={handleDeleteCancel}
                disabled={deleting || isProcessing}
              >
                Cancel
              </button>
              <button 
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: 'white',
                  cursor: deleting || isProcessing ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  opacity: deleting || isProcessing ? 0.6 : 1
                }}
                onClick={handleDeleteConfirm}
                disabled={deleting || isProcessing}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCheck && (
        <div style={{
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
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Edit Check</h3>
              <button
                onClick={handleCancelEdit}
                disabled={revalidating || isProcessing}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '0',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            {/* Show validation errors in edit modal */}
            {editFormData.validationErrors && editFormData.validationErrors.length > 0 && (
              <div style={{ 
                marginBottom: '12px', 
                padding: '10px', 
                background: '#fee2e2', 
                border: '1px solid #fecaca',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', marginBottom: '6px' }}>
                  Validation Errors:
                </div>
                <div style={{ fontSize: '12px', color: '#991b1b' }}>
                  {editFormData.validationErrors.map((error, index) => (
                    <div key={index} style={{ marginBottom: '2px' }}>
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Check Number
                </label>
                <input
                  type="text"
                  value={editFormData.checkNumber || ''}
                  onChange={(e) => setEditFormData({...editFormData, checkNumber: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Date of Deposit
                </label>
                <input
                  type="date"
                  value={editFormData.dateOfDeposit || ''}
                  onChange={(e) => setEditFormData({...editFormData, dateOfDeposit: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Check Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.checkAmount || 0}
                  onChange={(e) => setEditFormData({...editFormData, checkAmount: parseFloat(e.target.value) || 0})}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Payer
                </label>
                <input
                  type="text"
                  value={editFormData.payer || ''}
                  onChange={(e) => setEditFormData({...editFormData, payer: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={editFormData.location || ''}
                  onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Practice
                </label>
                <input
                  type="text"
                  value={editFormData.practice || ''}
                  onChange={(e) => setEditFormData({...editFormData, practice: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Type
                </label>
                <div style={{ width: '100%', minWidth: 0 }}>
                  <SearchableDropdown
                    options={[
                      { value: '', label: 'Select Type' },
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
                    value={editFormData.type || ''}
                    onChange={(value) => setEditFormData({...editFormData, type: value})}
                    placeholder="Select Type"
                    maxVisibleItems={5}
                    compact={true}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Exchange Description
                </label>
                <input
                  type="text"
                  value={editFormData.exchangeDescription || ''}
                  onChange={(e) => setEditFormData({...editFormData, exchangeDescription: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Bank Statement TRN Details
                </label>
                <input
                  type="text"
                  value={editFormData.bankStatementTrnDetails || ''}
                  onChange={(e) => setEditFormData({...editFormData, bankStatementTrnDetails: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Comments
                </label>
                <textarea
                  value={editFormData.comments || ''}
                  onChange={(e) => setEditFormData({...editFormData, comments: e.target.value})}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: '6px', minHeight: '70px', resize: 'vertical', fontSize: '14px' }}
                  rows={3}
                />
              </div>
              
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Assignee
                </label>
                <div style={{ width: '100%', minWidth: 0 }}>
                  <SearchableDropdown
                    options={userOptions}
                    value={editFormData.assigneeId || ''}
                    onChange={(value) => setEditFormData({...editFormData, assigneeId: value})}
                    placeholder="Select Assignee"
                    compact={true}
                  />
                </div>
              </div>
              
              <div style={{ width: '100%' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                  Reporter
                </label>
                <div style={{ width: '100%', minWidth: 0 }}>
                  <SearchableDropdown
                    options={userOptions}
                    value={editFormData.reporterId || ''}
                    onChange={(value) => setEditFormData({...editFormData, reporterId: value})}
                    placeholder="Select Reporter"
                    compact={true}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', gridColumn: '1 / -1' }}>
                  <button className="btn-cancel" onClick={handleCancelEdit} disabled={revalidating || isProcessing} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button className="btn-upload" onClick={handleSaveEdit} disabled={revalidating || isProcessing} style={{ flex: 1 }}>
                    {revalidating ? 'Saving...' : 'Save & Re-validate'}
                  </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckUpload;
