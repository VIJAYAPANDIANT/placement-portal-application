import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './company.css';

const DriveApplicants = () => {
  const { id: driveId } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [applicants, setApplicants] = useState([]);
  const [drivesList, setDrivesList] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(driveId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [time, setTime] = useState(new Date());

  // Interview Scheduler State
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewMode, setInterviewMode] = useState('Online');
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Candidate Profile Modal
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [profileModalData, setProfileModalData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchCompanyDrives();
  }, []);

  useEffect(() => {
    if (selectedDriveId) {
      fetchApplicants(selectedDriveId);
    }
  }, [selectedDriveId]);

  const fetchCompanyDrives = async () => {
    try {
      const res = await api.get('/company/drives');
      setDrivesList(res.data);
      if (!selectedDriveId && res.data.length > 0) {
        setSelectedDriveId(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching drives:', err);
    }
  };

  const fetchApplicants = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/company/drives/${id}/applicants`);
      setApplicants(res.data || []);
    } catch (err) {
      console.error('Error fetching drive applicants:', err);
      setError(err.response?.data?.error || 'Failed to fetch applicants.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      setAlert(null);
      await api.put(`/company/applications/${appId}/status`, { status: newStatus });
      setAlert({ type: 'success', message: `Applicant status updated to ${newStatus}!` });
      fetchApplicants(selectedDriveId);
    } catch (err) {
      console.error('Error updating status:', err);
      setAlert({ type: 'danger', message: err.response?.data?.error || 'Failed to update status.' });
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedDriveId) return;
    try {
      setScheduling(true);
      setAlert(null);
      await api.post(`/company/drives/${selectedDriveId}/interviews`, {
        interview_date: interviewDate,
        interview_mode: interviewMode.toLowerCase(),
        location_or_link: meetingLink,
        notes: `Round 1 Interview - scheduled by HR`,
      });
      setAlert({ type: 'success', message: 'Interviews scheduled for all shortlisted candidates!' });
      setInterviewDate('');
      setMeetingLink('');
    } catch (err) {
      console.error('Error scheduling interview:', err);
      setAlert({ type: 'danger', message: err.response?.data?.error || 'Failed to schedule interviews.' });
    } finally {
      setScheduling(false);
    }
  };

  const handleOpenProfileModal = async (studentId) => {
    setSelectedStudentId(studentId);
    setProfileModalData(null);
    try {
      setProfileLoading(true);
      const res = await api.get(`/company/students/${studentId}/profile`);
      setProfileModalData(res.data);
    } catch (err) {
      console.error('Error fetching student profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const filteredApplicants = applicants.filter((a) => {
    const query = searchQuery.toLowerCase();
    return (
      (a.student_name || '').toLowerCase().includes(query) ||
      (a.roll_number || '').toLowerCase().includes(query) ||
      (a.branch || '').toLowerCase().includes(query)
    );
  });

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="cp-page">
      {/* ── TOPBAR ── */}
      <div className="cp-topbar">
        <span className="cp-topbar__title">Applicants</span>
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
          <button className="cp-btn-primary" onClick={() => navigate('/company/drives')}>Manage Drives</button>
        </div>
      </div>

      <div className="cp-content">
        <div className="cp-breadcrumb">
          <Link to="/company">Home</Link>
          <span className="cp-breadcrumb__sep">›</span>
          <span>Applicants</span>
        </div>

        {alert && (
          <div style={{ background: alert.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${alert.type === 'success' ? '#BBF7D0' : '#FECDD3'}`, borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', fontSize: '13px', color: alert.type === 'success' ? '#15803D' : '#B91C1C' }}>
            {alert.message}
          </div>
        )}

        {/* Filter & Controls Card */}
        <div className="cp-panel" style={{ marginBottom: '20px' }}>
          <div className="cp-panel__body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>SELECT PLACEMENT DRIVE</label>
                <select
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA', fontWeight: 600 }}
                >
                  {drivesList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.job_title} ({d.applicant_count || 0} applied)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>SEARCH CANDIDATE</label>
                <input
                  type="text"
                  placeholder="Search applicant name, roll number, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Applicants Directory Panel */}
        <div className="cp-panel" style={{ marginBottom: '20px' }}>
          <div className="cp-panel__header">
            <span className="cp-panel__title">Applicants Directory</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
              {filteredApplicants.length} Candidates Found
            </span>
          </div>

          <div className="cp-panel__body cp-panel__body--p0">
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>⏳ Loading applicants...</div>
            ) : filteredApplicants.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No applicants matched the filters</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="cp-table">
                  <thead>
                    <tr>
                      <th>STUDENT</th>
                      <th>BRANCH</th>
                      <th>CGPA</th>
                      <th>APPLIED</th>
                      <th>STATUS</th>
                      <th style={{ textAlign: 'right' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplicants.map((app) => (
                      <tr key={app.application_id}>
                        <td>
                          <span
                            className="cp-table__name"
                            style={{ cursor: 'pointer', color: '#0F766E' }}
                            onClick={() => handleOpenProfileModal(app.student_id)}
                          >
                            {app.student_name}
                          </span>
                          <span className="cp-table__sub">{app.roll_number}</span>
                        </td>
                        <td>
                          <span className="sp-tag sp-tag--branch">{app.branch}</span>
                        </td>
                        <td>
                          <strong style={{ color: '#111827' }}>{app.cgpa}</strong>
                        </td>
                        <td style={{ color: '#6B7280' }}>{app.applied_on}</td>
                        <td>
                          <span className={`cp-status cp-status--${app.application_status?.toLowerCase()}`}>
                            {app.application_status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="cp-btn-ghost"
                              style={{ fontSize: '11px', height: '26px', padding: '0 8px' }}
                              onClick={() => handleUpdateStatus(app.application_id, 'shortlisted')}
                              disabled={app.application_status === 'shortlisted'}
                            >
                              Shortlist
                            </button>
                            <button
                              className="cp-btn-primary"
                              style={{ fontSize: '11px', height: '26px', padding: '0 8px' }}
                              onClick={() => handleUpdateStatus(app.application_id, 'selected')}
                              disabled={app.application_status === 'selected'}
                            >
                              Select
                            </button>
                            <button
                              className="cp-btn-ghost"
                              style={{ fontSize: '11px', height: '26px', padding: '0 8px', border: '1px solid #FEE2E2', color: '#DC2626' }}
                              onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                              disabled={app.application_status === 'rejected'}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Interview Scheduler Block */}
        <div className="cp-panel">
          <div className="cp-panel__header">
            <span className="cp-panel__title">Schedule Interviews</span>
          </div>
          <div className="cp-panel__body">
            <form onSubmit={handleScheduleInterview} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>INTERVIEW DATE & TIME</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>INTERVIEW MODE</label>
                <select
                  value={interviewMode}
                  onChange={(e) => setInterviewMode(e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                >
                  <option value="Online">Online</option>
                  <option value="In-Person">In-Person</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>MEETING LINK / VENUE</label>
                <input
                  type="text"
                  placeholder="Zoom link or Conference Room..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="cp-btn-primary" style={{ height: '36px', padding: '0 24px' }} disabled={scheduling}>
                  {scheduling ? 'Scheduling...' : 'Schedule Interview for Shortlisted Candidates'}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Candidate Profile Modal */}
      {selectedStudentId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
          <div style={{ background: '#fff', width: '560px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Student Profile Preview</span>
              <button style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280' }} onClick={() => setSelectedStudentId(null)}>×</button>
            </div>
            <div style={{ padding: '20px', maxHeight: '480px', overflowY: 'auto' }}>
              {profileLoading ? (
                <div>Loading profile...</div>
              ) : profileModalData ? (
                <div>
                  <h4 style={{ fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{profileModalData.name}</h4>
                  <p style={{ color: '#6B7280', fontSize: '13px' }}>{profileModalData.roll_number} · {profileModalData.branch}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '20px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>CGPA</span>
                      <strong style={{ display: 'block', fontSize: '16px', color: '#0F766E' }}>{profileModalData.cgpa || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>Graduation Year</span>
                      <strong style={{ display: 'block', fontSize: '16px' }}>{profileModalData.graduation_year || 'N/A'}</strong>
                    </div>
                  </div>

                  {profileModalData.categorized_skills && Object.keys(profileModalData.categorized_skills).length > 0 ? (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>🤖 AI Extracted Skills</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {Object.entries(profileModalData.categorized_skills).map(([category, items]) => {
                          if (!items || items.length === 0) return null;
                          return (
                            <div key={category} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              <span style={{ fontSize: '9px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', width: '130px', flexShrink: 0, marginTop: '4px' }}>
                                {category}
                              </span>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {items.map(s => (
                                  <span key={s} className="badge bg-info-subtle text-info fw-semibold border border-info-subtle px-2 py-1 fs-9 rounded-pill" style={{ fontSize: '10px' }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '20px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Skills</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {profileModalData.skills?.map(s => (
                          <span key={s} className="sp-skill-chip" style={{ margin: 0 }}>{s}</span>
                        )) || <span style={{ color: '#9CA3AF' }}>No skills added</span>}
                      </div>
                    </div>
                  )}

                  {/* Bio Section */}
                  {profileModalData.bio && (
                    <div style={{ marginTop: '20px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Bio / About</span>
                      <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: 1.4 }}>{profileModalData.bio}</p>
                    </div>
                  )}

                  {/* Professional Profiles */}
                  <div style={{ marginTop: '20px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Professional Profiles</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {profileModalData.github_url && (
                        <a
                          href={profileModalData.github_url.startsWith('http') ? profileModalData.github_url : `https://${profileModalData.github_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="cp-btn-ghost"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', borderColor: '#4B5563', color: '#1F2937' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                          GitHub
                        </a>
                      )}
                      {profileModalData.linkedin_url && (
                        <a
                          href={profileModalData.linkedin_url.startsWith('http') ? profileModalData.linkedin_url : `https://${profileModalData.linkedin_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="cp-btn-ghost"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', borderColor: '#2563EB', color: '#1D4ED8' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                          LinkedIn
                        </a>
                      )}
                      {profileModalData.portfolio_url && (
                        <a
                          href={profileModalData.portfolio_url.startsWith('http') ? profileModalData.portfolio_url : `https://${profileModalData.portfolio_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="cp-btn-ghost"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', borderColor: '#0D9488', color: '#0F766E' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                          Portfolio
                        </a>
                      )}
                      {!profileModalData.github_url && !profileModalData.linkedin_url && !profileModalData.portfolio_url && (
                        <span style={{ color: '#9CA3AF', fontSize: '13px' }}>No profile links linked yet</span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Documents</span>
                    {profileModalData.resume_url ? (
                      <a
                        href={`http://localhost:5000/${profileModalData.resume_url}`}
                        target="_blank" rel="noreferrer"
                        className="cp-btn-ghost"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
                      >
                        📄 Download Resume PDF
                      </a>
                    ) : (
                      <span style={{ color: '#9CA3AF', fontSize: '13px' }}>No resume uploaded</span>
                    )}
                  </div>
                </div>
              ) : (
                <div>No profile data found.</div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid #E5E7EB', background: '#FAFAFA' }}>
              <button className="cp-btn-ghost" onClick={() => setSelectedStudentId(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); refreshCount(); }}
      />
    </div>
  );
};

export default DriveApplicants;
