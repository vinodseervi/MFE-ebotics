import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useUsers } from '../context/UsersContext';
import SearchableDropdown from '../components/SearchableDropdown';
import Tooltip from '../components/Tooltip';
import { formatDateUS } from '../utils/dateUtils';
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
  
  // Job update state
  const [revalidating, setRevalidating] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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

  const handleDrop = (e) => {
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
        setFile(droppedFile);
      } else {
        setError('Please select a CSV or XLSX file');
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || 
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          selectedFile.name.endsWith('.csv') || 
          selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a CSV or XLSX file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await api.uploadBulkImportFile(file, jobName || null, assigneeId || null);
      setSuccessMessage('File uploaded successfully!');
      setFile(null);
      setJobName('');
      setAssigneeId('');
      
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
  const isProcessing = uploading || revalidating;
  const processingMessage = uploading ? 'Processing and validating file...' : revalidating ? 'Re-validating checks...' : '';

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

  const handleSaveEdit = () => {
    if (!editingCheck) return;
    
    // Save edit locally
    setLocalEdits(prev => ({
      ...prev,
      [editingCheck]: { ...editFormData }
    }));
    
    setSuccessMessage('Changes saved locally. Click "Re-validate" to apply changes.');
    setEditingCheck(null);
    setEditFormData({});
  };

  const handleRevalidate = async () => {
    if (!selectedJob) return;
    
    setRevalidating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // First, apply all local edits to the server
      const editEntries = Object.entries(localEdits);
      if (editEntries.length > 0) {
        // Apply all edits sequentially
        for (const [stagingCheckId, editData] of editEntries) {
          try {
            await api.updateStagedCheck(selectedJob.jobId, stagingCheckId, editData);
          } catch (err) {
            console.error(`Error updating check ${stagingCheckId}:`, err);
            // Continue with other edits even if one fails
          }
        }
      }
      
      // Then re-validate the job
      const updatedJob = await api.revalidateBulkImportJob(selectedJob.jobId);
      setSelectedJob(updatedJob);
      
      // Clear local edits after successful re-validation
      setLocalEdits({});
      
      setSuccessMessage('Job re-validated successfully!');
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
        <div className="success-message">
          <span>{successMessage}</span>
          <button 
            className="message-close-btn"
            onClick={() => setSuccessMessage(null)}
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

      {/* Dashboard View */}
      {!selectedJob && (
        <div>
          {/* Upload Section */}
          <div className="upload-section">
            <h2 className="section-title">Upload CSV/XLSX File</h2>
            <div
              className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-input"
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
                  <label htmlFor="file-input" className="upload-label">
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
                  <button className="btn-cancel" onClick={() => { setFile(null); setJobName(''); setAssigneeId(''); }} disabled={isProcessing}>
                    Cancel
                  </button>
                  <button className="btn-upload" onClick={handleUpload} disabled={uploading || isProcessing}>
                    Upload & Process
                  </button>
                </div>
              </div>
            )}
          </div>

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
                            background: job.status === 'COMPLETED' ? '#d1fae5' : job.status === 'FAILED' ? '#fee2e2' : '#fef3c7',
                            color: job.status === 'COMPLETED' ? '#059669' : job.status === 'FAILED' ? '#dc2626' : '#d97706'
                          }}>
                            {job.status || 'PENDING'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{job.totalRows || 0}</td>
                        <td style={{ padding: '12px', color: '#059669' }}>{job.validRows || 0}</td>
                        <td style={{ padding: '12px', color: '#dc2626' }}>{job.invalidRows || 0}</td>
                        <td style={{ padding: '12px', color: '#2563eb' }}>{job.promotedRows || 0}</td>
                        <td style={{ padding: '12px' }}>{formatDateTime(job.createdAt)}</td>
                        <td style={{ padding: '12px' }}>
                          <button
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            onClick={(e) => { e.stopPropagation(); handleSelectJob(job); }}
                          >
                            View
                          </button>
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
                        type: localEdit.type !== undefined ? localEdit.type : check.type
                      };
                      const hasLocalEdit = !!localEdits[check.stagingCheckId];
                      
                      return (
                      <tr key={check.stagingCheckId} style={{ borderBottom: '1px solid #e5e7eb', background: hasLocalEdit ? '#fef3c7' : 'transparent' }}>
                        <td style={{ padding: '12px', minWidth: '80px', width: '80px', whiteSpace: 'nowrap' }}>{formatRowNumber(check.sheetRowNumber)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: check.valid ? '#d1fae5' : '#fee2e2',
                            color: check.valid ? '#059669' : '#dc2626'
                          }}>
                            {check.valid ? 'Valid' : 'Invalid'}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>{displayCheck.checkNumber || '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.dateOfDeposit ? formatDateUS(displayCheck.dateOfDeposit) : '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.checkAmount ? formatCurrency(displayCheck.checkAmount) : '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.payer || '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.location || '-'}</td>
                        <td style={{ padding: '12px' }}>{displayCheck.practice || '-'}</td>
                        <td style={{ padding: '12px' }}>
                          {check.validationErrors && check.validationErrors.length > 0 ? (
                            <div style={{ fontSize: '12px', color: '#dc2626' }}>
                              <TruncatedText text={check.validationErrors.join(', ')} maxLength={25} />
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {!check.valid && (
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => handleEditCheck(check)}
                              disabled={isProcessing}
                            >
                              Edit
                            </button>
                          )}
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
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Edit Check</h3>
            
            {/* Show validation errors in edit modal */}
            {editFormData.validationErrors && editFormData.validationErrors.length > 0 && (
              <div style={{ 
                marginBottom: '20px', 
                padding: '12px', 
                background: '#fee2e2', 
                border: '1px solid #fecaca',
                borderRadius: '6px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                  Validation Errors:
                </div>
                <div style={{ fontSize: '13px', color: '#991b1b' }}>
                  {editFormData.validationErrors.map((error, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Check Number
                </label>
                <input
                  type="text"
                  value={editFormData.checkNumber || ''}
                  onChange={(e) => setEditFormData({...editFormData, checkNumber: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Date of Deposit
                </label>
                <input
                  type="date"
                  value={editFormData.dateOfDeposit || ''}
                  onChange={(e) => setEditFormData({...editFormData, dateOfDeposit: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Check Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editFormData.checkAmount || 0}
                  onChange={(e) => setEditFormData({...editFormData, checkAmount: parseFloat(e.target.value) || 0})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Payer
                </label>
                <input
                  type="text"
                  value={editFormData.payer || ''}
                  onChange={(e) => setEditFormData({...editFormData, payer: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={editFormData.location || ''}
                  onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Practice
                </label>
                <input
                  type="text"
                  value={editFormData.practice || ''}
                  onChange={(e) => setEditFormData({...editFormData, practice: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                  Type
                </label>
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
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button className="btn-cancel" onClick={handleCancelEdit} disabled={isProcessing} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button className="btn-upload" onClick={handleSaveEdit} disabled={isProcessing} style={{ flex: 1 }}>
                    Save
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
