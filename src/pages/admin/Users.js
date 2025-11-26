import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Edit } from 'lucide-react';
import './Admin.css';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
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
    role: 'USER',
    status: 'ACTIVE',
    phone: '',
    phoneNumber: '',
    profileUrl: ''
  });
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'USER',
    status: 'ACTIVE'
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

  useEffect(() => {
    fetchUsers();
  }, []);

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
      const userData = {
        ...formData,
        password
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
        role: 'USER',
        status: 'ACTIVE'
      });
      
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

  const formatRole = (role) => {
    if (!role) return '';
    return role
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatStatus = (status) => {
    if (!status) return '';
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const getRoleColor = (role) => {
    const roleColors = {
      'ADMIN': '#a855f7',
      'USER': '#3b82f6',
      'SUPER_ADMIN': '#ef4444',
      'MANAGER': '#c084fc',
    };
    return roleColors[role] || '#6b7280';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'All Roles' || formatRole(user.role) === selectedRole;
    const matchesStatus = selectedStatus === 'All Statuses' || formatStatus(user.status) === selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = ['All Roles', ...Array.from(new Set(users.map(u => formatRole(u.role)).filter(Boolean)))];
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role || 'USER',
      status: user.status || 'ACTIVE',
      phone: user.phone || '',
      phoneNumber: user.phoneNumber || '',
      profileUrl: user.profileUrl || ''
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
      const updateData = {
        email: editFormData.email,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        role: editFormData.role,
        status: editFormData.status,
        phone: editFormData.phone || editFormData.phoneNumber,
        phoneNumber: editFormData.phoneNumber || editFormData.phone,
        profileUrl: editFormData.profileUrl
      };

      await api.updateUser(editingUser.id, updateData);
      
      setShowEditModal(false);
      setEditingUser(null);
      
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
      const errorMessage = error.message || error.error || 'Failed to update user status. Please try again.';
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
        <button 
          className="btn-add-user"
          onClick={() => setShowAddModal(true)}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add User
        </button>
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
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
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
                              <div 
                                className="user-avatar-small" 
                                style={{ 
                                  backgroundColor: getRoleColor(user.role),
                                  display: 'none'
                                }}
                              >
                                {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                              </div>
                            </>
                          ) : (
                            <div 
                              className="user-avatar-small" 
                              style={{ backgroundColor: getRoleColor(user.role) }}
                            >
                              {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{user.firstName || '-'}</td>
                      <td>{user.lastName || '-'}</td>
                      <td>{user.email || '-'}</td>
                      <td>
                        <span 
                          className="role-badge"
                          style={{ 
                            backgroundColor: getRoleColor(user.role) + '20', 
                            color: getRoleColor(user.role) 
                          }}
                        >
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td>{user.phone || user.phoneNumber || '-'}</td>
                      <td>
                        <span 
                          className={`status-badge clickable ${user.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleStatusToggle(user)}
                          title={`Click to ${user.status === 'ACTIVE' ? 'deactivate' : 'activate'} user`}
                        >
                          {formatStatus(user.status)}
                        </span>
                      </td>
                      <td>{formatLastLogin(user.lastLogin)}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{formatDate(user.updatedAt)}</td>
                      <td>
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
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="role">Role *</label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
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
                  onClick={() => setShowAddModal(false)}
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
        <div className="modal-overlay" onClick={() => !isUpdating && setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-phone">Phone</label>
                  <input
                    type="tel"
                    id="edit-phone"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    placeholder="Enter phone number"
                    disabled={isUpdating}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-profileUrl">Profile URL</label>
                  <input
                    type="url"
                    id="edit-profileUrl"
                    name="profileUrl"
                    value={editFormData.profileUrl}
                    onChange={handleEditInputChange}
                    placeholder="Enter profile image URL"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-role">Role *</label>
                  <select
                    id="edit-role"
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditInputChange}
                    disabled={isUpdating}
                    required
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="MANAGER">Manager</option>
                  </select>
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
                  onClick={() => setShowEditModal(false)}
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
