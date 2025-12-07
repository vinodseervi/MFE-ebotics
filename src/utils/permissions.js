/**
 * Permission System for eBotics Solutions
 * Handles permission checking with support for composite permissions
 */

// All available permissions grouped by category
export const PERMISSIONS = {
  // Global Permissions
  GLOBAL_ALL: 'GLOBAL_ALL',
  GLOBAL_VIEW_ALL: 'GLOBAL_VIEW_ALL',
  
  // Admin Portal
  ADMIN_PORTAL_ALL: 'ADMIN_PORTAL_ALL',
  ADMIN_PORTAL_DASHBOARD_VIEW: 'ADMIN_PORTAL_DASHBOARD_VIEW',
  ADMIN_PORTAL_VIEW_ALL: 'ADMIN_PORTAL_VIEW_ALL',
  
  // User Management
  USER_CREATE: 'USER_CREATE',
  USER_LIST: 'USER_LIST',
  USER_MANAGEMENT_ALL: 'USER_MANAGEMENT_ALL',
  USER_MANAGEMENT_VIEW_ALL: 'USER_MANAGEMENT_VIEW_ALL',
  USER_UPDATE: 'USER_UPDATE',
  USER_UPDATE_STATUS: 'USER_UPDATE_STATUS',
  
  // Role Management
  ROLE_CREATE: 'ROLE_CREATE',
  ROLE_LIST: 'ROLE_LIST',
  ROLE_MANAGEMENT_ALL: 'ROLE_MANAGEMENT_ALL',
  ROLE_MANAGEMENT_VIEW_ALL: 'ROLE_MANAGEMENT_VIEW_ALL',
  ROLE_UPDATE: 'ROLE_UPDATE',
  ROLE_UPDATE_PERMISSIONS: 'ROLE_UPDATE_PERMISSIONS',
  ROLE_UPDATE_STATUS: 'ROLE_UPDATE_STATUS',
  
  // Practice Management
  PRACTICE_CREATE: 'PRACTICE_CREATE',
  PRACTICE_DELETE: 'PRACTICE_DELETE',
  PRACTICE_GET: 'PRACTICE_GET',
  PRACTICE_LIST: 'PRACTICE_LIST',
  PRACTICE_LOCATION_CREATE: 'PRACTICE_LOCATION_CREATE',
  PRACTICE_LOCATION_DELETE: 'PRACTICE_LOCATION_DELETE',
  PRACTICE_LOCATION_GET: 'PRACTICE_LOCATION_GET',
  PRACTICE_LOCATION_LIST: 'PRACTICE_LOCATION_LIST',
  PRACTICE_LOCATION_STATUS_UPDATE: 'PRACTICE_LOCATION_STATUS_UPDATE',
  PRACTICE_LOCATION_UPDATE: 'PRACTICE_LOCATION_UPDATE',
  PRACTICE_MANAGEMENT_ALL: 'PRACTICE_MANAGEMENT_ALL',
  PRACTICE_MANAGEMENT_VIEW_ALL: 'PRACTICE_MANAGEMENT_VIEW_ALL',
  PRACTICE_UPDATE: 'PRACTICE_UPDATE',
  PRACTICE_UPDATE_STATUS: 'PRACTICE_UPDATE_STATUS',
  
  // Payment Management
  PAYMENT_ALLOCATION_CREATE: 'PAYMENT_ALLOCATION_CREATE',
  PAYMENT_ALLOCATION_DELETE: 'PAYMENT_ALLOCATION_DELETE',
  PAYMENT_ALLOCATION_GET: 'PAYMENT_ALLOCATION_GET',
  PAYMENT_ALLOCATION_LIST: 'PAYMENT_ALLOCATION_LIST',
  PAYMENT_ALLOCATION_UPDATE: 'PAYMENT_ALLOCATION_UPDATE',
  PAYMENT_BATCH_CREATE: 'PAYMENT_BATCH_CREATE',
  PAYMENT_BATCH_DELETE: 'PAYMENT_BATCH_DELETE',
  PAYMENT_BATCH_GET: 'PAYMENT_BATCH_GET',
  PAYMENT_BATCH_LIST: 'PAYMENT_BATCH_LIST',
  PAYMENT_BATCH_UPDATE: 'PAYMENT_BATCH_UPDATE',
  PAYMENT_CHECK_CREATE: 'PAYMENT_CHECK_CREATE',
  PAYMENT_CHECK_DELETE: 'PAYMENT_CHECK_DELETE',
  PAYMENT_CHECK_GET: 'PAYMENT_CHECK_GET',
  PAYMENT_CHECK_LIST: 'PAYMENT_CHECK_LIST',
  PAYMENT_CHECK_UPDATE: 'PAYMENT_CHECK_UPDATE',
  PAYMENT_MANAGEMENT_ALL: 'PAYMENT_MANAGEMENT_ALL',
  PAYMENT_MANAGEMENT_VIEW_ALL: 'PAYMENT_MANAGEMENT_VIEW_ALL',
};

