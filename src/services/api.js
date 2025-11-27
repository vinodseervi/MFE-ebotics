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
}

// Export singleton instance
export default new ApiService();

