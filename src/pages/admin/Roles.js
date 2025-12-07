import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Edit, Info } from 'lucide-react';
import { usePermissions, PERMISSIONS } from '../../hooks/usePermissions';
import PermissionGuard from '../../components/PermissionGuard';
import './Admin.css';

const Roles = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUpdateRole, setStatusUpdateRole] = useState(null);
  const [newStatus, setNewStatus] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh roles when returning from form page
  useEffect(() => {
    if (location.pathname === '/admin/roles') {
      fetchRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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


  // Check if role is Super Admin (non-editable)
  const isSuperAdmin = (role) => {
    return role.roleName && role.roleName.toUpperCase() === 'SUPER ADMIN';
  };

  const handleEditClick = (role) => {
    // Prevent editing Super Admin
    if (isSuperAdmin(role)) {
      return;
    }
    navigate(`/admin/roles/${role.roleId}/edit`);
  };

  const handleStatusToggle = (role) => {
    // Prevent status toggle for Super Admin
    if (isSuperAdmin(role)) {
      return;
    }
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

  const formatDateForTooltip = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} at ${timeStr}`;
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = !searchTerm || 
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'All Statuses' || formatStatus(role.status) === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const uniqueStatuses = ['All Statuses', ...Array.from(new Set(roles.map(r => formatStatus(r.status)).filter(Boolean)))];

  return (
    <div className="admin-page role-management-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles & Permissions</h1>
          <p className="page-subtitle">Manage role-based access control and permissions</p>
        </div>
        <PermissionGuard permission={PERMISSIONS.ROLE_CREATE}>
          <button 
            className="btn-add-user"
            onClick={() => navigate('/admin/roles/new')}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create Role
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

      <div className="roles-section">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Loading roles...
          </div>
        ) : filteredRoles.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No roles found
          </div>
        ) : (
          <div className="roles-grid">
            {filteredRoles.map((role) => (
              <div 
                key={role.roleId} 
                className="role-card"
                onClick={() => {
                  // Don't redirect if it's Super Admin
                  if (!isSuperAdmin(role)) {
                    handleEditClick(role);
                  }
                }}
                style={{
                  cursor: isSuperAdmin(role) ? 'default' : 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isSuperAdmin(role)) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSuperAdmin(role)) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div className="role-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="role-name" style={{ margin: 0 }}>{role.roleName || '-'}</h3>
                    {(role.createdByMeta || role.updatedByMeta) && (
                      <div 
                        className="info-icon-wrapper" 
                        style={{ position: 'relative', display: 'inline-block' }}
                        onClick={(e) => e.stopPropagation()}
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
                        <div className="info-tooltip">
                          {role.createdByMeta && (
                            <div className="tooltip-line">
                              Created by <strong>{role.createdByMeta.fullName || 'N/A'}</strong> on {formatDateForTooltip(role.createdAt)}
                            </div>
                          )}
                          {role.updatedByMeta && (
                            <div className="tooltip-line">
                              Updated by <strong>{role.updatedByMeta.fullName || 'N/A'}</strong> on {formatDateForTooltip(role.updatedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div 
                    className="role-header-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isSuperAdmin(role) ? (
                      <span 
                        className={`status-badge ${role.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                        title="Super Admin role (non-editable)"
                      >
                        {formatStatus(role.status)}
                      </span>
                    ) : (
                      <>
                        <PermissionGuard permission={PERMISSIONS.ROLE_UPDATE_STATUS}>
                          <span 
                            className={`status-badge clickable ${role.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                            onClick={() => handleStatusToggle(role)}
                            title={`Click to ${role.status === 'ACTIVE' ? 'deactivate' : 'activate'} role`}
                          >
                            {formatStatus(role.status)}
                          </span>
                        </PermissionGuard>
                        {!can(PERMISSIONS.ROLE_UPDATE_STATUS) && (
                          <span 
                            className={`status-badge ${role.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}
                          >
                            {formatStatus(role.status)}
                          </span>
                        )}
                        <PermissionGuard permission={PERMISSIONS.ROLE_UPDATE}>
                          <button 
                            className="icon-btn-small"
                            onClick={() => handleEditClick(role)}
                            title="Edit role"
                          >
                            <Edit size={18} style={{ color: '#3b82f6' }} />
                          </button>
                        </PermissionGuard>
                      </>
                    )}
                  </div>
                </div>
                <p className="role-description">{role.description || '-'}</p>
                <div className="role-permissions">
                  <h4 className="permissions-title">Key Permissions:</h4>
                  {role.permissions && role.permissions.length > 0 ? (
                    <ul className="permissions-list">
                      {role.permissions.slice(0, 4).map((permission, index) => (
                        <li key={index} className="permission-item">
                          <span className="permission-dot"></span>
                          {permission}
                        </li>
                      ))}
                      {role.permissions.length > 4 && (
                        <li className="permission-item">
                          <span className="permission-more">+{role.permissions.length - 4} more</span>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>No permissions assigned</p>
                  )}
                </div>
                <div style={{ flex: 1 }}></div>
                <div className="role-footer">
                  <div className="role-meta-info">
                    <span className="role-meta-label">Created:</span>
                    <span className="role-meta-value">{formatDate(role.createdAt)}</span>
                  </div>
                  <div className="role-meta-info">
                    <span className="role-meta-label">Updated:</span>
                    <span className="role-meta-value">{formatDate(role.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
