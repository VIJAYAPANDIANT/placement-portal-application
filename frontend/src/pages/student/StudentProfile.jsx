import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './student.css';

const StudentProfile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [alert, setAlert]               = useState(null);
  const [time, setTime]                 = useState(new Date());

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();

  // Skills
  const [skillsList, setSkillsList]     = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillsSaving, setSkillsSaving] = useState(false);

  // Resume
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);

  // Links
  const [links, setLinks]               = useState({ linkedin_url:'', github_url:'', portfolio_url:'' });
  const [linksSaving, setLinksSaving]   = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/profile');
      setProfile(res.data);
      setSkillsList(res.data.skills || []);
      setLinks({
        linkedin_url:   res.data.linkedin_url   || '',
        github_url:     res.data.github_url     || '',
        portfolio_url:  res.data.portfolio_url  || '',
      });
    } catch (err) {
      setAlert({ type:'danger', message:'Failed to load profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSkills = async (updated) => {
    try {
      setSkillsSaving(true);
      await api.put('/student/profile', { skills: updated });
      fetchProfile();
    } catch { setAlert({ type:'danger', message:'Failed to update skills.' }); }
    finally { setSkillsSaving(false); }
  };

  const handleAddSkill = () => {
    const s = newSkillInput.trim();
    if (!s || skillsList.includes(s)) return;
    const updated = [...skillsList, s];
    setSkillsList(updated);
    handleUpdateSkills(updated);
    setNewSkillInput('');
    setShowAddSkill(false);
  };

  const handleRemoveSkill = (skill) => {
    const updated = skillsList.filter(s => s !== skill);
    setSkillsList(updated);
    handleUpdateSkills(updated);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.pdf')) { setAlert({ type:'danger', message:'Only PDF files are allowed.' }); return; }
    try {
      setUploadingResume(true);
      const fd = new FormData();
      fd.append('resume', file);
      await api.post('/student/upload-resume', fd, { headers: { 'Content-Type':'multipart/form-data' } });
      setAlert({ type:'success', message:'Resume uploaded successfully!' });
      fetchProfile();
    } catch { setAlert({ type:'danger', message:'Failed to upload resume.' }); }
    finally { setUploadingResume(false); }
  };

  const handleSaveLinks = async () => {
    try {
      setLinksSaving(true);
      await api.put('/student/profile', links);
      setAlert({ type:'success', message:'Links saved!' });
      fetchProfile();
    } catch { setAlert({ type:'danger', message:'Failed to save links.' }); }
    finally { setLinksSaving(false); }
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });

  if (loading) return (
    <div className="sp-page">
      <div className="sp-content" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
        <div style={{ textAlign:'center', color:'#6B7280' }}>
          <div style={{ fontSize:'32px', marginBottom:'12px' }}>⏳</div>Loading profile…
        </div>
      </div>
    </div>
  );

  return (
    <div className="sp-page">
      {/* ── TOPBAR ── */}
      <div className="sp-topbar">
        <span className="sp-topbar__title">My Profile</span>
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
          <button className="sp-btn-primary" onClick={handleSaveLinks} disabled={linksSaving}>
            {linksSaving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="sp-content">
        <div className="sp-breadcrumb">
          <Link to="/student">Home</Link>
          <span className="sp-breadcrumb__sep">›</span>
          <span>My Profile</span>
        </div>

        {/* Alert */}
        {alert && (
          <div style={{ background: alert.type === 'success' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${alert.type === 'success' ? '#BBF7D0' : '#FECDD3'}`, borderRadius:'8px', padding:'10px 16px', marginBottom:'16px', fontSize:'13px', color: alert.type === 'success' ? '#15803D' : '#B91C1C', display:'flex', justifyContent:'space-between' }}>
            {alert.message}
            <button style={{ background:'none', border:'none', cursor:'pointer', color:'inherit' }} onClick={() => setAlert(null)}>×</button>
          </div>
        )}

        {/* Profile completeness bar */}
        <div className="sp-profile-bar" style={{ marginBottom:'20px' }}>
          <span className="sp-profile-bar__label">Profile Completeness</span>
          <div className="sp-profile-bar__track">
            <div className="sp-profile-bar__fill" style={{ width: `${profile?.profile_completeness || 0}%` }} />
          </div>
          <span className="sp-profile-bar__pct">{profile?.profile_completeness || 0}%</span>
          {profile?.profile_completeness < 100 && (
            <span style={{ fontSize:'12px', color:'#6B7280' }}>Add skills &amp; LinkedIn to reach 100%</span>
          )}
        </div>

        {/* 2-col grid */}
        <div className="sp-profile-grid">
          {/* LEFT */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Academic Information */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Academic Information</span>
                <button className="sp-panel__link" style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>Edit</button>
              </div>
              <div className="sp-panel__body">
                {[
                  { label:'FULL NAME',       value: profile?.name },
                  { label:'ROLL NUMBER',     value: profile?.roll_number },
                  { label:'EMAIL',           value: profile?.email },
                  { label:'BRANCH',          value: profile?.branch },
                  { label:'CGPA',            value: profile?.cgpa ? <span style={{ color:'#0F766E', fontWeight:700 }}>{profile.cgpa} / 10</span> : '—' },
                  { label:'GRADUATION YEAR', value: profile?.graduation_year },
                ].map(row => (
                  <div className="sp-field-row" key={row.label}>
                    <span className="sp-field-label">{row.label}</span>
                    <span className="sp-field-value">{row.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Skills</span>
                <button
                  style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'2px 10px', cursor:'pointer', fontSize:'12px', color:'#374151', fontFamily:'inherit' }}
                  onClick={() => setShowAddSkill(!showAddSkill)}
                >
                  + Add
                </button>
              </div>
              <div className="sp-panel__body">
                <div style={{ display:'flex', flexWrap:'wrap' }}>
                  {skillsList.map(skill => (
                    <span className="sp-skill-chip" key={skill}>
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:'0', fontSize:'12px', color:'#6B7280', lineHeight:1 }}
                      >×</button>
                    </span>
                  ))}
                  {skillsList.length === 0 && <span style={{ fontSize:'13px', color:'#9CA3AF' }}>No skills added yet</span>}
                </div>
                {showAddSkill && (
                  <div style={{ display:'flex', gap:'8px', marginTop:'12px' }}>
                    <input
                      value={newSkillInput}
                      onChange={e => setNewSkillInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                      placeholder="e.g. React, Python…"
                      style={{ flex:1, height:'32px', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'0 10px', fontSize:'13px', fontFamily:'inherit', outline:'none' }}
                    />
                    <button className="sp-btn-primary" style={{ height:'32px', padding:'0 12px', fontSize:'12px' }} onClick={handleAddSkill} disabled={skillsSaving}>
                      {skillsSaving ? '…' : 'Add'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Resume */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Resume</span>
              </div>
              <div className="sp-panel__body">
                {profile?.resume_url ? (
                  <>
                    <div className="sp-resume-box">
                      <div className="sp-resume-icon">📄</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:600, color:'#111827' }}>{profile.name}_Resume.pdf</div>
                        <div style={{ fontSize:'11px', color:'#6B7280' }}>Uploaded</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <a
                        href={`http://localhost:5000/${profile.resume_url}`}
                        target="_blank" rel="noreferrer"
                        className="sp-btn-ghost"
                        style={{ flex:1, textAlign:'center', textDecoration:'none', display:'inline-flex', alignItems:'center', justifyContent:'center', height:'32px', fontSize:'12px' }}
                      >
                        Preview
                      </a>
                      <button className="sp-btn-ghost" style={{ flex:1, fontSize:'12px', height:'32px' }} onClick={() => fileInputRef.current?.click()}>
                        Replace
                      </button>
                      <button className="sp-btn-primary" style={{ flex:1, fontSize:'12px', height:'32px' }}>
                        ATS →
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign:'center', padding:'24px 0' }}>
                    <div style={{ fontSize:'28px', marginBottom:'8px' }}>📋</div>
                    <div style={{ fontSize:'13px', color:'#6B7280', marginBottom:'12px' }}>No resume uploaded</div>
                    <button className="sp-btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploadingResume}>
                      {uploadingResume ? 'Uploading…' : 'Upload PDF'}
                    </button>
                  </div>
                )}
                <input type="file" accept=".pdf" ref={fileInputRef} style={{ display:'none' }} onChange={handleResumeUpload} />
              </div>
            </div>

            {/* Links */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Links</span>
                <button className="sp-panel__link" style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }} onClick={handleSaveLinks}>
                  {linksSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
              <div className="sp-panel__body" style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {[
                  { key:'linkedin_url',  label:'LINKEDIN',  placeholder:'https://linkedin.com/in/yourname' },
                  { key:'github_url',    label:'GITHUB',    placeholder:'https://github.com/yourusername' },
                  { key:'portfolio_url', label:'PORTFOLIO', placeholder:'https://' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.6px', color:'#6B7280', display:'block', marginBottom:'4px' }}>
                      {label}
                    </label>
                    <input
                      value={links[key]}
                      onChange={e => setLinks(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width:'100%', height:'34px', border:'1px solid #E5E7EB', borderRadius:'6px', padding:'0 10px', fontSize:'13px', fontFamily:'inherit', outline:'none', background:'#FAFAFA' }}
                    />
                  </div>
                ))}
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

export default StudentProfile;
