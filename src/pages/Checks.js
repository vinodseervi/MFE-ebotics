import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockChecks } from '../data/mockData';
import './Checks.css';

const Checks = () => {
  const navigate = useNavigate();
  const [checks] = useState(mockChecks);
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedPractice, setSelectedPractice] = useState('All Practices');
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Complete': 'status-complete',
      'Under Clarification': 'status-clarification',
      'In Progress': 'status-progress',
      'Not Started': 'status-not-started'
    };
    return statusMap[status] || '';
  };

  const totals = checks.reduce((acc, check) => ({
    totalAmount: acc.totalAmount + check.totalAmount,
    posted: acc.posted + check.posted,
    remaining: acc.remaining + check.remaining
  }), { totalAmount: 0, posted: 0, remaining: 0 });

  const statusCounts = checks.reduce((acc, check) => {
    acc[check.status] = (acc[check.status] || 0) + 1;
    return acc;
  }, {});

  const totalChecks = checks.length;
  const statusPercentages = {
    'Complete': ((statusCounts['Complete'] || 0) / totalChecks * 100).toFixed(1),
    'Under Clarification': ((statusCounts['Under Clarification'] || 0) / totalChecks * 100).toFixed(1),
    'In Progress': ((statusCounts['In Progress'] || 0) / totalChecks * 100).toFixed(1),
    'Not Started': ((statusCounts['Not Started'] || 0) / totalChecks * 100).toFixed(1)
  };

  return (
    <div className="checks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Checks
            <span className="info-icon">⚠️</span>
          </h1>
          <p className="page-subtitle">Manage and reconcile payment checks</p>
        </div>
        <div className="header-actions">
          <div className="date-range">Nov 2025 - Nov 2025</div>
          <button className="btn-export">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M3 15V17H17V15M10 3V13M10 13L6 9M10 13L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export
          </button>
          <button className="btn-primary" onClick={() => navigate('/checks/new')}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 3V17M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Check
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 15L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search checks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-dropdowns">
          <select 
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option>All Statuses</option>
            <option>Complete</option>
            <option>Under Clarification</option>
            <option>In Progress</option>
            <option>Not Started</option>
          </select>
          <select 
            className="filter-select"
            value={selectedPractice}
            onChange={(e) => setSelectedPractice(e.target.value)}
          >
            <option>All Practices</option>
            <option>Metro Health Center</option>
            <option>Family Care Associates</option>
            <option>Community Medical Group</option>
          </select>
        </div>
      </div>

      <div className="status-bar">
        <div className="status-segment" style={{ width: `${statusPercentages['Complete']}%`, backgroundColor: '#10b981' }}>
          Complete ({statusPercentages['Complete']}%)
        </div>
        <div className="status-segment" style={{ width: `${statusPercentages['Under Clarification']}%`, backgroundColor: '#f59e0b' }}>
          Under Clarification ({statusPercentages['Under Clarification']}%)
        </div>
        <div className="status-segment" style={{ width: `${statusPercentages['In Progress']}%`, backgroundColor: '#3b82f6' }}>
          In Progress ({statusPercentages['In Progress']}%)
        </div>
        <div className="status-segment" style={{ width: `${statusPercentages['Not Started']}%`, backgroundColor: '#6b7280' }}>
          Not Started ({statusPercentages['Not Started']}%)
        </div>
      </div>

      <div className="table-section">
        <div className="table-header">
          <h3>{checks.length} Checks</h3>
          <div className="table-actions">
            <button className="icon-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="icon-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="checks-table">
            <thead>
              <tr className="totals-row">
                <th colSpan="6">Totals:</th>
                <th>{formatCurrency(totals.totalAmount)}</th>
                <th>{formatCurrency(totals.posted)}</th>
                <th>{formatCurrency(totals.remaining)}</th>
                <th colSpan="3"></th>
              </tr>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Deposit Date</th>
                <th>Check Number</th>
                <th>Payer</th>
                <th>Batch Description</th>
                <th>Exchange</th>
                <th>Total Amount</th>
                <th>Posted</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Clarifications</th>
                <th>Unknown</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((check) => (
                <tr key={check.id}>
                  <td><input type="checkbox" /></td>
                  <td>{check.depositDate}</td>
                  <td>
                    <button 
                      className="link-btn"
                      onClick={() => navigate(`/checks/${check.id}`)}
                    >
                      {check.checkNumber}
                    </button>
                  </td>
                  <td>{check.payer}</td>
                  <td>{check.batchDescription}</td>
                  <td>{check.exchange}</td>
                  <td>{formatCurrency(check.totalAmount)}</td>
                  <td>{formatCurrency(check.posted)}</td>
                  <td>{formatCurrency(check.remaining)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(check.status)}`}>
                      {check.status}
                    </span>
                  </td>
                  <td>
                    {check.clarifications > 0 && (
                      <span className="clarification-count">{check.clarifications}</span>
                    )}
                  </td>
                  <td>
                    {check.unknown > 0 && (
                      <span className="unknown-count">{check.unknown}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Checks;

