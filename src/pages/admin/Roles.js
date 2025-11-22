import React from 'react';
import { roles } from '../../data/mockData';
import './Admin.css';

const Roles = () => {
  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Roles & Permissions
            <span className="info-icon">⚠️</span>
          </h1>
          <p className="page-subtitle">Manage role-based access control</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="btn-primary">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create Role
          </button>
        </div>
      </div>

      <div className="roles-grid">
        {roles.map((role) => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <h3 className="role-name">{role.name}</h3>
              <button className="icon-btn-small">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M11 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V15C3 15.5304 3.21071 16.0391 3.58579 16.4142C3.96086 16.7893 4.46957 17 5 17H15C15.5304 17 16.0391 16.7893 16.4142 16.4142C16.7893 16.0391 17 15.5304 17 15V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M14.5 1.5L18.5 5.5L11 13H7V9L14.5 1.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <p className="role-description">{role.description}</p>
            <div className="role-meta">
              <span className="role-users">{role.users} User{role.users !== 1 ? 's' : ''}</span>
            </div>
            <div className="role-permissions">
              <h4 className="permissions-title">Key Permissions:</h4>
              <ul className="permissions-list">
                {role.permissions.slice(0, 3).map((permission, index) => (
                  <li key={index} className="permission-item">
                    <span className="permission-dot"></span>
                    {permission}
                  </li>
                ))}
                {role.permissions.length > 3 && (
                  <li className="permission-item">
                    <span className="permission-more">+{role.permissions.length - 3} more</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roles;

