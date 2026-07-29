import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const BrowseDrives = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appliedDrives, setAppliedDrives] = useState([]);
  const [alertInfo, setAlertInfo] = useState(null);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/student/drives');
      setDrives(res.data);
    } catch (err) {
      console.error('Error fetching drives:', err);
      setError(err.response?.data?.error || 'Failed to retrieve available placement drives.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (id) => {
    setAlertInfo(null);
    try {
      const res = await api.post(`/student/drives/${id}/apply`);
      
      setAlertInfo({
        type: 'success',
        message: res.data.message || 'Application submitted successfully',
        driveId: id
      });

      setAppliedDrives(prev => [...prev, id]);
    } catch (err) {
      console.error('Error applying to drive:', err);
      setAlertInfo({
        type: 'danger',
        message: err.response?.data?.message || err.response?.data?.error || 'Failed to submit application.',
        driveId: id
      });
    }
  };

  const getDeadlineStatus = (deadlineStr) => {
    if (!deadlineStr) return { passed: false, daysLeft: null, color: 'text-muted' };
    const deadline = new Date(deadlineStr);
    deadline.setHours(23, 59, 59, 999);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { passed: true, daysLeft: 0, color: 'text-danger' };
    if (diffDays < 3) return { passed: false, daysLeft: diffDays, color: 'text-warning' };
    return { passed: false, daysLeft: diffDays, color: 'text-success' };
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Scanning active campus recruitment drives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger shadow-sm p-4 text-center fade-in">
        <p className="text-danger fw-semibold mb-0"><i className="bi bi-exclamation-octagon-fill me-2"></i>{error}</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Browse Active Drives</h4>
        <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Explore premium placement opportunities verified by the placement department.</p>
      </div>

      {drives.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-megaphone-fill text-muted" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">No Active Drives Found</h4>
            <p className="text-muted mb-0 mx-auto" style={{ maxWidth: '400px' }}>
              There are currently no placement drives accepting applications. Check back later!
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {drives.map(drive => {
            const { passed, daysLeft, color } = getDeadlineStatus(drive.application_deadline);
            const isApplied = appliedDrives.includes(drive.id);
            const cardAlert = alertInfo?.driveId === drive.id ? alertInfo : null;

            return (
              <div key={drive.id} className="col-lg-6 col-xl-4">
                <div className="card card-hover h-100 border-0 shadow-sm d-flex flex-column">
                  
                  {/* Card Header */}
                  <div className="card-body pb-0">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="fw-bold text-dark mb-1">{drive.job_title}</h5>
                        <div className="d-flex align-items-center gap-2">
                          <i className="bi bi-building text-primary"></i>
                          <span className="text-primary fw-semibold" style={{ fontSize: '0.9rem' }}>{drive.company_name}</span>
                        </div>
                      </div>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1 fs-6">
                        {drive.package_lpa} LPA
                      </span>
                    </div>

                    <p className="text-secondary mb-4" style={{ fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {drive.job_description || 'No job description provided.'}
                    </p>

                    {/* Eligibility Stats */}
                    <div className="bg-light rounded p-3 mb-4">
                      <div className="row g-3">
                        <div className="col-6 border-end">
                          <span className="text-muted text-uppercase fw-semibold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Min CGPA</span>
                          <span className="fw-bold text-dark fs-6">≥ {drive.eligibility_cgpa}</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted text-uppercase fw-semibold d-block mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Branches</span>
                          <span className="fw-bold text-dark fs-6 text-truncate d-block">
                            {drive.eligible_branches?.join(', ') || 'All Branches'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="card-footer bg-transparent border-top-0 pt-0 pb-3 mt-auto">
                    
                    <div className="d-flex justify-content-between align-items-center mb-3 px-2">
                      <span className="text-muted small fw-medium">Deadline:</span>
                      <span className={`small fw-bold ${color}`}>
                        {drive.application_deadline || 'N/A'} {daysLeft !== null && !passed && `(${daysLeft} days left)`}
                        {passed && '(Expired)'}
                      </span>
                    </div>

                    {cardAlert && (
                      <div className={`alert alert-${cardAlert.type} py-2 mb-3 mx-2`} style={{ fontSize: '0.85rem' }} role="alert">
                        <i className={`bi ${cardAlert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} me-2`}></i>
                        {cardAlert.message}
                      </div>
                    )}

                    <div className="px-2">
                      {passed ? (
                        <button className="btn btn-light w-100 fw-semibold text-muted" disabled>
                          <i className="bi bi-clock-history me-2"></i>Deadline Passed
                        </button>
                      ) : (
                        <button
                          className={`btn w-100 fw-semibold shadow-sm ${isApplied ? 'btn-outline-secondary' : 'btn-primary'}`}
                          onClick={() => handleApply(drive.id)}
                          disabled={isApplied}
                        >
                          {isApplied ? (
                            <><i className="bi bi-check2-circle me-2"></i>Applied Successfully</>
                          ) : (
                            <><i className="bi bi-send-fill me-2"></i>Submit Application</>
                          )}
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseDrives;
