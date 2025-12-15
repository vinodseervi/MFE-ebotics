import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../services/api';
import { Edit, Info } from 'lucide-react';
import { countryCodes, parsePhoneNumber, formatPhoneNumber, getDefaultCountry, validatePhoneInput, getPhoneMaxLength, getPhonePlaceholder } from '../../utils/countryCodes';
import { usePermissions, PERMISSIONS } from '../../hooks/usePermissions';
import PermissionGuard from '../../components/PermissionGuard';
import { formatDateTime } from '../../utils/dateUtils';
import './Admin.css';

const Users = () => {
  const { can } = usePermissions();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    status: 'ACTIVE',
    phone: '',
    phoneNumber: ''
  });
  const [editCountryCode, setEditCountryCode] = useState(getDefaultCountry());
  const [addCountryCode, setAddCountryCode] = useState(getDefaultCountry());
  // Country code dropdown states
  const [editCountryOpen, setEditCountryOpen] = useState(false);
  const [editCountrySearch, setEditCountrySearch] = useState('');
  const [addCountryOpen, setAddCountryOpen] = useState(false);
  const [addCountrySearch, setAddCountrySearch] = useState('');
  // Role dropdown states
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [addRoleSearch, setAddRoleSearch] = useState('');
  const [editRoleOpen, setEditRoleOpen] = useState(false);
  const [editRoleSearch, setEditRoleSearch] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    roleId: '',
    status: 'ACTIVE',
    phone: '',
    phoneNumber: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateUser, setStatusUpdateUser] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedRole, setSelectedRole] = useState('All Roles');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  
  // Refs for dropdown triggers
  const addCountryRef = useRef(null);
  const addRoleRef = useRef(null);
  const editCountryRef = useRef(null);
  const editRoleRef = useRef(null);
  
  // Dropdown positions for portals
  const [addCountryPos, setAddCountryPos] = useState(null);
  const [addRolePos, setAddRolePos] = useState(null);
  const [editCountryPos, setEditCountryPos] = useState(null);
  const [editRolePos, setEditRolePos] = useState(null);
  
  // Function to find all scrollable containers
  const findScrollableContainers = (element) => {
    const containers = [];
    let current = element;
    
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY || style.overflow;
      const overflowX = style.overflowX || style.overflow;
      
      if (overflowY === 'auto' || overflowY === 'scroll' || 
          overflowX === 'auto' || overflowX === 'scroll') {
        containers.push(current);
      }
      
      current = current.parentElement;
    }
    
    // Always include window
    containers.push(window);
    
    return containers;
  };

  // Function to calculate dropdown position
  const calculateDropdownPosition = (ref, setPosition) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 280) // Ensure minimum width of 280px
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside country code dropdowns (including portal dropdowns)
      const countryWrapper = event.target.closest('.country-code-select-wrapper');
      const countryDropdown = event.target.closest('.country-code-dropdown');
      if (!countryWrapper && !countryDropdown) {
        setEditCountryOpen(false);
        setAddCountryOpen(false);
        setEditCountryPos(null);
        setAddCountryPos(null);
      }
      
      // Check if click is outside role dropdowns (including portal dropdowns)
      const roleWrapper = event.target.closest('.role-select-wrapper');
      const roleDropdown = event.target.closest('.role-dropdown');
      if (!roleWrapper && !roleDropdown) {
        setAddRoleOpen(false);
        setEditRoleOpen(false);
        setAddRolePos(null);
        setEditRolePos(null);
      }
    };
    
    // Use a small delay to allow React state updates to complete
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
      if (addCountryOpen && addCountryRef.current) {
        calculateDropdownPosition(addCountryRef, setAddCountryPos);
      }
      if (addRoleOpen && addRoleRef.current) {
        calculateDropdownPosition(addRoleRef, setAddRolePos);
      }
      if (editCountryOpen && editCountryRef.current) {
        calculateDropdownPosition(editCountryRef, setEditCountryPos);
      }
      if (editRoleOpen && editRoleRef.current) {
        calculateDropdownPosition(editRoleRef, setEditRolePos);
      }
    };
    
    // Find all scrollable containers for each open dropdown
    const scrollableContainers = new Set();
    
    if (addCountryOpen && addCountryRef.current) {
      findScrollableContainers(addCountryRef.current).forEach(container => scrollableContainers.add(container));
    }
    if (addRoleOpen && addRoleRef.current) {
      findScrollableContainers(addRoleRef.current).forEach(container => scrollableContainers.add(container));
    }
    if (editCountryOpen && editCountryRef.current) {
      findScrollableContainers(editCountryRef.current).forEach(container => scrollableContainers.add(container));
    }
    if (editRoleOpen && editRoleRef.current) {
      findScrollableContainers(editRoleRef.current).forEach(container => scrollableContainers.add(container));
    }
    
    // Add scroll listeners to all scrollable containers
    const cleanupFunctions = [];
    scrollableContainers.forEach(container => {
      if (container === window) {
        container.addEventListener('scroll', updatePositions, true);
        container.addEventListener('resize', updatePositions);
        cleanupFunctions.push(() => {
          container.removeEventListener('scroll', updatePositions, true);
          container.removeEventListener('resize', updatePositions);
        });
      } else {
        container.addEventListener('scroll', updatePositions, true);
        cleanupFunctions.push(() => {
          container.removeEventListener('scroll', updatePositions, true);
        });
      }
    });
    
    // Also listen to window resize
    window.addEventListener('resize', updatePositions);
    cleanupFunctions.push(() => {
      window.removeEventListener('resize', updatePositions);
    });
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [addCountryOpen, addRoleOpen, editCountryOpen, editRoleOpen]);

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

  // Filter roles based on search term
  const filterRoles = (searchTerm, rolesList) => {
    if (!searchTerm) return rolesList;
    const lowerSearch = searchTerm.toLowerCase();
    return rolesList.filter(role => 
      role.roleName?.toLowerCase().includes(lowerSearch) ||
      role.roleId?.toString().toLowerCase().includes(lowerSearch)
    );
  };


  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      // x-user-id header is automatically included via api service
      const data = await api.getPublicRoles();
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      console.error('Error status:', error.status);
      console.error('Error data:', error.data);
      setRoles([]);
      // Show error if it's a 403 (permission issue)
      if (error.status === 403 || (error.message && error.message.includes('403'))) {
        console.error('Permission denied: Make sure you are logged in and have the required permissions.');
        console.error('Current userId:', api.getUserId());
      }
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    const length = 10;
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '@#$%&*'[Math.floor(Math.random() * 6)];
    
    // Fill the rest
    for (let i = password.length; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.roleId) {
      errors.roleId = 'Role is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const password = generatePassword();
      const phoneNumber = formData.phone || formData.phoneNumber || '';
      const fullPhoneNumber = phoneNumber ? formatPhoneNumber(addCountryCode, phoneNumber) : '';
      
      // Send roleId to API (API should accept roleId)
      const userData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        roleId: formData.roleId,
        status: formData.status,
        password,
        phone: fullPhoneNumber,
        phoneNumber: fullPhoneNumber
      };

      const response = await api.createUser(userData);
      
      // Store the created user with password for display
      setCreatedUser({
        email: response.email || formData.email,
        password: password
      });
      
      setShowAddModal(false);
      setShowSuccessModal(true);
      
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        roleId: '',
        status: 'ACTIVE',
        phone: '',
        phoneNumber: ''
      });
      setAddCountryCode(getDefaultCountry());
      setAddRoleOpen(false);
      setAddCountryOpen(false);
      setAddRoleSearch('');
      setAddCountrySearch('');
      setAddRolePos(null);
      setAddCountryPos(null);
      
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.message || error.error || 'Failed to create user. Please try again.';
      setFormErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredentials = async () => {
    if (!createdUser) return;
    
    const text = `Email: ${createdUser.email}\nPassword: ${createdUser.password}`;
    
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const formatRole = (role, roleMeta) => {
    // Prefer roleMeta.name if available, otherwise use role string
    const roleName = roleMeta?.name || role;
    if (!roleName) return '';
    return roleName
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const getRoleColor = () => {
    // Single background color for all roles
    return { bg: 'rgb(243, 244, 246)', text: '#374151', border: '#e5e7eb' };
  };

  const getAvatarColor = (firstName, lastName) => {
    // Generate a consistent color based on user's initials
    const name = `${firstName || ''}${lastName || ''}`.toLowerCase();
    if (!name) return { bg: '#6b7280', text: '#ffffff' };
    
    // Professional, muted color palette - inspired by modern SaaS applications
    const colors = [
      { bg: '#0d9488', text: '#ffffff' }, // Teal
      { bg: '#3b82f6', text: '#ffffff' }, // Blue
      { bg: '#6366f1', text: '#ffffff' }, // Indigo
      { bg: '#8b5cf6', text: '#ffffff' }, // Purple
      { bg: '#06b6d4', text: '#ffffff' }, // Cyan
      { bg: '#14b8a6', text: '#ffffff' }, // Teal-500
      { bg: '#0ea5e9', text: '#ffffff' }, // Sky
      { bg: '#5b21b6', text: '#ffffff' }, // Purple-700
      { bg: '#0891b2', text: '#ffffff' }, // Cyan-600
      { bg: '#2563eb', text: '#ffffff' }, // Blue-600
      { bg: '#4f46e5', text: '#ffffff' }, // Indigo-600
      { bg: '#7c3aed', text: '#ffffff' }, // Violet-600
    ];
    
    // Simple hash function to consistently pick a color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userRoleName = formatRole(user.role, user.roleMeta);
    const matchesRole = selectedRole === 'All Roles' || userRoleName === selectedRole;
    const matchesStatus = selectedStatus === 'All Statuses' || formatStatus(user.status) === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = ['All Roles', ...Array.from(new Set(users.map(u => formatRole(u.role, u.roleMeta)).filter(Boolean)))];
  const uniqueStatuses = ['All Statuses', ...Array.from(new Set(users.map(u => formatStatus(u.status)).filter(Boolean)))];

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return '-';
    
    const now = new Date();
    const loginDate = new Date(lastLogin);
    const diffMs = now - loginDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins > 0) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      }
      return 'Just now';
    }
  };



  const handleEditClick = (user) => {
    setEditingUser(user);
    // Parse phone number to extract country code
    const phone = user.phone || user.phoneNumber || '';
    const parsed = parsePhoneNumber(phone);
    setEditCountryCode(parsed.countryCode || getDefaultCountry());
    
    // Use roleId from user object
    setEditFormData({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      roleId: user.roleId || '',
      status: user.status || 'ACTIVE',
      phone: parsed.phoneNumber,
      phoneNumber: parsed.phoneNumber
    });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (editFormErrors[name]) {
      setEditFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateEditForm = () => {
    const errors = {};
    
    if (!editFormData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!editFormData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!editFormData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!editFormData.roleId) {
      errors.roleId = 'Role is required';
    }
    
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) {
      return;
    }

    try {
      setIsUpdating(true);
      const phoneNumber = editFormData.phone || editFormData.phoneNumber || '';
      const fullPhoneNumber = phoneNumber ? formatPhoneNumber(editCountryCode, phoneNumber) : '';
      
      const updateData = {
        email: editFormData.email,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        roleId: editFormData.roleId,
        status: editFormData.status,
        phone: fullPhoneNumber,
        phoneNumber: fullPhoneNumber
      };

      await api.updateUser(editingUser.id, updateData);
      
      setShowEditModal(false);
      setEditingUser(null);
      setEditCountryCode(getDefaultCountry());
      setEditRoleOpen(false);
      setEditCountryOpen(false);
      setEditRoleSearch('');
      setEditCountrySearch('');
      setEditRolePos(null);
      setEditCountryPos(null);
      
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.message || error.error || 'Failed to update user. Please try again.';
      setEditFormErrors({ submit: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusToggle = (user) => {
    const newStatusValue = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusUpdateUser(user);
    setNewStatus(newStatusValue);
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusUpdateUser || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      await api.updateUserStatus(statusUpdateUser.id, newStatus);
      
      // Refresh users list
      await fetchUsers();
      
      setShowStatusModal(false);
      setStatusUpdateUser(null);
      setNewStatus(null);
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="admin-page user-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage all users in one place. Control access, assign roles, and monitor activity.</p>
        </div>
        <PermissionGuard permission={PERMISSIONS.USER_CREATE}>
          <button 
            className="btn-add-user"
            onClick={() => setShowAddModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add User
          </button>
        </PermissionGuard>
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
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="filter-dropdowns-wrapper">
          <select 
            className="filter-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
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
            Loading users...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell">
                          {user.profileUrl ? (
                            <>
                              <img 
                                src={user.profileUrl} 
                                alt={`${user.firstName} ${user.lastName}`}
                                className="user-profile-image"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextElementSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              {(() => {
                                const avatarColor = getAvatarColor(user.firstName, user.lastName);
                                return (
                                  <div 
                                    className="user-avatar-small" 
                                    style={{ 
                                      background: avatarColor.bg,
                                      color: avatarColor.text,
                                      display: 'none'
                                    }}
                                  >
                                    {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                                  </div>
                                );
                              })()}
                            </>
                          ) : (
                            (() => {
                              const avatarColor = getAvatarColor(user.firstName, user.lastName);
                              return (
                                <div 
                                  className="user-avatar-small user-avatar-gradient" 
                                  style={{ 
                                    background: avatarColor.bg,
                                    color: avatarColor.text
                                  }}
                                >
                                  {(user.firstName?.[0] || '').toUpperCase()}{(user.lastName?.[0] || '').toUpperCase()}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      </td>
                      <td>{user.firstName || '-'}</td>
                      <td>{user.lastName || '-'}</td>
                      <td className="user-email-cell">{user.email || '-'}</td>
                      <td>
                        {(() => {
                          const roleColor = getRoleColor();
                          return (
                            <span 
                              className="role-badge"
                              style={{ 
                                backgroundColor: roleColor.bg,
                                color: roleColor.text,
                                border: `1px solid ${roleColor.border}`,
                                fontWeight: '700'
                              }}
                            >
                              {formatRole(user.role, user.roleMeta)}
                            </span>
                          );
                        })()}
                      </td>
                      <td>{user.phone || user.phoneNumber || '-'}</td>
                      <td>
                        <PermissionGuard permission={PERMISSIONS.USER_UPDATE_STATUS}>
                          <span 
                            className={`status-badge clickable ${user.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                            onClick={() => handleStatusToggle(user)}
                            title={`Click to ${user.status === 'ACTIVE' ? 'deactivate' : 'activate'} user`}
                          >
                            {formatStatus(user.status)}
                          </span>
                        </PermissionGuard>
                        {!can(PERMISSIONS.USER_UPDATE_STATUS) && (
                          <span 
                            className={`status-badge ${user.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                          >
                            {formatStatus(user.status)}
                          </span>
                        )}
                      </td>
                      <td>{formatLastLogin(user.lastLogin)}</td>
                      <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                          {(user.createdByMeta || user.updatedByMeta) && (
                            <div 
                              className="info-icon-wrapper info-icon-last-column" 
                              style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
                            >
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
                              <div className="info-tooltip info-tooltip-right">
                                {user.createdByMeta && (
                                  <div className="tooltip-line">
                                    Created by <strong>{user.createdByMeta.fullName || 'N/A'}</strong> on {formatDateTime(user.createdAt) || '-'}
                                  </div>
                                )}
                                {user.updatedByMeta && (
                                  <div className="tooltip-line">
                                    Updated by <strong>{user.updatedByMeta.fullName || 'N/A'}</strong> on {formatDateTime(user.updatedAt) || '-'}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          <PermissionGuard permission={PERMISSIONS.USER_UPDATE}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                              <Edit
                                size={18}
                                style={{
                                  color: '#3b82f6',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s'
                                }}
                                onClick={() => handleEditClick(user)}
                                title="Edit user"
                              />
                            </div>
                          </PermissionGuard>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (!isSubmitting && !e.target.closest('.country-code-dropdown') && !e.target.closest('.role-dropdown')) {
            setShowAddModal(false);
            setAddRoleOpen(false);
            setAddCountryOpen(false);
            setAddCountryCode(getDefaultCountry());
            setAddRoleSearch('');
            setAddCountrySearch('');
            setAddRolePos(null);
            setAddCountryPos(null);
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setAddRoleOpen(false);
                  setAddCountryOpen(false);
                  setAddCountryCode(getDefaultCountry());
                  setAddRoleSearch('');
                  setAddCountrySearch('');
                }}
                disabled={isSubmitting}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                  required
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <div className="phone-input-group">
                  <div className="country-code-select-wrapper">
                    <div 
                      ref={addCountryRef}
                      className="country-code-select"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isSubmitting) {
                          const isOpening = !addCountryOpen;
                          setAddCountryOpen(prev => !prev);
                          setAddRoleOpen(false);
                          if (isOpening) {
                            setTimeout(() => calculateDropdownPosition(addCountryRef, setAddCountryPos), 0);
                          } else {
                            setAddCountryPos(null);
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer', position: 'relative', pointerEvents: 'auto' }}
                    >
                      <span className="country-code-display">
                        {addCountryCode.flag} {addCountryCode.dialCode}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px' }}>
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {addCountryOpen && !isSubmitting && addCountryPos && createPortal(
                    <div 
                      className="country-code-dropdown portal-dropdown" 
                      style={{
                        position: 'fixed',
                        top: `${addCountryPos.top}px`,
                        left: `${addCountryPos.left}px`,
                        width: `${addCountryPos.width}px`,
                        zIndex: 10050
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="country-code-search"
                        placeholder="Search country..."
                        value={addCountrySearch}
                        onChange={(e) => setAddCountrySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="country-code-list">
                        {filterCountries(addCountrySearch).map((country) => (
                          <div
                            key={country.code}
                            className={`country-code-option ${addCountryCode.code === country.code ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddCountryCode(country);
                              setAddCountrySearch('');
                              setAddCountryOpen(false);
                              setAddCountryPos(null);
                              // Validate existing phone number when country changes
                              if (formData.phone) {
                                const validated = validatePhoneInput(formData.phone, country);
                                setFormData(prev => ({
                                  ...prev,
                                  phone: validated,
                                  phoneNumber: validated
                                }));
                              }
                            }}
                          >
                            <span className="country-code-display">
                              {country.flag} {country.dialCode}
                            </span>
                            <span className="country-name">{country.name}</span>
                          </div>
                        ))}
                        {filterCountries(addCountrySearch).length === 0 && (
                          <div className="country-code-option no-results">No countries found</div>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      const validated = validatePhoneInput(e.target.value, addCountryCode);
                      setFormData(prev => ({
                        ...prev,
                        phone: validated,
                        phoneNumber: validated
                      }));
                    }}
                    className="phone-input"
                    placeholder={getPhonePlaceholder(addCountryCode)}
                    maxLength={getPhoneMaxLength(addCountryCode)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="roleId">Role *</label>
                  <div className="role-select-wrapper">
                    <div
                      ref={addRoleRef}
                      className="role-select"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isSubmitting) {
                          const isOpening = !addRoleOpen;
                          setAddRoleOpen(prev => !prev);
                          setAddCountryOpen(false);
                          if (isOpening) {
                            setTimeout(() => calculateDropdownPosition(addRoleRef, setAddRolePos), 0);
                          } else {
                            setAddRolePos(null);
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ cursor: isSubmitting ? 'not-allowed' : 'pointer', position: 'relative', pointerEvents: 'auto' }}
                    >
                      <span>
                        {formData.roleId 
                          ? roles.find(r => r.roleId === formData.roleId)?.roleName || 'Select a role'
                          : 'Select a role'}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px' }}>
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {addRoleOpen && !isSubmitting && addRolePos && createPortal(
                    <div 
                      className="role-dropdown portal-dropdown" 
                      style={{
                        position: 'fixed',
                        top: `${addRolePos.top}px`,
                        left: `${addRolePos.left}px`,
                        width: `${addRolePos.width}px`,
                        zIndex: 10050
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="role-search"
                        placeholder="Search role..."
                        value={addRoleSearch}
                        onChange={(e) => setAddRoleSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="role-list">
                        {filterRoles(addRoleSearch, roles).map((role) => (
                          <div
                            key={role.roleId}
                            className={`role-option ${formData.roleId === role.roleId ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInputChange({ target: { name: 'roleId', value: role.roleId } });
                              setAddRoleSearch('');
                              setAddRoleOpen(false);
                              setAddRolePos(null);
                            }}
                          >
                            {role.roleName}
                          </div>
                        ))}
                        {filterRoles(addRoleSearch, roles).length === 0 && (
                          <div className="role-option no-results">No roles found</div>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                  {formErrors.roleId && <span className="error-text">{formErrors.roleId}</span>}
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

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddRoleOpen(false);
                    setAddCountryOpen(false);
                    setAddCountryCode(getDefaultCountry());
                    setAddRoleSearch('');
                    setAddCountrySearch('');
                    setAddRolePos(null);
                    setAddCountryPos(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={(e) => {
          if (!isUpdating && !e.target.closest('.country-code-dropdown') && !e.target.closest('.role-dropdown')) {
            setShowEditModal(false);
            setEditCountryCode(getDefaultCountry());
            setEditRoleOpen(false);
            setEditCountryOpen(false);
            setEditRoleSearch('');
            setEditCountrySearch('');
            setEditRolePos(null);
            setEditCountryPos(null);
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowEditModal(false);
                  setEditCountryCode(getDefaultCountry());
                  setEditRoleOpen(false);
                  setEditCountryOpen(false);
                  setEditRoleSearch('');
                  setEditCountrySearch('');
                }}
                disabled={isUpdating}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-email">Email Address *</label>
                <input
                  type="email"
                  id="edit-email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  placeholder="Enter email address"
                  disabled={isUpdating}
                  required
                />
                {editFormErrors.email && <span className="error-text">{editFormErrors.email}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-firstName">First Name *</label>
                  <input
                    type="text"
                    id="edit-firstName"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleEditInputChange}
                    placeholder="Enter first name"
                    disabled={isUpdating}
                    required
                  />
                  {editFormErrors.firstName && <span className="error-text">{editFormErrors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-lastName">Last Name *</label>
                  <input
                    type="text"
                    id="edit-lastName"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleEditInputChange}
                    placeholder="Enter last name"
                    disabled={isUpdating}
                    required
                  />
                  {editFormErrors.lastName && <span className="error-text">{editFormErrors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-phone">Phone</label>
                <div className="phone-input-group">
                  <div className="country-code-select-wrapper">
                    <div 
                      ref={editCountryRef}
                      className="country-code-select"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isUpdating) {
                          const isOpening = !editCountryOpen;
                          setEditCountryOpen(prev => !prev);
                          setEditRoleOpen(false);
                          if (isOpening) {
                            setTimeout(() => calculateDropdownPosition(editCountryRef, setEditCountryPos), 0);
                          } else {
                            setEditCountryPos(null);
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ cursor: isUpdating ? 'not-allowed' : 'pointer', position: 'relative', pointerEvents: 'auto' }}
                    >
                      <span className="country-code-display">
                        {editCountryCode.flag} {editCountryCode.dialCode}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px' }}>
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {editCountryOpen && !isUpdating && editCountryPos && createPortal(
                    <div 
                      className="country-code-dropdown portal-dropdown" 
                      style={{
                        position: 'fixed',
                        top: `${editCountryPos.top}px`,
                        left: `${editCountryPos.left}px`,
                        width: `${editCountryPos.width}px`,
                        zIndex: 10050
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="country-code-search"
                        placeholder="Search country..."
                        value={editCountrySearch}
                        onChange={(e) => setEditCountrySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="country-code-list">
                        {filterCountries(editCountrySearch).map((country) => (
                          <div
                            key={country.code}
                            className={`country-code-option ${editCountryCode.code === country.code ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditCountryCode(country);
                              setEditCountrySearch('');
                              setEditCountryOpen(false);
                              setEditCountryPos(null);
                              // Validate existing phone number when country changes
                              if (editFormData.phone) {
                                const validated = validatePhoneInput(editFormData.phone, country);
                                setEditFormData(prev => ({
                                  ...prev,
                                  phone: validated,
                                  phoneNumber: validated
                                }));
                              }
                            }}
                          >
                            <span className="country-code-display">
                              {country.flag} {country.dialCode}
                            </span>
                            <span className="country-name">{country.name}</span>
                          </div>
                        ))}
                        {filterCountries(editCountrySearch).length === 0 && (
                          <div className="country-code-option no-results">No countries found</div>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                  <input
                    type="tel"
                    id="edit-phone"
                    name="phone"
                    value={editFormData.phone || ''}
                    onChange={(e) => {
                      const validated = validatePhoneInput(e.target.value, editCountryCode);
                      setEditFormData(prev => ({
                        ...prev,
                        phone: validated,
                        phoneNumber: validated
                      }));
                    }}
                    className="phone-input"
                    placeholder={getPhonePlaceholder(editCountryCode)}
                    maxLength={getPhoneMaxLength(editCountryCode)}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-roleId">Role *</label>
                  <div className="role-select-wrapper">
                    <div
                      ref={editRoleRef}
                      className="role-select"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isUpdating) {
                          const isOpening = !editRoleOpen;
                          setEditRoleOpen(prev => !prev);
                          setEditCountryOpen(false);
                          if (isOpening) {
                            setTimeout(() => calculateDropdownPosition(editRoleRef, setEditRolePos), 0);
                          } else {
                            setEditRolePos(null);
                          }
                        }
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      style={{ cursor: isUpdating ? 'not-allowed' : 'pointer', position: 'relative', pointerEvents: 'auto' }}
                    >
                      <span>
                        {editFormData.roleId 
                          ? roles.find(r => r.roleId === editFormData.roleId)?.roleName || 'Select a role'
                          : 'Select a role'}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px' }}>
                        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  {editRoleOpen && !isUpdating && editRolePos && createPortal(
                    <div 
                      className="role-dropdown portal-dropdown" 
                      style={{
                        position: 'fixed',
                        top: `${editRolePos.top}px`,
                        left: `${editRolePos.left}px`,
                        width: `${editRolePos.width}px`,
                        zIndex: 10050
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="role-search"
                        placeholder="Search role..."
                        value={editRoleSearch}
                        onChange={(e) => setEditRoleSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <div className="role-list">
                        {filterRoles(editRoleSearch, roles).map((role) => (
                          <div
                            key={role.roleId}
                            className={`role-option ${editFormData.roleId === role.roleId ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditInputChange({ target: { name: 'roleId', value: role.roleId } });
                              setEditRoleSearch('');
                              setEditRoleOpen(false);
                              setEditRolePos(null);
                            }}
                          >
                            {role.roleName}
                          </div>
                        ))}
                        {filterRoles(editRoleSearch, roles).length === 0 && (
                          <div className="role-option no-results">No roles found</div>
                        )}
                      </div>
                    </div>,
                    document.body
                  )}
                  {editFormErrors.roleId && <span className="error-text">{editFormErrors.roleId}</span>}
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
                    setEditCountryCode(getDefaultCountry());
                    setEditRoleOpen(false);
                    setEditCountryOpen(false);
                    setEditRoleSearch('');
                    setEditCountrySearch('');
                    setEditRolePos(null);
                    setEditCountryPos(null);
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && createdUser && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Created Successfully!</h2>
              <button 
                className="modal-close"
                onClick={() => setShowSuccessModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="success-content">
              <div className="success-icon">
                <svg width="48" height="48" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#10b981"/>
                  <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <p className="success-message">Please copy and share these credentials with the user:</p>
              
              <div className="credentials-box">
                <div className="credential-item">
                  <label>Email:</label>
                  <div className="credential-value">{createdUser.email}</div>
                </div>
                <div className="credential-item">
                  <label>Password:</label>
                  <div className="credential-value">{createdUser.password}</div>
                </div>
              </div>

              <button
                className="btn-primary copy-btn"
                onClick={copyCredentials}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M8 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V15C3 15.5304 3.21071 16.0391 3.58579 16.4142C3.96086 16.7893 4.46957 17 5 17H15C15.5304 17 16.0391 16.7893 16.4142 16.4142C16.7893 16.0391 17 15.5304 17 15V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M17 3H12M17 3L13 7M17 3V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copy Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Confirmation Modal */}
      {showStatusModal && statusUpdateUser && (
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
                {statusUpdateUser.status === 'ACTIVE' ? (
                  <>Are you sure you want to <span className="status-text-badge status-text-deactivate">deactivate</span> user <strong>{statusUpdateUser.firstName} {statusUpdateUser.lastName}</strong>?</>
                ) : (
                  <>Are you sure you want to <span className="status-text-badge status-text-activate">activate</span> user <strong>{statusUpdateUser.firstName} {statusUpdateUser.lastName}</strong>?</>
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
    </div>
  );
};

export default Users;
