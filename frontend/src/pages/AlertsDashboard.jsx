import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { alertsApi } from '../api/alertsApi';

export default function AlertsDashboard() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('active'); // active, all
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = filter === 'all' ? null : filter;
      const response = await alertsApi.getAlerts(null, status);
      setAlerts(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await alertsApi.acknowledgeAlert(alertId);
      await fetchAlerts();
    } catch (err) {
      setError('Failed to acknowledge alert');
    }
  };

  const handleResolve = async (alertId) => {
    try {
      await alertsApi.resolveAlert(alertId);
      await fetchAlerts();
    } catch (err) {
      setError('Failed to resolve alert');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return '#dc2626'; // Red for SAM
      case 'high':
        return '#f97316'; // Orange for MAM
      case 'medium':
        return '#eab308'; // Yellow
      case 'low':
        return '#22c55e'; // Green
      default:
        return '#6b7280';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      active: { bg: '#fee2e2', text: '#991b1b' },
      acknowledged: { bg: '#fef3c7', text: '#92400e' },
      resolved: { bg: '#dcfce7', text: '#166534' },
    };
    const color = colors[status] || colors.active;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '4px 8px',
          backgroundColor: color.bg,
          color: color.text,
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'capitalize',
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="page">
      <h1 style={{ marginBottom: '24px', fontSize: '28px', fontWeight: '700' }}>
        🚨 Health Alerts
      </h1>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', borderBottom: '1px solid #e5e7eb' }}>
        {['active', 'all'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              padding: '12px 24px',
              backgroundColor: filter === tab ? '#3b82f6' : 'transparent',
              color: filter === tab ? 'white' : '#6b7280',
              border: 'none',
              borderBottom: filter === tab ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontWeight: '600',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'active' ? 'Active Alerts' : 'All Alerts'}
          </button>
        ))}
      </div>

      {/* Alert Stats */}
      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
          {loading ? 'Loading...' : `Showing ${alerts.length} alert${alerts.length !== 1 ? 's' : ''}`}
        </p>
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
            borderLeft: '4px solid #dc2626',
          }}
        >
          {error}
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            color: '#6b7280',
          }}
        >
          No alerts to display
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                borderRadius: '6px',
                backgroundColor: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
                    {alert.message}
                  </h3>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                    <strong>Child ID:</strong> {alert.child_id} | <strong>Created:</strong>{' '}
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
                {getStatusBadge(alert.status)}
              </div>

              {/* Alert Details */}
              {alert.details && Object.keys(alert.details).length > 0 && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '4px',
                    marginBottom: '12px',
                    fontSize: '13px',
                  }}
                >
                  <strong>Details:</strong>
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    {Object.entries(alert.details).map(([key, value]) => (
                      <li key={key} style={{ marginBottom: '4px' }}>
                        <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                {alert.status === 'active' && (
                  <>
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fcd34d',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      ✓ Acknowledge
                    </button>
                  </>
                )}
                {alert.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      border: '1px solid #86efac',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    ✓ Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
