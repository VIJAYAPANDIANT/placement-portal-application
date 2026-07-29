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
        return <span className="badge badge-soft-warning px-2 py-1"><i className="bi bi-hourglass-split me-1"></i>Pending Approval</span>;
      case 'approved':
        return <span className="badge badge-soft-success px-2 py-1"><i className="bi bi-check-circle-fill me-1"></i>Approved & Active</span>;
      case 'rejected':
        return <span className="badge badge-soft-danger px-2 py-1"><i className="bi bi-x-circle-fill me-1"></i>Rejected</span>;
      case 'closed':
        return <span className="badge badge-soft-secondary px-2 py-1"><i className="bi bi-lock-fill me-1"></i>Closed</span>;
      default:
        return <span className="badge badge-soft-warning px-2 py-1"><i className="bi bi-info-circle-fill me-1"></i>{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Retrieving your placement drives...</p>
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">Company Recruitment Drives</h4>
          <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Manage active listings and review candidate applications.</p>
        </div>
        <button 
          className="btn btn-primary shadow-sm fw-semibold rounded-pill px-4"
          onClick={() => navigate('/company/drives/create')}
        >
          <i className="bi bi-plus-lg me-2"></i>Post New Drive
        </button>
      </div>

      {drives.length === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-briefcase-fill text-primary" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">No Drives Created Yet</h4>
            <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
              Post job opportunities to connect with eligible students from the placement cell.
            </p>
            <button 
              className="btn btn-primary fw-bold px-4 py-2 rounded-pill shadow-sm"
              onClick={() => navigate('/company/drives/create')}
            >
              Launch Your First Drive
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {drives.map(drive => (
            <div key={drive.id} className="col-lg-6 col-xl-4">
              <div className="card card-hover h-100 border-0 shadow-sm d-flex flex-column">
                
                {/* Card Header */}
                <div className="card-body pb-0">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="fw-bold text-dark mb-0 text-truncate pe-3" style={{ maxWidth: '75%' }}>{drive.job_title}</h5>
                    {getStatusBadge(drive.status)}
                  </div>
                  
                  {/* Drive Details */}
                  <div className="bg-light rounded p-3 mb-4">
                    <div className="d-flex flex-column gap-3 small">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted fw-semibold">Annual Package:</span>
                        <span className="fw-bold text-success fs-6 bg-success bg-opacity-10 px-2 rounded">{drive.package_lpa} LPA</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted fw-semibold">Eligibility:</span>
                        <span className="fw-bold text-dark">≥ {drive.eligibility_cgpa} CGPA</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted fw-semibold">Deadline:</span>
                        <span className="fw-bold text-dark">{drive.application_deadline || 'N/A'}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted fw-semibold">Target Branches:</span>
                        <span className="fw-bold text-dark text-truncate ms-3" style={{ maxWidth: '120px' }}>
                          {drive.eligible_branches?.join(', ') || 'All Branches'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="card-footer bg-transparent border-top-0 pt-0 pb-3 mt-auto px-4">
                  <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: 'var(--bs-primary-bg-subtle)' }}>
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-white rounded-circle d-flex align-items-center justify-content-center text-primary" style={{ width: '32px', height: '32px' }}>
                        <i className="bi bi-people-fill"></i>
                      </div>
                      <div>
                        <span className="d-block text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Candidates</span>
                        <span className="fw-black text-dark lh-1">{drive.applicant_count || 0}</span>
                      </div>
                    </div>
                    
                    <button
                      className="btn btn-primary fw-semibold rounded-pill px-4 shadow-sm"
                      onClick={() => navigate(`/company/drives/${drive.id}/applicants`)}
                    >
                      Review
                    </button>
                  </div>
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
