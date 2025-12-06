import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated on mount
    const checkAuth = () => {
      if (api.isAuthenticated()) {
        const userData = api.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    // Don't set global loading to true during login
    // This prevents the white loading screen from showing
    // The Login component has its own loading state
    try {
      // setLoading(true); // REMOVED - causes white screen
      const response = await api.login(email, password);
      const userData = api.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      return { success: true, data: response };
    } catch (error) {
      console.error('=== AUTH CONTEXT LOGIN ERROR ===');
      console.error('Full error object:', error);
      console.error('Error.data:', error.data);
      console.error('Error.message:', error.message);
      console.error('Error.status:', error.status);
      
      // Extract error message from backend response
      // Backend response format: { error: "UNAUTHORIZED", message: "Invalid credentials", ... }
      let errorMessage = 'Invalid credentials. Please check your username and password.';
      let errorData = null;
      
      // Check if error.data exists and has the backend response structure
      if (error.data) {
        errorData = error.data;
        // Backend returns: { error: "UNAUTHORIZED", message: "Invalid credentials", ... }
        if (error.data.message) {
          errorMessage = error.data.message;
          console.log('Using error.data.message:', errorMessage);
        } else if (error.data.error) {
          // If message is not available, use error field
          if (error.data.error === 'UNAUTHORIZED') {
            errorMessage = 'Invalid credentials. Please check your username and password.';
          } else {
            errorMessage = error.data.error;
          }
          console.log('Using error.data.error:', errorMessage);
        }
      } else if (error.message) {
        // Fallback to error.message if error.data is not available
        errorMessage = error.message;
        console.log('Using error.message:', errorMessage);
      }
      
      console.log('Returning error result:', { success: false, error: errorMessage, errorData });
      
      // ALWAYS return a result object, even on error
      return {
        success: false,
        error: errorMessage,
        errorData: errorData, // Pass full error data for additional handling
      };
    } finally {
      // Don't set loading to false here since we're not setting it to true
      // setLoading(false); // REMOVED
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await api.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

