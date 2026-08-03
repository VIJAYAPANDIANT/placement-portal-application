import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './student.css';

const COMPANY_COLORS = ['#0F766E','#2563EB','#7C3AED','#D97706','#DC2626','#0891B2','#059669','#9333EA'];

const BrowseDrives = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [drives, setDrives]         = useState([]);
  const [applications, setApps]     = useState([]);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All Drives');
  const [loading, setLoading]       = useState(true);
  const [applying, setApplying]     = useState(null);
  const [time, setTime]             = useState(new Date());

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/student/drives'),
      api.get('/student/applications'),
    ]).then(([drivesRes, appsRes]) => {
      setDrives(drivesRes.data || []);
      setApps(appsRes.data   || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  // Build a map of drive_id -> application status
  const appliedMap = {};
  applications.forEach(a => { appliedMap[a.drive_id] = a.status; });

  const handleApply = async (driveId) => {
    setApplying(driveId);
    try {
      await api.post(`/student/drives/${driveId}/apply`);
      const res = await api.get('/student/applications');
      setApps(res.data || []);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(null);
    }
  };

  const filtered = drives.filter(d => {
    const matchSearch = !search || [d.company_name, d.job_title].some(s => s?.toLowerCase().includes(search.toLowerCase()));
    const appStatus = appliedMap[d.id];

    if (filter === 'All Drives') return matchSearch;
    if (filter === 'CS / IT')    return matchSearch && d.eligible_branches?.some(b => ['CSE','CS','IT','IS'].includes(b));
    if (filter === 'Open Only')  return matchSearch && !appStatus;
    if (filter === '≥ 15 LPA')   return matchSearch && d.package_lpa >= 15;
    return matchSearch;
  });

  const today = new Date();

  const getAppStatus = (drive) => {
    const apps = applications.filter(a => a.drive_id == drive.id || a.job_title === drive.job_title);
    // Use appliedMap (which keyed by drive_id) — try matching by job_title since API may not return drive_id
    const found = applications.find(a => a.job_title === drive.job_title && a.company_name === drive.company_name);
    return found?.status || null;
  };

  const getDaysLeft = (deadline) => {
    if (!deadline) return null;
    return Math.ceil((new Date(deadline) - today) / 86400000);
  };

  return (
    <div className="sp-page">
      {/* ── TOPBAR ── */}
      <div className="sp-topbar">
        <span className="sp-topbar__title">Browse Drives</span>
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
          <button className="sp-btn-primary" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      </div>

      <div className="sp-content">
        <div className="sp-breadcrumb">
          <Link to="/student">Home</Link>
          <span className="sp-breadcrumb__sep">›</span>
          <span>Browse Drives</span>
        </div>

        {/* Search */}
        <div className="sp-search-bar">
          <svg className="sp-search-bar__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="sp-search-bar__input"
            placeholder="🔍 Search by company, role, or keywords..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="sp-filter-tabs">
          {['All Drives', 'CS / IT', 'Open Only', '≥ 15 LPA'].map(tab => (
            <button
              key={tab}
              className={`sp-filter-tab${filter === tab ? ' sp-filter-tab--active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#9CA3AF' }}>
            <div style={{ fontSize:'28px', marginBottom:'8px' }}>⏳</div>Loading drives…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#9CA3AF' }}>
            <div style={{ fontSize:'32px', marginBottom:'8px' }}>🔍</div>
            <div style={{ fontSize:'14px', fontWeight:600 }}>No drives found</div>
            <div style={{ fontSize:'12px', marginTop:'4px' }}>Try a different search or filter</div>
          </div>
        ) : (
          <div className="sp-drives-grid">
            {filtered.map((drive, i) => {
              const color    = COMPANY_COLORS[i % COMPANY_COLORS.length];
              const appStatus = getAppStatus(drive);
              const daysLeft  = getDaysLeft(drive.application_deadline);
              const isUrgent  = daysLeft !== null && daysLeft <= 3;
              const branches  = (drive.eligible_branches || []).join(' · ') || 'ALL';

              return (
                <div className="sp-drive-card" key={drive.id}>
                  {/* Company */}
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                    <div style={{ width:'32px',height:'32px',borderRadius:'8px',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'13px',fontWeight:'800',color:'#fff',flexShrink:0 }}>
                      {drive.company_name?.charAt(0)}
                    </div>
                    <div>
                      <div className="sp-drive-card__company">{drive.company_name?.toUpperCase()}</div>
                    </div>
                  </div>

                  <div className="sp-drive-card__title">{drive.job_title}</div>

                  {/* Tags */}
                  <div className="sp-drive-card__tags">
                    <span className="sp-tag sp-tag--pkg">₹{drive.package_lpa} LPA</span>
                    <span className="sp-tag sp-tag--cgpa">CGPA ≥ {drive.eligibility_cgpa}</span>
                    <span className="sp-tag sp-tag--branch">{branches}</span>
                  </div>

                  {/* Footer */}
                  <div className="sp-drive-card__footer">
                    <span className={`sp-deadline-text ${isUrgent ? 'sp-deadline-urgent' : ''}`}>
                      {isUrgent && '⚠ '}Deadline: {drive.application_deadline ? new Date(drive.application_deadline).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : 'N/A'}
                    </span>
                    {appStatus ? (
                      <span className={`sp-drive-status sp-drive-status--${appStatus}`}>
                        {appStatus === 'selected' ? '✓ Selected' : appStatus === 'shortlisted' ? 'Shortlisted' : appStatus === 'applied' ? 'applied ✓' : appStatus}
                      </span>
                    ) : (
                      <button
                        className="sp-apply-btn"
                        onClick={() => handleApply(drive.id)}
                        disabled={applying === drive.id}
                      >
                        {applying === drive.id ? 'Applying…' : 'Apply Now'}
                      </button>
                    )}
                  </div>
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

export default BrowseDrives;
