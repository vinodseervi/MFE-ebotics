import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AdminSidebar from './components/AdminSidebar';
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
  const [showAdminSubmenu, setShowAdminSubmenu] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showAdminSidebar, setShowAdminSidebar] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdminRoute) {
      setShowAdminSidebar(true);
      setShowAdminSubmenu(true);
    } else {
      setShowAdminSidebar(false);
    }
  }, [isAdminRoute]);

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
          <Route path="/" element={<Dashboard />} />
          <Route path="/checks" element={<Checks />} />
          <Route path="/checks/:id" element={<CheckDetails />} />
          <Route path="/check-upload" element={<CheckUpload />} />
          <Route path="/clarifications" element={<Clarifications />} />
          <Route path="/unknown" element={<Unknown />} />
          <Route path="/dit-drl-payments" element={<DITDRLPayments />} />
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/practices" element={<Practices />} />
          <Route path="/admin/roles" element={<Roles />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
