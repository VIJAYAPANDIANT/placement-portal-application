import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  // Bio state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [bioSaving, setBioSaving] = useState(false);

  // Skills state
  const [skillsList, setSkillsList] = useState([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [skillsSaving, setSkillsSaving] = useState(false);

  // Resume state
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);

  // Links state
  const [links, setLinks] = useState({ linkedin_url: '', github_url: '', portfolio_url: '' });
  const [linksSaving, setLinksSaving] = useState(false);
  const [linksSavedSuccess, setLinksSavedSuccess] = useState(false);
  const [linkErrors, setLinkErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/student/profile');
      setProfile(res.data);
      setBioInput(res.data.bio || '');
      setSkillsList(res.data.skills || []);
      setLinks({
        linkedin_url: res.data.linkedin_url || '',
        github_url: res.data.github_url || '',
        portfolio_url: res.data.portfolio_url || ''
      });
    } catch (err) {
      console.error('Error fetching student profile:', err);
      setError(err.response?.data?.error || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      setBioSaving(true);
      await api.put('/student/profile', { bio: bioInput });
      setIsEditingBio(false);
      fetchProfile();
    } catch (err) {
      console.error('Error updating bio:', err);
      setAlert({ type: 'danger', message: 'Failed to update bio.' });
    } finally {
      setBioSaving(false);
    }
  };

  const handleUpdateSkills = async (updatedSkills) => {
    try {
      setSkillsSaving(true);
      await api.put('/student/profile', { skills: updatedSkills });
      fetchProfile();
    } catch (err) {
      console.error('Error updating skills:', err);
      setAlert({ type: 'danger', message: 'Failed to update skills.' });
    } finally {
      setSkillsSaving(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (skillsList.length >= 15) return;
    if (skillsList.includes(trimmed)) {
      setNewSkillInput('');
      setShowAddSkill(false);
      return;
    }

    const nextSkills = [...skillsList, trimmed];
    setSkillsList(nextSkills);
    setNewSkillInput('');
    setShowAddSkill(false);
    handleUpdateSkills(nextSkills);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const nextSkills = skillsList.filter(s => s !== skillToRemove);
    setSkillsList(nextSkills);
    handleUpdateSkills(nextSkills);
  };

  const handleResumeFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setAlert({ type: 'danger', message: 'Only PDF files allowed' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAlert({ type: 'danger', message: 'Resume size must be less than 5MB' });
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      setUploadingResume(true);
      setAlert(null);
      await api.post('/student/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAlert({ type: 'success', message: 'Resume uploaded successfully!' });
      fetchProfile();
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      console.error('Error uploading resume:', err);
      setAlert({ type: 'danger', message: err.response?.data?.error || 'Failed to upload resume.' });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSaveLinks = async () => {
    const errors = {};
    ['linkedin_url', 'github_url', 'portfolio_url'].forEach(key => {
      const val = links[key].trim();
      if (val && !val.startsWith('https://')) {
        errors[key] = 'URL must start with https://';
      }
    });

    if (Object.keys(errors).length > 0) {
      setLinkErrors(errors);
      return;
    }

    setLinkErrors({});
    try {
      setLinksSaving(true);
      await api.put('/student/profile', links);
      setLinksSavedSuccess(true);
      fetchProfile();
      setTimeout(() => setLinksSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Error updating links:', err);
      setAlert({ type: 'danger', message: 'Failed to update links.' });
    } finally {
      setLinksSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Retrieving student profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="panel-card p-4 text-center border-danger">
        <p className="text-danger mb-0">{error || 'Profile not found'}</p>
      </div>
    );
  }

  const completeness = profile.profile_completeness || 0;
  let progressBarColor = '#dc2626'; // red
  if (completeness >= 75) progressBarColor = '#16a34a'; // green
  else if (completeness >= 50) progressBarColor = '#d97706'; // yellow

  const getMissingHint = () => {
    if (!profile.resume_url) return 'Upload your resume to improve your profile';
    if (!profile.linkedin_url) return 'Add your LinkedIn profile link';
    if (!profile.skills || profile.skills.length === 0) return 'Add your technical skills';
    if (!profile.bio) return 'Write a short bio to introduce yourself';
    return 'Your profile is looking great and ready for companies!';
  };

  const todayStr = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Section 1: Profile Completeness Bar */}
      <div className="panel-card p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: '12px' }}>
          <span className="fw-bold text-muted">PROFILE COMPLETENESS</span>
          <span className="fw-bold" style={{ color: progressBarColor, fontSize: '13px' }}>{completeness}% Complete</span>
        </div>
        <div className="progress mb-2" style={{ height: '8px', background: 'var(--table-hover)', borderRadius: '4px' }}>
          <div 
            className="progress-bar" 
            role="progressbar" 
            style={{ width: `${completeness}%`, backgroundColor: progressBarColor, borderRadius: '4px', transition: 'width 0.4s' }}
          ></div>
        </div>
        <div className="text-muted small" style={{ fontSize: '11px' }}>
          💡 <strong>Tip:</strong> {getMissingHint()}
        </div>
      </div>

      <div className="row g-3">
        {/* LEFT COLUMN (col-md-8) */}
        <div className="col-md-8">
          {/* Section 2: Academic Information Card */}
          <div className="panel-card">
            <div className="panel-header">
              <h5 className="panel-title">Academic Information</h5>
              <span className="status-pill pill-info">Verified Registry</span>
            </div>
            <div className="panel-body">
              <div className="row g-3" style={{ fontSize: '13px' }}>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>FULL NAME</span>
                  <strong style={{ color: 'var(--bs-body-color)' }}>{profile.name}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>ROLL NUMBER</span>
                  <strong style={{ color: 'var(--bs-body-color)' }}>{profile.roll_number}</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>COLLEGE EMAIL</span>
                  <span style={{ color: 'var(--bs-body-color)' }}>{profile.email}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>ACADEMIC BRANCH</span>
                  <span className="status-pill pill-purple">{profile.branch}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>CUMULATIVE CGPA</span>
                  <strong className="text-success" style={{ fontSize: '15px' }}>{profile.cgpa} / 10.0</strong>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px' }}>GRADUATION YEAR</span>
                  <strong style={{ color: 'var(--bs-body-color)' }}>{profile.graduation_year}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: About Me / Bio Card */}
          <div className="panel-card">
            <div className="panel-header">
              <h5 className="panel-title">About Me</h5>
              {!isEditingBio && (
                <button 
                  className="btn btn-sm btn-outline-secondary py-1 px-2"
                  style={{ borderRadius: '6px', fontSize: '11px' }}
                  onClick={() => setIsEditingBio(true)}
                >
                  ✏️ Edit Bio
                </button>
              )}
            </div>
            <div className="panel-body">
              {isEditingBio ? (
                <div>
                  <textarea
                    className="form-control mb-2"
                    rows="4"
                    maxLength={300}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Write a short personal statement or summary of career interests..."
                  ></textarea>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted" style={{ fontSize: '11px' }}>{bioInput.length} / 300 characters</span>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline-secondary py-1 px-3"
                        style={{ borderRadius: '6px', fontSize: '12px' }}
                        onClick={() => { setIsEditingBio(false); setBioInput(profile.bio || ''); }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn btn-sm btn-primary py-1 px-3 fw-bold"
                        style={{ borderRadius: '6px', fontSize: '12px' }}
                        onClick={handleSaveBio}
                        disabled={bioSaving}
                      >
                        {bioSaving ? 'Saving...' : 'Save Bio'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mb-0" style={{ fontSize: '13px', color: profile.bio ? 'var(--bs-body-color)' : 'var(--muted)', whiteSpace: 'pre-line' }}>
                  {profile.bio || 'Add a short bio to introduce yourself to potential recruiters...'}
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Skills Card */}
          <div className="panel-card">
            <div className="panel-header">
              <h5 className="panel-title">Technical Skills</h5>
              {!showAddSkill && skillsList.length < 15 && (
                <button 
                  className="btn btn-sm btn-outline-primary py-1 px-2"
                  style={{ borderRadius: '6px', fontSize: '11px' }}
                  onClick={() => setShowAddSkill(true)}
                >
                  + Add Skill
                </button>
              )}
            </div>
            <div className="panel-body">
              {skillsList.length >= 15 && (
                <div className="alert alert-warning py-1 px-2 mb-3 small" style={{ fontSize: '11px' }}>
                  ⚠️ Maximum 15 skills allowed
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mb-2">
                {skillsList.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="badge d-inline-flex align-items-center gap-1 py-2 px-3"
                    style={{ 
                      background: 'var(--sidebar-active-bg)', 
                      color: 'var(--sidebar-active-color)',
                      border: '1px solid var(--sidebar-active-border)',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    {skill}
                    <button 
                      type="button" 
                      className="btn-close ms-1"
                      style={{ fontSize: '9px', filter: 'none' }}
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label="Remove"
                    ></button>
                  </span>
                ))}

                {skillsList.length === 0 && !showAddSkill && (
                  <span className="text-muted small">No skills added yet. Click "+ Add Skill" above to list your tech stack.</span>
                )}
              </div>

              {showAddSkill && (
                <div className="d-flex gap-2 mt-3" style={{ maxWidth: '320px' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="e.g. Python, React, SQL"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    autoFocus
                  />
                  <button className="btn btn-sm btn-primary fw-bold px-3" onClick={handleAddSkill} disabled={skillsSaving}>
                    Add
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowAddSkill(false)}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (col-md-4) */}
        <div className="col-md-4">
          {/* Section 5: Resume Card */}
          <div className="panel-card">
            <div className="panel-header">
              <h5 className="panel-title">Resume</h5>
              <span className="status-pill pill-info">PDF</span>
            </div>
            <div className="panel-body">
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".pdf"
                className="d-none"
                onChange={handleResumeFileSelect}
              />

              {profile.resume_url ? (
                <div className="p-3 border rounded text-center" style={{ background: 'var(--table-hover)', borderColor: 'var(--card-border)' }}>
                  <div style={{ fontSize: '2.5rem' }}>📄</div>
                  <h6 className="fw-bold mt-2 mb-1 text-truncate" style={{ fontSize: '13px' }}>{profile.name.replace(/\s+/g, '_')}_Resume.pdf</h6>
                  <small className="text-muted d-block mb-3" style={{ fontSize: '11px' }}>Uploaded: {todayStr}</small>
                  
                  <div className="d-flex gap-2 justify-content-center">
                    <button 
                      className="btn btn-sm btn-outline-primary fw-bold px-3"
                      style={{ borderRadius: '6px', fontSize: '12px' }}
                      onClick={() => {
                        const baseUrl = api.defaults.baseURL.replace(/\/api$/, '');
                        window.open(`${baseUrl}/${profile.resume_url}`, '_blank');
                      }}
                    >
                      👁️ Preview
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary fw-bold px-3"
                      style={{ borderRadius: '6px', fontSize: '12px' }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingResume}
                    >
                      {uploadingResume ? 'Uploading...' : '🔄 Replace'}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="p-4 border border-dashed rounded text-center cursor-pointer"
                  style={{ borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--input-border)', background: 'var(--table-hover)', cursor: 'pointer' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ fontSize: '2.5rem' }}>📤</div>
                  <h6 className="fw-bold mt-2 mb-1" style={{ fontSize: '13px' }}>Upload your resume</h6>
                  <small className="text-muted d-block mb-3" style={{ fontSize: '11px' }}>PDF files only, max 5MB</small>
                  <button className="btn btn-sm btn-primary fw-bold px-3" style={{ borderRadius: '6px', fontSize: '12px' }} disabled={uploadingResume}>
                    {uploadingResume ? 'Uploading...' : 'Select PDF File'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Links Card */}
          <div className="panel-card">
            <div className="panel-header">
              <h5 className="panel-title">Professional Links</h5>
              <button 
                className={`btn btn-sm ${linksSavedSuccess ? 'btn-success' : 'btn-primary'} fw-bold px-3`}
                style={{ borderRadius: '6px', fontSize: '12px' }}
                onClick={handleSaveLinks}
                disabled={linksSaving}
              >
                {linksSaving ? 'Saving...' : linksSavedSuccess ? 'Saved ✓' : 'Save Links'}
              </button>
            </div>
            <div className="panel-body">
              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '11px' }}>🔗 LINKEDIN PROFILE</label>
                <input 
                  type="text"
                  className={`form-control ${linkErrors.linkedin_url ? 'is-invalid' : ''}`}
                  placeholder="https://linkedin.com/in/username"
                  value={links.linkedin_url}
                  onChange={(e) => setLinks(prev => ({ ...prev, linkedin_url: e.target.value }))}
                />
                {linkErrors.linkedin_url && <div className="invalid-feedback">{linkErrors.linkedin_url}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold" style={{ fontSize: '11px' }}>🐙 GITHUB PROFILE</label>
                <input 
                  type="text"
                  className={`form-control ${linkErrors.github_url ? 'is-invalid' : ''}`}
                  placeholder="https://github.com/username"
                  value={links.github_url}
                  onChange={(e) => setLinks(prev => ({ ...prev, github_url: e.target.value }))}
                />
                {linkErrors.github_url && <div className="invalid-feedback">{linkErrors.github_url}</div>}
              </div>

              <div className="mb-2">
                <label className="form-label fw-bold" style={{ fontSize: '11px' }}>🌐 PORTFOLIO WEBSITE</label>
                <input 
                  type="text"
                  className={`form-control ${linkErrors.portfolio_url ? 'is-invalid' : ''}`}
                  placeholder="https://yoursite.com"
                  value={links.portfolio_url}
                  onChange={(e) => setLinks(prev => ({ ...prev, portfolio_url: e.target.value }))}
                />
                {linkErrors.portfolio_url && <div className="invalid-feedback">{linkErrors.portfolio_url}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
