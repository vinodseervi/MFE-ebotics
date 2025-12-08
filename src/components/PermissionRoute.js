import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext';

/**
 * Route component that checks permissions before rendering
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if permission check passes
 * @param {string|Array<string>} props.permission - Required permission(s) to access this route
 * @param {boolean} props.requireAll - If true, user must have ALL permissions. If false (default), user needs ANY permission
 * @param {string} props.fallbackPath - Path to redirect if permission check fails (default: '/')
 */
const PermissionRoute = ({ 
  children, 
  permission, 
  requireAll = false,
  fallbackPath = '/' 
}) => {
  const { isAuthenticated, loading } = useAuth();
  const { can, canAll, canAny, isSuperAdmin } = usePermissions();

  // Show loading while checking auth
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no permission specified, allow access (just check authentication)
  if (!permission) {
    return children;
  }

  // SUPER ADMIN has access to everything (checked in usePermissions hook)
  if (isSuperAdmin) {
    return children;
  }

  // Check permissions
  let hasAccess = false;
  
  if (Array.isArray(permission)) {
    // Multiple permissions
    hasAccess = requireAll 
      ? canAll(permission) 
      : canAny(permission);
  } else {
    // Single permission
    hasAccess = can(permission);
  }

  // Redirect if no access
  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default PermissionRoute;

