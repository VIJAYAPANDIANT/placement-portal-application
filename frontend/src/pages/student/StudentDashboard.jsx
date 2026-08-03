import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './student.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const StudentDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [drives, setDrives]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime]       = useState(new Date());
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/student/dashboard/summary'),
      api.get('/student/drives'),
    ]).then(([summaryRes, drivesRes]) => {
      setData(summaryRes.data);
      setDrives(drivesRes.data || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const sb = data?.status_breakdown || {};

  const doughnutData = {
    labels: ['Selected', 'Shortlisted', 'Applied', 'Rejected'],
    datasets: [{
      data: [sb.selected || 0, sb.shortlisted || 0, sb.applied || 0, sb.rejected || 0],
      backgroundColor: ['#16A34A', '#D97706', '#2563EB', '#DC2626'],
      borderWidth: 0,
      spacing: 2,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } } },
  };

  // Closing soon = drives sorted by deadline, nearest first, show top 3
  const today = new Date();
  const closingSoon = [...drives]
    .filter(d => d.application_deadline)
    .map(d => ({
      ...d,
      daysLeft: Math.ceil((new Date(d.application_deadline) - today) / 86400000),
    }))
    .filter(d => d.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="sp-page">
        <div className="sp-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <div>Loading your dashboard…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      {/* ── TOPBAR ── */}
      <div className="sp-topbar">
        <span className="sp-topbar__title">Dashboard</span>
        <div className="sp-topbar__right">
          <span className="sp-live-badge"><span className="sp-live-dot" />LIVE</span>
          <span className="sp-time-badge">{timeStr} IST</span>
          <span className="sp-role-badge">STUDENT</span>
          <button
            className="sp-topbar__bell"
            title="Notifications"
            onClick={() => setIsDrawerOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="sp-topbar__bell-badge">{unreadCount}</span>}
          </button>
          <button className="sp-btn-ghost" onClick={() => { logout(); navigate('/login'); }}>Sign Out</button>
          <Link to="/student/drives" className="sp-btn-primary" style={{ display:'inline-flex',alignItems:'center',textDecoration:'none',gap:'6px' }}>
            Browse Drives
          </Link>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="sp-content">
        {/* Breadcrumb */}
        <div className="sp-breadcrumb">
          <Link to="/student">Home</Link>
          <span className="sp-breadcrumb__sep">›</span>
          <span>Dashboard</span>
        </div>

        {/* KPI Cards */}
        <div className="sp-kpi-grid">
          <div className="sp-kpi-card">
            <span className="sp-kpi-card__label">Applied Drives</span>
            <div className="sp-kpi-card__value">{data?.applied_drives || 0}</div>
            <span className="sp-chip sp-chip--blue">{data?.eligible_drives || 0} eligible</span>
          </div>
          <div className="sp-kpi-card">
            <span className="sp-kpi-card__label">Shortlisted</span>
            <div className="sp-kpi-card__value">{sb.shortlisted || 0}</div>
            <span className="sp-kpi-card__sub">{sb.shortlisted > 0 ? 'Awaiting result' : 'Keep applying!'}</span>
          </div>
          <div className="sp-kpi-card">
            <span className="sp-kpi-card__label">Selected</span>
            <div className="sp-kpi-card__value" style={{ color: sb.selected > 0 ? '#16A34A' : undefined }}>
              {sb.selected || 0}
            </div>
            {sb.selected > 0
              ? <span className="sp-chip sp-chip--green">Offer received!</span>
              : <span className="sp-kpi-card__sub">Aim for it!</span>}
          </div>
          <div className="sp-kpi-card">
            <span className="sp-kpi-card__label">Upcoming Interviews</span>
            <div className="sp-kpi-card__value">{data?.interview_count || 0}</div>
            {data?.upcoming_interview
              ? <span className="sp-kpi-card__sub">Next: {data.upcoming_interview.date}</span>
              : <span className="sp-kpi-card__sub">None scheduled</span>}
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="sp-profile-bar">
          <span className="sp-profile-bar__label">Profile Completeness</span>
          <div className="sp-profile-bar__track">
            <div className="sp-profile-bar__fill" style={{ width: `${data?.profile_completion || 0}%` }} />
          </div>
          <span className="sp-profile-bar__pct">{data?.profile_completion || 0}%</span>
          <Link to="/student/profile" className="sp-btn-primary" style={{ textDecoration:'none',fontSize:'12px',height:'28px',display:'inline-flex',alignItems:'center',padding:'0 12px' }}>
            Complete Profile
          </Link>
        </div>

        {/* Main 2-col grid */}
        <div className="sp-main-grid">
          {/* LEFT — Application Status + Upcoming Interviews */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Application Status Breakdown */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Application Status Breakdown</span>
                <Link to="/student/applications" className="sp-panel__link">View all →</Link>
              </div>
              <div className="sp-panel__body" style={{ display:'flex', gap:'24px', alignItems:'center' }}>
                <div style={{ width:'160px', height:'160px', flexShrink:0 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <div className="sp-doughnut-legend" style={{ flex:1 }}>
                  {[
                    { label:'Selected',    color:'#16A34A', count: sb.selected    || 0 },
                    { label:'Shortlisted', color:'#D97706', count: sb.shortlisted || 0 },
                    { label:'Applied',     color:'#2563EB', count: sb.applied     || 0 },
                    { label:'Rejected',    color:'#DC2626', count: sb.rejected    || 0 },
                  ].map(item => (
                    <div className="sp-legend-row" key={item.label}>
                      <span className="sp-legend-dot-label">
                        <span className="sp-legend-dot" style={{ background: item.color }} />
                        {item.label}
                      </span>
                      <span className="sp-legend-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Upcoming Interviews</span>
                <Link to="/student/interviews" className="sp-panel__link">All →</Link>
              </div>
              <div className="sp-panel__body">
                {data?.upcoming_interview ? (
                  <div className="sp-interview-card">
                    <div className="sp-interview-card__company">
                      {data.upcoming_interview.company_name} · {data.upcoming_interview.job_title}
                    </div>
                    <div className="sp-interview-card__title">{data.upcoming_interview.date}</div>
                    <div className="sp-interview-card__meta">Round 1 — Technical Interview</div>
                    <span className={`sp-mode-badge sp-mode--${data.upcoming_interview.mode}`}>
                      {data.upcoming_interview.mode === 'online' ? '🌐' : '📍'} {data.upcoming_interview.mode === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'24px 0', color:'#9CA3AF' }}>
                    <div style={{ fontSize:'28px', marginBottom:'8px' }}>📅</div>
                    <div style={{ fontSize:'13px' }}>No interviews scheduled yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Closing Soon + Quick Actions */}
          <div className="sp-side-col">
            {/* Closing Soon */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Closing Soon</span>
                <Link to="/student/drives" className="sp-panel__link">Browse →</Link>
              </div>
              <div className="sp-panel__body">
                {closingSoon.length === 0 ? (
                  <div style={{ textAlign:'center', color:'#9CA3AF', padding:'16px 0', fontSize:'13px' }}>No upcoming deadlines</div>
                ) : closingSoon.map(d => (
                  <div className="sp-closing-item" key={d.id}>
                    <div>
                      <div className="sp-closing-item__title">{d.company_name} · {d.job_title}</div>
                      <div className="sp-closing-item__sub">{d.package_lpa} LPA</div>
                    </div>
                    <span className={`sp-days-left ${d.daysLeft <= 2 ? 'sp-days--urgent' : d.daysLeft <= 5 ? 'sp-days--medium' : 'sp-days--ok'}`}>
                      {d.daysLeft}d left
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Quick Actions</span>
              </div>
              <div className="sp-panel__body">
                <Link to="/student/drives" className="sp-quick-btn sp-quick-btn--primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Browse Open Drives
                </Link>
                <Link to="/student/profile" className="sp-quick-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Complete Profile ({data?.profile_completion || 0}%)
                </Link>
                <Link to="/student/applications" className="sp-quick-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  My Applications
                </Link>
                <Link to="/student/interviews" className="sp-quick-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Interviews
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); refreshCount(); }}
      />
    </div>
  );
};

export default StudentDashboard;
