import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { Edit, MapPin, Plus, Building2, Phone, Mail, Search, Info } from 'lucide-react';
import { countryCodes, parsePhoneNumber, formatPhoneNumber, getDefaultCountry, validatePhoneInput, getPhoneMaxLength, getPhonePlaceholder } from '../../utils/countryCodes';
import { usePermissions, PERMISSIONS } from '../../hooks/usePermissions';
import PermissionGuard from '../../components/PermissionGuard';
import { formatDateTime } from '../../utils/dateUtils';
import './Admin.css';

const Practices = () => {
  const { can } = usePermissions();
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
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    status: 'ACTIVE',
    contactNumber: '',
    email: ''
  });
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    status: 'ACTIVE',
    contactNumber: '',
    email: ''
  });

  const [locationFormData, setLocationFormData] = useState({
    name: '',
    code: '',
    status: 'ACTIVE',
    contactNumber: '',
    email: ''
  });

  const [editLocationFormData, setEditLocationFormData] = useState({
    name: '',
    code: '',
    status: 'ACTIVE',
    contactNumber: '',
    email: ''
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
  const [practiceCountryCode, setPracticeCountryCode] = useState(getDefaultCountry());
  const [editPracticeCountryCode, setEditPracticeCountryCode] = useState(getDefaultCountry());
  const [locationCountryCode, setLocationCountryCode] = useState(getDefaultCountry());
  const [editLocationCountryCode, setEditLocationCountryCode] = useState(getDefaultCountry());
  
  // Search states for country code selectors
  const [practiceCountrySearch, setPracticeCountrySearch] = useState('');
  const [editPracticeCountrySearch, setEditPracticeCountrySearch] = useState('');
  const [locationCountrySearch, setLocationCountrySearch] = useState('');
  const [editLocationCountrySearch, setEditLocationCountrySearch] = useState('');
  
  // Dropdown open states
  const [practiceCountryOpen, setPracticeCountryOpen] = useState(false);
  const [editPracticeCountryOpen, setEditPracticeCountryOpen] = useState(false);
  const [locationCountryOpen, setLocationCountryOpen] = useState(false);
  const [editLocationCountryOpen, setEditLocationCountryOpen] = useState(false);
  
  // Refs for dropdown triggers
  const practiceCountryRef = useRef(null);
  const editPracticeCountryRef = useRef(null);
  const locationCountryRef = useRef(null);
  const editLocationCountryRef = useRef(null);
  
  // Dropdown positions for portals
  const [practiceCountryPos, setPracticeCountryPos] = useState(null);
  const [editPracticeCountryPos, setEditPracticeCountryPos] = useState(null);
  const [locationCountryPos, setLocationCountryPos] = useState(null);
  const [editLocationCountryPos, setEditLocationCountryPos] = useState(null);
  
  // Function to calculate dropdown position
  const calculateDropdownPosition = (ref, setPosition) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;
    
    setPosition({
      top: rect.bottom + scrollY + 4,
      left: rect.left + scrollX,
      width: Math.max(rect.width, 280) // Ensure minimum width of 280px
    });
  };

  useEffect(() => {
    fetchPractices();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const countryWrapper = event.target.closest('.country-code-select-wrapper');
      const countryDropdown = event.target.closest('.country-code-dropdown');
      if (!countryWrapper && !countryDropdown) {
        setPracticeCountryOpen(false);
        setEditPracticeCountryOpen(false);
        setLocationCountryOpen(false);
        setEditLocationCountryOpen(false);
        setPracticeCountryPos(null);
        setEditPracticeCountryPos(null);
        setLocationCountryPos(null);
        setEditLocationCountryPos(null);
      }
    };
    
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Update dropdown positions on scroll/resize
  useEffect(() => {
    const updatePositions = () => {
      if (practiceCountryOpen && practiceCountryRef.current) {
        calculateDropdownPosition(practiceCountryRef, setPracticeCountryPos);
      }
      if (editPracticeCountryOpen && editPracticeCountryRef.current) {
        calculateDropdownPosition(editPracticeCountryRef, setEditPracticeCountryPos);
      }
      if (locationCountryOpen && locationCountryRef.current) {
        calculateDropdownPosition(locationCountryRef, setLocationCountryPos);
      }
      if (editLocationCountryOpen && editLocationCountryRef.current) {
        calculateDropdownPosition(editLocationCountryRef, setEditLocationCountryPos);
      }
    };
    
    window.addEventListener('scroll', updatePositions, true);
    window.addEventListener('resize', updatePositions);
    
    return () => {
      window.removeEventListener('scroll', updatePositions, true);
      window.removeEventListener('resize', updatePositions);
    };
  }, [practiceCountryOpen, editPracticeCountryOpen, locationCountryOpen, editLocationCountryOpen]);

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
      const phoneNumber = formData.contactNumber || '';
      const fullPhoneNumber = phoneNumber ? formatPhoneNumber(practiceCountryCode, phoneNumber) : '';
      
      const practiceData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        status: formData.status,
        contactNumber: fullPhoneNumber || null,
        email: formData.email.trim() || null
      };

      await api.createPractice(practiceData);
      
      setShowAddModal(false);
      setFormData({
        name: '',
        code: '',
        status: 'ACTIVE',
        contactNumber: '',
        email: ''
      });
      setPracticeCountryCode(getDefaultCountry());
      setFormErrors({});
      setPracticeCountrySearch('');
      setPracticeCountryOpen(false);
      setPracticeCountryPos(null);
      
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
    // Parse phone number to extract country code
    const phone = practice.contactNumber || '';
    const parsed = parsePhoneNumber(phone);
    setEditPracticeCountryCode(parsed.countryCode || getDefaultCountry());
    
    setEditFormData({
      name: practice.name || '',
      code: practice.code || '',
      status: practice.status || 'ACTIVE',
      contactNumber: parsed.phoneNumber,
      email: practice.email || ''
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
      const phoneNumber = editFormData.contactNumber || '';
      const fullPhoneNumber = phoneNumber ? formatPhoneNumber(editPracticeCountryCode, phoneNumber) : '';
      
      const updateData = {
        name: editFormData.name.trim(),
        code: editFormData.code.trim(),
        contactNumber: fullPhoneNumber || null,
        email: editFormData.email.trim() || null
      };

      await api.updatePractice(editingPractice.practiceId, updateData);
      
      setShowEditModal(false);
      setEditingPractice(null);
      setEditPracticeCountryCode(getDefaultCountry());
      setEditFormErrors({});
      setEditPracticeCountrySearch('');
      setEditPracticeCountryOpen(false);
      setEditPracticeCountryPos(null);
      
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
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddLocationClick = (practice) => {
    setSelectedPractice(practice);
    setLocationFormData({
      name: '',
      code: '',
      isActive: true,
      contactNumber: '',
      email: ''
    });
    setLocationCountryCode(getDefaultCountry());
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
      const phoneNumber = locationFormData.contactNumber || '';
      const fullPhoneNumber = phoneNumber ? formatPhoneNumber(locationCountryCode, phoneNumber) : '';
      
      const locationData = {
        name: locationFormData.name.trim(),
        code: locationFormData.code.trim(),
        status: locationFormData.status,
        contactNumber: fullPhoneNumber || null,
        email: locationFormData.email.trim() || null
      };

      await api.createPracticeLocation(selectedPractice.practiceId, locationData);
      
      setShowLocationModal(false);
      setSelectedPractice(null);
      setLocationFormData({
        name: '',
        code: '',
        status: 'ACTIVE',
        contactNumber: '',
        email: ''
      });
      setLocationCountryCode(getDefaultCountry());
      setLocationFormErrors({});
      setLocationCountrySearch('');
      setLocationCountryOpen(false);
      setLocationCountryPos(null);
      
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
    // Parse phone number to extract country code
    const phone = location.contactNumber || '';
    const parsed = parsePhoneNumber(phone);
    setEditLocationCountryCode(parsed.countryCode || getDefaultCountry());
    
    setEditLocationFormData({
      name: location.name || '',
      code: location.code || '',
      status: location.status || (location.isActive ? 'ACTIVE' : 'INACTIVE'),
      contactNumber: parsed.phoneNumber,
      email: location.email || ''
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
      const phoneNumber = editLocationFormData.contactNumber || '';
      const fullPhoneNumber = phoneNumber ? formatPhoneNumber(editLocationCountryCode, phoneNumber) : '';
      
      const updateData = {
        name: editLocationFormData.name.trim(),
        code: editLocationFormData.code.trim(),
        status: editLocationFormData.status,
        contactNumber: fullPhoneNumber || null,
        email: editLocationFormData.email.trim() || null
      };

      await api.updatePracticeLocation(selectedPractice.practiceId, editingLocation.locationId, updateData);
      
      setShowEditLocationModal(false);
      setSelectedPractice(null);
      setEditingLocation(null);
      setEditLocationCountryCode(getDefaultCountry());
      setEditLocationFormErrors({});
      setEditLocationCountrySearch('');
      setEditLocationCountryOpen(false);
      setEditLocationCountryPos(null);
      
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
    } finally {
      setIsUpdatingLocationStatus(false);
    }
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };



  // Filter countries based on search term
  const filterCountries = (searchTerm) => {
    if (!searchTerm) return countryCodes;
    const lowerSearch = searchTerm.toLowerCase();
    return countryCodes.filter(country => 
      country.name.toLowerCase().includes(lowerSearch) ||
      country.dialCode.includes(lowerSearch) ||
      country.code.toLowerCase().includes(lowerSearch)
    );
  };

  const filteredPractices = practices.filter(practice => {
    const searchLower = searchTerm.toLowerCase();
    
    // Check if practice matches
    const practiceMatches = !searchTerm || 
      practice.name?.toLowerCase().includes(searchLower) ||
      practice.code?.toLowerCase().includes(searchLower);
    
    // Check if any location within the practice matches
    const locationMatches = !searchTerm || (practice.locations && practice.locations.some(location =>
      location.name?.toLowerCase().includes(searchLower) ||
      location.code?.toLowerCase().includes(searchLower)
    ));
    
    const matchesSearch = practiceMatches || locationMatches;
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
          <p className="page-subtitle">Manage practices and locations.</p>
        </div>
        <PermissionGuard permission={PERMISSIONS.PRACTICE_CREATE}>
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
            New Practice
          </button>
        </PermissionGuard>
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
            <Search size={20} style={{ color: '#6b7280', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search practices and locations..."
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

      <div className="practices-list">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Loading practices...
          </div>
        ) : filteredPractices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No practices found
          </div>
        ) : (
          filteredPractices.map((practice) => (
            <div key={practice.practiceId} className="practice-card">
              <>
              <div className="practice-header">
                <div className="practice-info">
                  <div className="practice-icon">
                    <Building2 size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 className="practice-name" style={{ margin: 0 }}>{practice.name || '-'}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p className="practice-code" style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                          Code: {practice.code || '-'}
                        </p>
                        {(practice.createdByMeta || practice.updatedByMeta) && (
                          <div className="info-icon-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                            <Info 
                              size={16} 
                              style={{ 
                                color: '#374151', 
                                cursor: 'pointer',
                                transition: 'color 0.2s',
                                fontWeight: 'bold',
                                strokeWidth: 2.5
                              }}
                              onMouseEnter={(e) => e.target.style.color = '#0d9488'}
                              onMouseLeave={(e) => e.target.style.color = '#374151'}
                            />
                            <div className="info-tooltip">
                              {practice.createdByMeta && (
                                <div className="tooltip-line">
                                  Created by <strong>{practice.createdByMeta.fullName || 'N/A'}</strong> on {formatDateTime(practice.createdAt) || '-'}
                                </div>
                              )}
                              {practice.updatedByMeta && (
                                <div className="tooltip-line">
                                  Updated by <strong>{practice.updatedByMeta.fullName || 'N/A'}</strong> on {formatDateTime(practice.updatedAt) || '-'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      {practice.contactNumber && (
                        <a 
                          href={`tel:${practice.contactNumber.replace(/\s/g, '')}`}
                          className="practice-contact"
                          style={{ 
                            fontSize: '13px', 
                            color: '#6b7280', 
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            transition: 'color 0.2s',
                            lineHeight: '1.5'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#0d9488';
                            const svg = e.currentTarget.querySelector('svg');
                            if (svg) svg.style.color = '#0d9488';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6b7280';
                            const svg = e.currentTarget.querySelector('svg');
                            if (svg) svg.style.color = '#6b7280';
                          }}
                        >
                          <Phone size={14} style={{ color: '#6b7280', transition: 'color 0.2s', flexShrink: 0, marginTop: '1px' }} />
                          <span>{practice.contactNumber}</span>
                        </a>
                      )}
                      {practice.email && (
                        <a 
                          href={`mailto:${practice.email}`}
                          className="practice-email"
                          style={{ 
                            fontSize: '13px', 
                            color: '#6b7280', 
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                            transition: 'color 0.2s',
                            lineHeight: '1.5'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#0d9488';
                            const svg = e.currentTarget.querySelector('svg');
                            if (svg) svg.style.color = '#0d9488';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#6b7280';
                            const svg = e.currentTarget.querySelector('svg');
                            if (svg) svg.style.color = '#6b7280';
                          }}
                        >
                          <Mail size={14} style={{ color: '#6b7280', transition: 'color 0.2s', flexShrink: 0, marginTop: '1px' }} />
                          <span>{practice.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="practice-actions">
                  <PermissionGuard permission={PERMISSIONS.PRACTICE_UPDATE_STATUS}>
                    <span 
                      className={`status-badge clickable ${practice.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                      onClick={() => handleStatusToggle(practice)}
                      title={`Click to ${practice.status === 'ACTIVE' ? 'deactivate' : 'activate'} practice`}
                    >
                      {formatStatus(practice.status)}
                    </span>
                  </PermissionGuard>
                  {!can(PERMISSIONS.PRACTICE_UPDATE_STATUS) && (
                    <span 
                      className={`status-badge ${practice.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                    >
                      {formatStatus(practice.status)}
                    </span>
                  )}
                  <PermissionGuard permission={PERMISSIONS.PRACTICE_UPDATE}>
                    <button 
                      className="btn-secondary"
                      onClick={() => handleEditClick(practice)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                  </PermissionGuard>
                  <PermissionGuard permission={PERMISSIONS.PRACTICE_LOCATION_CREATE}>
                    <button 
                      className="btn-primary"
                      onClick={() => handleAddLocationClick(practice)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Plus size={16} />
                      Add Location
                    </button>
                  </PermissionGuard>
                </div>
              </div>
              {practice.locations && practice.locations.length > 0 && (
                <div className="locations-section">
                  <p className="locations-count">{practice.locations.length} Locations:</p>
                  <div className="locations-grid">
                    {practice.locations.map((location) => (
                      <div key={location.locationId} className="location-item">
                        <MapPin size={18} style={{ color: '#6b7280', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span className="location-name" style={{ margin: 0, display: 'inline-block', verticalAlign: 'middle' }}>{location.name || '-'}</span>
                            {(location.createdByMeta || location.updatedByMeta) && (
                              <div className="info-icon-wrapper" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
                                <Info 
                                  size={16} 
                                  style={{ 
                                    color: '#374151', 
                                    cursor: 'pointer',
                                    transition: 'color 0.2s',
                                    fontWeight: 'bold',
                                    strokeWidth: 2.5,
                                    display: 'block'
                                  }}
                                  onMouseEnter={(e) => e.target.style.color = '#0d9488'}
                                  onMouseLeave={(e) => e.target.style.color = '#374151'}
                                />
                                <div className="info-tooltip">
                                  {location.createdByMeta && (
                                    <div className="tooltip-line">
                                      Created by <strong>{location.createdByMeta.fullName || 'N/A'}</strong> on {formatDateTime(location.createdAt) || '-'}
                                    </div>
                                  )}
                                  {location.updatedByMeta && (
                                    <div className="tooltip-line">
                                      Updated by <strong>{location.updatedByMeta.fullName || 'N/A'}</strong> on {formatDateTime(location.updatedAt) || '-'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="location-code">Code: {location.code || '-'}</div>
                          {location.contactNumber && (
                            <div style={{ marginTop: '4px' }}>
                              <a 
                                href={`tel:${location.contactNumber.replace(/\s/g, '')}`}
                                style={{ 
                                  fontSize: '12px', 
                                  color: '#6b7280', 
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  whiteSpace: 'nowrap',
                                  transition: 'color 0.2s',
                                  lineHeight: '1.5'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#0d9488';
                                  const svg = e.currentTarget.querySelector('svg');
                                  if (svg) svg.style.color = '#0d9488';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#6b7280';
                                  const svg = e.currentTarget.querySelector('svg');
                                  if (svg) svg.style.color = '#6b7280';
                                }}
                              >
                                <Phone size={14} style={{ color: '#6b7280', transition: 'color 0.2s', flexShrink: 0, marginTop: '1px' }} />
                                <span>{location.contactNumber}</span>
                              </a>
                            </div>
                          )}
                          {location.email && (
                            <div style={{ marginTop: location.contactNumber ? '2px' : '4px' }}>
                              <a 
                                href={`mailto:${location.email}`}
                                style={{ 
                                  fontSize: '12px', 
                                  color: '#6b7280', 
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  whiteSpace: 'nowrap',
                                  transition: 'color 0.2s',
                                  lineHeight: '1.5'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = '#0d9488';
                                  const svg = e.currentTarget.querySelector('svg');
                                  if (svg) svg.style.color = '#0d9488';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = '#6b7280';
                                  const svg = e.currentTarget.querySelector('svg');
                                  if (svg) svg.style.color = '#6b7280';
                                }}
                              >
                                <Mail size={14} style={{ color: '#6b7280', transition: 'color 0.2s', flexShrink: 0, marginTop: '1px' }} />
                                <span>{location.email}</span>
                              </a>
                            </div>
                          )}
                        </div>
                        <PermissionGuard permission={PERMISSIONS.PRACTICE_LOCATION_STATUS_UPDATE}>
                          <span 
                            className={`status-badge clickable ${location.isActive ? 'status-active' : 'status-inactive'}`}
                            onClick={() => handleLocationStatusToggle(practice, location)}
                            title={`Click to ${location.isActive ? 'deactivate' : 'activate'} location`}
                          >
                            {location.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </PermissionGuard>
                        {!can(PERMISSIONS.PRACTICE_LOCATION_STATUS_UPDATE) && (
                          <span 
                            className={`status-badge ${location.isActive ? 'status-active' : 'status-inactive'}`}
                          >
                            {location.isActive ? 'Active' : 'Inactive'}
                          </span>
                        )}
                        <PermissionGuard permission={PERMISSIONS.PRACTICE_LOCATION_UPDATE}>
                          <Edit
                            size={16}
                            style={{
                              color: '#3b82f6',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            onClick={() => handleEditLocationClick(practice, location)}
                            title="Edit location"
                          />
                        </PermissionGuard>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </>
            </div>
          ))
        )}
      </div>

      {/* Add Practice Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (!isSubmitting && !e.target.closest('.country-code-dropdown')) {
            setShowAddModal(false);
            setPracticeCountryOpen(false);
            setPracticeCountryPos(null);
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Practice</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setPracticeCountryOpen(false);
                  setPracticeCountryPos(null);
                }}
                disabled={isSubmitting}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
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
              </div>

              <div className="form-group">
                <label htmlFor="contactNumber">Phone</label>
                <div className="phone-input-group">
                  <div className="country-code-select-wrapper">
                    <div 
                      ref={practiceCountryRef}
                      className="country-code-select"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isSubmitting) {
                          const isOpening = !practiceCountryOpen;
                          setPracticeCountryOpen(prev => !prev);
                          if (isOpening) {
                            setTimeout(() => calculateDropdownPosition(practiceCountryRef, setPracticeCountryPos), 0);
                          } else {
                            setPracticeCountryPos(null);
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer', position: 'relative', pointerEvents: 'auto' }}
                    >
                      <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif', fontWeight: '500', fontSize: '14px' }}>
                        {practiceCountryCode.flag} {practiceCountryCode.dialCode}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px' }}>
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {practiceCountryOpen && !isSubmitting && practiceCountryPos && createPortal(
                    <div 
                      className="country-code-dropdown portal-dropdown" 
                      style={{
                        position: 'fixed',
                        top: `${practiceCountryPos.top}px`,
                        left: `${practiceCountryPos.left}px`,
                        width: `${practiceCountryPos.width}px`,
                        zIndex: 10050
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="country-code-search"
                        placeholder="Search country..."
                        value={practiceCountrySearch}
                        onChange={(e) => setPracticeCountrySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="country-code-list">
                        {filterCountries(practiceCountrySearch).map((country) => (
                          <div
                            key={country.code}
                            className={`country-code-option ${practiceCountryCode.code === country.code ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPracticeCountryCode(country);
                              setPracticeCountrySearch('');
                              setPracticeCountryOpen(false);
                              setPracticeCountryPos(null);
                              // Validate existing phone number when country changes
                              if (formData.contactNumber) {
                                const validated = validatePhoneInput(formData.contactNumber, country);
                                setFormData(prev => ({
                                  ...prev,
                                  contactNumber: validated
                                }));
                              }
                            }}
                          >
                            <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif', fontWeight: '500', fontSize: '14px' }}>
                              {country.flag} {country.dialCode}
                            </span>
                            <span className="country-name">{country.name}</span>
                          </div>
                        ))}
                        {filterCountries(practiceCountrySearch).length === 0 && (
                          <div className="country-code-option no-results">No countries found</div>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber || ''}
                    onChange={(e) => {
                      const validated = validatePhoneInput(e.target.value, practiceCountryCode);
                      setFormData(prev => ({
                        ...prev,
                        contactNumber: validated
                      }));
                    }}
                    className="phone-input"
                    placeholder={getPhonePlaceholder(practiceCountryCode)}
                    maxLength={getPhoneMaxLength(practiceCountryCode)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    disabled={isSubmitting}
                  />
                  {formErrors.email && <span className="error-text">{formErrors.email}</span>}
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
                  onClick={() => {
                    setShowAddModal(false);
                    setPracticeCountryOpen(false);
                    setPracticeCountryPos(null);
                  }}
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
        <div className="modal-overlay" onClick={(e) => {
          if (!isUpdating && !e.target.closest('.country-code-dropdown')) {
            setShowEditModal(false);
            setEditPracticeCountryOpen(false);
            setEditPracticeCountryPos(null);
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Practice</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setEditPracticeCountryOpen(false);
                  setEditPracticeCountryPos(null);
                }}
                disabled={isUpdating}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdatePractice} className="modal-form">
              <div className="form-row">
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
              </div>

              <div className="form-group">
                <label htmlFor="edit-contactNumber">Phone</label>
                <div className="phone-input-group">
                  <div className="country-code-select-wrapper">
                    <div 
                      ref={editPracticeCountryRef}
                      className="country-code-select"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isUpdating) {
                          const isOpening = !editPracticeCountryOpen;
                          setEditPracticeCountryOpen(prev => !prev);
                          if (isOpening) {
                            setTimeout(() => calculateDropdownPosition(editPracticeCountryRef, setEditPracticeCountryPos), 0);
                          } else {
                            setEditPracticeCountryPos(null);
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ cursor: isUpdating ? 'not-allowed' : 'pointer', position: 'relative', pointerEvents: 'auto' }}
                    >
                      <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif', fontWeight: '500', fontSize: '14px' }}>
                        {editPracticeCountryCode.flag} {editPracticeCountryCode.dialCode}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px' }}>
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {editPracticeCountryOpen && !isUpdating && editPracticeCountryPos && createPortal(
                    <div 
                      className="country-code-dropdown portal-dropdown" 
                      style={{
                        position: 'fixed',
                        top: `${editPracticeCountryPos.top}px`,
                        left: `${editPracticeCountryPos.left}px`,
                        width: `${editPracticeCountryPos.width}px`,
                        zIndex: 10050
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="country-code-search"
                        placeholder="Search country..."
                        value={editPracticeCountrySearch}
                        onChange={(e) => setEditPracticeCountrySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="country-code-list">
                        {filterCountries(editPracticeCountrySearch).map((country) => (
                          <div
                            key={country.code}
                            className={`country-code-option ${editPracticeCountryCode.code === country.code ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditPracticeCountryCode(country);
                              setEditPracticeCountrySearch('');
                              setEditPracticeCountryOpen(false);
                              setEditPracticeCountryPos(null);
                              // Validate existing phone number when country changes
                              if (editFormData.contactNumber) {
                                const validated = validatePhoneInput(editFormData.contactNumber, country);
                                setEditFormData(prev => ({
                                  ...prev,
                                  contactNumber: validated
                                }));
                              }
                            }}
                          >
                            <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif', fontWeight: '500', fontSize: '14px' }}>
                              {country.flag} {country.dialCode}
                            </span>
                            <span className="country-name">{country.name}</span>
                          </div>
                        ))}
                        {filterCountries(editPracticeCountrySearch).length === 0 && (
                          <div className="country-code-option no-results">No countries found</div>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                  <input
                    type="tel"
                    id="edit-contactNumber"
                    name="contactNumber"
                    value={editFormData.contactNumber || ''}
                    onChange={(e) => {
                      const validated = validatePhoneInput(e.target.value, editPracticeCountryCode);
                      setEditFormData(prev => ({
                        ...prev,
                        contactNumber: validated
                      }));
                    }}
                    className="phone-input"
                    placeholder={getPhonePlaceholder(editPracticeCountryCode)}
                    maxLength={getPhoneMaxLength(editPracticeCountryCode)}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    placeholder="Enter email address"
                    disabled={isUpdating}
                  />
                  {editFormErrors.email && <span className="error-text">{editFormErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-status">Status *</label>
                  <select
                    id="edit-status"
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                    disabled={isUpdating}
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
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
                  onClick={() => {
                  setShowEditModal(false);
                  setEditPracticeCountryOpen(false);
                  setEditPracticeCountryPos(null);
                }}
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
        <div className="modal-overlay" onClick={(e) => {
          if (!isSubmittingLocation && !e.target.closest('.country-code-dropdown')) {
            setShowLocationModal(false);
            setLocationCountryOpen(false);
            setLocationCountryPos(null);
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Location to {selectedPractice.name}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationCountryOpen(false);
                  setLocationCountryPos(null);
                }}
                disabled={isSubmittingLocation}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleLocationSubmit} className="modal-form">
              <div className="form-row">
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
              </div>

              <div className="form-group">
                <label htmlFor="location-contactNumber">Phone</label>
                <div className="phone-input-group">
                  <div className="country-code-select-wrapper">
                    <div 
                      ref={locationCountryRef}
                      className="country-code-select"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isSubmittingLocation) {
                          const isOpening = !locationCountryOpen;
                          setLocationCountryOpen(prev => !prev);
                          if (isOpening) {
                            setTimeout(() => calculateDropdownPosition(locationCountryRef, setLocationCountryPos), 0);
                          } else {
                            setLocationCountryPos(null);
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ cursor: isSubmittingLocation ? 'not-allowed' : 'pointer', position: 'relative', pointerEvents: 'auto' }}
                    >
                      <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif', fontWeight: '500', fontSize: '14px' }}>
                        {locationCountryCode.flag} {locationCountryCode.dialCode}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px' }}>
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {locationCountryOpen && !isSubmittingLocation && locationCountryPos && createPortal(
                    <div 
                      className="country-code-dropdown portal-dropdown" 
                      style={{
                        position: 'fixed',
                        top: `${locationCountryPos.top}px`,
                        left: `${locationCountryPos.left}px`,
                        width: `${locationCountryPos.width}px`,
                        zIndex: 10050
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="country-code-search"
                        placeholder="Search country..."
                        value={locationCountrySearch}
                        onChange={(e) => setLocationCountrySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="country-code-list">
                        {filterCountries(locationCountrySearch).map((country) => (
                          <div
                            key={country.code}
                            className={`country-code-option ${locationCountryCode.code === country.code ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocationCountryCode(country);
                              setLocationCountrySearch('');
                              setLocationCountryOpen(false);
                              setLocationCountryPos(null);
                              // Validate existing phone number when country changes
                              if (locationFormData.contactNumber) {
                                const validated = validatePhoneInput(locationFormData.contactNumber, country);
                                setLocationFormData(prev => ({
                                  ...prev,
                                  contactNumber: validated
                                }));
                              }
                            }}
                          >
                            <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif', fontWeight: '500', fontSize: '14px' }}>
                              {country.flag} {country.dialCode}
                            </span>
                            <span className="country-name">{country.name}</span>
                          </div>
                        ))}
                        {filterCountries(locationCountrySearch).length === 0 && (
                          <div className="country-code-option no-results">No countries found</div>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                  <input
                    type="tel"
                    id="location-contactNumber"
                    name="contactNumber"
                    value={locationFormData.contactNumber || ''}
                    onChange={(e) => {
                      const validated = validatePhoneInput(e.target.value, locationCountryCode);
                      setLocationFormData(prev => ({
                        ...prev,
                        contactNumber: validated
                      }));
                    }}
                    className="phone-input"
                    placeholder={getPhonePlaceholder(locationCountryCode)}
                    maxLength={getPhoneMaxLength(locationCountryCode)}
                    disabled={isSubmittingLocation}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location-email">Email</label>
                  <input
                    type="email"
                    id="location-email"
                    name="email"
                    value={locationFormData.email}
                    onChange={handleLocationInputChange}
                    placeholder="Enter email address"
                    disabled={isSubmittingLocation}
                  />
                  {locationFormErrors.email && <span className="error-text">{locationFormErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="location-status">Status *</label>
                  <select
                    id="location-status"
                    name="status"
                    value={locationFormData.status}
                    onChange={handleLocationInputChange}
                    disabled={isSubmittingLocation}
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
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
                  onClick={() => {
                  setShowLocationModal(false);
                  setLocationCountryOpen(false);
                  setLocationCountryPos(null);
                }}
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
        <div className="modal-overlay" onClick={(e) => {
          if (!isUpdatingLocation && !e.target.closest('.country-code-dropdown')) {
            setShowEditLocationModal(false);
            setEditLocationCountryOpen(false);
            setEditLocationCountryPos(null);
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Location</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowEditLocationModal(false);
                  setEditLocationCountryOpen(false);
                  setEditLocationCountryPos(null);
                }}
                disabled={isUpdatingLocation}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="modal-form">
              <div className="form-row">
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
              </div>

              <div className="form-group">
                <label htmlFor="edit-location-contactNumber">Phone</label>
                <div className="phone-input-group">
                  <div className="country-code-select-wrapper">
                    <div 
                      ref={editLocationCountryRef}
                      className="country-code-select"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isUpdatingLocation) {
                          const isOpening = !editLocationCountryOpen;
                          setEditLocationCountryOpen(prev => !prev);
                          if (isOpening) {
                            setTimeout(() => calculateDropdownPosition(editLocationCountryRef, setEditLocationCountryPos), 0);
                          } else {
                            setEditLocationCountryPos(null);
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ cursor: isUpdatingLocation ? 'not-allowed' : 'pointer', position: 'relative', pointerEvents: 'auto' }}
                    >
                      <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif', fontWeight: '500', fontSize: '14px' }}>
                        {editLocationCountryCode.flag} {editLocationCountryCode.dialCode}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px' }}>
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {editLocationCountryOpen && !isUpdatingLocation && editLocationCountryPos && createPortal(
                    <div 
                      className="country-code-dropdown portal-dropdown" 
                      style={{
                        position: 'fixed',
                        top: `${editLocationCountryPos.top}px`,
                        left: `${editLocationCountryPos.left}px`,
                        width: `${editLocationCountryPos.width}px`,
                        zIndex: 10050
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="country-code-search"
                        placeholder="Search country..."
                        value={editLocationCountrySearch}
                        onChange={(e) => setEditLocationCountrySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="country-code-list">
                        {filterCountries(editLocationCountrySearch).map((country) => (
                          <div
                            key={country.code}
                            className={`country-code-option ${editLocationCountryCode.code === country.code ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditLocationCountryCode(country);
                              setEditLocationCountrySearch('');
                              setEditLocationCountryOpen(false);
                              setEditLocationCountryPos(null);
                              // Validate existing phone number when country changes
                              if (editLocationFormData.contactNumber) {
                                const validated = validatePhoneInput(editLocationFormData.contactNumber, country);
                                setEditLocationFormData(prev => ({
                                  ...prev,
                                  contactNumber: validated
                                }));
                              }
                            }}
                          >
                            <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif', fontWeight: '500', fontSize: '14px' }}>
                              {country.flag} {country.dialCode}
                            </span>
                            <span className="country-name">{country.name}</span>
                          </div>
                        ))}
                        {filterCountries(editLocationCountrySearch).length === 0 && (
                          <div className="country-code-option no-results">No countries found</div>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                  <input
                    type="tel"
                    id="edit-location-contactNumber"
                    name="contactNumber"
                    value={editLocationFormData.contactNumber || ''}
                    onChange={(e) => {
                      const validated = validatePhoneInput(e.target.value, editLocationCountryCode);
                      setEditLocationFormData(prev => ({
                        ...prev,
                        contactNumber: validated
                      }));
                    }}
                    className="phone-input"
                    placeholder={getPhonePlaceholder(editLocationCountryCode)}
                    maxLength={getPhoneMaxLength(editLocationCountryCode)}
                    disabled={isUpdatingLocation}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-location-email">Email</label>
                  <input
                    type="email"
                    id="edit-location-email"
                    name="email"
                    value={editLocationFormData.email}
                    onChange={handleEditLocationInputChange}
                    placeholder="Enter email address"
                    disabled={isUpdatingLocation}
                  />
                  {editLocationFormErrors.email && <span className="error-text">{editLocationFormErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-location-status">Status *</label>
                  <select
                    id="edit-location-status"
                    name="status"
                    value={editLocationFormData.status}
                    onChange={handleEditLocationInputChange}
                    disabled={isUpdatingLocation}
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
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
                  onClick={() => {
                  setShowEditLocationModal(false);
                  setEditLocationCountryOpen(false);
                  setEditLocationCountryPos(null);
                }}
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
