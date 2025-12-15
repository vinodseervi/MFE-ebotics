import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(email, password);

      if (result && result.success === true) {
        // Only navigate on success
        navigate('/');
        return;
      } 
      
      // Handle error
      // Backend returns: { error: "UNAUTHORIZED", message: "Invalid credentials", ... }
      let errorMessage = 'Invalid credentials. Please check your username and password.';
      
      if (result) {
        // Priority 1: Check errorData.message (from backend response)
        if (result.errorData && result.errorData.message) {
          errorMessage = result.errorData.message;
        }
        // Priority 2: Check result.error (from AuthContext)
        else if (result.error) {
          errorMessage = result.error;
        }
        // Priority 3: Check errorData.error
        else if (result.errorData && result.errorData.error === 'UNAUTHORIZED') {
          errorMessage = 'Invalid credentials. Please check your username and password.';
        }
      }
      
      // Set error state
      setError(errorMessage);
      setIsLoading(false);
      
    } catch (err) {
      // Catch any unexpected errors
      console.error('=== UNEXPECTED ERROR ===');
      console.error('Error:', err);
      setError('Invalid credentials. Please check your username and password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left Side - Company Info */}
        <div className="login-info-section">
          <div className="login-info-content">
            <div className="login-logo-large">
              <img src="/ebotics.png" alt="Ebotics Logo" />
            </div>
            <h1 className="welcome-title">Welcome to eBotics Solutions</h1>
            <p className="welcome-subtitle">
              Automating Healthcare Revenue-Cycle Management for hospitals, clinics, and provider groups
            </p>
            <div className="features-list">
              <div className="feature-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 10L9.16667 11.6667L12.5 8.33333M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Medical Billing & Charge Posting</span>
              </div>
              <div className="feature-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 10L9.16667 11.6667L12.5 8.33333M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Eligibility & Benefit Verification</span>
              </div>
              <div className="feature-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 10L9.16667 11.6667L12.5 8.33333M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Claims & Denial Management</span>
              </div>
              <div className="feature-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 10L9.16667 11.6667L12.5 8.33333M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Provider Credentialing & Enrollment</span>
              </div>
              <div className="feature-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.5 10L9.16667 11.6667L12.5 8.33333M17.5 10C17.5 14.1421 14.1421 17.5 10 17.5C5.85786 17.5 2.5 14.1421 2.5 10C2.5 5.85786 5.85786 2.5 10 2.5C14.1421 2.5 17.5 5.85786 17.5 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Back-Office Automation & Virtual Assistant Services</span>
              </div>
            </div>
            <div className="welcome-footer">
              <p>Automate the repetitive. Boost accuracy, save time, and maximize revenue.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          <div className="login-card">
            <div className="login-header">
              <h2>Sign In</h2>
              <p>Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {/* Always render error notification if error exists - for debugging */}
              {error ? (
                <div className="error-notification" role="alert" style={{ display: 'flex' }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 6.66667V10M10 13.3333H10.0083" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{error || 'Error occurred'}</span>
                </div>
              ) : null}

              <div className="form-group">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3C5 3 1.73 6.11 1 10C1.73 13.89 5 17 10 17C15 17 18.27 13.89 19 10C18.27 6.11 15 3 10 3ZM10 15C7.24 15 5 12.76 5 10C5 7.24 7.24 5 10 5C12.76 5 15 7.24 15 10C15 12.76 12.76 15 10 15ZM10 7C8.34 7 7 8.34 7 10C7 11.66 8.34 13 10 13C11.66 13 13 11.66 13 10C13 8.34 11.66 7 10 7Z" fill="currentColor"/>
                        <path d="M2 2L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3C5 3 1.73 6.11 1 10C1.73 13.89 5 17 10 17C15 17 18.27 13.89 19 10C18.27 6.11 15 3 10 3ZM10 15C7.24 15 5 12.76 5 10C5 7.24 7.24 5 10 5C12.76 5 15 7.24 15 10C15 12.76 12.76 15 10 15ZM10 7C8.34 7 7 8.34 7 10C7 11.66 8.34 13 10 13C11.66 13 13 11.66 13 10C13 8.34 11.66 7 10 7Z" fill="currentColor"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

