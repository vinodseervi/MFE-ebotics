import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { hasPermission, hasAllPermissions, hasAnyPermission, PERMISSIONS } from '../utils/permissions';

// Re-export PERMISSIONS for convenience
export { PERMISSIONS };

/**
 * Custom hook for checking user permissions
 * @returns {Object} Permission checking functions
 */
export const usePermissions = () => {
  const { user } = useAuth();
  
  const userPermissions = useMemo(() => {
    return user?.perms || [];
  }, [user?.perms]);

  // Check if user is SUPER ADMIN
  const isSuperAdmin = useMemo(() => {
    if (!user?.roleMeta?.name) return false;
    const roleName = user.roleMeta.name.toUpperCase();
    return roleName === 'SUPER ADMIN' || roleName === 'SUPER_ADMIN' || roleName.includes('SUPER ADMIN');
  }, [user?.roleMeta?.name]);

  /**
   * Check if user has a specific permission
   * @param {string|Array<string>} permission - Permission code(s) to check
   * @returns {boolean}
   */
  const can = (permission) => {
    // SUPER ADMIN has access to everything
    if (isSuperAdmin) {
      return true;
    }
    return hasPermission(userPermissions, permission);
  };

  /**
   * Check if user has all of the specified permissions
   * @param {Array<string>} permissions - Array of permission codes
   * @returns {boolean}
   */
  const canAll = (permissions) => {
    // SUPER ADMIN has access to everything
    if (isSuperAdmin) {
      return true;
    }
    return hasAllPermissions(userPermissions, permissions);
  };

  /**
   * Check if user has any of the specified permissions
   * @param {Array<string>} permissions - Array of permission codes
   * @returns {boolean}
   */
  const canAny = (permissions) => {
    // SUPER ADMIN has access to everything
    if (isSuperAdmin) {
      return true;
    }
    return hasAnyPermission(userPermissions, permissions);
  };

  /**
   * Get all user permissions
   * @returns {Array<string>}
   */
  const getPermissions = () => {
    return userPermissions;
  };

  return {
    can,
    canAll,
    canAny,
    getPermissions,
    userPermissions,
    isSuperAdmin,
    PERMISSIONS, // Export constants for easy access
  };
};

