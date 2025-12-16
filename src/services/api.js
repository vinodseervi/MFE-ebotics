/**
 * Central API Service
 * Manages all API calls to the backend
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ebs.seervitechlabs.com';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get authentication token from localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Get user ID from localStorage
   */
  getUserId() {
    return localStorage.getItem('userId');
  }

  /**
   * Get default headers for API requests
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      const userId = this.getUserId();
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      if (userId) {
        headers['x-user-id'] = userId;
      }
    }

    return headers;
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(options.includeAuth !== false),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized or 403 Forbidden - redirect to login
      if (response.status === 401 || response.status === 403) {
        // Clear authentication data
        this.logout();
        // Redirect to login page
        window.location.href = '/login';
        // Create error object
        const error = new Error(
          response.status === 401 
            ? 'Unauthorized. Please login again.' 
            : 'Access forbidden. Please login again.'
        );
        error.status = response.status;
        throw error;
      }
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        // Create error object with more details
        const error = new Error(data.message || data.error || data || `HTTP error! status: ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      // If it's already a 403 error we handled, just rethrow it
      if (error.status === 403) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // ==================== Authentication APIs ====================

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(email, password) {
    const response = await this.post(
      '/api/v1/auth/login',
      { email, password },
      { includeAuth: false }
    );
    
    // Store auth data in localStorage
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('userId', response.userId);
      localStorage.setItem('userEmail', response.email);
      localStorage.setItem('userFirstName', response.firstName);
      localStorage.setItem('userLastName', response.lastName);
      localStorage.setItem('roleId', response.roleId);
      localStorage.setItem('roleMeta', JSON.stringify(response.roleMeta || {}));
      localStorage.setItem('perms', JSON.stringify(response.perms || []));
      localStorage.setItem('expiresAt', response.expiresAt);
    }
    
    return response;
  }

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  async logout() {
    const userId = this.getUserId();
    
    if (userId) {
      try {
        await this.post('/api/v1/auth/logout', {}, {
          headers: {
            'x-user-id': userId,
          },
        });
      } catch (error) {
        console.error('Logout API error:', error);
        // Continue with logout even if API call fails
      }
    }
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('roleId');
    localStorage.removeItem('roleMeta');
    localStorage.removeItem('perms');
    localStorage.removeItem('expiresAt');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = this.getToken();
    const expiresAt = localStorage.getItem('expiresAt');
    
    if (!token) return false;
    
    // Check if token is expired
    if (expiresAt) {
      const expirationTime = parseInt(expiresAt, 10);
      if (Date.now() >= expirationTime) {
        this.logout();
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get current user info from localStorage
   */
  getCurrentUser() {
    if (!this.isAuthenticated()) {
      return null;
    }

    return {
      userId: this.getUserId(),
      email: localStorage.getItem('userEmail'),
      firstName: localStorage.getItem('userFirstName'),
      lastName: localStorage.getItem('userLastName'),
      roleId: localStorage.getItem('roleId'),
      roleMeta: JSON.parse(localStorage.getItem('roleMeta') || '{}'),
      perms: JSON.parse(localStorage.getItem('perms') || '[]'),
    };
  }

  // ==================== User Management APIs ====================

  /**
   * Create a new user
   * POST /api/v1/users
   */
  async createUser(userData) {
    return this.post('/api/v1/users', userData);
  }

  /**
   * Get all users
   * GET /api/v1/users
   */
  async getAllUsers() {
    return this.get('/api/v1/users');
  }

  /**
   * Get user by ID
   * GET /api/v1/users/{userId}
   * Requires x-user-id header (automatically included via getHeaders)
   */
  async getUserById(userId) {
    // x-user-id header is automatically included via getHeaders() in the request method
    return this.get(`/api/v1/users/${userId}`);
  }

  /**
   * Update a user
   * PATCH /api/v1/users/{userId}
   */
  async updateUser(userId, userData) {
    return this.patch(`/api/v1/users/${userId}`, userData);
  }

  /**
   * Update user status
   * PATCH /api/v1/users/{userId}/status
   */
  async updateUserStatus(userId, status) {
    // Ensure x-user-id header is included (logged-in admin's ID)
    const adminUserId = this.getUserId();
    return this.patch(`/api/v1/users/${userId}/status`, { status }, {
      headers: {
        'x-user-id': adminUserId,
      },
    });
  }

  /**
   * Change user password
   * PATCH /api/v1/users/me/password
   * Requires x-user-id header (automatically included via getHeaders)
   */
  async changePassword(currentPassword, newPassword) {
    // x-user-id header is automatically included via getHeaders() in the request method
    return this.patch('/api/v1/users/me/password', {
      currentPassword,
      newPassword
    });
  }

  // ==================== Role Management APIs ====================

  /**
   * Get all roles
   * GET /api/v1/roles
   */
  async getAllRoles(roleName = null) {
    const params = roleName ? `?roleName=${encodeURIComponent(roleName)}` : '';
    return this.get(`/api/v1/roles${params}`);
  }

  /**
   * Create a new role
   * POST /api/v1/roles
   */
  async createRole(roleData) {
    return this.post('/api/v1/roles', roleData);
  }

  /**
   * Update a role
   * PUT /api/v1/roles/{roleId}
   * Includes x-user-id header automatically (authenticated user's UUID)
   */
  async updateRole(roleId, roleData) {
    // x-user-id header is automatically included via getHeaders()
    return this.put(`/api/v1/roles/${roleId}`, roleData);
  }

  /**
   * Update role status
   * PATCH /api/v1/roles/{roleId}/status
   */
  async updateRoleStatus(roleId, status) {
    return this.patch(`/api/v1/roles/${roleId}/status`, { status });
  }

  /**
   * Update role permissions
   * PATCH /api/v1/roles/{roleId}/permissions
   */
  async updateRolePermissions(roleId, permissions) {
    return this.patch(`/api/v1/roles/${roleId}/permissions`, { permissions });
  }

  // ==================== Permissions APIs ====================

  /**
   * Get all available permissions
   * GET /api/v1/permissions
   */
  async getAllPermissions() {
    return this.get('/api/v1/permissions');
  }

  // ==================== Public APIs ====================

  /**
   * Get all public roles (roleId and roleName only)
   * GET /api/v1/public/roles
   * Requires x-user-id header (automatically included via getHeaders)
   */
  async getPublicRoles(roleName = null) {
    const params = roleName ? `?roleName=${encodeURIComponent(roleName)}` : '';
    // x-user-id header is automatically included via getHeaders() in the request method
    return this.get(`/api/v1/public/roles${params}`, {
      includeAuth: true // Ensure auth headers including x-user-id are included
    });
  }

  // ==================== Practice Management APIs ====================

  /**
   * Get all practices
   * GET /api/v1/practices
   */
  async getAllPractices() {
    return this.get('/api/v1/practices');
  }

  /**
   * Create a new practice
   * POST /api/v1/practices
   */
  async createPractice(practiceData) {
    return this.post('/api/v1/practices', practiceData);
  }

  /**
   * Update a practice
   * PATCH /api/v1/practices/{practiceId}
   */
  async updatePractice(practiceId, practiceData) {
    return this.patch(`/api/v1/practices/${practiceId}`, practiceData);
  }

  /**
   * Update practice status
   * PATCH /api/v1/practices/{practiceId}/status
   */
  async updatePracticeStatus(practiceId, status) {
    return this.patch(`/api/v1/practices/${practiceId}/status`, { status });
  }

  /**
   * Check if practice code exists
   * GET /api/v1/practices/code-exists?code={code}
   */
  async checkPracticeCodeExists(code) {
    return this.get(`/api/v1/practices/code-exists?code=${encodeURIComponent(code)}`);
  }

  /**
   * Get all locations for a practice
   * GET /api/v1/practices/{practiceId}/locations
   */
  async getPracticeLocations(practiceId) {
    return this.get(`/api/v1/practices/${practiceId}/locations`);
  }

  /**
   * Create a new location for a practice
   * POST /api/v1/practices/{practiceId}/locations
   */
  async createPracticeLocation(practiceId, locationData) {
    return this.post(`/api/v1/practices/${practiceId}/locations`, locationData);
  }

  /**
   * Update a location
   * PATCH /api/v1/practices/{practiceId}/locations/{locationId}
   */
  async updatePracticeLocation(practiceId, locationId, locationData) {
    return this.patch(`/api/v1/practices/${practiceId}/locations/${locationId}`, locationData);
  }

  /**
   * Update location status
   * PATCH /api/v1/practices/{practiceId}/locations/{locationId}/status
   */
  async updateLocationStatus(practiceId, locationId, isActive) {
    return this.patch(`/api/v1/practices/${practiceId}/locations/${locationId}/status`, { isActive });
  }

  /**
   * Check if location code exists
   * GET /api/v1/practices/locations/code-exists?code={code}
   */
  async checkLocationCodeExists(code) {
    return this.get(`/api/v1/practices/locations/code-exists?code=${encodeURIComponent(code)}`);
  }

  // ==================== Check Management APIs ====================

  /**
   * Get checks dashboard with filters
   * GET /api/v1/checks/dashboard
   * @param {Object} params - Query parameters
   * @param {string} params.status - Check status
   * @param {string} params.practiceCode - Practice code
   * @param {string} params.locationCode - Location code
   * @param {string} params.assigneeId - Assignee user ID (UUID)
   * @param {string} params.reporterId - Reporter user ID (UUID)
   * @param {string} params.checkNumber - Check number
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {number} params.month - Month (1-12)
   * @param {number} params.year - Year
   * @param {number} params.page - Page number (default: 0)
   * @param {number} params.size - Page size (default: 50)
   */
  async getChecksDashboard(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Add all non-empty parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/checks/dashboard${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint);
  }

  /**
   * Search checks dashboard with filters (POST)
   * POST /api/v1/checks/dashboard/search?unknown={true|false}
   * @param {Object} searchParams - Search parameters in request body
   * @param {boolean} searchParams.unknown - Whether to search for unknown checks (default: false)
   * @param {Array<string>} searchParams.statuses - Check statuses array
   * @param {Array<string>} searchParams.practiceCodes - Practice codes array
   * @param {Array<string>} searchParams.locationCodes - Location codes array
   * @param {Array<string>} searchParams.assigneeIds - Assignee user IDs array (UUIDs)
   * @param {Array<string>} searchParams.reporterIds - Reporter user IDs array (UUIDs)
   * @param {string} searchParams.checkNumber - Check number (supports wildcards like "*CHE")
   * @param {string} searchParams.depositDateFrom - Deposit date from (YYYY-MM-DD)
   * @param {string} searchParams.depositDateTo - Deposit date to (YYYY-MM-DD)
   * @param {string} searchParams.receivedDateFrom - Received date from (YYYY-MM-DD)
   * @param {string} searchParams.receivedDateTo - Received date to (YYYY-MM-DD)
   * @param {string} searchParams.completedDateFrom - Completed date from (YYYY-MM-DD)
   * @param {string} searchParams.completedDateTo - Completed date to (YYYY-MM-DD)
   * @param {number} searchParams.page - Page number (default: 0)
   * @param {number} searchParams.size - Page size (default: 50)
   */
  async searchChecksDashboard(searchParams = {}) {
    // Pass unknown parameter (default: false for Checks page, true for Unknown page)
    const unknown = searchParams.unknown !== undefined ? searchParams.unknown : false;
    const endpoint = `/api/v1/checks/dashboard/search?unknown=${unknown}`;
    
    // Build request body, only including non-empty values
    const body = {};
    
    // Arrays - only include if not empty
    if (searchParams.statuses && Array.isArray(searchParams.statuses) && searchParams.statuses.length > 0) {
      body.statuses = searchParams.statuses;
    }
    if (searchParams.practiceCodes && Array.isArray(searchParams.practiceCodes) && searchParams.practiceCodes.length > 0) {
      body.practiceCodes = searchParams.practiceCodes;
    }
    if (searchParams.locationCodes && Array.isArray(searchParams.locationCodes) && searchParams.locationCodes.length > 0) {
      body.locationCodes = searchParams.locationCodes;
    }
    if (searchParams.assigneeIds && Array.isArray(searchParams.assigneeIds) && searchParams.assigneeIds.length > 0) {
      body.assigneeIds = searchParams.assigneeIds;
    }
    if (searchParams.reporterIds && Array.isArray(searchParams.reporterIds) && searchParams.reporterIds.length > 0) {
      body.reporterIds = searchParams.reporterIds;
    }
    
    // Strings - only include if not empty
    if (searchParams.checkNumber && searchParams.checkNumber.trim() !== '') {
      body.checkNumber = searchParams.checkNumber.trim();
    }
    
    // Dates - only include if not empty
    if (searchParams.depositDateFrom && searchParams.depositDateFrom.trim() !== '') {
      body.depositDateFrom = searchParams.depositDateFrom.trim();
    }
    if (searchParams.depositDateTo && searchParams.depositDateTo.trim() !== '') {
      body.depositDateTo = searchParams.depositDateTo.trim();
    }
    if (searchParams.receivedDateFrom && searchParams.receivedDateFrom.trim() !== '') {
      body.receivedDateFrom = searchParams.receivedDateFrom.trim();
    }
    if (searchParams.receivedDateTo && searchParams.receivedDateTo.trim() !== '') {
      body.receivedDateTo = searchParams.receivedDateTo.trim();
    }
    if (searchParams.completedDateFrom && searchParams.completedDateFrom.trim() !== '') {
      body.completedDateFrom = searchParams.completedDateFrom.trim();
    }
    if (searchParams.completedDateTo && searchParams.completedDateTo.trim() !== '') {
      body.completedDateTo = searchParams.completedDateTo.trim();
    }
    
    // Pagination - always include
    body.page = searchParams.page !== undefined ? searchParams.page : 0;
    body.size = searchParams.size !== undefined ? searchParams.size : 50;
    
    return this.post(endpoint, body);
  }

  /**
   * Create a new check
   * POST /api/v1/checks
   * @param {Object} checkData - Check data
   */
  async createCheck(checkData) {
    return this.post('/api/v1/checks', checkData);
  }

  /**
   * Bulk update checks (assignee/reporter/unknown and optionally create clarifications)
   * POST /api/v1/checks/bulk-actions
   * @param {Object} payload - Bulk action payload
   * @param {Array<string>} payload.checkIds - Array of check IDs (UUIDs)
   * @param {string} [payload.assigneeId] - Assignee user ID (UUID)
   * @param {string} [payload.reporterId] - Reporter user ID (UUID)
   * @param {boolean} [payload.unknown] - Mark checks as unknown
   * @param {Object} [payload.clarification] - Optional clarification object
   * @param {string} [payload.clarification.clarificationType] - Type of clarification
   * @param {string} [payload.clarification.details] - Clarification details
   * @param {string} [payload.clarification.status] - Clarification status (OPEN/RESOLVED)
   * @param {string} [payload.clarification.assigneeId] - Clarification assignee ID
   * @param {string} [payload.clarification.reporterId] - Clarification reporter ID
   * @param {string} [payload.clarification.assignee] - Assignee type (ON-SHORE/OFF-SHORE)
   * @param {string} [payload.clarification.reportee] - Reportee type (EBOTICS)
   */
  async bulkUpdateChecks(payload) {
    return this.post('/api/v1/checks/bulk-actions', payload);
  }

  /**
   * Get check by ID
   * GET /api/v1/checks/{checkId}
   * @param {string} checkId - Check ID (UUID)
   */
  async getCheckById(checkId) {
    return this.get(`/api/v1/checks/${checkId}`);
  }

  /**
   * Update check
   * PATCH /api/v1/checks/{checkId}
   * @param {string} checkId - Check ID (UUID)
   * @param {Object} checkData - Check data to update
   */
  async updateCheck(checkId, checkData) {
    return this.patch(`/api/v1/checks/${checkId}`, checkData);
  }

  /**
   * Create batch for a check
   * POST /api/v1/checks/{checkId}/batches
   * @param {string} checkId - Check ID (UUID)
   * @param {Object} batchData - Batch data
   */
  async createBatch(checkId, batchData) {
    return this.post(`/api/v1/checks/${checkId}/batches`, batchData);
  }

  /**
   * Update batch
   * PATCH /api/v1/checks/{checkId}/batches/{batchId}
   * @param {string} checkId - Check ID (UUID)
   * @param {string} batchId - Batch ID (UUID)
   * @param {Object} batchData - Batch data to update
   */
  async updateBatch(checkId, batchId, batchData) {
    return this.patch(`/api/v1/checks/${checkId}/batches/${batchId}`, batchData);
  }

  /**
   * Get check activities
   * GET /api/v1/checks/{checkId}/activities
   * @param {string} checkId - Check ID (UUID)
   * @param {number} page - Page number (default: 0)
   * @param {number} size - Page size (default: 20)
   */
  async getCheckActivities(checkId, page = 0, size = 20) {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page);
    queryParams.append('size', size);
    
    return this.get(`/api/v1/checks/${checkId}/activities?${queryParams.toString()}`);
  }

  // ==================== Clarification Management APIs ====================

  /**
   * Get clarifications dashboard with filters
   * GET /api/v1/clarifications/dashboard
   * @param {Object} params - Query parameters
   * @param {string} params.status - Clarification status
   * @param {string} params.assigneeId - Assignee user ID (UUID)
   * @param {string} params.reporterId - Reporter user ID (UUID)
   * @param {string} params.checkNumber - Check number
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @param {number} params.month - Month (1-12)
   * @param {number} params.year - Year
   * @param {number} params.page - Page number (default: 0)
   * @param {number} params.size - Page size (default: 50)
   */
  async getClarificationsDashboard(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Add all non-empty parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/v1/clarifications/dashboard${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint);
  }

  /**
   * Search clarifications dashboard with filters (POST)
   * POST /api/v1/clarifications/dashboard/search
   * @param {Object} searchParams - Search parameters in request body
   * @param {Array<string>} searchParams.statuses - Clarification statuses array (OPEN, RESOLVED)
   * @param {Array<string>} searchParams.assigneeIds - Assignee user IDs array (UUIDs)
   * @param {Array<string>} searchParams.reporterIds - Reporter user IDs array (UUIDs)
   * @param {string} searchParams.checkNumber - Check number (supports wildcards like "*CHE")
   * @param {string} searchParams.openedDateFrom - Opened date from (YYYY-MM-DD)
   * @param {string} searchParams.openedDateTo - Opened date to (YYYY-MM-DD)
   * @param {number} searchParams.page - Page number (default: 0)
   * @param {number} searchParams.size - Page size (default: 50)
   */
  async searchClarificationsDashboard(searchParams = {}) {
    const endpoint = '/api/v1/clarifications/dashboard/search';
    
    // Build request body, only including non-empty values
    const body = {};
    
    // Arrays - only include if not empty
    if (searchParams.statuses && Array.isArray(searchParams.statuses) && searchParams.statuses.length > 0) {
      body.statuses = searchParams.statuses;
    }
    if (searchParams.assigneeIds && Array.isArray(searchParams.assigneeIds) && searchParams.assigneeIds.length > 0) {
      body.assigneeIds = searchParams.assigneeIds;
    }
    if (searchParams.reporterIds && Array.isArray(searchParams.reporterIds) && searchParams.reporterIds.length > 0) {
      body.reporterIds = searchParams.reporterIds;
    }
    
    // Strings - only include if not empty
    if (searchParams.checkNumber && searchParams.checkNumber.trim() !== '') {
      body.checkNumber = searchParams.checkNumber.trim();
    }
    
    // Dates - only include if not empty
    if (searchParams.openedDateFrom && searchParams.openedDateFrom.trim() !== '') {
      body.openedDateFrom = searchParams.openedDateFrom.trim();
    }
    if (searchParams.openedDateTo && searchParams.openedDateTo.trim() !== '') {
      body.openedDateTo = searchParams.openedDateTo.trim();
    }
    
    // Pagination - always include
    body.page = searchParams.page !== undefined ? searchParams.page : 0;
    body.size = searchParams.size !== undefined ? searchParams.size : 50;
    
    return this.post(endpoint, body);
  }

  /**
   * Get all clarifications for a check
   * GET /api/v1/checks/{checkId}/clarifications
   * @param {string} checkId - Check ID (UUID)
   */
  async getClarifications(checkId) {
    return this.get(`/api/v1/checks/${checkId}/clarifications`);
  }

  /**
   * Create a new clarification
   * POST /api/v1/checks/{checkId}/clarifications
   * @param {string} checkId - Check ID (UUID)
   * @param {Object} clarificationData - Clarification data
   */
  async createClarification(checkId, clarificationData) {
    return this.post(`/api/v1/checks/${checkId}/clarifications`, clarificationData);
  }

  /**
   * Update a clarification
   * PATCH /api/v1/checks/{checkId}/clarifications/{clarificationId}
   * @param {string} checkId - Check ID (UUID)
   * @param {string} clarificationId - Clarification ID (UUID)
   * @param {Object} clarificationData - Clarification data to update (can include newComment)
   */
  async updateClarification(checkId, clarificationId, clarificationData) {
    return this.patch(`/api/v1/checks/${checkId}/clarifications/${clarificationId}`, clarificationData);
  }
}

// Export singleton instance
const apiService = new ApiService();
export default apiService;

