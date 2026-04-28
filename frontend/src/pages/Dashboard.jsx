import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { alertsApi } from '../api/alertsApi';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.awc_code) {
      fetchActiveAlertCount();
      // Refresh alert count every 30 seconds
      const interval = setInterval(fetchActiveAlertCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchActiveAlertCount = async () => {
    try {
      const response = await alertsApi.getActiveCount();
      setActiveAlertCount(response.data.active_alerts);
    } catch (err) {
      console.error('Failed to fetch alert count:', err);
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const getWelcomeMessage = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
        {getWelcomeMessage()}, {user?.name || 'Worker'}!
      </h1>
      <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '16px' }}>
        Welcome to Anganwadi Smart Health Monitoring System
      </p>

      {/* Alert Banner */}
      {activeAlertCount > 0 && (
        <div
          onClick={() => navigate('/alerts')}
          style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '24px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '16px', fontWeight: '600' }}>
              🚨 {activeAlertCount} Active Alert{activeAlertCount !== 1 ? 's' : ''}
            </h3>
            <p style={{ margin: 0, color: '#7f1d1d', fontSize: '14px' }}>
              Click to view and manage
            </p>
          </div>
          <span style={{ fontSize: '20px' }}>→</span>
        </div>
      )}

      {/* Quick Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div
          onClick={() => handleNavigate('/children')}
          style={{
            padding: '20px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#0c4a6e' }}>
            👶 View Children
          </h3>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px' }}>
            Manage enrolled children
          </p>
        </div>

        <div
          onClick={() => handleNavigate('/children/new')}
          style={{
            padding: '20px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#15803d' }}>
            ➕ Register Child
          </h3>
          <p style={{ margin: 0, color: '#15803d', fontSize: '14px' }}>
            Enroll a new child
          </p>
        </div>

        <div
          onClick={() => handleNavigate('/growth/new')}
          style={{
            padding: '20px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#92400e' }}>
            ⚖️ Log Measurement
          </h3>
          <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
            Record weight & height
          </p>
        </div>

        <div
          onClick={() => handleNavigate('/nutrition/log')}
          style={{
            padding: '20px',
            backgroundColor: '#fce7f3',
            border: '1px solid #fbcfe8',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#831843' }}>
            🍎 Log Diet
          </h3>
          <p style={{ margin: 0, color: '#831843', fontSize: '14px' }}>
            Record food intake
          </p>
        </div>

        <div
          onClick={() => handleNavigate('/alerts')}
          style={{
            padding: '20px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#991b1b' }}>
            🚨 View Alerts
          </h3>
          <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>
            {activeAlertCount > 0 ? `${activeAlertCount} active` : 'No active alerts'}
          </p>
        </div>

        <div
          onClick={() => handleNavigate('/reports')}
          style={{
            padding: '20px',
            backgroundColor: '#e0e7ff',
            border: '1px solid #c7d2fe',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#312e81' }}>
            📊 View Reports
          </h3>
          <p style={{ margin: 0, color: '#312e81', fontSize: '14px' }}>
            Monthly analytics
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
          📋 System Information
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
          <li style={{ marginBottom: '8px' }}>Your Role: <strong>{user?.role || 'Worker'}</strong></li>
          <li style={{ marginBottom: '8px' }}>AWC Code: <strong>{user?.awc_code || 'N/A'}</strong></li>
          <li>The system automatically detects SAM (Severe Acute Malnutrition) and MAM (Moderate Acute Malnutrition) cases and sends alerts.</li>
        </ul>
      </div>
    </div>
  );
}
