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
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Fetching pending company requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger shadow-sm p-4 text-center fade-in">
        <div className="text-danger mb-3" style={{ fontSize: '2.5rem' }}><i className="bi bi-exclamation-triangle-fill"></i></div>
        <h5 className="fw-bold text-dark mb-2">Error Loading Companies</h5>
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
        <h4 className="fw-bold text-dark mb-1">Company Registrations</h4>
        <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Review and approve new employer accounts before they can post recruitment drives.</p>
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
            <i className="bi bi-hourglass-split me-2"></i>{companies.length} Pending
          </span>
        </div>

        {companies.length === 0 ? (
          <div className="card-body text-center py-5">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-buildings text-muted" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h5 className="fw-bold text-dark mb-2">No Pending Companies</h5>
            <p className="text-muted mb-0">All company registrations have been processed.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3 text-muted small fw-bold">#</th>
                  <th className="px-4 py-3 text-muted small fw-bold">COMPANY NAME</th>
                  <th className="px-4 py-3 text-muted small fw-bold">EMAIL ADDRESS</th>
                  <th className="px-4 py-3 text-muted small fw-bold">INDUSTRY</th>
                  <th className="px-4 py-3 text-muted small fw-bold">HR CONTACT</th>
                  <th className="px-4 py-3 text-muted small fw-bold text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {companies.map((company, idx) => (
                  <tr key={company.id}>
                    <td className="px-4 text-muted fw-semibold">{idx + 1}</td>
                    <td className="px-4 fw-bold text-dark">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                          <i className="bi bi-building"></i>
                        </div>
                        {company.name}
                      </div>
                    </td>
                    <td className="px-4 text-secondary">{company.email}</td>
                    <td className="px-4">
                      <span className="badge badge-soft-info px-2 py-1">
                        <i className="bi bi-tag-fill me-1"></i>{company.industry || 'General IT'}
                      </span>
                    </td>
                    <td className="px-4 text-secondary">{company.hr_contact || 'Not provided'}</td>
                    <td className="px-4 text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-sm btn-success fw-semibold shadow-sm d-flex align-items-center gap-1 px-3"
                          onClick={() => handleApproveReject(company.id, 'approve')}
                        >
                          <i className="bi bi-check-lg"></i> Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger fw-semibold d-flex align-items-center gap-1 px-3"
                          onClick={() => handleApproveReject(company.id, 'reject')}
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

export default PendingCompanies;
