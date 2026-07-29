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
        return <span className="badge badge-soft-primary"><i className="bi bi-send-fill me-1"></i>Applied</span>;
      case 'shortlisted':
        return <span className="badge badge-soft-warning"><i className="bi bi-star-fill me-1"></i>Shortlisted</span>;
      case 'selected':
        return <span className="badge badge-soft-success"><i className="bi bi-trophy-fill me-1"></i>Selected</span>;
      case 'rejected':
        return <span className="badge badge-soft-danger"><i className="bi bi-x-circle-fill me-1"></i>Rejected</span>;
      default:
        return <span className="badge badge-soft-secondary"><i className="bi bi-info-circle-fill me-1"></i>{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Retrieving your application history...</p>
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
          <h4 className="fw-bold text-dark mb-1">My Application History</h4>
          <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Track your active job applications and current interview statuses.</p>
        </div>
        {applications.length > 0 && (
          <button
            className="btn btn-outline-primary shadow-sm fw-semibold rounded-pill px-4"
            onClick={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Starting Export...</>
            ) : (
              <><i className="bi bi-cloud-download-fill me-2"></i>Export CSV</>
            )}
          </button>
        )}
      </div>

      {exportAlert && (
        <div className={`alert alert-${exportAlert.type} alert-dismissible fade show mb-4 shadow-sm`} role="alert">
          <i className={`bi ${exportAlert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
          {exportAlert.message}
          <button type="button" className="btn-close" onClick={() => setExportAlert(null)} aria-label="Close"></button>
        </div>
      )}

      <div className="card border-0 shadow-sm overflow-hidden">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-dark mb-0">Submitted Applications</h5>
          <span className="badge badge-soft-primary px-3 py-2 fs-6">
            <i className="bi bi-file-earmark-text-fill me-2"></i>{applications.length} Total
          </span>
        </div>

        {applications.length === 0 ? (
          <div className="card-body text-center py-5">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-journal-x text-muted" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h5 className="fw-bold text-dark mb-2">No Applications Yet</h5>
            <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
              You haven't submitted any applications. Explore active campus drives to start your placement journey.
            </p>
            <Link to="/student/drives" className="btn btn-primary px-4 py-2 fw-semibold rounded-pill">
              Explore Active Drives
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-custom mb-0">
              <thead>
                <tr>
                  <th scope="col" className="ps-4" style={{ width: '50px' }}>#</th>
                  <th scope="col">Company Name</th>
                  <th scope="col">Job Title</th>
                  <th scope="col">Package</th>
                  <th scope="col">Applied On</th>
                  <th scope="col" className="pe-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, idx) => (
                  <tr key={app.id}>
                    <td className="ps-4 text-muted fw-semibold">{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 rounded d-flex align-items-center justify-content-center text-primary" style={{ width: '32px', height: '32px' }}>
                          <i className="bi bi-building"></i>
                        </div>
                        <span className="fw-bold text-dark">{app.company_name}</span>
                      </div>
                    </td>
                    <td className="fw-semibold text-secondary">{app.job_title}</td>
                    <td>
                      <span className="badge badge-soft-success fw-bold">{app.package_lpa} LPA</span>
                    </td>
                    <td className="text-muted small fw-medium">{app.applied_on || 'N/A'}</td>
                    <td className="pe-4">{getStatusBadge(app.status)}</td>
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
