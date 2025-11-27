import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Edit, MapPin, Plus } from 'lucide-react';
import './Admin.css';

const Practices = () => {
  const { user } = useAuth();
  const [practices, setPractices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showEditLocationModal, setShowEditLocationModal] = useState(false);
  const [editingPractice, setEditingPractice] = useState(null);
  const [selectedPractice, setSelectedPractice] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'ACTIVE'
  });
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    status: 'ACTIVE'
  });

  const [locationFormData, setLocationFormData] = useState({
    name: '',
    code: '',
    isActive: true
  });

  const [editLocationFormData, setEditLocationFormData] = useState({
    name: '',
    code: '',
    isActive: true
  });

  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});
  const [locationFormErrors, setLocationFormErrors] = useState({});
  const [editLocationFormErrors, setEditLocationFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmittingLocation, setIsSubmittingLocation] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLocationStatusModal, setShowLocationStatusModal] = useState(false);
  const [statusUpdatePractice, setStatusUpdatePractice] = useState(null);
  const [statusUpdateLocation, setStatusUpdateLocation] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [newLocationStatus, setNewLocationStatus] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingLocationStatus, setIsUpdatingLocationStatus] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [checkingLocationCode, setCheckingLocationCode] = useState(false);

  useEffect(() => {
    fetchPractices();
  }, []);

  const fetchPractices = async () => {
    try {
      setLoading(true);
      const data = await api.getAllPractices();
      setPractices(data || []);
    } catch (error) {
      console.error('Error fetching practices:', error);
      setPractices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async (practiceId) => {
    try {
      setLoadingLocations(true);
      const data = await api.getPracticeLocations(practiceId);
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (editFormErrors[name]) {
      setEditFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleLocationInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocationFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (locationFormErrors[name]) {
      setLocationFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEditLocationInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditLocationFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (editLocationFormErrors[name]) {
      setEditLocationFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.code.trim()) {
      errors.code = 'Code is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors = {};
    
    if (!editFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!editFormData.code.trim()) {
      errors.code = 'Code is required';
    }
    
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLocationForm = () => {
    const errors = {};
    
    if (!locationFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!locationFormData.code.trim()) {
      errors.code = 'Code is required';
    }
    
    setLocationFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditLocationForm = () => {
    const errors = {};
    
    if (!editLocationFormData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!editLocationFormData.code.trim()) {
      errors.code = 'Code is required';
    }
    
    setEditLocationFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkPracticeCode = async (code) => {
    if (!code || !code.trim()) return false;
    try {
      setCheckingCode(true);
      const response = await api.checkPracticeCodeExists(code.trim());
      return response.exists === true;
    } catch (error) {
      console.error('Error checking practice code:', error);
      return false;
    } finally {
      setCheckingCode(false);
    }
  };

  const checkLocationCode = async (code) => {
    if (!code || !code.trim()) return false;
    try {
      setCheckingLocationCode(true);
      const response = await api.checkLocationCodeExists(code.trim());
      return response.exists === true;
    } catch (error) {
      console.error('Error checking location code:', error);
      return false;
    } finally {
      setCheckingLocationCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Check if code already exists
    const codeExists = await checkPracticeCode(formData.code);
    if (codeExists) {
      setFormErrors({ code: 'This practice code already exists' });
      return;
    }

    try {
      setIsSubmitting(true);
      const practiceData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        status: formData.status
      };

      await api.createPractice(practiceData);
      
      setShowAddModal(false);
      setFormData({
        name: '',
        code: '',
        status: 'ACTIVE'
      });
      setFormErrors({});
      
      await fetchPractices();
    } catch (error) {
      console.error('Error creating practice:', error);
      const errorMessage = error.message || error.error || 'Failed to create practice. Please try again.';
      setFormErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (practice) => {
    setEditingPractice(practice);
    setEditFormData({
      name: practice.name || '',
      code: practice.code || '',
      status: practice.status || 'ACTIVE'
    });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdatePractice = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) {
      return;
    }

    // Check if code already exists (only if code changed)
    if (editFormData.code !== editingPractice.code) {
      const codeExists = await checkPracticeCode(editFormData.code);
      if (codeExists) {
        setEditFormErrors({ code: 'This practice code already exists' });
        return;
      }
    }

    try {
      setIsUpdating(true);
      const updateData = {
        name: editFormData.name.trim(),
        code: editFormData.code.trim()
      };

      await api.updatePractice(editingPractice.practiceId, updateData);
      
      setShowEditModal(false);
      setEditingPractice(null);
      setEditFormErrors({});
      
      await fetchPractices();
    } catch (error) {
      console.error('Error updating practice:', error);
      const errorMessage = error.message || error.error || 'Failed to update practice. Please try again.';
      setEditFormErrors({ submit: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusToggle = (practice) => {
    const newStatusValue = practice.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusUpdatePractice(practice);
    setNewStatus(newStatusValue);
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusUpdatePractice || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      await api.updatePracticeStatus(statusUpdatePractice.practiceId, newStatus);
      
      await fetchPractices();
      
      setShowStatusModal(false);
      setStatusUpdatePractice(null);
      setNewStatus(null);
    } catch (error) {
      console.error('Error updating practice status:', error);
      const errorMessage = error.message || error.error || 'Failed to update practice status. Please try again.';
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddLocationClick = (practice) => {
    setSelectedPractice(practice);
    setLocationFormData({
      name: '',
      code: '',
      isActive: true
    });
    setLocationFormErrors({});
    setShowLocationModal(true);
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateLocationForm()) {
      return;
    }

    // Check if code already exists
    const codeExists = await checkLocationCode(locationFormData.code);
    if (codeExists) {
      setLocationFormErrors({ code: 'This location code already exists' });
      return;
    }

    try {
      setIsSubmittingLocation(true);
      const locationData = {
        name: locationFormData.name.trim(),
        code: locationFormData.code.trim(),
        isActive: locationFormData.isActive
      };

      await api.createPracticeLocation(selectedPractice.practiceId, locationData);
      
      setShowLocationModal(false);
      setSelectedPractice(null);
      setLocationFormData({
        name: '',
        code: '',
        isActive: true
      });
      setLocationFormErrors({});
      
      await fetchPractices();
    } catch (error) {
      console.error('Error creating location:', error);
      const errorMessage = error.message || error.error || 'Failed to create location. Please try again.';
      setLocationFormErrors({ submit: errorMessage });
    } finally {
      setIsSubmittingLocation(false);
    }
  };

  const handleEditLocationClick = async (practice, location) => {
    setSelectedPractice(practice);
    setEditingLocation(location);
    setEditLocationFormData({
      name: location.name || '',
      code: location.code || '',
      isActive: location.isActive !== undefined ? location.isActive : true
    });
    setEditLocationFormErrors({});
    setShowEditLocationModal(true);
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    
    if (!validateEditLocationForm()) {
      return;
    }

    // Check if code already exists (only if code changed)
    if (editLocationFormData.code !== editingLocation.code) {
      const codeExists = await checkLocationCode(editLocationFormData.code);
      if (codeExists) {
        setEditLocationFormErrors({ code: 'This location code already exists' });
        return;
      }
    }

    try {
      setIsUpdatingLocation(true);
      const updateData = {
        name: editLocationFormData.name.trim(),
        code: editLocationFormData.code.trim()
      };

      await api.updatePracticeLocation(selectedPractice.practiceId, editingLocation.locationId, updateData);
      
      setShowEditLocationModal(false);
      setSelectedPractice(null);
      setEditingLocation(null);
      setEditLocationFormErrors({});
      
      await fetchPractices();
    } catch (error) {
      console.error('Error updating location:', error);
      const errorMessage = error.message || error.error || 'Failed to update location. Please try again.';
      setEditLocationFormErrors({ submit: errorMessage });
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const handleLocationStatusToggle = (practice, location) => {
    const newStatusValue = !location.isActive;
    setSelectedPractice(practice);
    setStatusUpdateLocation(location);
    setNewLocationStatus(newStatusValue);
    setShowLocationStatusModal(true);
  };

  const handleConfirmLocationStatusUpdate = async () => {
    if (!statusUpdateLocation || !selectedPractice || newLocationStatus === null) return;

    try {
      setIsUpdatingLocationStatus(true);
      await api.updateLocationStatus(selectedPractice.practiceId, statusUpdateLocation.locationId, newLocationStatus);
      
      await fetchPractices();
      
      setShowLocationStatusModal(false);
      setSelectedPractice(null);
      setStatusUpdateLocation(null);
      setNewLocationStatus(null);
    } catch (error) {
      console.error('Error updating location status:', error);
      const errorMessage = error.message || error.error || 'Failed to update location status. Please try again.';
    } finally {
      setIsUpdatingLocationStatus(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredPractices = practices.filter(practice => {
    const matchesSearch = !searchTerm || 
      practice.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      practice.code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All Statuses' || formatStatus(practice.status) === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const uniqueStatuses = ['All Statuses', ...Array.from(new Set(practices.map(p => formatStatus(p.status)).filter(Boolean)))];

  const totalLocations = practices.reduce((sum, p) => sum + (p.locations?.length || 0), 0);
  const activePractices = practices.filter(p => p.status === 'ACTIVE').length;

  return (
    <div className="admin-page user-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Practice Management</h1>
          <p className="page-subtitle">Manage practices and their locations. Control access and monitor activity.</p>
        </div>
        <button 
          className="btn-add-user"
          onClick={() => {
            setFormData({
              name: '',
              code: '',
              status: 'ACTIVE'
            });
            setFormErrors({});
            setShowAddModal(true);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Practice
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Total Practices</div>
          <div className="stat-value">{practices.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Locations</div>
          <div className="stat-value">{totalLocations}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Practices</div>
          <div className="stat-value success">{activePractices}</div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar-wrapper">
          <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 15L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search practices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="filter-dropdowns-wrapper">
          <select 
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-section">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Loading practices...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Locations</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPractices.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No practices found
                    </td>
                  </tr>
                ) : (
                  filteredPractices.map((practice) => (
                    <React.Fragment key={practice.practiceId}>
                      <tr>
                        <td style={{ fontWeight: 500 }}>{practice.name || '-'}</td>
                        <td>
                          <span style={{ 
                            fontFamily: 'Courier New, monospace',
                            fontSize: '13px',
                            color: '#6b7280'
                          }}>
                            {practice.code || '-'}
                          </span>
                        </td>
                        <td>
                          <span 
                            className={`status-badge clickable ${practice.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                            onClick={() => handleStatusToggle(practice)}
                            title={`Click to ${practice.status === 'ACTIVE' ? 'deactivate' : 'activate'} practice`}
                          >
                            {formatStatus(practice.status)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={16} style={{ color: '#6b7280' }} />
                            <span>{practice.locations?.length || 0}</span>
                            <button
                              onClick={() => handleAddLocationClick(practice)}
                              style={{
                                marginLeft: '8px',
                                padding: '4px 8px',
                                background: '#f3f4f6',
                                border: '1px solid #e5e7eb',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                color: '#374151',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Add Location"
                            >
                              <Plus size={12} />
                              Add
                            </button>
                          </div>
                        </td>
                        <td>{formatDate(practice.createdAt)}</td>
                        <td>{formatDate(practice.updatedAt)}</td>
                        <td>
                          <Edit
                            size={18}
                            style={{
                              color: '#3b82f6',
                              cursor: 'pointer',
                              transition: 'color 0.2s'
                            }}
                            onClick={() => handleEditClick(practice)}
                            title="Edit practice"
                          />
                        </td>
                      </tr>
                      {practice.locations && practice.locations.length > 0 && (
                        <tr style={{ background: '#f9fafb' }}>
                          <td colSpan="7" style={{ padding: '16px 14px' }}>
                            <div style={{ marginLeft: '24px' }}>
                              <div style={{ 
                                fontSize: '12px', 
                                fontWeight: 600, 
                                color: '#6b7280', 
                                marginBottom: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                Locations ({practice.locations.length})
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {practice.locations.map((location) => (
                                  <div
                                    key={location.locationId}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '8px 12px',
                                      background: 'white',
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '6px',
                                      fontSize: '13px'
                                    }}
                                  >
                                    <MapPin size={14} style={{ color: '#6b7280' }} />
                                    <div>
                                      <div style={{ fontWeight: 500, color: '#111827' }}>
                                        {location.name}
                                      </div>
                                      <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'Courier New, monospace' }}>
                                        {location.code}
                                      </div>
                                    </div>
                                    <span 
                                      className={`status-badge clickable ${location.isActive ? 'status-active' : 'status-inactive'}`}
                                      onClick={() => handleLocationStatusToggle(practice, location)}
                                      title={`Click to ${location.isActive ? 'deactivate' : 'activate'} location`}
                                      style={{ fontSize: '11px', padding: '4px 10px' }}
                                    >
                                      {location.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <Edit
                                      size={14}
                                      style={{
                                        color: '#3b82f6',
                                        cursor: 'pointer',
                                        marginLeft: '4px'
                                      }}
                                      onClick={() => handleEditLocationClick(practice, location)}
                                      title="Edit location"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Practice Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Practice</h2>
              <button 
                className="modal-close"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter practice name"
                  disabled={isSubmitting}
                  required
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="code">Code *</label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="Enter practice code"
                  disabled={isSubmitting || checkingCode}
                  required
                />
                {formErrors.code && <span className="error-text">{formErrors.code}</span>}
                {checkingCode && <span className="error-text" style={{ color: '#6b7280' }}>Checking code...</span>}
              </div>

              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {formErrors.submit && (
                <div className="error-text" style={{ marginTop: '12px' }}>
                  {formErrors.submit}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting || checkingCode}
                >
                  {isSubmitting ? 'Creating...' : 'Create Practice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Practice Modal */}
      {showEditModal && editingPractice && (
        <div className="modal-overlay" onClick={() => !isUpdating && setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Practice</h2>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdatePractice} className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-name">Name *</label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  placeholder="Enter practice name"
                  disabled={isUpdating}
                  required
                />
                {editFormErrors.name && <span className="error-text">{editFormErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="edit-code">Code *</label>
                <input
                  type="text"
                  id="edit-code"
                  name="code"
                  value={editFormData.code}
                  onChange={handleEditInputChange}
                  placeholder="Enter practice code"
                  disabled={isUpdating || checkingCode}
                  required
                />
                {editFormErrors.code && <span className="error-text">{editFormErrors.code}</span>}
                {checkingCode && <span className="error-text" style={{ color: '#6b7280' }}>Checking code...</span>}
              </div>

              {editFormErrors.submit && (
                <div className="error-text" style={{ marginTop: '12px' }}>
                  {editFormErrors.submit}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUpdating || checkingCode}
                >
                  {isUpdating ? 'Updating...' : 'Update Practice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showLocationModal && selectedPractice && (
        <div className="modal-overlay" onClick={() => !isSubmittingLocation && setShowLocationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Location to {selectedPractice.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowLocationModal(false)}
                disabled={isSubmittingLocation}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleLocationSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="location-name">Name *</label>
                <input
                  type="text"
                  id="location-name"
                  name="name"
                  value={locationFormData.name}
                  onChange={handleLocationInputChange}
                  placeholder="Enter location name"
                  disabled={isSubmittingLocation}
                  required
                />
                {locationFormErrors.name && <span className="error-text">{locationFormErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="location-code">Code *</label>
                <input
                  type="text"
                  id="location-code"
                  name="code"
                  value={locationFormData.code}
                  onChange={handleLocationInputChange}
                  placeholder="Enter location code"
                  disabled={isSubmittingLocation || checkingLocationCode}
                  required
                />
                {locationFormErrors.code && <span className="error-text">{locationFormErrors.code}</span>}
                {checkingLocationCode && <span className="error-text" style={{ color: '#6b7280' }}>Checking code...</span>}
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={locationFormData.isActive}
                    onChange={handleLocationInputChange}
                    disabled={isSubmittingLocation}
                  />
                  <span>Active</span>
                </label>
              </div>

              {locationFormErrors.submit && (
                <div className="error-text" style={{ marginTop: '12px' }}>
                  {locationFormErrors.submit}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowLocationModal(false)}
                  disabled={isSubmittingLocation}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingLocation || checkingLocationCode}
                >
                  {isSubmittingLocation ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {showEditLocationModal && selectedPractice && editingLocation && (
        <div className="modal-overlay" onClick={() => !isUpdatingLocation && setShowEditLocationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Location</h2>
              <button 
                className="modal-close"
                onClick={() => setShowEditLocationModal(false)}
                disabled={isUpdatingLocation}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-location-name">Name *</label>
                <input
                  type="text"
                  id="edit-location-name"
                  name="name"
                  value={editLocationFormData.name}
                  onChange={handleEditLocationInputChange}
                  placeholder="Enter location name"
                  disabled={isUpdatingLocation}
                  required
                />
                {editLocationFormErrors.name && <span className="error-text">{editLocationFormErrors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="edit-location-code">Code *</label>
                <input
                  type="text"
                  id="edit-location-code"
                  name="code"
                  value={editLocationFormData.code}
                  onChange={handleEditLocationInputChange}
                  placeholder="Enter location code"
                  disabled={isUpdatingLocation || checkingLocationCode}
                  required
                />
                {editLocationFormErrors.code && <span className="error-text">{editLocationFormErrors.code}</span>}
                {checkingLocationCode && <span className="error-text" style={{ color: '#6b7280' }}>Checking code...</span>}
              </div>

              {editLocationFormErrors.submit && (
                <div className="error-text" style={{ marginTop: '12px' }}>
                  {editLocationFormErrors.submit}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowEditLocationModal(false)}
                  disabled={isUpdatingLocation}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUpdatingLocation || checkingLocationCode}
                >
                  {isUpdatingLocation ? 'Updating...' : 'Update Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Practice Status Update Confirmation Modal */}
      {showStatusModal && statusUpdatePractice && (
        <div className="modal-overlay" onClick={() => !isUpdatingStatus && setShowStatusModal(false)}>
          <div className="modal-content status-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Status Update</h2>
              <button 
                className="modal-close"
                onClick={() => setShowStatusModal(false)}
                disabled={isUpdatingStatus}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="status-modal-body">
              <p className="status-modal-message">
                {statusUpdatePractice.status === 'ACTIVE' ? (
                  <>Are you sure you want to <span className="status-text-badge status-text-deactivate">deactivate</span> practice <strong>{statusUpdatePractice.name}</strong>?</>
                ) : (
                  <>Are you sure you want to <span className="status-text-badge status-text-activate">activate</span> practice <strong>{statusUpdatePractice.name}</strong>?</>
                )}
              </p>

              <div className="status-modal-actions">
                <button
                  type="button"
                  className="status-btn-no"
                  onClick={() => setShowStatusModal(false)}
                  disabled={isUpdatingStatus}
                >
                  NO
                </button>
                <button
                  type="button"
                  className={`status-btn-yes ${newStatus === 'ACTIVE' ? 'status-btn-activate' : 'status-btn-deactivate'}`}
                  onClick={handleConfirmStatusUpdate}
                  disabled={isUpdatingStatus}
                >
                  {isUpdatingStatus ? 'Updating...' : 'YES'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Status Update Confirmation Modal */}
      {showLocationStatusModal && statusUpdateLocation && selectedPractice && (
        <div className="modal-overlay" onClick={() => !isUpdatingLocationStatus && setShowLocationStatusModal(false)}>
          <div className="modal-content status-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Status Update</h2>
              <button 
                className="modal-close"
                onClick={() => setShowLocationStatusModal(false)}
                disabled={isUpdatingLocationStatus}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="status-modal-body">
              <p className="status-modal-message">
                {statusUpdateLocation.isActive ? (
                  <>Are you sure you want to <span className="status-text-badge status-text-deactivate">deactivate</span> location <strong>{statusUpdateLocation.name}</strong>?</>
                ) : (
                  <>Are you sure you want to <span className="status-text-badge status-text-activate">activate</span> location <strong>{statusUpdateLocation.name}</strong>?</>
                )}
              </p>

              <div className="status-modal-actions">
                <button
                  type="button"
                  className="status-btn-no"
                  onClick={() => setShowLocationStatusModal(false)}
                  disabled={isUpdatingLocationStatus}
                >
                  NO
                </button>
                <button
                  type="button"
                  className={`status-btn-yes ${newLocationStatus ? 'status-btn-activate' : 'status-btn-deactivate'}`}
                  onClick={handleConfirmLocationStatusUpdate}
                  disabled={isUpdatingLocationStatus}
                >
                  {isUpdatingLocationStatus ? 'Updating...' : 'YES'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Practices;
