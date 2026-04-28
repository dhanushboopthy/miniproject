import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../auth/useAuth';
import { reportsApi } from '../api/alertsApi';

export default function ReportsPage() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('awc'); // awc or trend
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (reportType === 'awc') {
      fetchAWCReport();
    } else {
      fetchTrendData();
    }
  }, [reportType, year, month]);

  const fetchAWCReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsApi.getAWCReport(null, year, month);
      setReport(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsApi.getNutritionTrend(null, 30);
      setTrend(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch trend data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = {
    sam: '#dc2626',  // Red
    mam: '#f97316',  // Orange
    normal: '#22c55e', // Green
  };

  // Prepare pie chart data for monthly report
  const pieData = report ? [
    { name: 'SAM', value: report.sam_count, color: COLORS.sam },
    { name: 'MAM', value: report.mam_count, color: COLORS.mam },
    { name: 'Normal', value: report.normal_count, color: COLORS.normal },
  ] : [];

  return (
    <div className="page">
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: '700' }}>
        📊 Nutrition Reports & Analytics
      </h1>

      {/* Report Type Selector */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#f3f4f6', padding: '16px', borderRadius: '8px' }}>
        <div>
          <label style={{ fontWeight: '600', marginRight: '8px' }}>Report Type:</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <option value="awc">Monthly Report</option>
            <option value="trend">30-Day Trend</option>
          </select>
        </div>

        {reportType === 'awc' && (
          <>
            <div>
              <label style={{ fontWeight: '600', marginRight: '8px' }}>Month:</label>
              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  width: '60px',
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: '600', marginRight: '8px' }}>Year:</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  width: '80px',
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            borderRadius: '6px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          Loading report...
        </div>
      ) : reportType === 'awc' && report ? (
        <div>
          {/* Summary Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Total Children</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>{report.total_children}</h3>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderLeft: '4px solid #eab308', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Measured</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>{report.measured_children} ({report.measured_children && report.total_children ? ((report.measured_children / report.total_children) * 100).toFixed(1) : 0}%)</h3>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderLeft: '4px solid #dc2626', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>SAM Cases</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>{report.sam_count} ({report.sam_percentage}%)</h3>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#fed7aa', borderLeft: '4px solid #f97316', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>MAM Cases</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>{report.mam_count} ({report.mam_percentage}%)</h3>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#e0e7ff', borderLeft: '4px solid #3b82f6', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Total Alerts</p>
              <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>{report.total_alerts}</h3>
            </div>
          </div>

          {/* Pie Chart */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
              Nutrition Status Distribution
            </h3>
            {pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No measurement data available
              </div>
            )}
          </div>

          {/* Children List */}
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
              Children Details
            </h3>
            {report.children_status.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Child ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Age (months)</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>WHZ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.children_status.map((child, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9fafb',
                        }}
                      >
                        <td style={{ padding: '12px' }}>{child.child_id}</td>
                        <td style={{ padding: '12px' }}>{child.name}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{child.age_months}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              backgroundColor:
                                child.latest_status === 'SAM'
                                  ? '#fee2e2'
                                  : child.latest_status === 'MAM'
                                  ? '#fed7aa'
                                  : '#dcfce7',
                              color:
                                child.latest_status === 'SAM'
                                  ? '#991b1b'
                                  : child.latest_status === 'MAM'
                                  ? '#92400e'
                                  : '#166534',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          >
                            {child.latest_status || 'Unknown'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {child.latest_whz ? child.latest_whz.toFixed(2) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                No children data available
              </div>
            )}
          </div>
        </div>
      ) : reportType === 'trend' && trend.length > 0 ? (
        <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
            Nutrition Status - 30 Day Trend
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sam_count" fill={COLORS.sam} name="SAM" />
              <Bar dataKey="mam_count" fill={COLORS.mam} name="MAM" />
              <Bar dataKey="normal_count" fill={COLORS.normal} name="Normal" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
          No data available for the selected period
        </div>
      )}
    </div>
  );
}
