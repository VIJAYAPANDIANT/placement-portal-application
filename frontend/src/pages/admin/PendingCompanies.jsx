import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const PendingCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchPendingCompanies();
  }, []);

  const fetchPendingCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/companies/pending');
      setCompanies(res.data);
    } catch (err) {
      console.error('Error fetching pending companies:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending companies.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (id, action) => {
    try {
      setAlert(null);
      const response = await api.put(`/admin/companies/${id}/approve`, { action });
      
      setCompanies(prev => prev.filter(company => company.id !== id));
      
      setAlert({
        type: 'success',
        message: response.data.message || `Company successfully ${action === 'approve' ? 'approved' : 'rejected'}.`
      });
      
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      console.error(`Error updating company ${id} status:`, err);
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || `Failed to ${action} company.`
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Fetching pending company requests...</p>
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
          <h5 className="panel-title">Pending Company Registration Approvals</h5>
          <span className="status-pill pill-warning">
            ● {companies.length} Pending
          </span>
        </div>

        {companies.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '2.5rem' }}>🏢</div>
            <p className="mt-3 fw-semibold mb-1">No pending companies to review</p>
            <small className="text-muted">All company registrations have been processed and approved.</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enhanced-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company Name</th>
                  <th>Email</th>
                  <th>Industry</th>
                  <th>HR Contact</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, idx) => (
                  <tr key={company.id}>
                    <td className="text-muted fw-bold" style={{ fontSize: '11px' }}>{idx + 1}</td>
                    <td className="fw-bold">{company.name}</td>
                    <td>{company.email}</td>
                    <td>
                      <span className="status-pill pill-info">
                        {company.industry || 'General IT'}
                      </span>
                    </td>
                    <td>{company.hr_contact || 'Not provided'}</td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-success me-2 px-3"
                        style={{ borderRadius: '6px', fontSize: '12px' }}
                        onClick={() => handleApproveReject(company.id, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger px-3"
                        style={{ borderRadius: '6px', fontSize: '12px' }}
                        onClick={() => handleApproveReject(company.id, 'reject')}
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

export default PendingCompanies;
