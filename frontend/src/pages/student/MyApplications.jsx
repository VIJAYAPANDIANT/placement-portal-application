import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportAlert, setExportAlert] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/student/applications');
      setApplications(res.data);
    } catch (err) {
      console.error('Error fetching student applications:', err);
      setError(err.response?.data?.error || 'Failed to retrieve applications.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      setExportAlert(null);
      const res = await api.post('/student/export-csv');
      setExportAlert({
        type: 'success',
        message: res.data.message || 'Export started, you will receive an email shortly'
      });
      setTimeout(() => setExportAlert(null), 4000);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setExportAlert({
        type: 'danger',
        message: err.response?.data?.error || 'Failed to trigger CSV export.'
      });
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'applied':
        return <span className="status-pill pill-info">● Applied</span>;
      case 'shortlisted':
        return <span className="status-pill pill-purple">● Shortlisted</span>;
      case 'selected':
        return <span className="status-pill pill-success">● Selected</span>;
      case 'rejected':
        return <span className="status-pill pill-danger">● Rejected</span>;
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
        <p className="mt-3 text-muted">Retrieving your application history...</p>
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
          <h4 className="fw-bold mb-1">My Application History</h4>
          <p className="text-muted mb-0" style={{ fontSize: '13px' }}>View current status and export records for all submitted drive applications.</p>
        </div>
        {applications.length > 0 && (
          <button
            className="btn btn-outline-primary fw-bold btn-sm px-3 py-2"
            style={{ borderRadius: '8px' }}
            onClick={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? '⏳ Starting Export...' : '📥 Export Applications CSV'}
          </button>
        )}
      </div>

      {exportAlert && (
        <div className={`alert alert-${exportAlert.type} alert-dismissible fade show mb-4`} role="alert">
          {exportAlert.message}
          <button type="button" className="btn-close" onClick={() => setExportAlert(null)} aria-label="Close"></button>
        </div>
      )}

      <div className="panel-card">
        <div className="panel-header">
          <h5 className="panel-title">Submitted Drive Applications</h5>
          <span className="status-pill pill-info">📝 {applications.length} Total Applications</span>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: '2.5rem' }}>📝</div>
            <p className="mt-3 fw-semibold mb-1">No applications submitted yet</p>
            <small className="text-muted d-block mb-4">Explore available campus drives and apply to start tracking your recruitment status.</small>
            <Link to="/student/drives" className="btn btn-sm btn-primary fw-bold px-4" style={{ borderRadius: '6px' }}>
              Explore Active Drives
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enhanced-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Company Name</th>
                  <th>Job Title</th>
                  <th>Package LPA</th>
                  <th>Applied On</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <tr key={app.id}>
                    <td className="text-muted fw-bold" style={{ fontSize: '11px' }}>{idx + 1}</td>
                    <td className="fw-bold text-primary">{app.company_name}</td>
                    <td className="fw-bold">{app.job_title}</td>
                    <td><span className="status-pill pill-success">{app.package_lpa} LPA</span></td>
                    <td>{app.applied_on || 'N/A'}</td>
                    <td>{getStatusBadge(app.status)}</td>
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

export default MyApplications;
