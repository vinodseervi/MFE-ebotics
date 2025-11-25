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
        throw new Error(data.message || data || `HTTP error! status: ${response.status}`);
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
      localStorage.setItem('userRoles', JSON.stringify(response.roles));
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
    localStorage.removeItem('userRoles');
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
      roles: JSON.parse(localStorage.getItem('userRoles') || '[]'),
    };
  }
}

// Export singleton instance
export default new ApiService();

