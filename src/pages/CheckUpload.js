import React, { useState } from 'react';
import './CheckUpload.css';

const CheckUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);

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
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        alert('Please upload a CSV file');
      }
    }
  };

  const handleDownloadTemplate = () => {
    // Create a sample CSV template
    const template = `practice_code,check_number,deposit_date,total_amount,payer_name,location_code,posted_amount,batch_number,notes
MHC,CHK-2025-001234,2025-11-05,45230.50,Blue Cross Blue Shield,DTC,45230.50,B-2025-11-001,Regular monthly payment
FCA,CHK-2025-001235,2025-11-06,32150.75,Aetna,MO,28450.75,B-2025-11-002,`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'check_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="check-upload-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Check Upload
            <span className="info-icon">⚠️</span>
          </h1>
          <p className="page-subtitle">Upload multiple checks via CSV file</p>
        </div>
        <button className="btn-download" onClick={handleDownloadTemplate}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M3 15V17H17V15M10 3V13M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Download Template
        </button>
      </div>

      <div className="upload-section">
        <h2 className="section-title">Upload CSV File</h2>
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
            accept=".csv"
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
                <strong>Click to select CSV file</strong>
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
              <button className="btn-remove" onClick={() => setFile(null)}>
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="requirements-section">
        <h3 className="requirements-title">CSV Format Requirements</h3>
        <ul className="requirements-list">
          <li>Required columns: <code>practice_code</code>, <code>check_number</code>, <code>deposit_date</code>, <code>total_amount</code>, <code>payer_name</code></li>
          <li>Optional columns: <code>location_code</code>, <code>posted_amount</code>, <code>batch_number</code>, <code>notes</code></li>
          <li>Date format: <code>YYYY-MM-DD</code></li>
          <li>Currency format: Numbers only (no $ or commas)</li>
          <li>Encoding: <code>UTF-8</code></li>
        </ul>
      </div>

      {file && (
        <div className="upload-actions">
          <button className="btn-cancel" onClick={() => setFile(null)}>
            Cancel
          </button>
          <button className="btn-upload">
            Upload & Process
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckUpload;

