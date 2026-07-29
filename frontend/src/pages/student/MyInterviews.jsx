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

  const getModeBadge = (mode) => {
    if (mode === 'online') {
      return <span className="status-pill pill-info">💻 Online Meeting</span>;
    }
    return <span className="status-pill pill-purple">🏛️ Campus Venue</span>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading your interview schedule...</p>
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
        <h4 className="fw-bold mb-1">Scheduled Interview Rounds</h4>
        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Confirmed interview dates, venues, meeting links, and candidate instructions.</p>
      </div>

      {interviews.length === 0 ? (
        <div className="panel-card p-5 text-center">
          <div style={{ fontSize: '2.5rem' }}>📅</div>
          <p className="mt-3 fw-semibold mb-1">No interviews scheduled yet</p>
          <small className="text-muted">Your applications are currently under review by hiring companies. Interview calls will appear here once scheduled.</small>
        </div>
      ) : (
        <div className="row g-3">
          {interviews.map((iv, idx) => (
            <div key={idx} className="col-md-6 col-lg-4">
              <div className="panel-card h-100 d-flex flex-column justify-content-between mb-0">
                <div className="panel-header">
                  <div className="flex-grow-1 text-truncate pe-2">
                    <h5 className="panel-title text-truncate">{iv.job_title}</h5>
                    <span className="text-primary fw-semibold" style={{ fontSize: '12px' }}>{iv.company_name}</span>
                  </div>
                  {getModeBadge(iv.interview_mode)}
                </div>

                <div className="panel-body flex-grow-1">
                  <div className="mb-3" style={{ fontSize: '12px' }}>
                    <div className="mb-2">
                      <span className="text-muted d-block" style={{ fontSize: '10px' }}>SCHEDULED DATE</span>
                      <strong className="fw-bold" style={{ color: 'var(--bs-body-color)', fontSize: '14px' }}>📅 {iv.interview_date || 'N/A'}</strong>
                    </div>

                    <div className="mb-2">
                      <span className="text-muted d-block" style={{ fontSize: '10px' }}>
                        {iv.interview_mode === 'online' ? 'MEETING LINK' : 'VENUE LOCATION'}
                      </span>
                      {iv.location_or_link ? (
                        iv.interview_mode === 'online' ? (
                          <a 
                            href={iv.location_or_link.startsWith('http') ? iv.location_or_link : `https://${iv.location_or_link}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="fw-bold text-decoration-none"
                          >
                            🔗 Join Online Meeting Room
                          </a>
                        ) : (
                          <strong style={{ color: 'var(--bs-body-color)' }}>{iv.location_or_link}</strong>
                        )
                      ) : (
                        <span className="text-muted">Details will be updated soon</span>
                      )}
                    </div>
                  </div>

                  {iv.notes && (
                    <div className="p-3 border rounded" style={{ background: 'var(--table-hover)', borderColor: 'var(--card-border)', fontSize: '12px' }}>
                      <span className="text-muted d-block mb-1" style={{ fontSize: '10px' }}>CANDIDATE INSTRUCTIONS</span>
                      <p className="mb-0" style={{ color: 'var(--bs-body-color)', whiteSpace: 'pre-line' }}>
                        {iv.notes}
                      </p>
                    </div>
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
