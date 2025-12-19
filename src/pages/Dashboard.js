import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import SearchableDropdown from '../components/SearchableDropdown';
import './Dashboard.css';

const Dashboard = () => {
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [practices, setPractices] = useState([]);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    depositDateFrom: '',
    depositDateTo: '',
    practiceCodes: [],
    unknown: false
  });

  useEffect(() => {
    fetchPractices();
    fetchKPIData();
  }, []);

  useEffect(() => {
    fetchKPIData();
  }, [filters]);

  // Sync local filters with applied filters when sidebar opens
  useEffect(() => {
    if (showFilterSidebar) {
      setLocalFilters({
        depositDateFrom: filters.depositDateFrom || '',
        depositDateTo: filters.depositDateTo || '',
        practiceCodes: filters.practiceCodes || [],
        unknown: filters.unknown || false
      });
    }
  }, [showFilterSidebar, filters]);

  const fetchPractices = async () => {
    try {
      const response = await api.getAllPractices();
      const practicesList = Array.isArray(response) ? response : (response?.items || []);
      setPractices(practicesList.filter(p => p.isActive !== false));
    } catch (error) {
      console.error('Error fetching practices:', error);
    }
  };

  const fetchKPIData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build request body - use filters if provided, otherwise empty object for default (current month)
      const requestBody = { ...filters };
      
      const response = await api.getDashboardKPIs(requestBody);
      setKpiData(response);
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateRange = () => {
    if (!kpiData?.scope) return 'Current Month';
    const { depositDateFrom, depositDateTo } = kpiData.scope;
    if (depositDateFrom && depositDateTo) {
      return `${formatDate(depositDateFrom)} - ${formatDate(depositDateTo)}`;
    }
    return 'Current Month';
  };

  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const [selectedPracticeValue, setSelectedPracticeValue] = useState('');

  const handlePracticeAdd = (practiceCode) => {
    if (!practiceCode || practiceCode === '') return;
    setLocalFilters(prev => {
      const currentCodes = prev.practiceCodes || [];
      if (currentCodes.includes(practiceCode)) {
        return prev;
      }
      return {
        ...prev,
        practiceCodes: [...currentCodes, practiceCode]
      };
    });
    // Reset dropdown after selection
    setSelectedPracticeValue('');
  };

  const handlePracticeRemove = (practiceCode) => {
    setLocalFilters(prev => ({
      ...prev,
      practiceCodes: (prev.practiceCodes || []).filter(code => code !== practiceCode)
    }));
  };

  const applyFilters = () => {
    const newFilters = {};
    
    if (localFilters.depositDateFrom) {
      newFilters.depositDateFrom = localFilters.depositDateFrom;
    }
    if (localFilters.depositDateTo) {
      newFilters.depositDateTo = localFilters.depositDateTo;
    }
    if (localFilters.practiceCodes && localFilters.practiceCodes.length > 0) {
      newFilters.practiceCodes = [...localFilters.practiceCodes];
    }
    if (localFilters.unknown !== undefined && localFilters.unknown !== false) {
      newFilters.unknown = localFilters.unknown;
    }
    
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setLocalFilters({
      depositDateFrom: '',
      depositDateTo: '',
      practiceCodes: [],
      unknown: false
    });
    setFilters({});
  };

  const hasActiveFilters = () => {
    return (
      filters.depositDateFrom ||
      filters.depositDateTo ||
      (filters.practiceCodes && filters.practiceCodes.length > 0) ||
      filters.unknown
    );
  };

  const getAppliedFilters = () => {
    const applied = {};
    if (filters.depositDateFrom) applied.depositDateFrom = filters.depositDateFrom;
    if (filters.depositDateTo) applied.depositDateTo = filters.depositDateTo;
    if (filters.practiceCodes) applied.practiceCodes = filters.practiceCodes;
    if (filters.unknown) applied.unknown = filters.unknown;
    return applied;
  };

  const STATUS_COLORS = {
    'NOT_STARTED': '#6b7280',
    'IN_PROGRESS': '#3b82f6',
    'COMPLETED': '#10b981',
    'OVER_POSTED': '#ef4444',
    'UNDER_CLARIFICATIONS': '#f59e0b'
  };

  const STATUS_LABELS = {
    'NOT_STARTED': 'Not Started',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'OVER_POSTED': 'Over Posted',
    'UNDER_CLARIFICATIONS': 'Clarifications'
  };

  const prepareStatusChartData = () => {
    if (!kpiData?.single?.statusBreakdown) return [];
    return kpiData.single.statusBreakdown.map(item => ({
      name: STATUS_LABELS[item.status] || item.status,
      value: item.count,
      percentage: item.percentage,
      status: item.status
    }));
  };

  const prepareStatusBarData = () => {
    if (!kpiData?.single?.statusBreakdown) return [];
    return kpiData.single.statusBreakdown.map(item => ({
      name: STATUS_LABELS[item.status] || item.status,
      count: item.count,
      percentage: item.percentage,
      status: item.status
    }));
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchKPIData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="dashboard">
        <div className="no-data-container">
          <p>No data available</p>
        </div>
      </div>
    );
  }

  const { single } = kpiData;
  const { totalCount, statusBreakdown, amountSummary } = single || {};

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview of payment reconciliation for {formatDateRange()}
          </p>
        </div>
        <div className="header-actions">
          <button 
            onClick={() => setShowFilterSidebar(true)} 
            className={`custom-filter-button ${hasActiveFilters() ? 'has-filters' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>
            </svg>
            Custom Filter
            {hasActiveFilters() && (
              <span className="filter-badge">
                {Object.keys(getAppliedFilters()).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters() && (() => {
        const appliedFilters = getAppliedFilters();
        return (
          <div className="active-filters-section">
            <div className="active-filters-label">Active Filters:</div>
            <div className="active-filters-chips">
              {appliedFilters.depositDateFrom && (
                <div className="filter-chip">
                  <span>From: {formatDate(appliedFilters.depositDateFrom)}</span>
                  <button
                    className="chip-close-btn"
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters.depositDateFrom;
                      setFilters(newFilters);
                      setLocalFilters(prev => ({ ...prev, depositDateFrom: '' }));
                    }}
                    title="Remove date filter"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
              {appliedFilters.depositDateTo && (
                <div className="filter-chip">
                  <span>To: {formatDate(appliedFilters.depositDateTo)}</span>
                  <button
                    className="chip-close-btn"
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters.depositDateTo;
                      setFilters(newFilters);
                      setLocalFilters(prev => ({ ...prev, depositDateTo: '' }));
                    }}
                    title="Remove date filter"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
              {appliedFilters.practiceCodes && appliedFilters.practiceCodes.length > 0 && appliedFilters.practiceCodes.map((practiceCode) => (
                <div key={practiceCode} className="filter-chip">
                  <span>Practice: {practices.find(p => p.code === practiceCode)?.name || practiceCode}</span>
                  <button
                    className="chip-close-btn"
                    onClick={() => {
                      const newFilters = { ...filters };
                      if (newFilters.practiceCodes) {
                        newFilters.practiceCodes = newFilters.practiceCodes.filter(code => code !== practiceCode);
                        if (newFilters.practiceCodes.length === 0) {
                          delete newFilters.practiceCodes;
                        }
                      }
                      setFilters(newFilters);
                      handlePracticeRemove(practiceCode);
                    }}
                    title="Remove practice filter"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              ))}
              {appliedFilters.unknown && (
                <div className="filter-chip">
                  <span>Unknown</span>
                  <button
                    className="chip-close-btn"
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters.unknown;
                      setFilters(newFilters);
                      setLocalFilters(prev => ({ ...prev, unknown: false }));
                    }}
                    title="Remove unknown filter"
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                      <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon-wrapper">
            <div className="stat-icon dollar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value">{formatCurrency(amountSummary?.totalAmount)}</div>
            <div className="stat-meta">{totalCount || 0} checks</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon-wrapper">
            <div className="stat-icon trend">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 7H15V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-label">Posted Amount</div>
            <div className="stat-value">{formatCurrency(amountSummary?.postedAmount)}</div>
            <div className="stat-meta success">
              {amountSummary?.totalAmount 
                ? `${((amountSummary.postedAmount / amountSummary.totalAmount) * 100).toFixed(1)}% of total`
                : '0% of total'}
            </div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon-wrapper">
            <div className="stat-icon warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-label">Remaining Amount</div>
            <div className="stat-value">{formatCurrency(amountSummary?.remainingAmount)}</div>
            <div className="stat-meta warning">
              {amountSummary?.totalAmount 
                ? `${((amountSummary.remainingAmount / amountSummary.totalAmount) * 100).toFixed(1)}% remaining`
                : '0% remaining'}
            </div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon-wrapper">
            <div className="stat-icon info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="stat-content">
            <div className="stat-label">Other Amount</div>
            <div className="stat-value">{formatCurrency(amountSummary?.otherAmount)}</div>
            <div className="stat-meta">Additional amounts</div>
          </div>
        </div>
      </div>

      {/* Status Breakdown Section */}
      <div className="status-section">
        <h2 className="section-title">Status Breakdown</h2>
        <div className="status-grid">
          {statusBreakdown?.map((status) => (
            <div key={status.status} className="status-card">
              <div className="status-header">
                <div 
                  className="status-indicator" 
                  style={{ backgroundColor: STATUS_COLORS[status.status] }}
                ></div>
                <span className="status-name">{STATUS_LABELS[status.status] || status.status}</span>
              </div>
              <div className="status-stats">
                <div className="status-count">{status.count}</div>
                <div className="status-percentage">{status.percentage.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Status Distribution</h3>
            <div className="chart-subtitle">Check count by status</div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={prepareStatusChartData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {prepareStatusChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} checks (${props.payload.percentage.toFixed(1)}%)`,
                  name
                ]}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            {prepareStatusChartData().map((entry, index) => (
              <div key={index} className="legend-item">
                <div 
                  className="legend-color" 
                  style={{ backgroundColor: STATUS_COLORS[entry.status] || '#8884d8' }}
                ></div>
                <span className="legend-label">{entry.name}</span>
                <span className="legend-percentage">{entry.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Status Comparison</h3>
            <div className="chart-subtitle">Count and percentage by status</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={prepareStatusBarData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 11 }}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} checks (${props.payload.percentage.toFixed(1)}%)`,
                  'Count'
                ]}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  padding: '12px'
                }}
              />
              <Bar 
                dataKey="count" 
                radius={[8, 8, 0, 0]}
              >
                {prepareStatusBarData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#8884d8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Sidebar */}
      {showFilterSidebar && (
        <>
          <div className="filter-sidebar-overlay" onClick={() => setShowFilterSidebar(false)}></div>
          <div className="filter-sidebar">
            <div className="filter-sidebar-header">
              <h2>Custom Filters</h2>
              <button 
                className="filter-sidebar-close"
                onClick={() => setShowFilterSidebar(false)}
                title="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="filter-sidebar-content">
              <div className="sidebar-filter-group">
                <label>Deposit Date From:</label>
                <input
                  type="date"
                  value={localFilters.depositDateFrom || ''}
                  onChange={(e) => handleFilterChange('depositDateFrom', e.target.value)}
                  className="sidebar-filter-input"
                />
              </div>
              
              <div className="sidebar-filter-group">
                <label>Deposit Date To:</label>
                <input
                  type="date"
                  value={localFilters.depositDateTo || ''}
                  onChange={(e) => handleFilterChange('depositDateTo', e.target.value)}
                  className="sidebar-filter-input"
                />
              </div>

              <div className="sidebar-filter-group">
                <label>Practice:</label>
                <SearchableDropdown
                  options={practices
                    .filter(p => !localFilters.practiceCodes?.includes(p.code))
                    .map(p => ({ value: p.code, label: `${p.code} - ${p.name}` }))}
                  value={selectedPracticeValue}
                  onChange={handlePracticeAdd}
                  placeholder="Select practice..."
                />
                {localFilters.practiceCodes && localFilters.practiceCodes.length > 0 && (
                  <div className="selected-practices">
                    {localFilters.practiceCodes.map((practiceCode) => (
                      <div key={practiceCode} className="selected-practice-chip">
                        <span>{practices.find(p => p.code === practiceCode)?.name || practiceCode}</span>
                        <button
                          onClick={() => handlePracticeRemove(practiceCode)}
                          className="chip-remove-btn"
                        >
                          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                            <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sidebar-filter-group">
                <label className="sidebar-checkbox-label">
                  <input
                    type="checkbox"
                    checked={localFilters.unknown || false}
                    onChange={(e) => handleFilterChange('unknown', e.target.checked)}
                    className="sidebar-filter-checkbox"
                  />
                  <span>Include Unknown Checks</span>
                </label>
              </div>
            </div>
            <div className="filter-sidebar-footer">
              <button onClick={() => {
                clearFilters();
                setShowFilterSidebar(false);
              }} className="sidebar-clear-button">
                Clear All
              </button>
              <button onClick={() => {
                applyFilters();
                setShowFilterSidebar(false);
              }} className="sidebar-apply-button">
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
