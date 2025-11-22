import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockChecks } from '../data/mockData';
import './CheckDetails.css';

const CheckDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const check = mockChecks.find(c => c.id === parseInt(id)) || mockChecks[0];
  
  const [formData, setFormData] = useState({
    checkNumber: check.checkNumber,
    altCheckNumber: '',
    depositDate: check.depositDate.replace(/\//g, '-'),
    type: check.type,
    practice: check.practice,
    location: check.location,
    payerName: check.payer,
    status: check.status,
    totalAmount: check.totalAmount,
    postedAmount: check.posted,
    remainingBalance: check.remaining,
    batchNumber: check.batchDescription,
    batchType: '',
    batchDate: '',
    batchRunNumber: '',
    notes: check.notes || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Save logic will be added later with API
    setIsEditMode(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const checkIndex = mockChecks.findIndex(c => c.id === parseInt(id));
  const prevCheck = checkIndex > 0 ? mockChecks[checkIndex - 1] : null;
  const nextCheck = checkIndex < mockChecks.length - 1 ? mockChecks[checkIndex + 1] : null;

  return (
    <div className="check-details-page">
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/checks')}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
          <div>
            <h1 className="page-title">
              {check.checkNumber} {check.payer}
              <span className="info-icon">⚠️</span>
            </h1>
            <div className="metadata">
              <span>Created: {check.createdBy} • {check.createdDate}</span>
              <span>Updated: {check.updatedBy} • {check.updatedDate}</span>
              <span>Batch ID: <button className="link-btn">{check.batchDescription}</button></span>
              <span>Clarifications: {check.clarifications}</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="nav-controls">
            <button 
              className="nav-arrow" 
              disabled={!prevCheck}
              onClick={() => prevCheck && navigate(`/checks/${prevCheck.id}`)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="page-indicator">{checkIndex + 1}/{mockChecks.length}</span>
            <button 
              className="nav-arrow"
              disabled={!nextCheck}
              onClick={() => nextCheck && navigate(`/checks/${nextCheck.id}`)}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          {!isEditMode && (
            <button className="btn-primary" onClick={() => setIsEditMode(true)}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M11 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V15C3 15.5304 3.21071 16.0391 3.58579 16.4142C3.96086 16.7893 4.46957 17 5 17H15C15.5304 17 16.0391 16.7893 16.4142 16.4142C16.7893 16.0391 17 15.5304 17 15V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14.5 1.5L18.5 5.5L11 13H7V9L14.5 1.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="check-details-content">
        <div className="details-section">
          <h2 className="section-title">Check Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Check Number</label>
              <input 
                type="text" 
                name="checkNumber"
                value={formData.checkNumber}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Alt. Check Number</label>
              <input 
                type="text" 
                name="altCheckNumber"
                value={formData.altCheckNumber}
                onChange={handleChange}
                placeholder="Optional"
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Deposit Date</label>
              <input 
                type="text" 
                name="depositDate"
                value={formData.depositDate}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={!isEditMode}
              >
                <option>ERA</option>
                <option>Paper</option>
                <option>EFT</option>
              </select>
            </div>
            <div className="form-group">
              <label>Practice</label>
              <input 
                type="text" 
                name="practice"
                value={formData.practice}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Payer Name</label>
              <input 
                type="text" 
                name="payerName"
                value={formData.payerName}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select 
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={!isEditMode}
              >
                <option>Complete</option>
                <option>Under Clarification</option>
                <option>In Progress</option>
                <option>Not Started</option>
              </select>
            </div>
            <div className="form-group">
              <label>Total Amount</label>
              <input 
                type="text" 
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Posted Amount</label>
              <input 
                type="text" 
                name="postedAmount"
                value={formData.postedAmount}
                onChange={handleChange}
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Remaining Balance</label>
              <input 
                type="text" 
                name="remainingBalance"
                value={formData.remainingBalance}
                onChange={handleChange}
                disabled={!isEditMode}
                className={formData.remainingBalance === 0 ? 'zero-balance' : ''}
              />
            </div>
          </div>
        </div>

        <div className="details-section">
          <div className="section-header">
            <h2 className="section-title">Batch Information</h2>
            <button className="btn-secondary">+ New Batch</button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Batch Number</label>
              <input 
                type="text" 
                name="batchNumber"
                value={formData.batchNumber}
                onChange={handleChange}
                placeholder="Enter batch #"
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Batch Type</label>
              <select 
                name="batchType"
                value={formData.batchType}
                onChange={handleChange}
                disabled={!isEditMode}
              >
                <option>Select type</option>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <div className="form-group">
              <label>Batch Date</label>
              <input 
                type="text" 
                name="batchDate"
                value={formData.batchDate}
                onChange={handleChange}
                placeholder="dd-mm-yyyy"
                disabled={!isEditMode}
              />
            </div>
            <div className="form-group">
              <label>Batch Run Number</label>
              <input 
                type="text" 
                name="batchRunNumber"
                value={formData.batchRunNumber}
                onChange={handleChange}
                placeholder="Run #"
                disabled={!isEditMode}
              />
            </div>
          </div>
        </div>

        <div className="details-section">
          <h2 className="section-title">Notes</h2>
          <textarea 
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={!isEditMode}
            rows="4"
            placeholder="Add notes..."
          />
        </div>

        {isEditMode && (
          <div className="edit-actions">
            <button className="btn-cancel" onClick={() => setIsEditMode(false)}>
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

        <div className="tabs-section">
          <div className="tabs">
            <button className="tab active">Clarifications ({check.clarifications})</button>
            <button className="tab">Attachments (0)</button>
            <button className="tab">Audit Trail</button>
          </div>
          <div className="tab-content">
            <div className="tab-header">
              <h3>Clarifications</h3>
              <button className="btn-secondary">+ Add</button>
            </div>
            <div className="empty-state">
              No clarifications added yet.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckDetails;

