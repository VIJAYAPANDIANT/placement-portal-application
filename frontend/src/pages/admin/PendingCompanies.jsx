import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

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
      setCompanies((prev) => prev.filter((company) => company.id !== id));
      setAlert({
        type: 'success',
        message: response.data.message || `Company successfully ${action === 'approve' ? 'approved' : 'rejected'}.`,
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      console.error(`Error updating company ${id} status:`, err);
      setAlert({
        type: 'danger',
        message: err.response?.data?.message || `Failed to ${action} company.`,
      });
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-dark">Company Approval Funnel</h4>
          <p className="text-muted fs-7 mb-0">Review recruiter registration requests and verify organization credentials.</p>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} rounded-3 mb-4`} role="alert">
          {alert.message}
        </div>
      )}

      <div className="card saas-card border-0 p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold text-dark mb-0">Pending Recruiters</h6>
          <StatusBadge status="pending" />
        </div>

        {loading ? (
          <SkeletonLoader type="table" count={4} />
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : companies.length === 0 ? (
          <EmptyState
            title="All Companies Processed"
            message="There are no pending company registration requests at this time."
            icon="bi-building-check"
          />
        ) : (
          <div className="table-responsive">
            <table className="table align-middle border-top">
              <thead className="table-light fs-7 text-uppercase text-muted">
                <tr>
                  <th>Company Name</th>
                  <th>Official Email</th>
                  <th>Industry</th>
                  <th>HR Contact</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td><span className="fw-bold text-dark">{company.name}</span></td>
                    <td className="text-muted">{company.email}</td>
                    <td><span className="badge bg-info-subtle text-info fw-semibold">{company.industry || 'IT'}</span></td>
                    <td className="text-muted">{company.hr_contact || 'N/A'}</td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          className="btn btn-sm btn-success px-3 py-1 fs-8"
                          onClick={() => handleApproveReject(company.id, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger px-3 py-1 fs-8"
                          style={{ borderRadius: '6px' }}
                          onClick={() => handleApproveReject(company.id, 'reject')}
                        >
                          Reject
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
