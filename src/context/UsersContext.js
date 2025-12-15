import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const UsersContext = createContext(null);

const CACHE_KEY = 'cached_users';
const CACHE_TIMESTAMP_KEY = 'cached_users_timestamp';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

export const UsersProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load users from localStorage cache
  const loadFromCache = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp, 10);
        const now = Date.now();
        
        // Check if cache is still valid (within 30 minutes)
        if (now - timestamp < CACHE_DURATION) {
          const parsedUsers = JSON.parse(cachedData);
          setUsers(parsedUsers);
          return true; // Cache is valid
        }
      }
    } catch (error) {
      console.error('Error loading users from cache:', error);
    }
    return false; // Cache is invalid or doesn't exist
  }, []);

  // Save users to localStorage cache
  const saveToCache = useCallback((usersList) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(usersList));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error('Error saving users to cache:', error);
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      setUsers([]);
    } catch (error) {
      console.error('Error clearing users cache:', error);
    }
  }, []);

  // Fetch all users from API
  const fetchAllUsers = useCallback(async (forceRefresh = false) => {
    // If we have users in state and not forcing refresh, return them
    if (!forceRefresh && users.length > 0) {
      return users;
    }

    // Try to load from cache first (if not forcing refresh)
    if (!forceRefresh) {
      const hasCache = loadFromCache();
      if (hasCache) {
        // Return cached users
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          try {
            const parsedUsers = JSON.parse(cachedData);
            return parsedUsers;
          } catch (error) {
            console.error('Error parsing cached users:', error);
          }
        }
      }
    }

    setLoading(true);
    try {
      const response = await api.getAllUsers();
      const usersList = Array.isArray(response) ? response : (response?.items || []);
      
      setUsers(usersList);
      saveToCache(usersList);
      
      return usersList;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [users, loadFromCache, saveToCache]);

  // Load users from cache on mount and fetch if needed
  useEffect(() => {
    if (isAuthenticated) {
      // Try to load from cache first
      const hasCache = loadFromCache();
      
      // If no cache, fetch from API
      if (!hasCache) {
        fetchAllUsers(false);
      }
    } else {
      // Clear cache when not authenticated
      clearCache();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Get user by ID
  const getUserById = useCallback((userId) => {
    if (!userId) return null;
    return users.find(u => (u.userId || u.id) === userId);
  }, [users]);

  // Get user name by ID
  const getUserName = useCallback((userId) => {
    if (!userId) return 'N/A';
    const user = getUserById(userId);
    if (!user) return 'N/A';
    
    // Try to get full name
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    // Fallback to email
    if (user.email) {
      return user.email;
    }
    // Fallback to userId
    return userId;
  }, [getUserById]);

  // Get user display info (for dropdowns)
  const getUserDisplayInfo = useCallback((userId) => {
    const user = getUserById(userId);
    if (!user) return null;
    
    return {
      userId: user.userId || user.id,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.email || userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      ...user
    };
  }, [getUserById]);

  // Refresh users from API (force refresh)
  const refreshUsers = useCallback(async () => {
    return await fetchAllUsers(true);
  }, [fetchAllUsers]);

  const value = {
    users,
    loading,
    fetchAllUsers,
    refreshUsers,
    getUserById,
    getUserName,
    getUserDisplayInfo,
    clearCache,
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};
