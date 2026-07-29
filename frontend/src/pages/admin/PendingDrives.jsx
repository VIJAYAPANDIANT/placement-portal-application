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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Fetching pending placement drives...</p>
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
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mb-4`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)} aria-label="Close"></button>
        </div>
      )}

      <div className="panel-card">
        <div className="panel-header">
          <h5 className="panel-title">Pending Placement Drives Approval</h5>
          <span className="status-pill pill-warning">
            ● {drives.length} Pending
          </span>
        </div>

        {drives.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '2.5rem' }}>🎯</div>
            <p className="mt-3 fw-semibold mb-1">No pending drives to review</p>
            <small className="text-muted">All company drive requests have been evaluated.</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enhanced-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Job Title</th>
                  <th>Company Name</th>
                  <th>Package</th>
                  <th>Eligibility</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drives.map((drive, idx) => (
                  <tr key={drive.id}>
                    <td className="text-muted fw-bold" style={{ fontSize: '11px' }}>{idx + 1}</td>
                    <td className="fw-bold">{drive.job_title}</td>
                    <td>{drive.company_name}</td>
                    <td>
                      <span className="status-pill pill-success">
                        {drive.package_lpa} LPA
                      </span>
                    </td>
                    <td>
                      <span className="status-pill pill-info">
                        ≥ {drive.eligibility_cgpa} CGPA
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-success me-2 px-3"
                        style={{ borderRadius: '6px', fontSize: '12px' }}
                        onClick={() => handleApproveReject(drive.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger px-3"
                        style={{ borderRadius: '6px', fontSize: '12px' }}
                        onClick={() => handleApproveReject(drive.id, 'reject')}
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
    </div>
  );
};

export default PendingDrives;
