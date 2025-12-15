import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Edit } from 'lucide-react';
import { countryCodes, parsePhoneNumber, formatPhoneNumber, getDefaultCountry, validatePhoneInput, getPhoneMaxLength, getPhonePlaceholder } from '../utils/countryCodes';
import { formatDateTime } from '../utils/dateUtils';
import './Profile.css';

const Profile = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState(getDefaultCountry());
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  // Country code dropdown states
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryRef = useRef(null);
  const [countryPos, setCountryPos] = useState(null);
  
  // Function to find all scrollable containers
  const findScrollableContainers = (element) => {
    const containers = [];
    let current = element;
    
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY || style.overflow;
      const overflowX = style.overflowX || style.overflow;
      
      if (overflowY === 'auto' || overflowY === 'scroll' || 
          overflowX === 'auto' || overflowX === 'scroll') {
        containers.push(current);
      }
      
      current = current.parentElement;
    }
    
    // Always include window
    containers.push(window);
    
    return containers;
  };

  // Function to calculate dropdown position
  const calculateDropdownPosition = (ref, setPosition) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 280) // Ensure minimum width of 280px
    });
  };
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Close country code dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const countryWrapper = event.target.closest('.country-code-select-wrapper');
      const countryDropdown = event.target.closest('.country-code-dropdown');
      if (!countryWrapper && !countryDropdown) {
        setCountryOpen(false);
        setCountryPos(null);
      }
    };
    
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Update dropdown positions on scroll/resize
  useEffect(() => {
    const updatePositions = () => {
      if (countryOpen && countryRef.current) {
        calculateDropdownPosition(countryRef, setCountryPos);
      }
    };
    
    // Find all scrollable containers for the open dropdown
    const scrollableContainers = new Set();
    
    if (countryOpen && countryRef.current) {
      findScrollableContainers(countryRef.current).forEach(container => scrollableContainers.add(container));
    }
    
    // Add scroll listeners to all scrollable containers
    const cleanupFunctions = [];
    scrollableContainers.forEach(container => {
      if (container === window) {
        container.addEventListener('scroll', updatePositions, true);
        container.addEventListener('resize', updatePositions);
        cleanupFunctions.push(() => {
          container.removeEventListener('scroll', updatePositions, true);
          container.removeEventListener('resize', updatePositions);
        });
      } else {
        container.addEventListener('scroll', updatePositions, true);
        cleanupFunctions.push(() => {
          container.removeEventListener('scroll', updatePositions, true);
        });
      }
    });
    
    // Also listen to window resize
    window.addEventListener('resize', updatePositions);
    cleanupFunctions.push(() => {
      window.removeEventListener('resize', updatePositions);
    });
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [countryOpen]);

  // Filter countries based on search term
  const filterCountries = (searchTerm) => {
    if (!searchTerm) return countryCodes;
    const lowerSearch = searchTerm.toLowerCase();
    return countryCodes.filter(country => 
      country.name.toLowerCase().includes(lowerSearch) ||
      country.dialCode.includes(lowerSearch) ||
      country.code.toLowerCase().includes(lowerSearch)
    );
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser?.userId) {
        setError('User ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userId = authUser.userId;
        const data = await api.getUserById(userId);
        setUserData(data);
        
        // Parse existing phone number to extract country code
        if (data.phone) {
          const parsed = parsePhoneNumber(data.phone);
          setSelectedCountryCode(parsed.countryCode || getDefaultCountry());
          setPhoneValue(parsed.phoneNumber);
        } else {
          setPhoneValue('');
          setSelectedCountryCode(getDefaultCountry());
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err.message || 'Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [authUser]);

  const handleEditPhone = () => {
    setEditingPhone(true);
    if (userData.phone) {
      const parsed = parsePhoneNumber(userData.phone);
      setSelectedCountryCode(parsed.countryCode || getDefaultCountry());
      setPhoneValue(parsed.phoneNumber);
    } else {
      setPhoneValue('');
      setSelectedCountryCode(getDefaultCountry());
    }
    setPhoneError('');
  };

  const handleCancelEditPhone = () => {
    setEditingPhone(false);
    if (userData.phone) {
      const parsed = parsePhoneNumber(userData.phone);
      setSelectedCountryCode(parsed.countryCode || getDefaultCountry());
      setPhoneValue(parsed.phoneNumber);
    } else {
      setPhoneValue('');
      setSelectedCountryCode(getDefaultCountry());
    }
    setPhoneError('');
    setCountryOpen(false);
    setCountryPos(null);
    setCountrySearch('');
  };

  const handleSavePhone = async () => {
    if (!phoneValue.trim()) {
      setPhoneError('Phone number is required');
      return;
    }

    try {
      setUpdatingPhone(true);
      setPhoneError('');
      const userId = authUser.userId;
      const fullPhoneNumber = formatPhoneNumber(selectedCountryCode, phoneValue.trim());
      await api.updateUser(userId, { phone: fullPhoneNumber });
      
      // Refresh user data
      const updatedData = await api.getUserById(userId);
      setUserData(updatedData);
      setEditingPhone(false);
      setCountryOpen(false);
      setCountryPos(null);
      setCountrySearch('');
    } catch (err) {
      console.error('Error updating phone:', err);
      setPhoneError(err.message || 'Failed to update phone number. Please try again.');
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirm password do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      await api.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };


  const getUserInitials = () => {
    if (userData) {
      const firstName = userData.firstName || '';
      const lastName = userData.lastName || '';
      if (firstName && lastName) {
        return `${firstName[0].toUpperCase()}${lastName[0].toUpperCase()}`;
      }
      if (userData.email) {
        return userData.email[0].toUpperCase();
      }
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <p>No profile data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">View and manage your account information</p>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-large">
              {userData.profileUrl ? (
                <img src={userData.profileUrl} alt="Profile" />
              ) : (
                <span>{getUserInitials()}</span>
              )}
            </div>
            <div className="profile-header-info">
              <div className="profile-info-content">
                <h2 className="profile-name">
                  {userData.firstName} {userData.lastName}
                </h2>
                <p className="profile-email">{userData.email}</p>
                <p className="profile-role">
                  {userData.roleMeta?.name ? 
                    userData.roleMeta.name.split('_').map(word => 
                      word.charAt(0) + word.slice(1).toLowerCase()
                    ).join(' ') 
                    : 'N/A'}
                </p>
                <div className="profile-status-badge">
                  <span className={`status-badge ${userData.status === 'ACTIVE' ? 'status-active' : 'status-inactive'}`}>
                    {userData.status}
                  </span>
                </div>
              </div>
              <div className="profile-header-actions">
                <button
                  className="btn-change-password-header"
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-details-grid">
          <div className="detail-card">
            <h3 className="detail-card-title">Personal Information</h3>
            <div className="detail-list">
              <div className="detail-item">
                <span className="detail-label">First Name</span>
                <span className="detail-value">{userData.firstName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Name</span>
                <span className="detail-value">{userData.lastName || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{userData.email || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <div className="detail-item-header">
                  <span className="detail-label">Phone</span>
                  {!editingPhone && (
                    <button className="edit-btn" onClick={handleEditPhone} title="Edit phone number">
                      <Edit size={16} />
                    </button>
                  )}
                </div>
                {editingPhone ? (
                  <div className="edit-phone-container">
                    <div className="phone-input-group">
                      <div className="country-code-select-wrapper">
                        <div 
                          ref={countryRef}
                          className="country-code-select"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!updatingPhone) {
                              const isOpening = !countryOpen;
                              setCountryOpen(prev => !prev);
                              if (isOpening) {
                                setTimeout(() => calculateDropdownPosition(countryRef, setCountryPos), 0);
                              } else {
                                setCountryPos(null);
                              }
                            }
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          style={{ cursor: updatingPhone ? 'not-allowed' : 'pointer', position: 'relative', pointerEvents: 'auto' }}
                        >
                          <span className="country-code-display">
                            {selectedCountryCode.flag} {selectedCountryCode.dialCode}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '8px' }}>
                            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      {countryOpen && !updatingPhone && countryPos && createPortal(
                        <div 
                          className="country-code-dropdown portal-dropdown" 
                          style={{
                            position: 'fixed',
                            top: `${countryPos.top}px`,
                            left: `${countryPos.left}px`,
                            width: `${countryPos.width}px`,
                            zIndex: 10050
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            className="country-code-search"
                            placeholder="Search country..."
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                          <div className="country-code-list">
                            {filterCountries(countrySearch).map((country) => (
                              <div
                                key={country.code}
                                className={`country-code-option ${selectedCountryCode.code === country.code ? 'selected' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCountryCode(country);
                                  setCountrySearch('');
                                  setCountryOpen(false);
                                  setCountryPos(null);
                                  // Validate existing phone number when country changes
                                  if (phoneValue) {
                                    const validated = validatePhoneInput(phoneValue, country);
                                    setPhoneValue(validated);
                                  }
                                }}
                              >
                                <span className="country-code-display">
                                  {country.flag} {country.dialCode}
                                </span>
                                <span className="country-name">{country.name}</span>
                              </div>
                            ))}
                            {filterCountries(countrySearch).length === 0 && (
                              <div className="country-code-option no-results">No countries found</div>
                            )}
                          </div>
                        </div>,
                        document.body
                      )}
                      <input
                        type="tel"
                        value={phoneValue}
                        onChange={(e) => {
                          const validated = validatePhoneInput(e.target.value, selectedCountryCode);
                          setPhoneValue(validated);
                        }}
                        className="phone-input"
                        placeholder={getPhonePlaceholder(selectedCountryCode)}
                        maxLength={getPhoneMaxLength(selectedCountryCode)}
                        disabled={updatingPhone}
                      />
                    </div>
                    {phoneError && <div className="error-text">{phoneError}</div>}
                    <div className="edit-actions">
                      <button
                        className="btn-cancel"
                        onClick={handleCancelEditPhone}
                        disabled={updatingPhone}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-save"
                        onClick={handleSavePhone}
                        disabled={updatingPhone}
                      >
                        {updatingPhone ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="detail-value">{userData.phone || 'N/A'}</span>
                )}
              </div>
            </div>
          </div>

          <div className="detail-card">
            <h3 className="detail-card-title">Account History</h3>
            <div className="detail-list">
              <div className="detail-item">
                <span className="detail-label">Created At</span>
                <span className="detail-value">{formatDateTime(userData.createdAt) || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created By</span>
                <span className="detail-value">
                  {userData.createdByMeta?.fullName || userData.createdByMeta?.email || 'N/A'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Updated At</span>
                <span className="detail-value">{formatDateTime(userData.updatedAt) || 'N/A'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Updated By</span>
                <span className="detail-value">
                  {userData.updatedByMeta?.fullName || userData.updatedByMeta?.email || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="logout-section">
          <button className="logout-button" onClick={async () => {
            await logout();
            navigate('/login');
          }}>
            Logout
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => !changingPassword && setShowPasswordModal(false)}>
          <div className="modal-content password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
                disabled={changingPassword}
              >
                ×
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="modal-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  disabled={changingPassword}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  disabled={changingPassword}
                  required
                  minLength={8}
                />
                <small className="form-hint">Password must be at least 8 characters long</small>
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  disabled={changingPassword}
                  required
                  minLength={8}
                />
              </div>
              {passwordError && <div className="error-message">{passwordError}</div>}
              {passwordSuccess && (
                <div className="success-message">Password changed successfully!</div>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={changingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

