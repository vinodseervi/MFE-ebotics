import React from 'react';
import { practices } from '../../data/mockData';
import './Admin.css';

const Practices = () => {
  const stats = {
    totalPractices: practices.length,
    totalLocations: practices.reduce((sum, p) => sum + p.locations.length, 0),
    activePractices: practices.filter(p => p.status === 'Active').length
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Practice Management
            <span className="info-icon">⚠️</span>
          </h1>
          <p className="page-subtitle">Manage practices and locations.</p>
        </div>
        <button className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Practice
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Practices</div>
          <div className="stat-value">{stats.totalPractices}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Locations</div>
          <div className="stat-value">{stats.totalLocations}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Practices</div>
          <div className="stat-value success">{stats.activePractices}</div>
        </div>
      </div>

      <div className="practices-list">
        {practices.map((practice) => (
          <div key={practice.id} className="practice-card">
            <div className="practice-header">
              <div className="practice-info">
                <div className="practice-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3H21V21H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 9H21M9 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="practice-name">{practice.name}</h3>
                  <p className="practice-code">Code: {practice.code}</p>
                </div>
              </div>
              <div className="practice-actions">
                <span className="status-badge status-active">{practice.status}</span>
                <button className="btn-secondary">+ Add Location</button>
              </div>
            </div>
            <div className="locations-section">
              <p className="locations-count">{practice.locations.length} Locations:</p>
              <div className="locations-grid">
                {practice.locations.map((location) => (
                  <div key={location.id} className="location-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <div>
                      <div className="location-name">{location.name}</div>
                      <div className="location-code">Code: {location.code}</div>
                    </div>
                    <span className="status-badge status-active">{location.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Practices;

