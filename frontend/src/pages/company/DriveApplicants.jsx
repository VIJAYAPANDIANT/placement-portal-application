import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const DriveApplicants = () => {
  const { id: driveId } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  // Schedule Interview Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [interviewData, setInterviewData] = useState({
    interview_date: '',
    interview_mode: 'online',
    location_or_link: '',
    notes: ''
  });

  // Candidate Profile Modal state
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [profileModalData, setProfileModalData] = useState(null);
  const [profileModalLoading, setProfileModalLoading] = useState(false);
  const [profileModalError, setProfileModalError] = useState(null);

  useEffect(() => {
    fetchApplicants();
  }, [driveId]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/company/drives/${driveId}/applicants`);
      setApplicants(res.data);
    } catch (err) {
      console.error('Error fetching drive applicants:', err);
      setError(err.response?.data?.error || 'Failed to fetch applicants.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      setAlert(null);
      await api.put(`/company/applications/${appId}/status`, { status });
      setAlert({
        type: 'success',
        message: `Applicant status updated to ${status} successfully.`
      });
      fetchApplicants();
      if (selectedAppId === appId) {
        setSelectedStudentId(null);
        setSelectedAppId(null);
      }
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setAlert({
        type: 'danger',
        message: err.response?.data?.error || 'Failed to update candidate status.'
      });
    }
  };

  const handleOpenProfileModal = async (studentId, appId) => {
    setSelectedStudentId(studentId);
    setSelectedAppId(appId);
    setProfileModalData(null);
    setProfileModalError(null);
    try {
      setProfileModalLoading(true);
      const res = await api.get(`/company/students/${studentId}/profile`);
      setProfileModalData(res.data);
    } catch (err) {
      console.error('Error loading student profile for company:', err);
      setProfileModalError(err.response?.data?.error || 'Failed to load candidate profile.');
    } finally {
      setProfileModalLoading(false);
    }
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setInterviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setAlert(null);
    try {
      setModalLoading(true);
      const res = await api.post(`/company/drives/${driveId}/interview`, interviewData);
      setAlert({
        type: 'success',
        message: res.data.message || 'Interview scheduled successfully.'
      });
      setShowModal(false);
      setInterviewData({
        interview_date: '',
        interview_mode: 'online',
        location_or_link: '',
        notes: ''
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      console.error('Error scheduling interview:', err);
      setAlert({
        type: 'danger',
        message: err.response?.data?.error || 'Failed to schedule interview (it might be already scheduled).'
      });
      setShowModal(false);
    } finally {
      setModalLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'applied':
        return <span className="status-pill pill-info">● Applied</span>;
      case 'shortlisted':
        return <span className="status-pill pill-purple">● Shortlisted</span>;
      case 'selected':
        return <span className="status-pill pill-success">● Selected</span>;
      case 'rejected':
        return <span className="status-pill pill-danger">● Rejected</span>;
      default:
        return <span className="status-pill pill-warning">● {status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Retrieving applicant directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card p-4 text-center border-danger">
        <p className="text-danger mb-3">{error}</p>
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/company/drives')}>
          Back to My Drives
        </button>
      </div>
    );
  }

  const capacityProgress = Math.min(Math.round((applicants.length / 50) * 100), 100);

  return (
    <div>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <button className="btn btn-sm btn-outline-secondary mb-2" style={{ borderRadius: '6px' }} onClick={() => navigate('/company/drives')}>
            &larr; Back to My Drives
          </button>
          <h4 className="fw-bold mb-0">Drive Candidates & Applications</h4>
        </div>
        <button
          className="btn btn-primary fw-bold btn-sm px-3 py-2"
          style={{ borderRadius: '8px' }}
          onClick={() => setShowModal(true)}
        >
          📅 Schedule Drive Interview
        </button>
      </div>

      <div className="panel-card p-3 mb-4">
        <div className="d-flex justify-content-between align-items-center mb-1" style={{ fontSize: '12px' }}>
          <span className="fw-bold text-muted">APPLICATION CAPACITY VOLUME</span>
          <span className="fw-bold text-primary">{applicants.length} / 50 Applications</span>
        </div>
        <div className="progress" style={{ height: '8px', borderRadius: '4px', background: 'var(--table-hover)' }}>
          <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${capacityProgress}%` }}></div>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      <div className="panel-card">
        <div className="panel-header">
          <h5 className="panel-title">Registered Student Candidates</h5>
          <span className="status-pill pill-info">👥 {applicants.length} Total Applicants</span>
        </div>

        {applicants.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '2.5rem' }}>📋</div>
            <p className="mt-3 fw-semibold mb-1">No applications received yet</p>
            <small className="text-muted">Eligible students will appear here once they apply to this drive.</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enhanced-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((app, idx) => (
                  <tr key={app.application_id}>
                    <td className="text-muted fw-bold" style={{ fontSize: '11px' }}>{idx + 1}</td>
                    <td className="fw-bold">{app.student_name}</td>
                    <td>{app.roll_number}</td>
                    <td><span className="status-pill pill-purple">{app.branch}</span></td>
                    <td className="fw-bold">{app.cgpa}</td>
                    <td>{getStatusBadge(app.application_status)}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-info text-white me-1 px-2 py-1"
                        style={{ borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}
                        onClick={() => handleOpenProfileModal(app.student_id, app.application_id)}
                      >
                        👤 View Profile
                      </button>
                      <button
                        className="btn btn-sm btn-outline-primary me-1 px-2 py-1"
                        style={{ borderRadius: '6px', fontSize: '11px' }}
                        onClick={() => handleUpdateStatus(app.application_id, 'shortlisted')}
                        disabled={app.application_status === 'shortlisted'}
                      >
                        Shortlist
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success me-1 px-2 py-1"
                        style={{ borderRadius: '6px', fontSize: '11px' }}
                        onClick={() => handleUpdateStatus(app.application_id, 'selected')}
                        disabled={app.application_status === 'selected'}
                      >
                        Select
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger px-2 py-1"
                        style={{ borderRadius: '6px', fontSize: '11px' }}
                        onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                        disabled={app.application_status === 'rejected'}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Profile Modal for Company */}
      {selectedStudentId && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content panel-card border-0 shadow-lg">
              <div className="modal-header panel-header">
                <h5 className="modal-title fw-bold">🎓 Candidate Profile Evaluation</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedStudentId(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body p-4">
                {profileModalLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted small">Loading profile details...</p>
                  </div>
                ) : profileModalError ? (
                  <div className="alert alert-danger mb-0">{profileModalError}</div>
                ) : profileModalData && (
                  <div>
                    <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-3">
                      <div>
                        <h4 className="fw-bold mb-1">{profileModalData.name}</h4>
                        <span className="text-muted small" style={{ fontSize: '12px' }}>Roll Number: <strong>{profileModalData.roll_number}</strong> | Branch: <strong>{profileModalData.branch}</strong></span>
                      </div>
                      <span className="status-pill pill-success" style={{ fontSize: '14px' }}>
                        CGPA: {profileModalData.cgpa} / 10.0
                      </span>
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-md-7">
                        <h6 className="fw-bold text-muted" style={{ fontSize: '11px' }}>ABOUT CANDIDATE</h6>
                        <p className="small mb-3" style={{ fontSize: '13px', color: 'var(--bs-body-color)', whiteSpace: 'pre-line' }}>
                          {profileModalData.bio || 'No bio provided.'}
                        </p>

                        <h6 className="fw-bold text-muted mb-2" style={{ fontSize: '11px' }}>TECHNICAL SKILLS</h6>
                        <div className="d-flex flex-wrap gap-1 mb-3">
                          {profileModalData.skills && profileModalData.skills.length > 0 ? (
                            profileModalData.skills.map((s, idx) => (
                              <span key={idx} className="status-pill pill-purple">{s}</span>
                            ))
                          ) : (
                            <span className="text-muted small">No skills listed</span>
                          )}
                        </div>
                      </div>

                      <div className="col-md-5 border-start ps-3">
                        <h6 className="fw-bold text-muted mb-2" style={{ fontSize: '11px' }}>RESUME & LINKS</h6>
                        {profileModalData.resume_url ? (
                          <button 
                            className="btn btn-sm btn-primary w-100 mb-3 fw-bold py-2"
                            style={{ borderRadius: '6px', fontSize: '12px' }}
                            onClick={() => window.open(`http://localhost:5000/${profileModalData.resume_url}`, '_blank')}
                          >
                            📄 View Candidate Resume PDF
                          </button>
                        ) : (
                          <div className="alert alert-warning py-2 small mb-3" style={{ fontSize: '11px' }}>
                            ⚠️ No resume uploaded by student
                          </div>
                        )}

                        <div className="d-flex flex-column gap-2" style={{ fontSize: '12px' }}>
                          {profileModalData.linkedin_url ? (
                            <a href={profileModalData.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-semibold">
                              🔗 LinkedIn Profile
                            </a>
                          ) : <span className="text-muted">🔗 LinkedIn: Not provided</span>}

                          {profileModalData.github_url ? (
                            <a href={profileModalData.github_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-semibold">
                              🐙 GitHub Repository
                            </a>
                          ) : <span className="text-muted">🐙 GitHub: Not provided</span>}

                          {profileModalData.portfolio_url ? (
                            <a href={profileModalData.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-decoration-none fw-semibold">
                              🌐 Portfolio Website
                            </a>
                          ) : <span className="text-muted">🌐 Portfolio: Not provided</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer p-3 border-top d-flex justify-content-between" style={{ borderColor: 'var(--card-border)' }}>
                <button type="button" className="btn btn-sm btn-outline-secondary" style={{ borderRadius: '6px' }} onClick={() => setSelectedStudentId(null)}>
                  Close Profile
                </button>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-sm btn-primary px-3 fw-bold" 
                    style={{ borderRadius: '6px' }}
                    onClick={() => handleUpdateStatus(selectedAppId, 'shortlisted')}
                  >
                    Shortlist Candidate
                  </button>
                  <button 
                    className="btn btn-sm btn-success px-3 fw-bold" 
                    style={{ borderRadius: '6px' }}
                    onClick={() => handleUpdateStatus(selectedAppId, 'selected')}
                  >
                    Select Candidate
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger px-3 fw-bold" 
                    style={{ borderRadius: '6px' }}
                    onClick={() => handleUpdateStatus(selectedAppId, 'rejected')}
                  >
                    Reject Candidate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content panel-card border-0 shadow-lg">
                <div className="modal-header panel-header">
                  <h5 className="modal-title fw-bold">🗓️ Schedule Drive Interview</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
                </div>
                <form onSubmit={handleScheduleInterview}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label htmlFor="interview_date" className="form-label fw-bold" style={{ fontSize: '12px' }}>INTERVIEW DATE *</label>
                      <input
                        type="date"
                        className="form-control"
                        id="interview_date"
                        name="interview_date"
                        value={interviewData.interview_date}
                        onChange={handleModalChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="interview_mode" className="form-label fw-bold" style={{ fontSize: '12px' }}>INTERVIEW MODE *</label>
                      <select
                        className="form-select"
                        id="interview_mode"
                        name="interview_mode"
                        value={interviewData.interview_mode}
                        onChange={handleModalChange}
                        required
                      >
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="location_or_link" className="form-label fw-bold" style={{ fontSize: '12px' }}>
                        {interviewData.interview_mode === 'online' ? 'MEETING LINK' : 'CAMPUS VENUE / LOCATION'}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="location_or_link"
                        name="location_or_link"
                        value={interviewData.location_or_link}
                        onChange={handleModalChange}
                        placeholder={interviewData.interview_mode === 'online' ? 'e.g. Google Meet or Zoom URL' : 'e.g. Placement Cell Hall A'}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="notes" className="form-label fw-bold" style={{ fontSize: '12px' }}>INSTRUCTIONS & NOTES</label>
                      <textarea
                        className="form-control"
                        id="notes"
                        name="notes"
                        rows="3"
                        value={interviewData.notes}
                        onChange={handleModalChange}
                        placeholder="Topics to prepare, documentation required..."
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer p-3 border-top" style={{ borderColor: 'var(--card-border)' }}>
                    <button type="button" className="btn btn-sm btn-outline-secondary" style={{ borderRadius: '6px' }} onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-sm btn-primary px-4 fw-bold" style={{ borderRadius: '6px' }} disabled={modalLoading}>
                      {modalLoading ? 'Scheduling...' : 'Confirm & Schedule'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DriveApplicants;
