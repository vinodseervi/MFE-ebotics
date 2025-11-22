import React, { useState } from 'react';
import { users } from '../../data/mockData';
import './Admin.css';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    const roleColors = {
      'Super Admin': '#ef4444',
      'Admin': '#a855f7',
      'Manager': '#3b82f6',
      'Supervisor': '#c084fc',
      'Auditor': '#f59e0b',
      'Data Analyst': '#14b8a6'
    };
    return roleColors[role] || '#6b7280';
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'Active').length,
    inactive: users.filter(u => u.status === 'Inactive').length,
    admins: users.filter(u => u.role.includes('Admin')).length
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            User Management
            <span className="info-icon">⚠️</span>
          </h1>
          <p className="page-subtitle">Manage users, roles, and access.</p>
        </div>
        <button className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New User
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value success">{stats.active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Inactive</div>
          <div className="stat-value">{stats.inactive}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Admins</div>
          <div className="stat-value">{stats.admins}</div>
        </div>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h3>{filteredUsers.length} Users</h3>
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

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>
                <th>Client User Name</th>
                <th>Client ID</th>
                <th>Role</th>
                <th>Practices</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-small" style={{ backgroundColor: '#3b82f6' }}>
                        {user.initial}
                      </div>
                      {user.firstName}
                    </div>
                  </td>
                  <td>{user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.clientUserName}</td>
                  <td>{user.clientId}</td>
                  <td>
                    <span 
                      className="role-badge"
                      style={{ backgroundColor: getRoleColor(user.role) + '20', color: getRoleColor(user.role) }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{user.practices}</td>
                  <td>
                    <span className="status-badge status-active">
                      {user.status}
                    </span>
                  </td>
                  <td>{user.lastLogin}</td>
                  <td>
                    <button className="icon-btn">
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M11 3H5C4.46957 3 3.96086 3.21071 3.58579 3.58579C3.21071 3.96086 3 4.46957 3 5V15C3 15.5304 3.21071 16.0391 3.58579 16.4142C3.96086 16.7893 4.46957 17 5 17H15C15.5304 17 16.0391 16.7893 16.4142 16.4142C16.7893 16.0391 17 15.5304 17 15V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M14.5 1.5L18.5 5.5L11 13H7V9L14.5 1.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;

