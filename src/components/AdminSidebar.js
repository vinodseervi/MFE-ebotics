import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { GrUserAdmin } from 'react-icons/gr';
import { MdOutlinePeople, MdOutlineGrid3X3, MdOutlineSecurity } from 'react-icons/md';
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
            <GrUserAdmin size={20} />
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
          <MdOutlinePeople size={20} />
          <span>Users</span>
        </Link>

        <Link 
          to="/admin/practices" 
          className={`admin-nav-item ${isActive('/admin/practices') ? 'active' : ''}`}
        >
          <MdOutlineGrid3X3 size={20} />
          <span>Practices</span>
        </Link>

        <Link 
          to="/admin/roles" 
          className={`admin-nav-item ${isActive('/admin/roles') ? 'active' : ''}`}
        >
          <MdOutlineSecurity size={20} />
          <span>Roles & Permissions</span>
        </Link>
      </nav>
    </div>
  );
};

export default AdminSidebar;

