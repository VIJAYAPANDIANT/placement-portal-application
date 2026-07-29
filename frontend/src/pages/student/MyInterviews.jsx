import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const MyInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/student/interviews');
      setInterviews(res.data);
    } catch (err) {
      console.error('Error fetching interviews:', err);
      setError(err.response?.data?.error || 'Failed to retrieve scheduled interviews.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Loading your interview schedule...</p>
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
        <h4 className="fw-bold text-dark mb-1">Scheduled Interviews</h4>
        <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Track confirmed interview dates, meeting links, and candidate instructions.</p>
      </div>

      {interviews.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-calendar2-x text-muted" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h5 className="fw-bold text-dark mb-2">No Scheduled Interviews</h5>
            <p className="text-muted mb-0 mx-auto" style={{ maxWidth: '400px' }}>
              Your applications are under review. Companies will schedule interviews here if you are shortlisted.
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {interviews.map((iv, idx) => (
            <div key={idx} className="col-lg-6 col-xl-4">
              <div className="card card-hover h-100 border-0 shadow-sm d-flex flex-column">
                
                {/* Card Header */}
                <div className="card-body pb-0">
                  <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                      <h5 className="fw-bold text-dark mb-1 text-truncate" style={{ maxWidth: '200px' }}>{iv.job_title}</h5>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-building text-primary"></i>
                        <span className="text-primary fw-semibold" style={{ fontSize: '0.9rem' }}>{iv.company_name}</span>
                      </div>
                    </div>
                    {iv.interview_mode === 'online' ? (
                      <span className="badge badge-soft-primary px-2 py-1 fs-6 d-flex align-items-center gap-1">
                        <i className="bi bi-laptop"></i>Online
                      </span>
                    ) : (
                      <span className="badge badge-soft-secondary px-2 py-1 fs-6 d-flex align-items-center gap-1">
                        <i className="bi bi-geo-alt-fill"></i>Campus
                      </span>
                    )}
                  </div>

                  {/* Interview Date & Location */}
                  <div className="d-flex flex-column gap-3 mb-4">
                    <div className="d-flex align-items-center gap-3 bg-light rounded p-2 px-3">
                      <div className="text-primary fs-4"><i className="bi bi-calendar-check-fill"></i></div>
                      <div>
                        <span className="text-muted text-uppercase fw-semibold d-block mb-0" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Date & Time</span>
                        <span className="fw-bold text-dark">{iv.interview_date || 'TBD'}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 bg-light rounded p-2 px-3">
                      <div className="text-success fs-4">
                        <i className={iv.interview_mode === 'online' ? 'bi bi-camera-video-fill' : 'bi bi-pin-map-fill'}></i>
                      </div>
                      <div className="text-truncate flex-grow-1">
                        <span className="text-muted text-uppercase fw-semibold d-block mb-0" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                          {iv.interview_mode === 'online' ? 'Meeting Link' : 'Venue'}
                        </span>
                        {iv.location_or_link ? (
                          iv.interview_mode === 'online' ? (
                            <a 
                              href={iv.location_or_link.startsWith('http') ? iv.location_or_link : `https://${iv.location_or_link}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="fw-bold text-decoration-none text-truncate d-block"
                            >
                              Join Meeting <i className="bi bi-box-arrow-up-right ms-1 small"></i>
                            </a>
                          ) : (
                            <span className="fw-bold text-dark text-truncate d-block">{iv.location_or_link}</span>
                          )
                        ) : (
                          <span className="text-muted small">Details pending</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  {iv.notes && (
                    <div className="mb-4">
                      <span className="text-muted text-uppercase fw-semibold d-block mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Instructions</span>
                      <p className="text-secondary small mb-0 bg-light p-3 rounded border border-light shadow-sm" style={{ whiteSpace: 'pre-line' }}>
                        {iv.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="card-footer bg-transparent border-top-0 pt-0 pb-3 mt-auto px-4">
                  {iv.interview_mode === 'online' && iv.location_or_link ? (
                    <a 
                      href={iv.location_or_link.startsWith('http') ? iv.location_or_link : `https://${iv.location_or_link}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-primary w-100 fw-bold shadow-sm"
                    >
                      <i className="bi bi-camera-video-fill me-2"></i>Join Online Interview
                    </a>
                  ) : (
                    <button className="btn btn-outline-secondary w-100 fw-bold disabled">
                      <i className="bi bi-calendar-check me-2"></i>Confirmed
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyInterviews;
