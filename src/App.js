import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/AdminSidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Checks from './pages/Checks';
import CheckDetails from './pages/CheckDetails';
import CheckUpload from './pages/CheckUpload';
import Clarifications from './pages/Clarifications';
import Unknown from './pages/Unknown';
import DITDRLPayments from './pages/DITDRLPayments';
import Users from './pages/admin/Users';
import Practices from './pages/admin/Practices';
import Roles from './pages/admin/Roles';
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

  // Show loading state while checking authentication
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

  // Don't show sidebar on login page
  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
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
    navigate('/');
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
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/checks" element={<ProtectedRoute><Checks /></ProtectedRoute>} />
          <Route path="/checks/:id" element={<ProtectedRoute><CheckDetails /></ProtectedRoute>} />
          <Route path="/check-upload" element={<ProtectedRoute><CheckUpload /></ProtectedRoute>} />
          <Route path="/clarifications" element={<ProtectedRoute><Clarifications /></ProtectedRoute>} />
          <Route path="/unknown" element={<ProtectedRoute><Unknown /></ProtectedRoute>} />
          <Route path="/dit-drl-payments" element={<ProtectedRoute><DITDRLPayments /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Navigate to="/admin/users" replace /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/admin/practices" element={<ProtectedRoute><Practices /></ProtectedRoute>} />
          <Route path="/admin/roles" element={<ProtectedRoute><Roles /></ProtectedRoute>} />
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
