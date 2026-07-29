import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const PendingDrives = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchPendingDrives();
  }, []);

  const fetchPendingDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/drives/pending');
      setDrives(res.data);
    } catch (err) {
      console.error('Error fetching pending drives:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending drives.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (id, action) => {
    try {
      setAlert(null);
      const response = await api.put(`/admin/drives/${id}/approve`, { action });
      
      setDrives(prev => prev.filter(drive => drive.id !== id));
      
      setAlert({
        type: 'success',
        message: response.data.message || `Drive successfully ${action === 'approve' ? 'approved' : 'rejected'}.`
      });
      
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      console.error(`Error updating drive ${id} status:`, err);
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || `Failed to ${action} drive.`
      });
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Fetching pending placement drives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger shadow-sm p-4 text-center fade-in">
        <div className="text-danger mb-3" style={{ fontSize: '2.5rem' }}><i className="bi bi-exclamation-triangle-fill"></i></div>
        <h5 className="fw-bold text-dark mb-2">Error Loading Drives</h5>
        <p className="text-muted mb-4">{error}</p>
        <button className="btn btn-outline-danger fw-semibold rounded-pill px-4 mx-auto" onClick={() => window.location.reload()}>
          <i className="bi bi-arrow-clockwise me-2"></i>Retry
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Placement Drive Approvals</h4>
        <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Review and verify newly created job drives before making them visible to students.</p>
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
          <h5 className="fw-bold text-dark mb-0">Pending Approvals</h5>
          <span className="badge badge-soft-warning px-3 py-2 fs-6">
            <i className="bi bi-hourglass-split me-2"></i>{drives.length} Pending
          </span>
        </div>

        {drives.length === 0 ? (
          <div className="card-body text-center py-5">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-briefcase text-muted" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h5 className="fw-bold text-dark mb-2">No Pending Drives</h5>
            <p className="text-muted mb-0">All placement drive requests have been evaluated.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3 text-muted small fw-bold">#</th>
                  <th className="px-4 py-3 text-muted small fw-bold">JOB TITLE</th>
                  <th className="px-4 py-3 text-muted small fw-bold">COMPANY NAME</th>
                  <th className="px-4 py-3 text-muted small fw-bold">PACKAGE</th>
                  <th className="px-4 py-3 text-muted small fw-bold">ELIGIBILITY</th>
                  <th className="px-4 py-3 text-muted small fw-bold text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {drives.map((drive, idx) => (
                  <tr key={drive.id}>
                    <td className="px-4 text-muted fw-semibold">{idx + 1}</td>
                    <td className="px-4 fw-bold text-dark">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                          <i className="bi bi-briefcase"></i>
                        </div>
                        {drive.job_title}
                      </div>
                    </td>
                    <td className="px-4 text-secondary fw-medium">{drive.company_name}</td>
                    <td className="px-4">
                      <span className="badge badge-soft-success px-2 py-1 fs-6">
                        <i className="bi bi-currency-rupee"></i>{drive.package_lpa} LPA
                      </span>
                    </td>
                    <td className="px-4">
                      <span className="badge badge-soft-info px-2 py-1 fs-6">
                        &ge; {drive.eligibility_cgpa} CGPA
                      </span>
                    </td>
                    <td className="px-4 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-sm btn-success fw-semibold shadow-sm d-flex align-items-center gap-1 px-3"
                          onClick={() => handleApproveReject(drive.id, 'approve')}
                        >
                          <i className="bi bi-check-lg"></i> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger fw-semibold d-flex align-items-center gap-1 px-3"
                          onClick={() => handleApproveReject(drive.id, 'reject')}
                        >
                          <i className="bi bi-x-lg"></i> Reject
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
    </div>
  );
};

export default PendingDrives;
