import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [dateRange, setDateRange] = useState({
    depositDateFrom: null,
    depositDateTo: null
  });

  useEffect(() => {
    fetchKPIData();
  }, [filters]);

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

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyDateFilter = () => {
    const newFilters = {};
    if (dateRange.depositDateFrom) {
      newFilters.depositDateFrom = dateRange.depositDateFrom;
    }
    if (dateRange.depositDateTo) {
      newFilters.depositDateTo = dateRange.depositDateTo;
    }
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setDateRange({
      depositDateFrom: null,
      depositDateTo: null
    });
    setFilters({});
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
    'UNDER_CLARIFICATIONS': 'Under Clarifications'
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
          <div className="date-filter-container">
            <div className="date-input-group">
              <label>From:</label>
              <input
                type="date"
                value={dateRange.depositDateFrom || ''}
                onChange={(e) => handleDateRangeChange('depositDateFrom', e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-group">
              <label>To:</label>
              <input
                type="date"
                value={dateRange.depositDateTo || ''}
                onChange={(e) => handleDateRangeChange('depositDateTo', e.target.value)}
                className="date-input"
              />
            </div>
            <button onClick={applyDateFilter} className="filter-button">
              Apply
            </button>
            {(filters.depositDateFrom || filters.depositDateTo) && (
              <button onClick={clearFilters} className="clear-button">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

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
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={prepareStatusChartData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                outerRadius={120}
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
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Status Comparison</h3>
            <div className="chart-subtitle">Count and percentage by status</div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={prepareStatusBarData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={80}
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
    </div>
  );
};

export default Dashboard;
