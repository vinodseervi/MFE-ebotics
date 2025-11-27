import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Edit } from 'lucide-react';
import './Admin.css';

const Roles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    permissions: []
  });
  const [editFormData, setEditFormData] = useState({
    roleName: '',
    description: '',
    permissions: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [editFormErrors, setEditFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateRole, setStatusUpdateRole] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await api.getAllRoles(searchTerm || null);
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const data = await api.getAllPermissions();
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
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

  const handlePermissionToggle = (permissionCode, isEdit = false) => {
    if (isEdit) {
      setEditFormData(prev => {
        const currentPerms = prev.permissions || [];
        const newPerms = currentPerms.includes(permissionCode)
          ? currentPerms.filter(p => p !== permissionCode)
          : [...currentPerms, permissionCode];
        return { ...prev, permissions: newPerms };
      });
    } else {
      setFormData(prev => {
        const currentPerms = prev.permissions || [];
        const newPerms = currentPerms.includes(permissionCode)
          ? currentPerms.filter(p => p !== permissionCode)
          : [...currentPerms, permissionCode];
        return { ...prev, permissions: newPerms };
      });
    }
  };

  const handleGroupToggle = (groupPermissions, isEdit = false) => {
    const permissionCodes = groupPermissions.map(p => p.code);
    const currentPerms = isEdit ? editFormData.permissions : formData.permissions;
    const allSelected = permissionCodes.every(code => currentPerms.includes(code));
    
    if (isEdit) {
      setEditFormData(prev => {
        const newPerms = allSelected
          ? prev.permissions.filter(p => !permissionCodes.includes(p))
          : [...new Set([...prev.permissions, ...permissionCodes])];
        return { ...prev, permissions: newPerms };
      });
    } else {
      setFormData(prev => {
        const newPerms = allSelected
          ? prev.permissions.filter(p => !permissionCodes.includes(p))
          : [...new Set([...prev.permissions, ...permissionCodes])];
        return { ...prev, permissions: newPerms };
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.roleName.trim()) {
      errors.roleName = 'Role name is required';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors = {};
    
    if (!editFormData.roleName.trim()) {
      errors.roleName = 'Role name is required';
    }
    
    if (!editFormData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Create role with only roleName and description (as per API spec)
      const roleData = {
        roleName: formData.roleName,
        description: formData.description
      };

      const createdRole = await api.createRole(roleData);
      
      // Update permissions separately if any are selected
      if (formData.permissions.length > 0 && createdRole.roleId) {
        try {
          await api.updateRolePermissions(createdRole.roleId, formData.permissions);
        } catch (permError) {
          console.warn('Role created but permissions update failed:', permError);
          // Role is created, permissions can be updated later
        }
      }
      
      setShowAddModal(false);
      setFormData({
        roleName: '',
        description: '',
        permissions: []
      });
      setFormErrors({});
      
      await fetchRoles();
    } catch (error) {
      console.error('Error creating role:', error);
      const errorMessage = error.message || error.error || 'Failed to create role. Please try again.';
      setFormErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (role) => {
    setEditingRole(role);
    setEditFormData({
      roleName: role.roleName || '',
      description: role.description || '',
      permissions: role.permissions || []
    });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    
    if (!validateEditForm()) {
      return;
    }

    try {
      setIsUpdating(true);
      // Update role with only roleName and description (as per API spec)
      const updateData = {
        roleName: editFormData.roleName,
        description: editFormData.description
      };

      await api.updateRole(editingRole.roleId, updateData);
      
      // Update permissions separately
      try {
        await api.updateRolePermissions(editingRole.roleId, editFormData.permissions);
      } catch (permError) {
        console.warn('Role updated but permissions update failed:', permError);
        // Role info updated, permissions can be updated later
      }
      
      setShowEditModal(false);
      setEditingRole(null);
      setEditFormErrors({});
      
      await fetchRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      const errorMessage = error.message || error.error || 'Failed to update role. Please try again.';
      setEditFormErrors({ submit: errorMessage });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusToggle = (role) => {
    const newStatusValue = role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusUpdateRole(role);
    setNewStatus(newStatusValue);
    setShowStatusModal(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!statusUpdateRole || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      await api.updateRoleStatus(statusUpdateRole.roleId, newStatus);
      
      await fetchRoles();
      
      setShowStatusModal(false);
      setStatusUpdateRole(null);
      setNewStatus(null);
    } catch (error) {
      console.error('Error updating role status:', error);
      const errorMessage = error.message || error.error || 'Failed to update role status. Please try again.';
    } finally {
      setIsUpdatingStatus(false);
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

  const filteredRoles = roles.filter(role => {
    const matchesSearch = !searchTerm || 
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All Statuses' || formatStatus(role.status) === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const uniqueStatuses = ['All Statuses', ...Array.from(new Set(roles.map(r => formatStatus(r.status)).filter(Boolean)))];

  const renderPermissionCheckboxes = (isEdit = false) => {
    const currentPerms = isEdit ? editFormData.permissions : formData.permissions;
    
    return (
      <div className="permissions-container">
        {permissions.map((group) => (
          <div key={group.group} className="permission-group">
            <div className="permission-group-header">
              <label className="permission-group-checkbox">
                <input
                  type="checkbox"
                  checked={group.permissions.every(p => currentPerms.includes(p.code))}
                  onChange={() => handleGroupToggle(group.permissions, isEdit)}
                />
                <span className="permission-group-label">{group.label}</span>
                <span className="permission-group-count">
                  ({group.permissions.filter(p => currentPerms.includes(p.code)).length}/{group.permissions.length})
                </span>
              </label>
            </div>
            <div className="permission-list">
              {group.permissions.map((permission) => {
                const isChecked = currentPerms.includes(permission.code);
                return (
                  <label 
                    key={permission.code} 
                    className={`permission-item-checkbox ${isChecked ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handlePermissionToggle(permission.code, isEdit)}
                    />
                    <span className="permission-description-only">{permission.description}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-page role-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="page-subtitle">Manage role-based access control and permissions</p>
        </div>
        <button 
          className="btn-add-user"
          onClick={() => {
            setFormData({
              roleName: '',
              description: '',
              permissions: []
            });
            setFormErrors({});
            setShowAddModal(true);
          }}
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Create Role
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
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                fetchRoles();
              }}
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
            Loading roles...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Role Name</th>
                  <th>Description</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      No roles found
                    </td>
                  </tr>
                ) : (
                  filteredRoles.map((role) => (
                    <tr key={role.roleId}>
                      <td>
                        <strong>{role.roleName || '-'}</strong>
                      </td>
                      <td>{role.description || '-'}</td>
                      <td>
                        <div className="permissions-badge-list">
                          {role.permissions && role.permissions.length > 0 ? (
                            <>
                              <span className="permission-count">{role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}</span>
                              <div className="permissions-preview">
                                {role.permissions.slice(0, 3).map((perm, idx) => (
                                  <span key={idx} className="permission-tag">{perm}</span>
                                ))}
                                {role.permissions.length > 3 && (
                                  <span className="permission-more">+{role.permissions.length - 3} more</span>
                                )}
                              </div>
                            </>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>No permissions</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`status-badge clickable ${role.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleStatusToggle(role)}
                          title={`Click to ${role.status === 'ACTIVE' ? 'deactivate' : 'activate'} role`}
                        >
                          {formatStatus(role.status)}
                        </span>
                      </td>
                      <td>{formatDate(role.createdAt)}</td>
                      <td>{formatDate(role.updatedAt)}</td>
                      <td>
                        <Edit
                          size={18}
                          style={{
                            color: '#3b82f6',
                            cursor: 'pointer',
                            transition: 'color 0.2s'
                          }}
                          onClick={() => handleEditClick(role)}
                          title="Edit role"
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

      {/* Create Role Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowAddModal(false)}>
          <div className="modal-content role-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Role</h2>
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
              <div className="modal-form-content">
                <div className="form-group">
                  <label htmlFor="roleName">Role Name *</label>
                  <input
                    type="text"
                    id="roleName"
                    name="roleName"
                    value={formData.roleName}
                    onChange={handleInputChange}
                    placeholder="Enter role name"
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.roleName && <span className="error-text">{formErrors.roleName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter role description"
                    disabled={isSubmitting}
                    required
                  />
                  {formErrors.description && <span className="error-text">{formErrors.description}</span>}
                </div>

                <div className="form-group permissions-form-group">
                  <label className="permissions-label">Permissions</label>
                  <div className="permissions-scroll-container">
                    {renderPermissionCheckboxes(false)}
                  </div>
                </div>

                {formErrors.submit && (
                  <div className="error-text" style={{ marginTop: '12px' }}>
                    {formErrors.submit}
                  </div>
                )}
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
                  {isSubmitting ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingRole && (
        <div className="modal-overlay" onClick={() => !isUpdating && setShowEditModal(false)}>
          <div className="modal-content role-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Role</h2>
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

            <form onSubmit={handleUpdateRole} className="modal-form">
              <div className="modal-form-content">
                <div className="form-group">
                  <label htmlFor="edit-roleName">Role Name *</label>
                  <input
                    type="text"
                    id="edit-roleName"
                    name="roleName"
                    value={editFormData.roleName}
                    onChange={handleEditInputChange}
                    placeholder="Enter role name"
                    disabled={isUpdating}
                    required
                  />
                  {editFormErrors.roleName && <span className="error-text">{editFormErrors.roleName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="edit-description">Description *</label>
                  <input
                    type="text"
                    id="edit-description"
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    placeholder="Enter role description"
                    disabled={isUpdating}
                    required
                  />
                  {editFormErrors.description && <span className="error-text">{editFormErrors.description}</span>}
                </div>

                <div className="form-group permissions-form-group">
                  <label className="permissions-label">Permissions</label>
                  <div className="permissions-scroll-container">
                    {renderPermissionCheckboxes(true)}
                  </div>
                </div>

                {editFormErrors.submit && (
                  <div className="error-text" style={{ marginTop: '12px' }}>
                    {editFormErrors.submit}
                  </div>
                )}
              </div>

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
                  {isUpdating ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Confirmation Modal */}
      {showStatusModal && statusUpdateRole && (
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
                {statusUpdateRole.status === 'ACTIVE' ? (
                  <>Are you sure you want to <span className="status-text-badge status-text-deactivate">deactivate</span> role <strong>{statusUpdateRole.roleName}</strong>?</>
                ) : (
                  <>Are you sure you want to <span className="status-text-badge status-text-activate">activate</span> role <strong>{statusUpdateRole.roleName}</strong>?</>
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

export default Roles;