// Permission groups mapping for composite permissions
const PERMISSION_GROUPS = {
  GLOBAL_ALL: ['*'], // All permissions
  GLOBAL_VIEW_ALL: [
    // All view permissions across all groups
    'ADMIN_PORTAL_DASHBOARD_VIEW',
    'USER_LIST',
    'ROLE_LIST',
    'PRACTICE_LIST',
    'PRACTICE_GET',
    'PRACTICE_LOCATION_LIST',
    'PRACTICE_LOCATION_GET',
    'PAYMENT_BATCH_LIST',
    'PAYMENT_BATCH_GET',
    'PAYMENT_CHECK_LIST',
    'PAYMENT_CHECK_GET',
    'PAYMENT_ALLOCATION_LIST',
    'PAYMENT_ALLOCATION_GET',
  ],
  
  ADMIN_PORTAL_ALL: [
    'ADMIN_PORTAL_DASHBOARD_VIEW',
    'USER_CREATE',
    'USER_LIST',
    'USER_UPDATE',
    'USER_UPDATE_STATUS',
    'ROLE_CREATE',
    'ROLE_LIST',
    'ROLE_UPDATE',
    'ROLE_UPDATE_STATUS',
    'ROLE_UPDATE_PERMISSIONS',
  ],
  ADMIN_PORTAL_VIEW_ALL: [
    'ADMIN_PORTAL_DASHBOARD_VIEW',
    'USER_LIST',
    'ROLE_LIST',
  ],
  
  USER_MANAGEMENT_ALL: [
    'USER_CREATE',
    'USER_LIST',
    'USER_UPDATE',
    'USER_UPDATE_STATUS',
  ],
  USER_MANAGEMENT_VIEW_ALL: [
    'USER_LIST',
  ],
  
  ROLE_MANAGEMENT_ALL: [
    'ROLE_CREATE',
    'ROLE_LIST',
    'ROLE_UPDATE',
    'ROLE_UPDATE_PERMISSIONS',
    'ROLE_UPDATE_STATUS',
  ],
  ROLE_MANAGEMENT_VIEW_ALL: [
    'ROLE_LIST',
  ],
  
  PRACTICE_MANAGEMENT_ALL: [
    'PRACTICE_CREATE',
    'PRACTICE_LIST',
    'PRACTICE_GET',
    'PRACTICE_UPDATE',
    'PRACTICE_UPDATE_STATUS',
    'PRACTICE_DELETE',
    'PRACTICE_LOCATION_CREATE',
    'PRACTICE_LOCATION_LIST',
    'PRACTICE_LOCATION_GET',
    'PRACTICE_LOCATION_UPDATE',
    'PRACTICE_LOCATION_STATUS_UPDATE',
    'PRACTICE_LOCATION_DELETE',
  ],
  PRACTICE_MANAGEMENT_VIEW_ALL: [
    'PRACTICE_LIST',
    'PRACTICE_GET',
    'PRACTICE_LOCATION_LIST',
    'PRACTICE_LOCATION_GET',
  ],
  
  PAYMENT_MANAGEMENT_ALL: [
    'PAYMENT_BATCH_CREATE',
    'PAYMENT_BATCH_LIST',
    'PAYMENT_BATCH_GET',
    'PAYMENT_BATCH_UPDATE',
    'PAYMENT_BATCH_DELETE',
    'PAYMENT_CHECK_CREATE',
    'PAYMENT_CHECK_LIST',
    'PAYMENT_CHECK_GET',
    'PAYMENT_CHECK_UPDATE',
    'PAYMENT_CHECK_DELETE',
    'PAYMENT_ALLOCATION_CREATE',
    'PAYMENT_ALLOCATION_LIST',
    'PAYMENT_ALLOCATION_GET',
    'PAYMENT_ALLOCATION_UPDATE',
    'PAYMENT_ALLOCATION_DELETE',
  ],
  PAYMENT_MANAGEMENT_VIEW_ALL: [
    'PAYMENT_BATCH_LIST',
    'PAYMENT_BATCH_GET',
    'PAYMENT_CHECK_LIST',
    'PAYMENT_CHECK_GET',
    'PAYMENT_ALLOCATION_LIST',
    'PAYMENT_ALLOCATION_GET',
  ],
};

/**
 * Check if user has a specific permission
 * Handles composite permissions automatically
 * @param {Array<string>} userPermissions - Array of permission codes the user has
 * @param {string|Array<string>} requiredPermission - Permission code(s) to check
 * @returns {boolean} - True if user has the permission
 */
