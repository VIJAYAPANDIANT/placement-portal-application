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
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Retrieving student profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="card border-danger shadow-sm p-4 text-center fade-in">
        <p className="text-danger fw-semibold mb-0"><i className="bi bi-exclamation-octagon-fill me-2"></i>{error || 'Profile not found'}</p>
      </div>
    );
  }

  const completeness = profile.profile_completeness || 0;
  let progressBarColor = 'var(--bs-danger)';
  let progressBgColor = 'rgba(220, 53, 69, 0.2)';
  if (completeness >= 75) {
    progressBarColor = 'var(--bs-success)';
    progressBgColor = 'rgba(25, 135, 84, 0.2)';
  } else if (completeness >= 50) {
    progressBarColor = 'var(--bs-warning)';
    progressBgColor = 'rgba(255, 193, 7, 0.2)';
  }

  const getMissingHint = () => {
    if (!profile.resume_url) return 'Upload your resume to improve your profile';
    if (!profile.linkedin_url) return 'Add your LinkedIn profile link';
    if (!profile.skills || profile.skills.length === 0) return 'Add your technical skills';
    if (!profile.bio) return 'Write a short bio to introduce yourself';
    return 'Your profile is looking great and ready for companies!';
  };

  const todayStr = new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Student Profile</h4>
        <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Manage your personal details, academic records, and resume for recruiters.</p>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4 shadow-sm`} role="alert">
          <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Section 1: Profile Completeness Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
              <i className="bi bi-shield-check text-primary"></i>Profile Completeness
            </h6>
            <span className="badge px-3 py-2 fs-6" style={{ backgroundColor: progressBgColor, color: progressBarColor }}>
              {completeness}% Complete
            </span>
          </div>
          <div className="progress mb-3" style={{ height: '10px', borderRadius: '5px' }}>
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated" 
              role="progressbar" 
              style={{ width: `${completeness}%`, backgroundColor: progressBarColor, borderRadius: '5px', transition: 'width 0.4s' }}
            ></div>
          </div>
          <div className="text-muted small fw-medium bg-light p-2 px-3 rounded d-inline-block">
            <i className="bi bi-lightbulb-fill text-warning me-2"></i><strong>Tip:</strong> {getMissingHint()}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN (col-lg-8) */}
        <div className="col-lg-8">
          
          {/* Section 2: Academic Information Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Academic Information</h5>
              <span className="badge badge-soft-primary"><i className="bi bi-patch-check-fill me-1"></i>Verified</span>
            </div>
            <div className="card-body p-4">
              <div className="row g-4">
                <div className="col-sm-6">
                  <span className="text-muted text-uppercase fw-semibold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Full Name</span>
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }}>
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <strong className="text-dark fs-6">{profile.name}</strong>
                  </div>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted text-uppercase fw-semibold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Roll Number</span>
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }}>
                      <i className="bi bi-hash"></i>
                    </div>
                    <strong className="text-dark fs-6">{profile.roll_number}</strong>
                  </div>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted text-uppercase fw-semibold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>College Email</span>
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }}>
                      <i className="bi bi-envelope-fill"></i>
                    </div>
                    <span className="text-dark fw-medium">{profile.email}</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted text-uppercase fw-semibold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Academic Branch</span>
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-purple bg-opacity-10 text-purple rounded-circle d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }}>
                      <i className="bi bi-journal-bookmark-fill"></i>
                    </div>
                    <span className="badge bg-purple text-white bg-opacity-75">{profile.branch}</span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted text-uppercase fw-semibold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Cumulative CGPA</span>
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }}>
                      <i className="bi bi-award-fill"></i>
                    </div>
                    <strong className="text-success fs-5">{profile.cgpa} <span className="text-muted fs-6">/ 10.0</span></strong>
                  </div>
                </div>
                <div className="col-sm-6">
                  <span className="text-muted text-uppercase fw-semibold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Graduation Year</span>
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex justify-content-center align-items-center" style={{ width: '30px', height: '30px' }}>
                      <i className="bi bi-mortarboard-fill"></i>
                    </div>
                    <strong className="text-dark fs-6">{profile.graduation_year}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: About Me / Bio Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">About Me</h5>
              {!isEditingBio && (
                <button 
                  className="btn btn-sm btn-outline-secondary rounded-pill fw-semibold px-3 shadow-sm"
                  onClick={() => setIsEditingBio(true)}
                >
                  <i className="bi bi-pencil-square me-2"></i>Edit Bio
                </button>
              )}
            </div>
            <div className="card-body p-4">
              {isEditingBio ? (
                <div>
                  <textarea
                    className="form-control mb-3"
                    rows="4"
                    maxLength={300}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="Write a short personal statement or summary of career interests..."
                    autoFocus
                  ></textarea>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small fw-medium">{bioInput.length} / 300 chars</span>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-outline-secondary rounded-pill px-4 fw-semibold shadow-sm"
                        onClick={() => { setIsEditingBio(false); setBioInput(profile.bio || ''); }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm"
                        onClick={handleSaveBio}
                        disabled={bioSaving}
                      >
                        {bioSaving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-floppy-fill me-2"></i>}
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-light p-4 rounded border border-light">
                  <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-line', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {profile.bio || (
                      <span className="text-muted fst-italic">
                        <i className="bi bi-info-circle me-2"></i>Add a short bio to introduce yourself to potential recruiters...
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Skills Card */}
          <div className="card border-0 shadow-sm mb-4 mb-lg-0">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Technical Skills</h5>
              {!showAddSkill && skillsList.length < 15 && (
                <button 
                  className="btn btn-sm btn-outline-primary rounded-pill fw-semibold px-3 shadow-sm"
                  onClick={() => setShowAddSkill(true)}
                >
                  <i className="bi bi-plus-lg me-2"></i>Add Skill
                </button>
              )}
            </div>
            <div className="card-body p-4">
              {skillsList.length >= 15 && (
                <div className="alert alert-warning py-2 px-3 mb-4 small fw-medium shadow-sm d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Maximum 15 skills allowed
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mb-2">
                {skillsList.map((skill, idx) => (
                  <span 
                    key={idx} 
                    className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 d-inline-flex align-items-center gap-1 py-2 px-3"
                    style={{ borderRadius: '20px', fontSize: '0.85rem' }}
                  >
                    {skill}
                    <button 
                      type="button" 
                      className="btn-close ms-1 shadow-none"
                      style={{ fontSize: '0.5rem', filter: 'none', opacity: 0.8 }}
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label="Remove"
                    ></button>
                  </span>
                ))}

                {skillsList.length === 0 && !showAddSkill && (
                  <div className="text-center w-100 py-3">
                    <i className="bi bi-tools text-muted fs-3 mb-2 d-block"></i>
                    <span className="text-muted fw-medium">No skills added yet. Click "Add Skill" above to list your tech stack.</span>
                  </div>
                )}
              </div>

              {showAddSkill && (
                <div className="d-flex align-items-center gap-2 mt-4 bg-light p-3 rounded border">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Python, React, SQL"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    autoFocus
                  />
                  <button className="btn btn-primary fw-bold px-4 rounded shadow-sm" onClick={handleAddSkill} disabled={skillsSaving}>
                    Add
                  </button>
                  <button className="btn btn-outline-secondary rounded shadow-sm" onClick={() => setShowAddSkill(false)}>
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (col-lg-4) */}
        <div className="col-lg-4">
          
          {/* Section 5: Resume Card */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Resume</h5>
              <span className="badge badge-soft-danger"><i className="bi bi-file-earmark-pdf-fill me-1"></i>PDF</span>
            </div>
            <div className="card-body p-4">
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".pdf"
                className="d-none"
                onChange={handleResumeFileSelect}
              />

              {profile.resume_url ? (
                <div className="p-4 border rounded text-center bg-light">
                  <div className="bg-white rounded-circle shadow-sm d-inline-flex justify-content-center align-items-center mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-file-earmark-pdf-fill text-danger fs-2"></i>
                  </div>
                  <h6 className="fw-bold text-dark mb-1 text-truncate px-2" title={`${profile.name.replace(/\s+/g, '_')}_Resume.pdf`}>
                    {profile.name.replace(/\s+/g, '_')}_Resume.pdf
                  </h6>
                  <p className="text-muted small fw-medium mb-4">Uploaded: {todayStr}</p>
                  
                  <div className="d-flex flex-column gap-2">
                    <button 
                      className="btn btn-primary fw-bold shadow-sm rounded-pill"
                      onClick={() => {
                        const baseUrl = api.defaults.baseURL.replace(/\/api$/, '');
                        window.open(`${baseUrl}/${profile.resume_url}`, '_blank');
                      }}
                    >
                      <i className="bi bi-eye-fill me-2"></i>Preview Resume
                    </button>
                    <button 
                      className="btn btn-outline-secondary fw-semibold rounded-pill"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingResume}
                    >
                      {uploadingResume ? (
                        <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</>
                      ) : (
                        <><i className="bi bi-arrow-repeat me-2"></i>Replace PDF</>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="p-5 rounded text-center cursor-pointer card-hover"
                  style={{ border: '2px dashed var(--bs-primary)', backgroundColor: 'var(--bs-primary-bg-subtle)' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="bi bi-cloud-arrow-up-fill text-primary mb-3 d-block" style={{ fontSize: '3rem' }}></i>
                  <h6 className="fw-bold text-dark mb-2">Upload your resume</h6>
                  <p className="text-secondary small fw-medium mb-4">PDF files only, max 5MB</p>
                  <button className="btn btn-primary fw-bold px-4 rounded-pill shadow-sm" disabled={uploadingResume}>
                    {uploadingResume ? (
                      <><span className="spinner-border spinner-border-sm me-2"></span>Uploading...</>
                    ) : 'Select PDF'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Links Card */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold text-dark mb-0">Professional Links</h5>
            </div>
            <div className="card-body p-4">
              <div className="mb-4">
                <label className="form-label fw-bold text-dark small d-flex align-items-center gap-2">
                  <i className="bi bi-linkedin text-primary"></i> LinkedIn Profile
                </label>
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-link-45deg text-muted"></i></span>
                  <input 
                    type="text"
                    className={`form-control border-start-0 ps-0 ${linkErrors.linkedin_url ? 'is-invalid' : ''}`}
                    placeholder="https://linkedin.com/in/username"
                    value={links.linkedin_url}
                    onChange={(e) => setLinks(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  />
                  {linkErrors.linkedin_url && <div className="invalid-feedback">{linkErrors.linkedin_url}</div>}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-dark small d-flex align-items-center gap-2">
                  <i className="bi bi-github text-dark"></i> GitHub Profile
                </label>
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-link-45deg text-muted"></i></span>
                  <input 
                    type="text"
                    className={`form-control border-start-0 ps-0 ${linkErrors.github_url ? 'is-invalid' : ''}`}
                    placeholder="https://github.com/username"
                    value={links.github_url}
                    onChange={(e) => setLinks(prev => ({ ...prev, github_url: e.target.value }))}
                  />
                  {linkErrors.github_url && <div className="invalid-feedback">{linkErrors.github_url}</div>}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-dark small d-flex align-items-center gap-2">
                  <i className="bi bi-globe text-info"></i> Portfolio Website
                </label>
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-link-45deg text-muted"></i></span>
                  <input 
                    type="text"
                    className={`form-control border-start-0 ps-0 ${linkErrors.portfolio_url ? 'is-invalid' : ''}`}
                    placeholder="https://yoursite.com"
                    value={links.portfolio_url}
                    onChange={(e) => setLinks(prev => ({ ...prev, portfolio_url: e.target.value }))}
                  />
                  {linkErrors.portfolio_url && <div className="invalid-feedback">{linkErrors.portfolio_url}</div>}
                </div>
              </div>

              <button 
                className={`btn w-100 fw-bold shadow-sm rounded-pill ${linksSavedSuccess ? 'btn-success' : 'btn-primary'}`}
                onClick={handleSaveLinks}
                disabled={linksSaving}
              >
                {linksSaving ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</>
                ) : linksSavedSuccess ? (
                  <><i className="bi bi-check-circle-fill me-2"></i>Saved Successfully</>
                ) : (
                  <><i className="bi bi-floppy-fill me-2"></i>Save Links</>
                )}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
