import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import './admin.css';

const PendingCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'active'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/companies');
      setCompanies(res.data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err.response?.data?.message || 'Failed to fetch companies directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = async (id, action) => {
    try {
      setAlert(null);
      const response = await api.put(`/admin/companies/${id}/approve`, { action });
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, approval_status: action === 'approve' ? 'approved' : 'rejected' } : c))
      );
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

  const handleDeleteCompany = async (id, name) => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete the company account for "${name}"? This will remove all their placement drives, schedules, student applications, and cannot be undone.`)) {
      try {
        setAlert(null);
        await api.delete(`/admin/companies/${id}`);
        setCompanies((prev) => prev.filter((c) => c.id !== id));
        setAlert({
          type: 'success',
          message: `Company account for "${name}" has been permanently deleted.`,
        });
        setTimeout(() => setAlert(null), 3000);
      } catch (err) {
        console.error('Error deleting company:', err);
        setAlert({
          type: 'danger',
          message: err.response?.data?.message || 'Failed to delete company account.',
        });
      }
    }
  };

  const getLastActiveBadge = (lastActiveStr) => {
    if (!lastActiveStr) return <span className="text-muted fs-8">Never</span>;
    const lastActiveDate = new Date(lastActiveStr);
    const diffMs = new Date() - lastActiveDate;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return <span className="text-success fw-bold fs-8" title={lastActiveDate.toLocaleString()}>Just now</span>;
    }
    if (diffMins < 60) {
      return <span className="text-success fw-bold fs-8" title={lastActiveDate.toLocaleString()}>{diffMins}m ago</span>;
    }
    if (diffHours < 24) {
      return <span className="text-dark fs-8" title={lastActiveDate.toLocaleString()}>{diffHours}h ago</span>;
    }
    if (diffDays < 30) {
      return <span className="text-dark fs-8" title={lastActiveDate.toLocaleString()}>{diffDays}d ago</span>;
    }
    return (
      <span className="badge bg-danger-subtle text-danger fw-semibold" title={lastActiveDate.toLocaleString()}>
        Inactive ({diffDays}d)
      </span>
    );
  };

  const filteredCompanies = companies.filter((c) => {
    if (activeTab === 'pending') {
      return c.approval_status === 'pending';
    } else {
      return c.approval_status === 'approved';
    }
  });

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-dark">Company Directory & Approvals</h4>
          <p className="text-muted fs-7 mb-0">Review registration requests, monitor active recruiters, and manage company accounts.</p>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} rounded-3 mb-4`} role="alert">
          {alert.message}
        </div>
      )}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3">
        <button
          className={`btn btn-sm px-4 py-2 fw-bold border ${activeTab === 'pending' ? 'btn-primary' : 'btn-light text-muted'}`}
          style={{ borderRadius: '8px' }}
          onClick={() => setActiveTab('pending')}
        >
          Pending Approvals ({companies.filter(c => c.approval_status === 'pending').length})
        </button>
        <button
          className={`btn btn-sm px-4 py-2 fw-bold border ${activeTab === 'active' ? 'btn-primary' : 'btn-light text-muted'}`}
          style={{ borderRadius: '8px' }}
          onClick={() => setActiveTab('active')}
        >
          Active Recruiters ({companies.filter(c => c.approval_status === 'approved').length})
        </button>
      </div>

      <div className="card saas-card border-0 p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold text-dark mb-0">
            {activeTab === 'pending' ? 'Pending Registrations' : 'Active Corporate Partners'}
          </h6>
          <StatusBadge status={activeTab === 'pending' ? 'pending' : 'approved'} />
        </div>

        {loading ? (
          <SkeletonLoader type="table" count={4} />
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : filteredCompanies.length === 0 ? (
          <EmptyState
            title={activeTab === 'pending' ? 'All Companies Processed' : 'No Active Companies'}
            message={activeTab === 'pending' ? 'There are no pending company registration requests at this time.' : 'There are no active approved company accounts registered.'}
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
                  {activeTab === 'active' && <th>Last Active</th>}
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <span className="fw-bold text-dark d-block">{company.name}</span>
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="fs-8 text-primary text-decoration-none">
                          {company.website}
                        </a>
                      )}
                    </td>
                    <td className="text-muted">{company.email}</td>
                    <td><span className="badge bg-info-subtle text-info fw-semibold">{company.industry || 'IT'}</span></td>
                    <td className="text-muted">{company.hr_contact || 'N/A'}</td>
                    {activeTab === 'active' && <td>{getLastActiveBadge(company.last_active_at)}</td>}
                    <td className="text-end">
                      {activeTab === 'pending' ? (
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
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-danger px-2 py-1 fs-8"
                          style={{ borderRadius: '6px', border: '1px solid #fee2e2' }}
                          onClick={() => handleDeleteCompany(company.id, company.name)}
                          title="Delete Company Permanently"
                        >
                          🗑️ Delete Account
                        </button>
                      )}
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
