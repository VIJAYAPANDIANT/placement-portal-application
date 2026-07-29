import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const MyDrives = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanyDrives();
  }, []);

  const fetchCompanyDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/company/drives');
      setDrives(res.data);
    } catch (err) {
      console.error('Error fetching company drives:', err);
      setError(err.response?.data?.error || 'Failed to retrieve your placement drives.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-pill pill-warning">● Pending Approval</span>;
      case 'approved':
        return <span className="status-pill pill-success">● Approved & Active</span>;
      case 'rejected':
        return <span className="status-pill pill-danger">● Rejected</span>;
      case 'closed':
        return <span className="status-pill pill-info">● Closed</span>;
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
        <p className="mt-3 text-muted">Retrieving your placement drives...</p>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Company Recruitment Drives</h4>
          <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Manage active listings and review candidate applications.</p>
        </div>
        <button 
          className="btn btn-primary fw-bold btn-sm px-3 py-2"
          style={{ borderRadius: '8px' }}
          onClick={() => navigate('/company/drives/create')}
        >
          ➕ Post New Drive
        </button>
      </div>

      {drives.length === 0 ? (
        <div className="panel-card p-5 text-center">
          <div style={{ fontSize: '2.5rem' }}>💼</div>
          <p className="mt-3 fw-semibold mb-1">No drives created yet</p>
          <small className="text-muted d-block mb-3">Post job opportunities to connect with eligible students from Easwari Engineering College.</small>
          <button 
            className="btn btn-sm btn-primary fw-bold px-4"
            style={{ borderRadius: '6px' }}
            onClick={() => navigate('/company/drives/create')}
          >
            Launch Your First Drive
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {drives.map(drive => (
            <div key={drive.id} className="col-md-6 col-lg-4">
              <div className="panel-card h-100 d-flex flex-column justify-content-between mb-0">
                <div className="panel-header">
                  <h5 className="panel-title text-truncate">{drive.job_title}</h5>
                </div>
                
                <div className="panel-body flex-grow-1">
                  <div className="mb-3">
                    {getStatusBadge(drive.status)}
                  </div>

                  <div className="small" style={{ color: 'var(--muted)', fontSize: '12px' }}>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Annual Package:</span>
                      <span className="fw-bold text-success" style={{ fontSize: '13px' }}>{drive.package_lpa} LPA</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Eligibility Cutoff:</span>
                      <span className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>≥ {drive.eligibility_cgpa} CGPA</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Application Deadline:</span>
                      <span className="fw-bold" style={{ color: 'var(--bs-body-color)' }}>{drive.application_deadline || 'N/A'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Target Branches:</span>
                      <span className="fw-bold text-truncate ms-2" style={{ color: 'var(--bs-body-color)' }}>
                        {drive.eligible_branches?.join(', ') || 'All Branches'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-top d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--card-border)', background: 'var(--table-hover)' }}>
                  <span style={{ fontSize: '12px' }}>
                    👥 Candidates: <strong className="text-primary">{drive.applicant_count || 0}</strong>
                  </span>
                  <button
                    className="btn btn-sm btn-outline-primary fw-bold px-3"
                    style={{ borderRadius: '6px', fontSize: '12px' }}
                    onClick={() => navigate(`/company/drives/${drive.id}/applicants`)}
                  >
                    Review Applicants
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDrives;
