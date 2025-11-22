import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ showAdminSubmenu, onAdminClick, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
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
    return location.pathname === path;
  };

  const handleAdminClick = () => {
    setAdminExpanded(!adminExpanded);
    if (onAdminClick) onAdminClick();
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && (
          <>
            <div className="logo">
              <span className="logo-e3">E3</span> otics
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
              <span className="logo-e3">E3</span>
            </div>
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`} title={isCollapsed ? 'Dashboard' : ''}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 3H7L9 1H11L13 3H17V7L19 9V11L17 13V17H13L11 19H9L7 17H3V13L1 11V9L3 7V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 7H13M7 10H13M7 13H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {!isCollapsed && <span>Dashboard</span>}
        </Link>

        <Link to="/checks" className={`nav-item ${isActive('/checks') ? 'active' : ''}`} title={isCollapsed ? 'Checks' : ''}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 4H16V16H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 8H16M8 4V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {!isCollapsed && <span>Checks</span>}
        </Link>

        <Link to="/check-upload" className={`nav-item ${isActive('/check-upload') ? 'active' : ''}`} title={isCollapsed ? 'Check Upload' : ''}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 3L7 6H13L10 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && <span>Check Upload</span>}
        </Link>

        <Link to="/clarifications" className={`nav-item ${isActive('/clarifications') ? 'active' : ''}`} title={isCollapsed ? 'Clarifications' : ''}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M10 6V10M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {!isCollapsed && <span>Clarifications</span>}
        </Link>

        <Link to="/unknown" className={`nav-item ${isActive('/unknown') ? 'active' : ''}`} title={isCollapsed ? 'Unknown' : ''}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M10 6V10M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {!isCollapsed && <span>Unknown</span>}
        </Link>

        <Link to="/dit-drl-payments" className={`nav-item ${isActive('/dit-drl-payments') ? 'active' : ''}`} title={isCollapsed ? 'DIT/DRL Payments' : ''}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
            <path d="M6 8H14M6 12H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {!isCollapsed && <span>DIT/DRL Payments</span>}
        </Link>
      </nav>

      <div className="sidebar-divider"></div>

      <div className="admin-section">
        <button 
          className={`nav-item admin-portal ${isActive('/admin') ? 'active' : ''}`}
          onClick={handleAdminClick}
          title={isCollapsed ? 'Admin Portal' : ''}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2L3 7V17H8V12H12V17H17V7L10 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!isCollapsed && <span>Admin Portal</span>}
        </button>
      </div>

      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="user-profile">
            <div className="user-avatar">S</div>
            <div className="user-info">
              <div className="user-name">Sarah Johnson</div>
              <div className="user-role">Super Admin</div>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="user-profile-collapsed">
            <div className="user-avatar">S</div>
          </div>
        )}
        <button className="sign-out-btn" title={isCollapsed ? 'Sign Out' : ''}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7 17H3C2.44772 17 2 16.5523 2 16V4C2 3.44772 2.44772 3 3 3H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M13 14L17 10L13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

