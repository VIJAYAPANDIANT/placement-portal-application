import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './student.css';

const MyInterviews = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [time, setTime]             = useState(new Date());

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.get('/student/interviews')
      .then(res => setInterviews(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming  = interviews.filter(iv => {
    const d = new Date(iv.interview_date);
    return d >= today;
  });
  const completed = interviews.filter(iv => {
    const d = new Date(iv.interview_date);
    return d < today;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  };

  return (
    <div className="sp-page">
      {/* ── TOPBAR ── */}
      <div className="sp-topbar">
        <span className="sp-topbar__title">Interviews</span>
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
          <button className="sp-btn-primary">Add to Calendar</button>
        </div>
      </div>

      <div className="sp-content">
        {/* Tip Banner */}
        <div className="sp-tip-bar">
          <span>💡</span>
          <span>
            <strong>Tip:</strong> Review DSA fundamentals before technical rounds. For offline interviews, report 15 min early with your college ID and printed resume.
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:'#9CA3AF' }}>
            <div style={{ fontSize:'28px', marginBottom:'8px' }}>⏳</div>Loading interviews…
          </div>
        ) : interviews.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'#9CA3AF' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📅</div>
            <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'4px' }}>No interviews yet</div>
            <div style={{ fontSize:'13px' }}>When you get shortlisted, your interview schedule will appear here.</div>
            <Link to="/student/drives" style={{ display:'inline-block', marginTop:'16px', color:'#0F766E', fontWeight:600, textDecoration:'none' }}>
              Browse Drives →
            </Link>
          </div>
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div style={{ marginBottom:'28px' }}>
                <div className="sp-iv-section-title">
                  <span>📅</span>
                  <span>Upcoming Interviews ({upcoming.length})</span>
                </div>
                {upcoming.map((iv, i) => (
                  <div className="sp-iv-card" key={i}>
                    <div className="sp-iv-card__action">
                      {iv.interview_mode === 'online' ? (
                        <button className="sp-btn-primary" style={{ fontSize:'12px' }}>
                          Join Zoom
                        </button>
                      ) : (
                        <button className="sp-btn-ghost" style={{ fontSize:'12px' }}>
                          Campus Map
                        </button>
                      )}
                    </div>
                    <div className="sp-iv-card__company">
                      {iv.company_name} · {iv.job_title}
                    </div>
                    <div className="sp-iv-card__date">{formatDate(iv.interview_date)}</div>
                    <div className="sp-iv-card__time">
                      Round 1 — {iv.interview_mode === 'online' ? 'Technical' : 'Campus Interview'}
                    </div>
                    <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
                      <span className={`sp-mode-badge sp-mode--${iv.interview_mode}`}>
                        {iv.interview_mode === 'online' ? '🌐 Online' : '📍 Offline'}
                      </span>
                      {iv.location_or_link && (
                        <span style={{ fontSize:'12px', color:'#6B7280' }}>
                          {iv.interview_mode === 'online' ? '🔗' : '📍'} {iv.location_or_link}
                        </span>
                      )}
                    </div>
                    {iv.notes && (
                      <div style={{ fontSize:'12px', color:'#6B7280', background:'#F9FAFB', borderRadius:'6px', padding:'8px 10px' }}>
                        📋 <strong>Notes:</strong> {iv.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <div className="sp-iv-section-title">
                  <span>✅</span>
                  <span>Completed</span>
                </div>
                {completed.map((iv, i) => (
                  <div className="sp-iv-card" key={i} style={{ opacity:0.75 }}>
                    <div className="sp-iv-card__company">{iv.company_name} · {iv.job_title}</div>
                    <div className="sp-iv-card__date" style={{ fontSize:'15px' }}>{formatDate(iv.interview_date)} · All Rounds</div>
                    <div style={{ display:'flex', gap:'12px', marginTop:'8px', flexWrap:'wrap' }}>
                      {['Round 1 ✓', 'Round 2 ✓', 'HR ✓', 'Offer Extended 🎉'].map(step => (
                        <span key={step} style={{ fontSize:'11px', color:'#16A34A', fontWeight:600 }}>{step}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); refreshCount(); }}
      />
    </div>
  );
};

export default MyInterviews;
