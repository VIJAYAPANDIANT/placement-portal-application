import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './company.css';

const MyDrives = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [drives, setDrives]   = useState([]);
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
    fetchCompanyDrives();
  }, []);

  const fetchCompanyDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/company/drives');
      setDrives(res.data || []);
    } catch (err) {
      console.error('Error fetching company drives:', err);
      setError(err.response?.data?.error || 'Failed to retrieve your placement drives.');
    } finally {
      setLoading(false);
    }
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const liveCount = drives.filter((d) => d.status === 'approved').length;
  const pendingCount = drives.filter((d) => d.status === 'pending').length;

  if (loading) {
    return (
      <div className="cp-page">
        <div className="cp-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <div>Loading drives...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cp-page">
      {/* ── TOPBAR ── */}
      <div className="cp-topbar">
        <span className="cp-topbar__title">My Drives</span>
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
        <div className="cp-breadcrumb">
          <Link to="/company">Home</Link>
          <span className="cp-breadcrumb__sep">›</span>
          <span>My Drives</span>
        </div>

        {/* Drives posted summary line & Button */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <div style={{ fontSize:'13px', color:'#4B5563' }}>
            <strong>{drives.length} drives posted</strong> · {liveCount} live · {pendingCount} pending
          </div>
          <Link to="/company/drives/create" className="cp-btn-primary" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center' }}>
            + Post New Drive
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger rounded-3 mb-4">{error}</div>
        )}

        {drives.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
            <div style={{ fontWeight: 700, color: '#111827' }}>No drives posted yet</div>
            <Link to="/company/drives/create" style={{ display: 'inline-block', marginTop: '12px', color: '#0F766E', textDecoration: 'none', fontWeight: 600 }}>Create your first drive →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {drives.map((drive) => {
              const isLive = drive.status === 'approved';
              const branches = drive.eligible_branches?.join(' / ') || 'All branches';
              const dateStr = drive.application_deadline ? new Date(drive.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';

              return (
                <div key={drive.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  
                  {/* Top line info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#CCFBF1', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '18px', flexShrink: 0, justifyContent: 'center' }}>
                        📢
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{drive.job_title}</span>
                          <span className={`cp-status cp-status--${isLive ? 'selected' : 'pending'}`}>
                            {isLive ? 'LIVE' : 'PENDING'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                          Full-time · {branches} · CGPA ≥ {drive.eligibility_cgpa} · ₹{drive.package_lpa} LPA · Deadline: {dateStr}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="cp-btn-ghost"
                        style={{ fontSize: '12px', height: '28px', padding: '0 12px' }}
                        onClick={() => navigate(`/company/drives/${drive.id}/applicants`)}
                      >
                        Applicants
                      </button>
                      <button className="cp-btn-ghost" style={{ fontSize: '12px', height: '28px', padding: '0 12px' }}>
                        Edit
                      </button>
                      {isLive && (
                        <button className="cp-btn-ghost" style={{ fontSize: '12px', height: '28px', padding: '0 12px', border: '1px solid #FEE2E2', color: '#DC2626' }}>
                          Close
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Funnel Counters & Progress */}
                  {isLive ? (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', gap: '32px' }}>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>APPLIED</span>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: '#2563EB', display: 'block', marginTop: '2px' }}>{drive.applicant_count || 0}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>SHORTLISTED</span>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: '#D97706', display: 'block', marginTop: '2px' }}>{Math.floor((drive.applicant_count || 0) * 0.35)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>SELECTED</span>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: '#16A34A', display: 'block', marginTop: '2px' }}>{Math.floor((drive.applicant_count || 0) * 0.08)}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6B7280', marginBottom: '4px' }}>
                            <span>Deadline progress</span>
                          </div>
                          <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: '65%', background: '#0F766E', borderRadius: '4px' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px', fontSize: '12px', color: '#92400E' }}>
                        ⏳ Submitted — Awaiting Placement Cell approval. Usually within 24 hours.
                      </div>
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

export default MyDrives;
