import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/AdminSidebar';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute from './components/PermissionRoute';
import { PERMISSIONS } from './hooks/usePermissions';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Checks from './pages/Checks';
import CheckDetails from './pages/CheckDetails';
import CheckUpload from './pages/CheckUpload';
import CreateCheck from './pages/CreateCheck';
import Clarifications from './pages/Clarifications';
import Unknown from './pages/Unknown';
import DITDRLPayments from './pages/DITDRLPayments';
import Users from './pages/admin/Users';
import Practices from './pages/admin/Practices';
import Roles from './pages/admin/Roles';
import RoleForm from './pages/admin/RoleForm';
import Profile from './pages/Profile';
import './App.css';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isLoginPage = location.pathname === '/login';

  // Redirect to login if not authenticated (except on login page)
  // Only redirect after loading is complete
  useEffect(() => {
    if (!loading && !isAuthenticated && !isLoginPage) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoginPage, navigate, loading]);

  // Handle admin sidebar state
  useEffect(() => {
    if (isAdminRoute) {
      setShowAdminSidebar(true);
      setShowAdminSubmenu(true);
    } else {
      setShowAdminSidebar(false);
    }
  }, [isAdminRoute]);

  // Don't show sidebar on login page - show login page immediately
  // This prevents white screen during login attempts
  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Show loading state while checking authentication (but not on login page)
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading...</div>
        </div>
      </div>
    );
  }

  const handleAdminClick = () => {
    if (!isAdminRoute) {
      // Navigate to users page by default when admin portal is clicked
      navigate('/admin/users');
      setShowAdminSidebar(true);
    } else {
      // If already on admin route, just toggle
      setShowAdminSidebar(!showAdminSidebar);
    }
    setShowAdminSubmenu(true);
  };

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleCloseAdminSidebar = () => {
    setShowAdminSidebar(false);
    // Don't navigate - keep user on current page
  };

  return (
    <div className={`app ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${showAdminSidebar ? 'admin-sidebar-open' : ''}`}>
      <Sidebar 
        showAdminSubmenu={showAdminSubmenu} 
        onAdminClick={handleAdminClick}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      {showAdminSidebar && (
        <AdminSidebar 
          onClose={handleCloseAdminSidebar}
          isMainSidebarCollapsed={isSidebarCollapsed}
        />
      )}
      <div className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${showAdminSidebar ? 'admin-sidebar-open' : ''}`}>
        <Routes>
          {/* Dashboard - Available to all authenticated users */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          {/* Checks - Requires PAYMENT_CHECK_LIST permission */}
          <Route path="/checks" element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_CHECK_LIST}>
              <Checks />
            </PermissionRoute>
          } />
          <Route path="/checks/:id" element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_CHECK_GET}>
              <CheckDetails />
            </PermissionRoute>
          } />
          
          {/* Check Upload - Requires PAYMENT_CHECK_CREATE permission */}
          <Route path="/check-upload" element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_CHECK_CREATE}>
              <CheckUpload />
            </PermissionRoute>
          } />
          
          {/* Create Check - Requires PAYMENT_CHECK_CREATE permission */}
          <Route path="/checks/new" element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_CHECK_CREATE}>
              <CreateCheck />
            </PermissionRoute>
          } />
          
          {/* Clarifications - Requires PAYMENT_ALLOCATION_LIST permission */}
          <Route path="/clarifications" element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_ALLOCATION_LIST}>
              <Clarifications />
            </PermissionRoute>
          } />
          
          {/* Unknown - Requires PAYMENT_CHECK_LIST permission */}
          <Route path="/unknown" element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_CHECK_LIST}>
              <Unknown />
            </PermissionRoute>
          } />
          
          {/* DIT/DRL Payments - Requires PAYMENT_BATCH_LIST permission */}
          <Route path="/dit-drl-payments" element={
            <PermissionRoute permission={PERMISSIONS.PAYMENT_BATCH_LIST}>
              <DITDRLPayments />
            </PermissionRoute>
          } />
          
          {/* Profile - Available to all authenticated users */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          
          {/* Admin Portal Routes */}
          <Route path="/admin" element={
            <PermissionRoute permission={[
              PERMISSIONS.ADMIN_PORTAL_DASHBOARD_VIEW,
              PERMISSIONS.USER_LIST,
              PERMISSIONS.ROLE_LIST,
              PERMISSIONS.PRACTICE_LIST
            ]} fallbackPath="/">
              <Navigate to="/admin/users" replace />
            </PermissionRoute>
          } />
          
          {/* Users Management - Requires USER_LIST permission */}
          <Route path="/admin/users" element={
            <PermissionRoute permission={PERMISSIONS.USER_LIST}>
              <Users />
            </PermissionRoute>
          } />
          
          {/* Practices Management - Requires PRACTICE_LIST permission */}
          <Route path="/admin/practices" element={
            <PermissionRoute permission={PERMISSIONS.PRACTICE_LIST}>
              <Practices />
            </PermissionRoute>
          } />
          
          {/* Roles Management - Requires ROLE_LIST permission */}
          <Route path="/admin/roles" element={
            <PermissionRoute permission={PERMISSIONS.ROLE_LIST}>
              <Roles />
            </PermissionRoute>
          } />
          
          {/* Role Form - Create/Edit - Requires ROLE_CREATE or ROLE_UPDATE permission */}
          <Route path="/admin/roles/new" element={
            <PermissionRoute permission={PERMISSIONS.ROLE_CREATE}>
              <RoleForm />
            </PermissionRoute>
          } />
          <Route path="/admin/roles/:id/edit" element={
            <PermissionRoute permission={PERMISSIONS.ROLE_UPDATE}>
              <RoleForm />
            </PermissionRoute>
          } />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