export const hasPermission = (userPermissions = [], requiredPermission) => {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Handle GLOBAL_ALL - grants all permissions
  if (userPermissions.includes(PERMISSIONS.GLOBAL_ALL)) {
    return true;
  }

  // Handle array of required permissions (check if user has ANY of them)
  if (Array.isArray(requiredPermission)) {
    return requiredPermission.some(perm => hasPermission(userPermissions, perm));
  }

  // Direct permission check
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check composite permissions
  for (const userPerm of userPermissions) {
    const groupPermissions = PERMISSION_GROUPS[userPerm];
    
    if (groupPermissions) {
      // If group contains '*', user has all permissions
      if (groupPermissions.includes('*')) {
        return true;
      }
      
      // Check if the required permission is in this group
      if (groupPermissions.includes(requiredPermission)) {
        return true;
      }
      
      // Recursively check nested composite permissions
      if (hasPermission(groupPermissions, requiredPermission)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Check if user has all of the specified permissions
 * @param {Array<string>} userPermissions - Array of permission codes the user has
 * @param {Array<string>} requiredPermissions - Array of permission codes required
 * @returns {boolean} - True if user has all permissions
 */
export const hasAllPermissions = (userPermissions = [], requiredPermissions = []) => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  return requiredPermissions.every(perm => hasPermission(userPermissions, perm));
};

/**
 * Check if user has any of the specified permissions
 * @param {Array<string>} userPermissions - Array of permission codes the user has
 * @param {Array<string>} requiredPermissions - Array of permission codes (user needs at least one)
 * @returns {boolean} - True if user has at least one permission
 */
export const hasAnyPermission = (userPermissions = [], requiredPermissions = []) => {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }
  
  return requiredPermissions.some(perm => hasPermission(userPermissions, perm));
};

/**
 * Get permission display name
 * @param {string} permissionCode - Permission code
 * @returns {string} - Human-readable permission name
 */
export const getPermissionDisplayName = (permissionCode) => {
  const permissionMap = {
    [PERMISSIONS.ADMIN_PORTAL_DASHBOARD_VIEW]: 'View Admin Dashboard',
    [PERMISSIONS.USER_CREATE]: 'Create User',
    [PERMISSIONS.USER_LIST]: 'List Users',
    [PERMISSIONS.USER_UPDATE]: 'Update User',
    [PERMISSIONS.USER_UPDATE_STATUS]: 'Activate/Deactivate User',
    [PERMISSIONS.ROLE_CREATE]: 'Create Role',
    [PERMISSIONS.ROLE_LIST]: 'List Roles',
    [PERMISSIONS.ROLE_UPDATE]: 'Update Role',
    [PERMISSIONS.ROLE_UPDATE_PERMISSIONS]: 'Update Role Permissions',
    [PERMISSIONS.ROLE_UPDATE_STATUS]: 'Activate/Deactivate Role',
    [PERMISSIONS.PRACTICE_CREATE]: 'Create Practice',
    [PERMISSIONS.PRACTICE_LIST]: 'List Practices',
    [PERMISSIONS.PRACTICE_GET]: 'View Practice',
    [PERMISSIONS.PRACTICE_UPDATE]: 'Update Practice',
    [PERMISSIONS.PRACTICE_UPDATE_STATUS]: 'Activate/Deactivate Practice',
    [PERMISSIONS.PRACTICE_DELETE]: 'Delete Practice',
    [PERMISSIONS.PRACTICE_LOCATION_CREATE]: 'Create Location',
    [PERMISSIONS.PRACTICE_LOCATION_LIST]: 'List Locations',
    [PERMISSIONS.PRACTICE_LOCATION_GET]: 'View Location',
    [PERMISSIONS.PRACTICE_LOCATION_UPDATE]: 'Update Location',
    [PERMISSIONS.PRACTICE_LOCATION_STATUS_UPDATE]: 'Activate/Deactivate Location',
    [PERMISSIONS.PRACTICE_LOCATION_DELETE]: 'Delete Location',
    [PERMISSIONS.PAYMENT_BATCH_CREATE]: 'Create Payment Batch',
    [PERMISSIONS.PAYMENT_BATCH_LIST]: 'List Payment Batches',
    [PERMISSIONS.PAYMENT_BATCH_GET]: 'View Payment Batch',
    [PERMISSIONS.PAYMENT_BATCH_UPDATE]: 'Update Payment Batch',
    [PERMISSIONS.PAYMENT_BATCH_DELETE]: 'Delete Payment Batch',
    [PERMISSIONS.PAYMENT_CHECK_CREATE]: 'Create Check',
    [PERMISSIONS.PAYMENT_CHECK_LIST]: 'List Checks',
    [PERMISSIONS.PAYMENT_CHECK_GET]: 'View Check',
    [PERMISSIONS.PAYMENT_CHECK_UPDATE]: 'Update Check',
    [PERMISSIONS.PAYMENT_CHECK_DELETE]: 'Delete Check',
    [PERMISSIONS.PAYMENT_ALLOCATION_CREATE]: 'Create Allocation',
    [PERMISSIONS.PAYMENT_ALLOCATION_LIST]: 'List Allocations',
    [PERMISSIONS.PAYMENT_ALLOCATION_GET]: 'View Allocation',
    [PERMISSIONS.PAYMENT_ALLOCATION_UPDATE]: 'Update Allocation',
    [PERMISSIONS.PAYMENT_ALLOCATION_DELETE]: 'Delete Allocation',
  };
  
  return permissionMap[permissionCode] || permissionCode;
};

