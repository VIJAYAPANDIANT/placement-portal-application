import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const StudentDashboard = () => {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatusBreakdown();
  }, []);

  const fetchStatusBreakdown = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/student/dashboard/status-breakdown');
      setBreakdown(res.data);
    } catch (err) {
      console.error('Error fetching student breakdown:', err);
      setError(err.response?.data?.error || 'Failed to fetch application breakdown stats.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Retrieving placement status...</p>
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

  const totalApplications = 
    (breakdown?.applied || 0) + 
    (breakdown?.shortlisted || 0) + 
    (breakdown?.selected || 0) + 
    (breakdown?.rejected || 0);

  const chartData = {
    labels: ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
    datasets: [
      {
        data: [
          breakdown?.applied || 0,
          breakdown?.shortlisted || 0,
          breakdown?.selected || 0,
          breakdown?.rejected || 0
        ],
        backgroundColor: [
          'rgba(13, 110, 253, 0.85)',
          'rgba(255, 193, 7, 0.85)',
          'rgba(25, 135, 84, 0.85)',
          'rgba(220, 53, 69, 0.85)'
        ],
        borderColor: [
          '#0d6efd',
          '#ffc107',
          '#198754',
          '#dc3545'
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, font: { family: "'Inter', sans-serif", size: 12, weight: '500' }, usePointStyle: true }
      },
      title: { display: false }
    },
    cutout: '60%' // Turns Pie into a beautiful modern Doughnut chart
  };

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Welcome Back, Student 👋</h4>
          <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Track your active job applications, interview schedules, and placement status.</p>
        </div>
        <div>
          <Link to="/student/drives" className="btn btn-primary shadow-sm rounded-pill px-4 fw-semibold">
            <i className="bi bi-search me-2"></i>Browse Jobs
          </Link>
        </div>
      </div>

      <div className="row g-4 mb-5">
        {/* KPI 1 */}
        <div className="col-md-3 col-sm-6">
          <div className="card card-hover h-100 border-0 p-3">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Applied</span>
                <div className="bg-primary bg-opacity-10 text-primary rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                  <i className="bi bi-file-earmark-text-fill fs-5"></i>
                </div>
              </div>
              <h2 className="fw-bold text-dark mb-1">{breakdown?.applied || 0}</h2>
              <span className="text-muted small"><i className="bi bi-arrow-right-short text-primary"></i> Active Submissions</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="col-md-3 col-sm-6">
          <div className="card card-hover h-100 border-0 p-3">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Shortlisted</span>
                <div className="bg-warning bg-opacity-10 text-warning rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                  <i className="bi bi-star-fill fs-5"></i>
                </div>
              </div>
              <h2 className="fw-bold text-dark mb-1">{breakdown?.shortlisted || 0}</h2>
              <span className="text-muted small"><i className="bi bi-arrow-right-short text-warning"></i> Interview Ready</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="col-md-3 col-sm-6">
          <div className="card card-hover h-100 border-0 p-3">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Selected</span>
                <div className="bg-success bg-opacity-10 text-success rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                  <i className="bi bi-trophy-fill fs-5"></i>
                </div>
              </div>
              <h2 className="fw-bold text-dark mb-1">{breakdown?.selected || 0}</h2>
              <span className="text-muted small"><i className="bi bi-arrow-up-short text-success"></i> Job Offers Received</span>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="col-md-3 col-sm-6">
          <div className="card card-hover h-100 border-0 p-3">
            <div className="card-body p-2 d-flex flex-column justify-content-between">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-secondary fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Rejected</span>
                <div className="bg-danger bg-opacity-10 text-danger rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px' }}>
                  <i className="bi bi-x-circle-fill fs-5"></i>
                </div>
              </div>
              <h2 className="fw-bold text-dark mb-1">{breakdown?.rejected || 0}</h2>
              <span className="text-muted small"><i className="bi bi-arrow-down-short text-danger"></i> Archived</span>
            </div>
          </div>
        </div>
      </div>

      {totalApplications === 0 ? (
        <div className="card border-0 shadow-sm text-center py-5">
          <div className="card-body">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-mortarboard-fill text-muted" style={{ fontSize: '2.5rem' }}></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">No Active Applications</h4>
            <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
              You haven't applied to any placement drives yet. Explore upcoming campus recruitment opportunities to kickstart your career!
            </p>
            <Link to="/student/drives" className="btn btn-primary px-4 py-2 fw-semibold rounded-pill">
              Browse Available Drives
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-5 col-md-6">
            <div className="card border-0 shadow-sm h-100 p-2">
              <div className="card-header bg-transparent border-0 pt-4 pb-0 px-4">
                <h5 className="fw-bold text-dark mb-0">Application Breakdown</h5>
              </div>
              <div className="card-body d-flex justify-content-center align-items-center">
                <div style={{ maxWidth: '300px', width: '100%' }}>
                  <Pie data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-7 col-md-6">
             <div className="card border-0 shadow-sm h-100 p-2">
              <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold text-dark mb-0">Next Steps</h5>
              </div>
              <div className="card-body px-4">
                <div className="list-group list-group-flush mt-2">
                  <div className="list-group-item px-0 py-3 border-bottom d-flex align-items-start gap-3">
                    <div className="text-primary mt-1"><i className="bi bi-info-circle-fill"></i></div>
                    <div>
                      <h6 className="fw-semibold mb-1">Complete your Profile</h6>
                      <p className="text-muted small mb-0">Ensure your resume and CGPA are up to date before applying.</p>
                    </div>
                  </div>
                  <div className="list-group-item px-0 py-3 border-bottom d-flex align-items-start gap-3">
                    <div className="text-success mt-1"><i className="bi bi-calendar-event-fill"></i></div>
                    <div>
                      <h6 className="fw-semibold mb-1">Check Interview Schedules</h6>
                      <p className="text-muted small mb-0">Monitor the 'My Interviews' tab for any shortlisted drives.</p>
                    </div>
                  </div>
                  <div className="list-group-item px-0 py-3 border-bottom border-0 d-flex align-items-start gap-3">
                    <div className="text-warning mt-1"><i className="bi bi-envelope-paper-fill"></i></div>
                    <div>
                      <h6 className="fw-semibold mb-1">Download CSV Reports</h6>
                      <p className="text-muted small mb-0">Export your application history directly to your email inbox.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
