import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './student.css';

const COMPANY_COLORS = ['#0F766E','#2563EB','#7C3AED','#D97706','#DC2626','#0891B2','#059669','#9333EA'];

const STATUS_META = {
  selected:    { label: 'SELECTED ✓', pillClass: 'sp-app-status--selected',    banner: 'sp-banner--selected',    icon: '🎉', msg: "Congratulations! You've been selected. Offer letter sent to your email." },
  shortlisted: { label: 'SHORTLISTED', pillClass: 'sp-app-status--shortlisted', banner: 'sp-banner--shortlisted', icon: '⚡', msg: "You've been shortlisted! Check the Interviews tab for schedule details." },
  applied:     { label: 'APPLIED',     pillClass: 'sp-app-status--applied',     banner: null,                     icon: null, msg: null },
  rejected:    { label: 'REJECTED',    pillClass: 'sp-app-status--rejected',    banner: 'sp-banner--rejected',    icon: '❌', msg: 'Your application was not selected this time. Keep applying!' },
};

const MyApplications = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filter, setFilter]             = useState('All');
  const [loading, setLoading]           = useState(true);
  const [time, setTime]                 = useState(new Date());

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.get('/student/applications')
      .then(res => setApplications(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const TABS = ['All', 'Selected', 'Shortlisted', 'Applied', 'Rejected'];

  const counts = {
    All: applications.length,
    Selected: applications.filter(a => a.status === 'selected').length,
    Shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    Applied: applications.filter(a => a.status === 'applied').length,
    Rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const filtered = filter === 'All'
    ? applications
    : applications.filter(a => a.status === filter.toLowerCase());

  const exportCSV = async () => {
    try {
      await api.post('/student/export-csv');
      alert('Export started! The CSV report is being emailed to your registered address.');
    } catch (err) {
      console.error('CSV Export error:', err);
      alert('Failed to export CSV.');
    }
  };

  return (
    <div className="sp-page">
      {/* ── TOPBAR ── */}
      <div className="sp-topbar">
        <span className="sp-topbar__title">My Applications</span>
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
          <button className="sp-btn-primary" onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      <div className="sp-content">
        <div className="sp-breadcrumb">
          <Link to="/student">Home</Link>
          <span className="sp-breadcrumb__sep">›</span>
          <span>My Applications</span>
        </div>

        {/* Filter Tabs */}
        <div className="sp-filter-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`sp-filter-tab${filter === tab ? ' sp-filter-tab--active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Summary counts */}
        <div style={{ display:'flex', gap:'16px', marginBottom:'16px', fontSize:'13px', color:'#6B7280' }}>
          <span><strong style={{ color:'#111827' }}>{counts.All} Applied</strong></span>
          {counts.Shortlisted > 0 && <span><strong style={{ color:'#D97706' }}>{counts.Shortlisted} Shortlisted</strong></span>}
          {counts.Selected    > 0 && <span><strong style={{ color:'#16A34A' }}>{counts.Selected} Selected</strong></span>}
          {counts.Rejected    > 0 && <span><strong style={{ color:'#DC2626' }}>{counts.Rejected} Rejected</strong></span>}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#9CA3AF' }}>
            <div style={{ fontSize:'28px', marginBottom:'8px' }}>⏳</div>Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#9CA3AF' }}>
            <div style={{ fontSize:'32px', marginBottom:'8px' }}>📭</div>
            <div style={{ fontSize:'14px', fontWeight:600 }}>No applications</div>
            <Link to="/student/drives" style={{ fontSize:'13px', color:'#0F766E', marginTop:'8px', display:'inline-block' }}>Browse Drives →</Link>
          </div>
        ) : (
          <div>
            {filtered.map((app, i) => {
              const meta  = STATUS_META[app.status] || STATUS_META.applied;
              const color = COMPANY_COLORS[i % COMPANY_COLORS.length];

              return (
                <div className="sp-app-card" key={app.id}>
                  <div className="sp-app-card__header">
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <div className="sp-app-card__logo" style={{ background: color }}>
                        {app.company_name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color:'#6B7280', marginBottom:'2px' }}>
                          {app.company_name}
                        </div>
                        <div style={{ fontSize:'15px', fontWeight:700, color:'#111827' }}>{app.job_title}</div>
                        <div style={{ display:'flex', gap:'8px', marginTop:'4px', flexWrap:'wrap' }}>
                          <span className="sp-tag sp-tag--pkg">₹{app.package_lpa} LPA</span>
                          {app.applied_on && (
                            <span className="sp-tag sp-tag--branch">
                              Deadline: {new Date(app.applied_on).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px' }}>
                      <span className={`sp-app-status-pill ${meta.pillClass}`}>{meta.label}</span>
                      {app.status === 'selected' && (
                        <button className="sp-btn-primary" style={{ height:'28px', fontSize:'11px', padding:'0 10px' }}>
                          View Offer
                        </button>
                      )}
                      {(app.status === 'shortlisted') && (
                        <Link to="/student/interviews" className="sp-btn-ghost" style={{ height:'28px', fontSize:'11px', padding:'0 10px', textDecoration:'none', display:'inline-flex', alignItems:'center' }}>
                          Interview →
                        </Link>
                      )}
                    </div>
                  </div>
                  {meta.banner && meta.msg && (
                    <div className={`sp-app-card__banner ${meta.banner}`}>
                      <span>{meta.icon}</span>
                      <span>{meta.msg}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); refreshCount(); }}
      />
    </div>
  );
};

export default MyApplications;
