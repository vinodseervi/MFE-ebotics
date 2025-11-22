import React from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardStats, trendData, statusDistribution } from '../data/mockData';
import './Dashboard.css';

const Dashboard = () => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const COLORS = {
    complete: '#10b981',
    clarification: '#f59e0b',
    inProgress: '#3b82f6',
    notStarted: '#6b7280'
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Dashboard
            <span className="info-icon">⚠️</span>
          </h1>
          <p className="page-subtitle">
            Overview of payment reconciliation for Nov 1, 2025 - Nov 30, 2025
          </p>
        </div>
        <div className="date-range">
          Nov 2025 - Nov 2025
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon dollar">$</div>
          <div className="stat-content">
            <div className="stat-label">Expected Amount</div>
            <div className="stat-value">{formatCurrency(dashboardStats.expectedAmount)}</div>
            <div className="stat-meta">{dashboardStats.expectedChecks} checks deposited</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon trend">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 7H15V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Posted Amount</div>
            <div className="stat-value">{formatCurrency(dashboardStats.postedAmount)}</div>
            <div className="stat-meta success">{dashboardStats.postedPercentage}% of expected</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Under Clarification</div>
            <div className="stat-value">{formatCurrency(dashboardStats.clarificationAmount)}</div>
            <div className="stat-meta warning">{dashboardStats.clarificationChecks} checks need review</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon clock">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{formatCurrency(dashboardStats.pendingAmount)}</div>
            <div className="stat-meta">Avg {dashboardStats.avgDaysToProcess} days to process</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3 className="chart-title">Expected vs Posted Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="expected" 
                stroke="#14b8a6" 
                strokeWidth={2}
                name="Expected"
                dot={{ fill: '#14b8a6', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="posted" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Posted"
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3 className="chart-title">Check Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

