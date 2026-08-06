import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './company.css';

const CreateDrive = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const initialFormState = {
    job_title: '',
    job_description: '',
    package_lpa: '',
    employment_type: 'Full-time',
    eligibility_cgpa: '7.5',
    graduation_year: '2025',
    eligible_branches: ['Computer Science', 'Information Technology'],
    application_deadline: '',
    interview_mode: 'Online',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading]   = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage]     = useState(null);
  const [time, setTime]         = useState(new Date());

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (isEditMode) {
      fetchDriveDetails();
    }
  }, [id]);

  const fetchDriveDetails = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await api.get(`/company/drives/${id}`);
      const drive = res.data;
      if (drive) {
        setFormData({
          job_title: drive.job_title || '',
          job_description: drive.job_description || '',
          package_lpa: drive.package_lpa?.toString() || '',
          employment_type: drive.employment_type || 'Full-time',
          eligibility_cgpa: drive.eligibility_cgpa?.toString() || '7.5',
          graduation_year: drive.graduation_year?.toString() || '2025',
          eligible_branches: drive.eligible_branches || [],
          application_deadline: drive.application_deadline || '',
          interview_mode: drive.interview_mode || 'Online',
        });
      }
    } catch (err) {
      console.error('Error fetching drive details:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to load drive details.');
    } finally {
      setLoading(false);
    }
  };

  const availableBranches = [
    'Computer Science',
    'Information Technology',
    'ECE',
    'EEE',
    'Mechanical',
    'Civil',
    'AIML',
    'Data Science',
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleBranch = (branchName) => {
    if (branchName === 'All Branches') {
      if (formData.eligible_branches.length === availableBranches.length) {
        setFormData((prev) => ({ ...prev, eligible_branches: [] }));
      } else {
        setFormData((prev) => ({ ...prev, eligible_branches: [...availableBranches] }));
      }
      return;
    }

    setFormData((prev) => {
      const exists = prev.eligible_branches.includes(branchName);
      const updated = exists
        ? prev.eligible_branches.filter((b) => b !== branchName)
        : [...prev.eligible_branches, branchName];
      return { ...prev, eligible_branches: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (formData.eligible_branches.length === 0) {
      setErrorMessage('Please select at least one eligible branch.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        job_title: formData.job_title,
        job_description: formData.job_description,
        package_lpa: parseFloat(formData.package_lpa),
        eligibility_cgpa: parseFloat(formData.eligibility_cgpa),
        eligible_branches: formData.eligible_branches,
        application_deadline: formData.application_deadline,
      };

      let res;
      if (isEditMode) {
        res = await api.put(`/company/drives/${id}`, payload);
      } else {
        res = await api.post('/company/drives', payload);
      }

      if (res.status === 200 || res.status === 201) {
        setSuccessMessage(isEditMode ? 'Drive details updated successfully! Redirecting...' : 'Drive submitted for Admin approval! Redirecting to drives dashboard...');
        setTimeout(() => {
          navigate('/company/drives');
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving drive:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to save drive.');
    } finally {
      setLoading(false);
    }
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return (
    <div className="cp-page">
      {/* ── TOPBAR ── */}
      <div className="cp-topbar">
        <span className="cp-topbar__title">{isEditMode ? 'Edit Placement Drive' : 'Post New Drive'}</span>
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

      <div className="cp-content" style={{ maxWidth: '960px' }}>
        {/* Breadcrumb */}
        <div className="cp-breadcrumb">
          <Link to="/company">Home</Link>
          <span className="cp-breadcrumb__sep">›</span>
          <Link to="/company/drives">My Drives</Link>
          <span className="cp-breadcrumb__sep">›</span>
          <span>{isEditMode ? 'Edit Drive' : 'Post New Drive'}</span>
        </div>

        {/* Info Banner */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#1E40AF', display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <span>💡</span>
          <span>Your drive details will be reviewed by the Placement Cell and typically approved within 24 hours.</span>
        </div>

        {successMessage && (
          <div className="alert alert-success rounded-3 mb-4">{successMessage}</div>
        )}
        {errorMessage && (
          <div className="alert alert-danger rounded-3 mb-4">{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card 1: Drive Details */}
          <div className="cp-panel">
            <div className="cp-panel__header">
              <span className="cp-panel__title">Drive Details</span>
            </div>
            <div className="cp-panel__body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>JOB TITLE *</label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  placeholder="e.g. Backend Software Engineer"
                  style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>PACKAGE (LPA) *</label>
                  <input
                    type="number"
                    name="package_lpa"
                    value={formData.package_lpa}
                    onChange={handleChange}
                    placeholder="22"
                    min="0"
                    step="0.1"
                    style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>EMPLOYMENT TYPE</label>
                  <select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                    style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>JOB DESCRIPTION *</label>
                <textarea
                  name="job_description"
                  value={formData.job_description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe the role, responsibilities, tech stack..."
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '10px 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA', resize: 'vertical' }}
                  required
                ></textarea>
              </div>
            </div>
          </div>

          {/* Card 2: Eligibility Criteria */}
          <div className="cp-panel">
            <div className="cp-panel__header">
              <span className="cp-panel__title">Eligibility Criteria</span>
            </div>
            <div className="cp-panel__body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>MINIMUM CGPA</label>
                  <input
                    type="number"
                    name="eligibility_cgpa"
                    value={formData.eligibility_cgpa}
                    onChange={handleChange}
                    placeholder="7.5"
                    min="0"
                    max="10"
                    step="0.1"
                    style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>GRADUATION YEAR</label>
                  <select
                    name="graduation_year"
                    value={formData.graduation_year}
                    onChange={handleChange}
                    style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                  >
                    <option value="2020">2020</option>
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                    <option value="2028">2028</option>
                    <option value="2029">2029</option>
                    <option value="2030">2030</option>
                    <option value="2031">2031</option>
                    <option value="2032">2032</option>
                    <option value="2033">2033</option>
                    <option value="2034">2034</option>
                    <option value="2035">2035</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '8px' }}>ELIGIBLE BRANCHES</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {availableBranches.map((branch) => {
                    const isSelected = formData.eligible_branches.includes(branch);
                    return (
                      <button
                        key={branch}
                        type="button"
                        onClick={() => toggleBranch(branch)}
                        style={{
                          height: '28px',
                          padding: '0 14px',
                          borderRadius: '20px',
                          border: isSelected ? '1px solid #0F766E' : '1px solid #D1D5DB',
                          background: isSelected ? '#CCFBF1' : '#fff',
                          color: isSelected ? '#0F766E' : '#4B5563',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s'
                        }}
                      >
                        {branch}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => toggleBranch('All Branches')}
                    style={{
                      height: '28px',
                      padding: '0 14px',
                      borderRadius: '20px',
                      border: '1px solid #E5E7EB',
                      background: formData.eligible_branches.length === availableBranches.length ? '#0F766E' : '#fff',
                      color: formData.eligible_branches.length === availableBranches.length ? '#fff' : '#4B5563',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s'
                    }}
                  >
                    All Branches
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Schedule */}
          <div className="cp-panel">
            <div className="cp-panel__header">
              <span className="cp-panel__title">Schedule</span>
            </div>
            <div className="cp-panel__body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>APPLICATION DEADLINE</label>
                  <input
                    type="date"
                    name="application_deadline"
                    value={formData.application_deadline}
                    onChange={handleChange}
                    style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: '6px' }}>INTERVIEW MODE</label>
                  <select
                    name="interview_mode"
                    value={formData.interview_mode}
                    onChange={handleChange}
                    style={{ width: '100%', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0 12px', fontSize: '13px', outline: 'none', background: '#FAFAFA' }}
                  >
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="cp-btn-primary"
              style={{ flex: 1, height: '40px', fontSize: '14px' }}
              disabled={loading}
            >
              {loading ? 'Submitting...' : isEditMode ? 'Update Drive Details →' : 'Submit Drive for Approval →'}
            </button>
            <button
              type="button"
              className="cp-btn-ghost"
              style={{ width: '140px', height: '40px', fontSize: '14px' }}
              onClick={() => navigate('/company/drives')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); refreshCount(); }}
      />
    </div>
  );
};

export default CreateDrive;
