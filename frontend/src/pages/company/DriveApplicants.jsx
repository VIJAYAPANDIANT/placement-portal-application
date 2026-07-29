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
        return <span className="badge badge-soft-info px-2 py-1"><i className="bi bi-file-earmark-text me-1"></i>Applied</span>;
      case 'shortlisted':
        return <span className="badge badge-soft-warning px-2 py-1"><i className="bi bi-star-fill me-1"></i>Shortlisted</span>;
      case 'selected':
        return <span className="badge badge-soft-success px-2 py-1"><i className="bi bi-trophy-fill me-1"></i>Selected</span>;
      case 'rejected':
        return <span className="badge badge-soft-danger px-2 py-1"><i className="bi bi-x-circle-fill me-1"></i>Rejected</span>;
      default:
        return <span className="badge badge-soft-secondary px-2 py-1">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Retrieving applicant directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger shadow-sm p-4 text-center fade-in">
        <p className="text-danger fw-semibold mb-3"><i className="bi bi-exclamation-octagon-fill me-2"></i>{error}</p>
        <button className="btn btn-sm btn-outline-secondary rounded-pill px-4 mx-auto" onClick={() => navigate('/company/drives')}>
          <i className="bi bi-arrow-left me-2"></i>Back to My Drives
        </button>
      </div>
    );
  }

  const capacityProgress = Math.min(Math.round((applicants.length / 50) * 100), 100);

  return (
    <div className="fade-in">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <button className="btn btn-sm btn-link text-secondary px-0 text-decoration-none mb-2" onClick={() => navigate('/company/drives')}>
            <i className="bi bi-arrow-left me-2"></i>Back to My Drives
          </button>
          <h4 className="fw-bold text-dark mb-0">Drive Candidates & Applications</h4>
        </div>
        <button
          className="btn btn-primary shadow-sm fw-semibold rounded-pill px-4"
          onClick={() => setShowModal(true)}
        >
          <i className="bi bi-calendar-event me-2"></i>Schedule Interview
        </button>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold text-muted small" style={{ letterSpacing: '0.5px' }}>APPLICATION CAPACITY VOLUME</span>
            <span className="fw-bold text-primary">{applicants.length} / 50 Applications</span>
          </div>
          <div className="progress" style={{ height: '10px', borderRadius: '5px', backgroundColor: 'var(--bs-primary-bg-subtle)' }}>
            <div className="progress-bar bg-primary rounded-pill" role="progressbar" style={{ width: `${capacityProgress}%` }}></div>
          </div>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm mb-4`} role="alert">
          {alert.type === 'success' ? <i className="bi bi-check-circle-fill me-2"></i> : <i className="bi bi-exclamation-triangle-fill me-2"></i>}
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-dark mb-0">Registered Student Candidates</h5>
          <span className="badge badge-soft-primary px-3 py-2 fs-6">
            <i className="bi bi-people-fill me-2"></i>{applicants.length} Total
          </span>
        </div>

        {applicants.length === 0 ? (
          <div className="card-body text-center py-5">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-inbox text-muted" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h5 className="fw-bold text-dark mb-2">No Applications Received Yet</h5>
            <p className="text-muted mb-0">Eligible students will appear here once they apply to this drive.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3 text-muted small fw-bold">#</th>
                  <th className="px-4 py-3 text-muted small fw-bold">STUDENT NAME</th>
                  <th className="px-4 py-3 text-muted small fw-bold">ROLL NUMBER</th>
                  <th className="px-4 py-3 text-muted small fw-bold">BRANCH</th>
                  <th className="px-4 py-3 text-muted small fw-bold">CGPA</th>
                  <th className="px-4 py-3 text-muted small fw-bold">STATUS</th>
                  <th className="px-4 py-3 text-muted small fw-bold text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {applicants.map((app, idx) => (
                  <tr key={app.application_id}>
                    <td className="px-4 text-muted fw-semibold">{idx + 1}</td>
                    <td className="px-4 fw-bold text-dark">{app.student_name}</td>
                    <td className="px-4 text-secondary">{app.roll_number}</td>
                    <td className="px-4"><span className="badge badge-soft-primary">{app.branch}</span></td>
                    <td className="px-4 fw-bold text-dark">{app.cgpa}</td>
                    <td className="px-4">{getStatusBadge(app.application_status)}</td>
                    <td className="px-4 text-end">
                      <div className="btn-group shadow-sm">
                        <button
                          className="btn btn-sm btn-light text-primary border fw-semibold px-3"
                          onClick={() => handleOpenProfileModal(app.student_id, app.application_id)}
                          title="View Profile"
                        >
                          <i className="bi bi-person-badge"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-light text-warning border fw-semibold px-3"
                          onClick={() => handleUpdateStatus(app.application_id, 'shortlisted')}
                          disabled={app.application_status === 'shortlisted' || app.application_status === 'selected'}
                          title="Shortlist"
                        >
                          <i className="bi bi-star"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-light text-success border fw-semibold px-3"
                          onClick={() => handleUpdateStatus(app.application_id, 'selected')}
                          disabled={app.application_status === 'selected'}
                          title="Select"
                        >
                          <i className="bi bi-check-lg"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-light text-danger border fw-semibold px-3"
                          onClick={() => handleUpdateStatus(app.application_id, 'rejected')}
                          disabled={app.application_status === 'rejected'}
                          title="Reject"
                        >
                          <i className="bi bi-x-lg"></i>
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

      {/* Candidate Profile Modal for Company */}
      {selectedStudentId && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable" role="document">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-white border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-person-lines-fill text-primary me-2"></i>Candidate Profile Evaluation</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setSelectedStudentId(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body p-4 p-md-5 bg-light">
                {profileModalLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="mt-3 text-muted fw-medium">Loading profile details...</p>
                  </div>
                ) : profileModalError ? (
                  <div className="alert alert-danger shadow-sm mb-0"><i className="bi bi-exclamation-triangle-fill me-2"></i>{profileModalError}</div>
                ) : profileModalData && (
                  <div className="fade-in">
                    
                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-body p-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
                            <i className="bi bi-person-fill"></i>
                          </div>
                          <div>
                            <h4 className="fw-black text-dark mb-1">{profileModalData.name}</h4>
                            <div className="d-flex flex-wrap gap-2 text-secondary small fw-medium">
                              <span><i className="bi bi-hash me-1"></i>{profileModalData.roll_number}</span>
                              <span>&bull;</span>
                              <span><i className="bi bi-building me-1"></i>{profileModalData.branch}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-md-end text-center p-3 bg-light rounded border">
                          <span className="d-block text-muted small fw-bold mb-1">CURRENT CGPA</span>
                          <span className="fs-3 fw-black text-success lh-1">{profileModalData.cgpa} <span className="fs-6 text-muted">/ 10</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="row g-4">
                      <div className="col-md-7">
                        <div className="card border-0 shadow-sm h-100">
                          <div className="card-body p-4">
                            <h6 className="fw-bold text-dark mb-3"><i className="bi bi-file-person me-2 text-primary"></i>About Candidate</h6>
                            <p className="text-secondary mb-4" style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                              {profileModalData.bio || 'No bio provided.'}
                            </p>

                            <h6 className="fw-bold text-dark mb-3"><i className="bi bi-code-slash me-2 text-primary"></i>Technical Skills</h6>
                            <div className="d-flex flex-wrap gap-2">
                              {profileModalData.skills && profileModalData.skills.length > 0 ? (
                                profileModalData.skills.map((s, idx) => (
                                  <span key={idx} className="badge badge-soft-primary px-3 py-2 fs-6">{s}</span>
                                ))
                              ) : (
                                <span className="text-muted fst-italic">No skills listed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-5">
                        <div className="card border-0 shadow-sm h-100">
                          <div className="card-body p-4">
                            <h6 className="fw-bold text-dark mb-3"><i className="bi bi-link-45deg me-2 text-primary"></i>Documents & Links</h6>
                            
                            {profileModalData.resume_url ? (
                              <button 
                                className="btn btn-primary w-100 mb-4 fw-semibold py-2 shadow-sm rounded-pill d-flex align-items-center justify-content-center gap-2"
                                onClick={() => window.open(`http://localhost:5000/${profileModalData.resume_url}`, '_blank')}
                              >
                                <i className="bi bi-file-earmark-pdf-fill fs-5"></i> View Candidate Resume
                              </button>
                            ) : (
                              <div className="alert alert-warning py-2 mb-4 d-flex align-items-center gap-2">
                                <i className="bi bi-exclamation-triangle-fill"></i> No resume uploaded
                              </div>
                            )}

                            <div className="d-flex flex-column gap-3">
                              <a 
                                href={profileModalData.linkedin_url || '#'} 
                                target={profileModalData.linkedin_url ? "_blank" : "_self"} 
                                rel="noopener noreferrer" 
                                className={`text-decoration-none d-flex align-items-center gap-3 p-2 rounded ${profileModalData.linkedin_url ? 'text-dark card-hover bg-white border shadow-sm' : 'text-muted bg-light'}`}
                              >
                                <i className="bi bi-linkedin fs-4 text-primary"></i>
                                <span className="fw-medium">LinkedIn Profile</span>
                              </a>
                              
                              <a 
                                href={profileModalData.github_url || '#'} 
                                target={profileModalData.github_url ? "_blank" : "_self"} 
                                rel="noopener noreferrer" 
                                className={`text-decoration-none d-flex align-items-center gap-3 p-2 rounded ${profileModalData.github_url ? 'text-dark card-hover bg-white border shadow-sm' : 'text-muted bg-light'}`}
                              >
                                <i className="bi bi-github fs-4 text-dark"></i>
                                <span className="fw-medium">GitHub Repository</span>
                              </a>

                              <a 
                                href={profileModalData.portfolio_url || '#'} 
                                target={profileModalData.portfolio_url ? "_blank" : "_self"} 
                                rel="noopener noreferrer" 
                                className={`text-decoration-none d-flex align-items-center gap-3 p-2 rounded ${profileModalData.portfolio_url ? 'text-dark card-hover bg-white border shadow-sm' : 'text-muted bg-light'}`}
                              >
                                <i className="bi bi-globe fs-4 text-info"></i>
                                <span className="fw-medium">Portfolio Website</span>
                              </a>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              <div className="modal-footer bg-white p-3 border-top d-flex justify-content-between">
                <button type="button" className="btn btn-light fw-semibold rounded-pill px-4 border" onClick={() => setSelectedStudentId(null)}>
                  Close
                </button>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-warning fw-semibold rounded-pill px-4 shadow-sm text-dark d-flex align-items-center gap-2"
                    onClick={() => handleUpdateStatus(selectedAppId, 'shortlisted')}
                  >
                    <i className="bi bi-star-fill"></i> Shortlist
                  </button>
                  <button 
                    className="btn btn-success fw-semibold rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
                    onClick={() => handleUpdateStatus(selectedAppId, 'selected')}
                  >
                    <i className="bi bi-trophy-fill"></i> Select
                  </button>
                  <button 
                    className="btn btn-danger fw-semibold rounded-pill px-4 shadow-sm d-flex align-items-center gap-2"
                    onClick={() => handleUpdateStatus(selectedAppId, 'rejected')}
                  >
                    <i className="bi bi-x-circle-fill"></i> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <div className="modal-header bg-white border-bottom py-3 px-4">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-calendar-plus text-primary me-2"></i>Schedule Drive Interview</h5>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)} aria-label="Close"></button>
              </div>
              <form onSubmit={handleScheduleInterview}>
                <div className="modal-body p-4 bg-light">
                  
                  <div className="card border-0 shadow-sm mb-0">
                    <div className="card-body p-4">
                      <div className="mb-4">
                        <label htmlFor="interview_date" className="form-label fw-bold text-dark small">INTERVIEW DATE <span className="text-danger">*</span></label>
                        <div className="input-group shadow-sm">
                          <span className="input-group-text bg-light border-end-0"><i className="bi bi-calendar-date text-primary"></i></span>
                          <input
                            type="datetime-local"
                            className="form-control border-start-0 ps-0"
                            id="interview_date"
                            name="interview_date"
                            value={interviewData.interview_date}
                            onChange={handleModalChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="interview_mode" className="form-label fw-bold text-dark small">INTERVIEW MODE <span className="text-danger">*</span></label>
                        <div className="input-group shadow-sm">
                          <span className="input-group-text bg-light border-end-0"><i className="bi bi-display text-primary"></i></span>
                          <select
                            className="form-select border-start-0 ps-0"
                            id="interview_mode"
                            name="interview_mode"
                            value={interviewData.interview_mode}
                            onChange={handleModalChange}
                            required
                          >
                            <option value="online">Online (Virtual)</option>
                            <option value="offline">Offline (In-Person)</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label htmlFor="location_or_link" className="form-label fw-bold text-dark small">
                          {interviewData.interview_mode === 'online' ? 'MEETING LINK ' : 'CAMPUS VENUE / LOCATION '}
                          <span className="text-danger">*</span>
                        </label>
                        <div className="input-group shadow-sm">
                          <span className="input-group-text bg-light border-end-0">
                            {interviewData.interview_mode === 'online' ? <i className="bi bi-link-45deg text-primary"></i> : <i className="bi bi-geo-alt-fill text-primary"></i>}
                          </span>
                          <input
                            type="text"
                            className="form-control border-start-0 ps-0"
                            id="location_or_link"
                            name="location_or_link"
                            value={interviewData.location_or_link}
                            onChange={handleModalChange}
                            placeholder={interviewData.interview_mode === 'online' ? 'e.g. Google Meet or Zoom URL' : 'e.g. Placement Cell Hall A'}
                            required
                          />
                        </div>
                      </div>

                      <div className="mb-2">
                        <label htmlFor="notes" className="form-label fw-bold text-dark small">INSTRUCTIONS & NOTES</label>
                        <textarea
                          className="form-control shadow-sm"
                          id="notes"
                          name="notes"
                          rows="3"
                          value={interviewData.notes}
                          onChange={handleModalChange}
                          placeholder="Topics to prepare, documentation required..."
                        ></textarea>
                      </div>
                    </div>
                  </div>

                </div>
                <div className="modal-footer bg-white p-3 border-top">
                  <button type="button" className="btn btn-light fw-semibold rounded-pill px-4 border" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary fw-bold rounded-pill px-4 shadow-sm" disabled={modalLoading}>
                    {modalLoading ? <><span className="spinner-border spinner-border-sm me-2"></span>Scheduling...</> : <><i className="bi bi-calendar-check me-2"></i>Confirm & Schedule</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriveApplicants;
