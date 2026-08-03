import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './company.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CompanyDashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [time, setTime]       = useState(new Date());

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/company/dashboard/summary');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching company summary:', err);
      setError(err.response?.data?.error || 'Failed to load recruitment metrics');
    } finally {
      setLoading(false);
    }
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  if (loading) {
    return (
      <div className="cp-page">
        <div className="cp-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <div>Loading dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  const weeklyChartData = {
    labels: (data?.weekly_applications || []).map((w) => w.day),
    datasets: [
      {
        label: 'Applications',
        data: (data?.weekly_applications || []).map((w) => w.count),
        backgroundColor: '#0d9488',
        borderRadius: 6,
      },
    ],
  };

  const weeklyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { drawBorder: false, color: '#F3F4F6' } },
      x: { grid: { display: false } }
    },
  };

  // Get total applicants for funnel percentages
  const totalApps = data?.funnel?.applied || 0;

  return (
    <div className="cp-page">
      {/* ── TOPBAR ── */}
      <div className="cp-topbar">
        <span className="cp-topbar__title">Overview</span>
        <div className="cp-topbar__right">
          <span className="cp-live-badge"><span className="cp-live-dot" />LIVE</span>
          <span className="cp-time-badge">{timeStr} IST</span>
          <span className="cp-role-badge">COMPANY</span>
          <button className="cp-topbar__bell" title="Notifications" onClick={() => setIsDrawerOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="cp-topbar__bell-badge">{unreadCount}</span>}
          </button>
          <button className="cp-btn-ghost" onClick={() => { logout(); navigate('/login'); }}>Sign Out</button>
          <Link to="/company/drives/create" className="cp-btn-primary" style={{ display:'inline-flex',alignItems:'center',textDecoration:'none',gap:'6px' }}>
            + Post Drive
          </Link>
        </div>
      </div>

      <div className="cp-content">
        {/* Breadcrumb */}
        <div className="cp-breadcrumb">
          <Link to="/company">Home</Link>
          <span className="cp-breadcrumb__sep">›</span>
          <span>Overview</span>
        </div>

        {/* KPI Cards Grid */}
        <div className="cp-kpi-grid">
          <div className="cp-kpi-card">
            <span className="cp-kpi-card__label">Active Drives</span>
            <div className="cp-kpi-card__value">{data?.active_drives || 0}</div>
            <span className="cp-chip sp-chip--yellow">{data?.pending_drives || 0} pending approval</span>
          </div>
          <div className="cp-kpi-card">
            <span className="cp-kpi-card__label">Total Applicants</span>
            <div className="cp-kpi-card__value">{data?.total_applicants || 0}</div>
            <span className="cp-chip sp-chip--green">+38 this week</span>
          </div>
          <div className="cp-kpi-card">
            <span className="cp-kpi-card__label">Shortlisted</span>
            <div className="cp-kpi-card__value">{data?.shortlisted || 0}</div>
            <span className="cp-kpi-card__sub">18.3% conversion</span>
          </div>
          <div className="cp-kpi-card">
            <span className="cp-kpi-card__label">Offers Extended</span>
            <div className="cp-kpi-card__value" style={{ color: '#16A34A' }}>{data?.offers_extended || 0}</div>
            <span className="cp-chip sp-chip--teal">4.9% hire rate</span>
          </div>
        </div>

        {/* Main 2-column Layout */}
        <div className="cp-main-grid">
          {/* Left Column: Funnel & Recent Applicants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Applicant Funnel */}
            <div className="cp-panel">
              <div className="cp-panel__header">
                <span className="cp-panel__title">Applicant Funnel — Backend SDE</span>
                <Link to="/company/applicants" className="cp-panel__link">Manage →</Link>
              </div>
              <div className="cp-panel__body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Applied',     count: data?.funnel?.applied || 0,     pct: 100, color: '#2563EB' },
                    { label: 'Shortlisted', count: data?.funnel?.shortlisted || 0, pct: totalApps > 0 ? Math.round((data.funnel.shortlisted / totalApps) * 100) : 0, color: '#D97706' },
                    { label: 'Interviewed', count: data?.funnel?.interviewed || 0, pct: totalApps > 0 ? Math.round((data.funnel.interviewed / totalApps) * 100) : 0, color: '#7C3AED' },
                    { label: 'Selected',    count: data?.funnel?.selected || 0,    pct: totalApps > 0 ? Math.round((data.funnel.selected / totalApps) * 100) : 0, color: '#16A34A' }
                  ].map((row) => (
                    <div className="cp-funnel-item" key={row.label}>
                      <div className="cp-funnel-meta">
                        <span className="cp-funnel-label">{row.label}</span>
                        <span className="cp-funnel-count">{row.count} students</span>
                      </div>
                      <div className="cp-funnel-bar">
                        <div
                          className="cp-funnel-fill"
                          style={{ width: `${row.pct}%`, background: row.color }}
                        >
                          {row.pct}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Applicants */}
            <div className="cp-panel">
              <div className="cp-panel__header">
                <span className="cp-panel__title">Recent Applicants</span>
                <Link to="/company/applicants" className="cp-panel__link">All applicants →</Link>
              </div>
              <div className="cp-panel__body cp-panel__body--p0">
                {!data?.recent_applicants || data.recent_applicants.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>No inbound applicants</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="cp-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>CGPA</th>
                          <th>Drive</th>
                          <th>Applied</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_applicants.map((app) => (
                          <tr key={app.application_id}>
                            <td>
                              <span className="cp-table__name">{app.student_name}</span>
                              <span className="cp-table__sub">{app.roll_number} · {app.branch}</span>
                            </td>
                            <td><strong style={{ color: '#111827' }}>{app.cgpa}</strong></td>
                            <td>{app.drive}</td>
                            <td style={{ color: '#6B7280' }}>{app.applied_on}</td>
                            <td>
                              <span className={`cp-status cp-status--${app.status?.toLowerCase()}`}>
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Applications, Drive Status Summary, Quick Actions */}
          <div className="cp-side-col">
            {/* Weekly Applications Chart */}
            <div className="cp-panel">
              <div className="cp-panel__header">
                <span className="cp-panel__title">Weekly Applications</span>
              </div>
              <div className="cp-panel__body">
                <div style={{ height: '180px', position: 'relative' }}>
                  <Bar data={weeklyChartData} options={weeklyChartOptions} />
                </div>
                <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '10px', textAlign: 'center' }}>
                  Total this week: <strong>198</strong>
                </div>
              </div>
            </div>

            {/* Drive Status Summary */}
            <div className="cp-panel">
              <div className="cp-panel__header">
                <span className="cp-panel__title">Drive Status</span>
              </div>
              <div className="cp-panel__body">
                {!data?.drive_status_list || data.drive_status_list.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>No drives created</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.drive_status_list.map((d) => (
                      <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F9FAFB', borderRadius: '6px' }}>
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', display: 'block' }}>{d.job_title}</span>
                          <span style={{ fontSize: '11px', color: '#6B7280' }}>{d.applicant_count} applicants</span>
                        </div>
                        <span className={`cp-status cp-status--${d.status?.toLowerCase() === 'approved' ? 'selected' : d.status?.toLowerCase() === 'pending' ? 'pending' : 'applied'}`}>
                          {d.status?.toLowerCase() === 'approved' ? 'LIVE' : d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="cp-panel">
              <div className="cp-panel__header">
                <span className="cp-panel__title">Quick Actions</span>
              </div>
              <div className="cp-panel__body">
                <Link to="/company/drives/create" className="cp-quick-btn cp-quick-btn--primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Post New Drive
                </Link>
                <Link to="/company/drives" className="cp-quick-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  Review Applicants
                </Link>
                <Link to="/company/applicants" className="cp-quick-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Schedule Interview
                </Link>
                <button className="cp-quick-btn" onClick={() => alert('Exporting applicants list...')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Export Applicants CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION DRAWER ── */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); refreshCount(); }}
      />
    </div>
  );
};

export default CompanyDashboard;
