import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../hooks/usePermissions';
import PermissionGuard from './PermissionGuard';
import { 
  MdOutlineHome,
  MdOutlineDescription,
  MdOutlineCloudUpload,
  MdOutlineHelpOutline,
  MdOutlineHelp,
  MdOutlinePayment,
  MdOutlineLogout
} from 'react-icons/md';
import { GrUserAdmin } from 'react-icons/gr';
import './Sidebar.css';

const Sidebar = ({ showAdminSubmenu, onAdminClick, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [adminExpanded, setAdminExpanded] = useState(isAdminRoute || showAdminSubmenu || false);

  useEffect(() => {
    if (isAdminRoute) {
      setAdminExpanded(true);
    }
  }, [isAdminRoute]);

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname.startsWith('/admin');
    }
    // Highlight Checks when on /checks, /checks/new, or /checks/:id
    if (path === '/checks') {
      return location.pathname === '/checks' || 
             location.pathname.startsWith('/checks/');
    }
    return location.pathname === path;
  };

  const handleAdminClick = () => {
    setAdminExpanded(!adminExpanded);
    if (onAdminClick) onAdminClick();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getUserDisplayName = () => {
    if (user) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
    }
    return 'User';
  };

  const getUserInitials = () => {
    if (user) {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      if (firstName && lastName) {
        return `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
      }
      if (user.email) {
        return user.email[0].toUpperCase();
      }
    }
    return 'U';
  };

  const getUserRole = () => {
    if (user && user.roleMeta && user.roleMeta.name) {
      // Format role: SUPER ADMIN -> Super Admin, etc.
      return user.roleMeta.name
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
    }
    return 'User';
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <>
            <div className="logo">
              <img src="/ebotics_icon.png" alt="Ebotics Icon" className="logo-expanded-icon" />
              <span className="logo-text">otics</span>
            </div>
            <button className="collapse-btn" onClick={onToggleCollapse}>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none"
              >
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </>
        )}
        {isCollapsed && (
          <button 
            className="logo-icon-btn" 
            onClick={onToggleCollapse}
            title="Click to expand"
          >
            <div className="logo-icon">
              <img src="/ebotics_icon.png" alt="Ebotics Icon" className="logo-icon-img" />
            </div>
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard - Available to all authenticated users */}
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`} title={isCollapsed ? 'Dashboard' : ''}>
          <MdOutlineHome className="nav-icon" size={22} />
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        {/* Checks - Always visible in sidebar */}
        <Link to="/checks" className={`nav-item ${isActive('/checks') ? 'active' : ''}`} title={isCollapsed ? 'Checks' : ''}>
          <MdOutlineDescription className="nav-icon" size={22} />
          {!isCollapsed && <span>Checks</span>}
        </Link>

        {/* Check Upload - Always visible in sidebar */}
        <Link to="/check-upload" className={`nav-item ${isActive('/check-upload') ? 'active' : ''}`} title={isCollapsed ? 'Check Upload' : ''}>
          <MdOutlineCloudUpload className="nav-icon" size={22} />
          {!isCollapsed && <span>Check Upload</span>}
        </Link>

        {/* Clarifications - Always visible in sidebar */}
        <Link to="/clarifications" className={`nav-item ${isActive('/clarifications') ? 'active' : ''}`} title={isCollapsed ? 'Clarifications' : ''}>
          <MdOutlineHelpOutline className="nav-icon" size={22} />
          {!isCollapsed && <span>Clarifications</span>}
        </Link>

        {/* Unknown - Always visible in sidebar */}
        <Link to="/unknown" className={`nav-item ${isActive('/unknown') ? 'active' : ''}`} title={isCollapsed ? 'Unknown' : ''}>
          <MdOutlineHelp className="nav-icon" size={22} />
          {!isCollapsed && <span>Unknown</span>}
        </Link>

        {/* DIT/DRL Payments - Always visible in sidebar */}
        <Link to="/dit-drl-payments" className={`nav-item ${isActive('/dit-drl-payments') ? 'active' : ''}`} title={isCollapsed ? 'DIT/DRL Payments' : ''}>
          <MdOutlinePayment className="nav-icon" size={22} />
          {!isCollapsed && <span>DIT/DRL Payments</span>}
        </Link>
      </nav>

      <div className="sidebar-divider"></div>

      {/* Admin Portal - Requires any admin portal permission */}
      <PermissionGuard permission={[
        PERMISSIONS.ADMIN_PORTAL_DASHBOARD_VIEW,
        PERMISSIONS.USER_LIST,
        PERMISSIONS.ROLE_LIST,
        PERMISSIONS.PRACTICE_LIST
      ]}>
        <div className="admin-section">
          <button 
            className={`nav-item admin-portal ${isActive('/admin') ? 'active' : ''}`}
            onClick={handleAdminClick}
            title={isCollapsed ? 'Admin Portal' : ''}
          >
            <GrUserAdmin className="nav-icon" size={22} />
            {!isCollapsed && <span>Admin Portal</span>}
          </button>
        </div>
      </PermissionGuard>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <Link to="/profile" className="user-profile-link">
            <div className="user-profile">
              <div className="user-avatar">{getUserInitials()}</div>
              <div className="user-info">
                <div className="user-name">{getUserDisplayName()}</div>
                <div className="user-role">{getUserRole()}</div>
              </div>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <Link to="/profile" className="user-profile-link-collapsed" title="Profile">
            <div className="user-profile-collapsed">
              <div className="user-avatar">{getUserInitials()}</div>
            </div>
          </Link>
        )}
        <button className="sign-out-btn" onClick={handleLogout} title={isCollapsed ? 'Sign Out' : ''}>
          <MdOutlineLogout className="nav-icon" size={22} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

