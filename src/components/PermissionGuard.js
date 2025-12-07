import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Component that conditionally renders children based on permissions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if permission check passes
 * @param {string|Array<string>} props.permission - Required permission(s)
 * @param {boolean} props.requireAll - If true, user must have ALL permissions
 * @param {React.ReactNode} props.fallback - Component to render if permission check fails
 */
const PermissionGuard = ({ 
  children, 
  permission, 
  requireAll = false,
  fallback = null 
}) => {
  const { can, canAll, canAny } = usePermissions();

  if (!permission) {
    return children;
  }

  let hasAccess = false;
  
  if (Array.isArray(permission)) {
    hasAccess = requireAll 
      ? canAll(permission) 
      : canAny(permission);
  } else {
    hasAccess = can(permission);
  }

  return hasAccess ? children : fallback;
};

export default PermissionGuard;

