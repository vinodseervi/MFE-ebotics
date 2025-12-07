import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import './Admin.css';

const RoleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    permissions: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [roleData, setRoleData] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState({}); // Track which groups are expanded

  useEffect(() => {
    fetchPermissions();
    if (isEditMode) {
      fetchRoleData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRoleData = async () => {
    try {
      setLoading(true);
      const roles = await api.getAllRoles();
      const role = roles.find(r => r.roleId === id);
      if (role) {
        setRoleData(role);
        setFormData({
          roleName: role.roleName || '',
          description: role.description || '',
          permissions: role.permissions || []
        });
      } else {
        setFormErrors({ submit: 'Role not found' });
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      setFormErrors({ submit: 'Failed to load role data' });
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

  const handlePermissionToggle = (permissionCode) => {
    setFormData(prev => {
      const currentPerms = prev.permissions || [];
      const newPerms = currentPerms.includes(permissionCode)
        ? currentPerms.filter(p => p !== permissionCode)
        : [...currentPerms, permissionCode];
      return { ...prev, permissions: newPerms };
    });
  };

  const handleGroupToggle = (groupPermissions) => {
    const permissionCodes = groupPermissions.map(p => p.code);
    const currentPerms = formData.permissions;
    const allSelected = permissionCodes.every(code => currentPerms.includes(code));
    
    setFormData(prev => {
      const newPerms = allSelected
        ? prev.permissions.filter(p => !permissionCodes.includes(p))
        : [...new Set([...prev.permissions, ...permissionCodes])];
      return { ...prev, permissions: newPerms };
    });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.roleName.trim()) {
      errors.roleName = 'Role name is required';
    } else {
      // Validate: roleName must be alphanumeric with spaces only
      const roleNameRegex = /^[a-zA-Z0-9\s]+$/;
      if (!roleNameRegex.test(formData.roleName.trim())) {
        errors.roleName = 'Role name must contain only letters, numbers, and spaces';
      }
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if role is Super Admin (non-editable)
  const isSuperAdmin = () => {
    return roleData && roleData.roleName && roleData.roleName.toUpperCase() === 'SUPER ADMIN';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent updating Super Admin
    if (isEditMode && isSuperAdmin()) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEditMode) {
        // Update role
        const updateData = {
          roleName: formData.roleName.trim(),
          description: formData.description.trim(),
          permissions: formData.permissions || []
        };
        await api.updateRole(id, updateData);
      } else {
        // Create role
        const roleData = {
          roleName: formData.roleName.trim(),
          description: formData.description.trim()
        };
        const createdRole = await api.createRole(roleData);
        
        // Update permissions separately if any are selected
        if (formData.permissions.length > 0 && createdRole.roleId) {
          try {
            await api.updateRolePermissions(createdRole.roleId, formData.permissions);
          } catch (permError) {
            console.error('Permissions update failed:', permError);
            const permErrorMessage = permError.message || permError.error || 'Failed to update permissions due to server error';
            setFormErrors({ 
              submit: `⚠️ Role created successfully, but permissions update failed: ${permErrorMessage}. You can edit the role to add permissions.` 
            });
            setTimeout(() => {
              navigate('/admin/roles');
            }, 3000);
            return;
          }
        }
      }
      
      // Success - navigate back to roles list
      navigate('/admin/roles');
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} role:`, error);
      let errorMessage = `Failed to ${isEditMode ? 'update' : 'create'} role. Please try again.`;
      
      if (error.details && Array.isArray(error.details) && error.details.length > 0) {
        const fieldError = error.details.find(d => d.field === 'roleName');
        if (fieldError) {
          setFormErrors({ roleName: fieldError.message });
          errorMessage = fieldError.message;
        } else {
          errorMessage = error.details[0].message || error.message || error.error || errorMessage;
        }
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to update this role.';
      } else {
        errorMessage = error.message || error.error || errorMessage;
      }
      
      setFormErrors(prev => ({ ...prev, submit: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGroupExpanded = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const renderPermissionCheckboxes = () => {
    const currentPerms = formData.permissions;
    
    return (
      <div className="permissions-container" style={{ marginTop: '16px' }}>
        {permissions.map((group) => {
          const isExpanded = expandedGroups[group.group];
          const selectedCount = group.permissions.filter(p => currentPerms.includes(p.code)).length;
          
          return (
            <div 
              key={group.group} 
              className="permission-group" 
              style={{ 
                marginBottom: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: 'white',
                overflow: 'hidden'
              }}
            >
              <div 
                className="permission-group-header"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#f9fafb',
                  userSelect: 'none',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f9fafb'}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    marginRight: '12px',
                    flexShrink: 0
                  }}
                >
                  <input
                    type="checkbox"
                    checked={group.permissions.every(p => currentPerms.includes(p.code))}
                    onChange={() => handleGroupToggle(group.permissions)}
                    disabled={isEditMode && isSuperAdmin()}
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px'
                    }}
                  />
                </div>
                <div
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px',
                    flex: 1,
                    cursor: 'pointer',
                    minWidth: 0
                  }}
                  onClick={() => toggleGroupExpanded(group.group)}
                >
                  <span className="permission-group-label" style={{ fontWeight: '500', color: '#111827' }}>
                    {group.label}
                  </span>
                  <span className="permission-group-count" style={{ color: '#6b7280', fontSize: '13px' }}>
                    ({selectedCount}/{group.permissions.length})
                  </span>
                </div>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    color: '#6b7280',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                    padding: '4px',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}
                  onClick={() => toggleGroupExpanded(group.group)}
                >
                  {isExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </div>
              {isExpanded && (
                <div 
                  className="permission-list"
                  style={{
                    padding: '12px 16px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: 'white'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {group.permissions.map((permission) => {
                    const isChecked = currentPerms.includes(permission.code);
                    return (
                      <label 
                        key={permission.code} 
                        className={`permission-item-checkbox ${isChecked ? 'checked' : ''}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          marginBottom: '4px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handlePermissionToggle(permission.code)}
                          disabled={isEditMode && isSuperAdmin()}
                          style={{ cursor: 'pointer' }}
                        />
                        <span className="permission-description-only" style={{ fontSize: '14px', color: '#374151' }}>
                          {permission.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading && isEditMode) {
    return (
      <div className="admin-page role-form-page" style={{
        width: '100%',
        minHeight: '100vh',
        padding: '24px',
        background: '#f9fafb'
      }}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
          Loading role data...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page role-form-page" style={{
      width: '100%',
      minHeight: '100vh',
      padding: '24px',
      background: '#f9fafb'
    }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            className="icon-btn-small"
            onClick={() => navigate('/admin/roles')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px',
              background: 'transparent',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
            <ArrowLeft size={20} style={{ color: '#374151' }} />
          </button>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="page-title" style={{ fontSize: 'clamp(20px, 4vw, 24px)', wordBreak: 'break-word' }}>
              {isEditMode ? 'Edit Role' : 'Create New Role'}
            </h1>
            <p className="page-subtitle" style={{ fontSize: 'clamp(12px, 2vw, 13px)' }}>
              {isEditMode ? 'Update role details and permissions' : 'Add a new role with specific permissions'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ 
        width: '100%',
        maxWidth: '100%',
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: 'clamp(20px, 4vw, 32px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        {isEditMode && isSuperAdmin() && (
          <div className="info-banner" style={{ 
            padding: '12px 16px', 
            background: '#fef3c7', 
            border: '1px solid #fbbf24', 
            borderRadius: '8px', 
            marginBottom: '24px',
            color: '#92400e',
            fontSize: '14px'
          }}>
            ⚠️ Super Admin role is read-only and cannot be edited.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="form-group">
              <label htmlFor="roleName">Role Name *</label>
              <input
                type="text"
                id="roleName"
                name="roleName"
                value={formData.roleName}
                onChange={handleInputChange}
                placeholder="e.g., Admin, Manager, User (letters, numbers, and spaces only)"
                disabled={isSubmitting || (isEditMode && isSuperAdmin())}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: formErrors.roleName ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              {formErrors.roleName && (
                <span className="error-text" style={{ marginTop: '6px', display: 'block' }}>
                  {formErrors.roleName}
                </span>
              )}
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
                disabled={isSubmitting || (isEditMode && isSuperAdmin())}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: formErrors.description ? '1px solid #ef4444' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              {formErrors.description && (
                <span className="error-text" style={{ marginTop: '6px', display: 'block' }}>
                  {formErrors.description}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginTop: '8px' }}>
              <label className="permissions-label" style={{ 
                display: 'block', 
                marginBottom: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Permissions
              </label>
              <div style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#f9fafb',
                maxHeight: 'calc(100vh - 400px)',
                overflowY: 'auto',
                minHeight: '300px'
              }}>
                {renderPermissionCheckboxes()}
              </div>
            </div>

            {formErrors.submit && (
              <div className="error-text" style={{ 
                marginTop: '12px',
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b'
              }}>
                {formErrors.submit}
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb',
              marginTop: '8px'
            }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/admin/roles')}
                disabled={isSubmitting}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#374151',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  minWidth: '100px'
                }}
              >
                Cancel
              </button>
              {!(isEditMode && isSuperAdmin()) && (
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 20px',
                    background: '#0d9488',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: 'white',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    opacity: isSubmitting ? 0.6 : 1,
                    minWidth: '120px'
                  }}
                >
                  {isSubmitting 
                    ? (isEditMode ? 'Updating...' : 'Creating...') 
                    : (isEditMode ? 'Update Role' : 'Create Role')
                  }
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleForm;

