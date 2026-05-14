import { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { alertsApi, reportsApi } from '../api/alertsApi';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, subtext, bg, borderColor, textColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '20px',
        backgroundColor: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.boxShadow = 'none')}
    >
      <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <h2 style={{ margin: '0 0 4px 0', fontSize: '32px', fontWeight: '800', color: textColor }}>
        {value ?? '—'}
      </h2>
      {subtext && (
        <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>{subtext}</p>
      )}
    </div>
  );
}

function QuickActionCard({ icon, title, description, bg, border, textColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '20px',
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: textColor }}>
        {icon} {title}
      </h3>
      <p style={{ margin: 0, color: textColor, fontSize: '14px', opacity: 0.8 }}>{description}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    if (!user?.awc_code) return;

    const fetchAll = async () => {
      try {
        const [alertRes, reportRes] = await Promise.allSettled([
          alertsApi.getActiveCount(),
          reportsApi.getAWCReport(user.awc_code, year, month),
        ]);

        if (alertRes.status === 'fulfilled') {
          setActiveAlertCount(alertRes.value.data.active_alerts);
        }
        if (reportRes.status === 'fulfilled') {
          setMonthlyReport(reportRes.value.data);
        }
      } finally {
        setStatsLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(() => alertsApi.getActiveCount().then((r) => setActiveAlertCount(r.data.active_alerts)).catch(() => {}), 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const monthName = now.toLocaleString('default', { month: 'long' });

  return (
    <div className="page">
      <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '700' }}>
        {getWelcomeMessage()}, {user?.name || 'Worker'}!
      </h1>
      <p style={{ margin: '0 0 28px 0', color: '#6b7280', fontSize: '14px' }}>
        {user?.awc_code} · {user?.role}
      </p>

      {/* Alert Banner */}
      {activeAlertCount > 0 && (
        <div
          onClick={() => navigate('/alerts')}
          style={{
            padding: '14px 20px',
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
            <h3 style={{ margin: '0 0 2px 0', color: '#991b1b', fontSize: '16px', fontWeight: '700' }}>
              🚨 {activeAlertCount} Active Alert{activeAlertCount !== 1 ? 's' : ''} Require Attention
            </h3>
            <p style={{ margin: 0, color: '#7f1d1d', fontSize: '13px' }}>Click to view and resolve</p>
          </div>
          <span style={{ fontSize: '20px', color: '#991b1b' }}>→</span>
        </div>
      )}

      {/* Monthly Stats */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>
          {monthName} {year} — AWC Summary
        </h2>
        {statsLoading ? (
          <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#9ca3af', textAlign: 'center', fontSize: '14px' }}>
            Loading stats...
          </div>
        ) : monthlyReport ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <StatCard
              label="Total Children"
              value={monthlyReport.total_children}
              subtext="enrolled"
              bg="#eff6ff"
              borderColor="#bfdbfe"
              textColor="#1e40af"
              onClick={() => navigate('/children')}
            />
            <StatCard
              label="Measured"
              value={monthlyReport.measured_children}
              subtext={`${monthlyReport.total_children ? ((monthlyReport.measured_children / monthlyReport.total_children) * 100).toFixed(0) : 0}% coverage`}
              bg="#f0fdf4"
              borderColor="#bbf7d0"
              textColor="#15803d"
            />
            <StatCard
              label="SAM Cases"
              value={monthlyReport.sam_count}
              subtext={`${monthlyReport.sam_percentage}% of measured`}
              bg="#fee2e2"
              borderColor="#fca5a5"
              textColor="#dc2626"
              onClick={() => navigate('/reports')}
            />
            <StatCard
              label="MAM Cases"
              value={monthlyReport.mam_count}
              subtext={`${monthlyReport.mam_percentage}% of measured`}
              bg="#fff7ed"
              borderColor="#fdba74"
              textColor="#ea580c"
              onClick={() => navigate('/reports')}
            />
            <StatCard
              label="Normal"
              value={monthlyReport.normal_count}
              subtext={`${monthlyReport.normal_percentage}% of measured`}
              bg="#f0fdf4"
              borderColor="#86efac"
              textColor="#16a34a"
            />
            <StatCard
              label="Active Alerts"
              value={activeAlertCount}
              subtext="unresolved"
              bg={activeAlertCount > 0 ? "#fee2e2" : "#f9fafb"}
              borderColor={activeAlertCount > 0 ? "#fca5a5" : "#e5e7eb"}
              textColor={activeAlertCount > 0 ? "#dc2626" : "#6b7280"}
              onClick={() => navigate('/alerts')}
            />
          </div>
        ) : (
          <div style={{ padding: '24px', backgroundColor: '#f9fafb', borderRadius: '8px', color: '#9ca3af', textAlign: 'center', fontSize: '14px' }}>
            No data available for this month. Start logging measurements to see stats.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#374151' }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <QuickActionCard icon="👶" title="View Children" description="Manage enrolled children" bg="#eff6ff" border="#bfdbfe" textColor="#0c4a6e" onClick={() => navigate('/children')} />
        <QuickActionCard icon="➕" title="Register Child" description="Enroll a new child" bg="#f0fdf4" border="#bbf7d0" textColor="#15803d" onClick={() => navigate('/children/new')} />
        <QuickActionCard icon="⚖️" title="Log Measurement" description="Record weight & height" bg="#fef3c7" border="#fde68a" textColor="#92400e" onClick={() => navigate('/growth/new')} />
        <QuickActionCard icon="🍎" title="Log Diet" description="Record food intake" bg="#fce7f3" border="#fbcfe8" textColor="#831843" onClick={() => navigate('/nutrition/log')} />
        <QuickActionCard icon="🚨" title="View Alerts" description={activeAlertCount > 0 ? `${activeAlertCount} active` : 'No active alerts'} bg="#fee2e2" border="#fecaca" textColor="#991b1b" onClick={() => navigate('/alerts')} />
        <QuickActionCard icon="📊" title="Reports" description="Monthly analytics" bg="#e0e7ff" border="#c7d2fe" textColor="#312e81" onClick={() => navigate('/reports')} />
      </div>

      {/* Info Panel */}
      <div style={{ backgroundColor: '#f9fafb', padding: '16px 20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600' }}>System Information</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '14px' }}>
          <li style={{ marginBottom: '6px' }}>Role: <strong>{user?.role || 'Worker'}</strong> · AWC: <strong>{user?.awc_code || 'N/A'}</strong></li>
          <li>The system auto-detects SAM/MAM cases and sends alerts. Log measurements regularly to keep data current.</li>
        </ul>
      </div>
    </div>
  );
}
