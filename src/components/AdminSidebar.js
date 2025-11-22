import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = ({ onClose, isMainSidebarCollapsed }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`admin-sidebar ${isMainSidebarCollapsed ? 'main-sidebar-collapsed' : ''}`}>
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-title">
          <div className="admin-sidebar-title-text">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L3 7V17H8V12H12V17H17V7L10 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Admin Portal</span>
          </div>
        </div>
        <button className="close-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        <Link 
          to="/admin/users" 
          className={`admin-nav-item ${isActive('/admin/users') ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M0 20C0 15.5817 4.47715 12 10 12C15.5228 12 20 15.5817 20 20" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <span>Users</span>
        </Link>

        <Link 
          to="/admin/practices" 
          className={`admin-nav-item ${isActive('/admin/practices') ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 3H17V17H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 7H17M7 3V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span>Practices</span>
        </Link>

        <Link 
          to="/admin/roles" 
          className={`admin-nav-item ${isActive('/admin/roles') ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L3 7V17H8V12H12V17H17V7L10 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Roles & Permissions</span>
        </Link>
      </nav>
    </div>
  );
};

export default AdminSidebar;

