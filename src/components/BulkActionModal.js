import React, { useState, useRef, useEffect } from 'react';
import SearchableDropdown from './SearchableDropdown';
import './BulkActionModal.css';

const BulkActionModal = ({ isOpen, onClose, onSave, selectedCount, users }) => {
  const detailsTextareaRef = useRef(null);
  const [formData, setFormData] = useState({
    assigneeId: '',
    reporterId: '',
    unknown: false,
    clarification: {
      clarificationType: '',
      details: '',
      status: 'OPEN',
      assigneeId: '',
      reporterId: '',
      assignee: 'ON-SHORE',
      reportee: 'EBOTICS'
    },
    includeClarification: false
  });

  // Auto-expand textarea
  useEffect(() => {
    const textarea = detailsTextareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [formData.clarification.details, formData.includeClarification]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClarificationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      clarification: {
        ...prev.clarification,
        [field]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {};

    // Only add fields if they have values
    if (formData.assigneeId) {
      payload.assigneeId = formData.assigneeId;
    }
    
    if (formData.reporterId) {
      payload.reporterId = formData.reporterId;
    }
    
    if (formData.unknown) {
      payload.unknown = true;
    }

    // Add clarification if enabled and has required fields
    if (formData.includeClarification && formData.clarification.clarificationType) {
      const clarification = { ...formData.clarification };
      
      // Remove empty fields
      Object.keys(clarification).forEach(key => {
        if (clarification[key] === '' || clarification[key] === undefined) {
          delete clarification[key];
        }
      });

      if (Object.keys(clarification).length > 0) {
        payload.clarification = clarification;
      }
    }

    onSave(payload);
    
    // Reset form
    setFormData({
      assigneeId: '',
      reporterId: '',
      unknown: false,
      clarification: {
        clarificationType: '',
        details: '',
        status: 'OPEN',
        assigneeId: '',
        reporterId: '',
        assignee: 'ON-SHORE',
        reportee: 'EBOTICS'
      },
      includeClarification: false
    });
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      assigneeId: '',
      reporterId: '',
      unknown: false,
      clarification: {
        clarificationType: '',
        details: '',
        status: 'OPEN',
        assigneeId: '',
        reporterId: '',
        assignee: 'ON-SHORE',
        reportee: 'EBOTICS'
      },
      includeClarification: false
    });
    onClose();
  };

  return (
    <div className="bulk-action-modal-overlay" onClick={handleCancel}>
      <div 
        className={`bulk-action-modal ${formData.includeClarification ? 'with-clarification' : 'without-clarification'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bulk-action-modal-header">
          <h2>Bulk Update Checks</h2>
          <button className="modal-close-btn" onClick={handleCancel}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="bulk-action-modal-content">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="form-section-header">
                <h3>Update Fields</h3>
                <span className="selected-count">{selectedCount} check(s) selected</span>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Assignee</label>
                  <SearchableDropdown
                    options={[
                      { value: '', label: 'Select Assignee' },
                      ...users.map(user => ({
                        value: user.userId || user.id,
                        label: user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email || 'Unknown User'
                      }))
                    ]}
                    value={formData.assigneeId}
                    onChange={(value) => handleChange('assigneeId', value)}
                    placeholder="Select Assignee"
                    maxVisibleItems={5}
                  />
                </div>

                <div className="form-group">
                  <label>Reporter</label>
                  <SearchableDropdown
                    options={[
                      { value: '', label: 'Select Reporter' },
                      ...users.map(user => ({
                        value: user.userId || user.id,
                        label: user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}` 
                          : user.email || 'Unknown User'
                      }))
                    ]}
                    value={formData.reporterId}
                    onChange={(value) => handleChange('reporterId', value)}
                    placeholder="Select Reporter"
                    maxVisibleItems={5}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.unknown}
                      onChange={(e) => handleChange('unknown', e.target.checked)}
                    />
                    <span>Mark as Unknown</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.includeClarification}
                      onChange={(e) => handleChange('includeClarification', e.target.checked)}
                    />
                    <span>Add Clarification</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="form-section">

              {formData.includeClarification && (
                <div className="clarification-section">
                  <h4 className="clarification-title">Clarification Details</h4>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Clarification Type *</label>
                      <input
                        type="text"
                        value={formData.clarification.clarificationType}
                        onChange={(e) => handleClarificationChange('clarificationType', e.target.value)}
                        placeholder="e.g., MISSING_DOCS"
                        required={formData.includeClarification}
                      />
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={formData.clarification.status}
                        onChange={(e) => handleClarificationChange('status', e.target.value)}
                      >
                        <option value="OPEN">Open</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Details</label>
                    <textarea
                      ref={detailsTextareaRef}
                      value={formData.clarification.details}
                      onChange={(e) => {
                        handleClarificationChange('details', e.target.value);
                        // Auto-expand
                        const textarea = e.target;
                        textarea.style.height = 'auto';
                        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
                      }}
                      placeholder="Enter clarification details..."
                      rows="1"
                      className="expandable-textarea"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Clarification Assignee</label>
                      <SearchableDropdown
                        options={[
                          { value: '', label: 'Select Assignee' },
                          ...users.map(user => ({
                            value: user.userId || user.id,
                            label: user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.email || 'Unknown User'
                          }))
                        ]}
                        value={formData.clarification.assigneeId}
                        onChange={(value) => handleClarificationChange('assigneeId', value)}
                        placeholder="Select Assignee"
                        maxVisibleItems={5}
                      />
                    </div>

                    <div className="form-group">
                      <label>Clarification Reporter</label>
                      <SearchableDropdown
                        options={[
                          { value: '', label: 'Select Reporter' },
                          ...users.map(user => ({
                            value: user.userId || user.id,
                            label: user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : user.email || 'Unknown User'
                          }))
                        ]}
                        value={formData.clarification.reporterId}
                        onChange={(value) => handleClarificationChange('reporterId', value)}
                        placeholder="Select Reporter"
                        maxVisibleItems={5}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Assignee Type</label>
                      <select
                        value={formData.clarification.assignee}
                        onChange={(e) => handleClarificationChange('assignee', e.target.value)}
                      >
                        <option value="ON-SHORE">ON-SHORE</option>
                        <option value="OFF-SHORE">OFF-SHORE</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Reportee Type</label>
                      <input
                        type="text"
                        value={formData.clarification.reportee}
                        onChange={(e) => handleClarificationChange('reportee', e.target.value)}
                        placeholder="e.g., EBOTICS"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bulk-action-modal-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-save">
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModal;
