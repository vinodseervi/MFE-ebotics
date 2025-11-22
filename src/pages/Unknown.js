import React from 'react';
import './Placeholder.css';

const Unknown = () => {
  return (
    <div className="placeholder-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Unknown
            <span className="info-icon">⚠️</span>
          </h1>
          <p className="page-subtitle">Manage unknown payments and items</p>
        </div>
      </div>
      <div className="placeholder-content">
        <p>Unknown page coming soon...</p>
      </div>
    </div>
  );
};

export default Unknown;

