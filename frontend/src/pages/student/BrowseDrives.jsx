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
    if (!deadlineStr) return { passed: false, cardClass: 'drive-card-far', daysLeft: null };
    const deadline = new Date(deadlineStr);
    deadline.setHours(23, 59, 59, 999);
    const today = new Date();
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { passed: true, cardClass: 'drive-card-expired', daysLeft: 0 };
    if (diffDays < 3) return { passed: false, cardClass: 'drive-card-near', daysLeft: diffDays };
    if (diffDays <= 7) return { passed: false, cardClass: 'drive-card-mid', daysLeft: diffDays };
    return { passed: false, cardClass: 'drive-card-far', daysLeft: diffDays };
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Scanning active campus recruitment drives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card p-4 text-center border-danger">
        <p className="text-danger mb-0">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Browse Active Campus Placement Drives</h4>
        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Explore opportunities verified by Easwari Engineering College placement department.</p>
      </div>

      {drives.length === 0 ? (
        <div className="panel-card p-5 text-center">
          <div style={{ fontSize: '2.5rem' }}>📢</div>
          <p className="mt-3 fw-semibold mb-1">No placement drives available right now</p>
          <small className="text-muted">Check back when companies post new recruitment opportunities.</small>
        </div>
      ) : (
        <div className="row g-3">
          {drives.map(drive => {
            const { passed, cardClass, daysLeft } = getDeadlineStatus(drive.application_deadline);
            const isApplied = appliedDrives.includes(drive.id);
            const cardAlert = alertInfo?.driveId === drive.id ? alertInfo : null;

            return (
              <div key={drive.id} className="col-lg-6">
                <div className={`panel-card h-100 d-flex flex-column justify-content-between mb-0 ${cardClass}`}>
                  <div className="panel-header">
                    <div className="flex-grow-1">
                      <h5 className="panel-title mb-0">{drive.job_title}</h5>
                      <span className="text-primary fw-semibold" style={{ fontSize: '12px' }}>{drive.company_name}</span>
                    </div>
                    <span className="status-pill pill-success">
                      {drive.package_lpa} LPA
                    </span>
                  </div>

                  <div className="panel-body flex-grow-1">
                    <p className="small mb-3" style={{ color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {drive.job_description || 'No job description provided.'}
                    </p>

                    <div className="p-3 border rounded mb-3" style={{ background: 'var(--table-hover)', borderColor: 'var(--card-border)', fontSize: '12px' }}>
                      <div className="row g-2">
                        <div className="col-6">
                          <span className="text-muted d-block" style={{ fontSize: '10px' }}>MINIMUM CGPA</span>
                          <span className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>≥ {drive.eligibility_cgpa} CGPA</span>
                        </div>
                        <div className="col-6">
                          <span className="text-muted d-block" style={{ fontSize: '10px' }}>ELIGIBLE BRANCHES</span>
                          <span className="fw-bold text-truncate d-block" style={{ color: 'var(--bs-body-color)' }}>
                            {drive.eligible_branches?.join(', ') || 'All Branches'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '12px' }}>
                      <span className="text-muted">Deadline:</span>
                      <span className={`fw-bold ${passed ? 'text-danger' : ''}`} style={{ color: passed ? undefined : 'var(--bs-body-color)' }}>
                        {drive.application_deadline || 'N/A'} {daysLeft !== null && !passed && `(${daysLeft}d left)`}
                      </span>
                    </div>

                    {cardAlert && (
                      <div className={`alert alert-${cardAlert.type} mt-3 mb-0 py-2`} style={{ fontSize: '12px' }} role="alert">
                        {cardAlert.message}
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-top" style={{ borderColor: 'var(--card-border)', background: 'var(--table-hover)' }}>
                    {passed ? (
                      <button className="btn btn-sm btn-secondary w-100 disabled" style={{ borderRadius: '6px' }}>
                        ⏳ Application Deadline Passed
                      </button>
                    ) : (
                      <button
                        className={`btn btn-sm w-100 fw-bold ${isApplied ? 'btn-outline-secondary' : 'btn-primary'}`}
                        style={{ borderRadius: '6px' }}
                        onClick={() => handleApply(drive.id)}
                        disabled={isApplied}
                      >
                        {isApplied ? '✔️ Application Submitted' : 'Apply Now for Drive'}
                      </button>
                    )}
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
