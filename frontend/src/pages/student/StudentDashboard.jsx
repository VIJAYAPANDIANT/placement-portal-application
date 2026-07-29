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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Retrieving placement status...</p>
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
          'rgba(37, 99, 235, 0.7)',
          'rgba(217, 119, 6, 0.7)',
          'rgba(22, 163, 74, 0.7)',
          'rgba(220, 38, 38, 0.7)'
        ],
        borderColor: [
          'rgba(37, 99, 235, 1)',
          'rgba(217, 119, 6, 1)',
          'rgba(22, 163, 74, 1)',
          'rgba(220, 38, 38, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 15, font: { size: 12 } }
      },
      title: { display: false }
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Welcome Back 👋</h4>
        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Track your active job applications, interview schedules, and placement status.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3 col-6">
          <div className="kpi-card">
            <div className="kpi-label">Applied</div>
            <div className="kpi-value text-info">{breakdown?.applied || 0}</div>
            <div className="kpi-sub">📝 Submissions Sent</div>
            <div className="trend-up"><span>•</span> Active Drives</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="kpi-card">
            <div className="kpi-label">Shortlisted</div>
            <div className="kpi-value text-warning">{breakdown?.shortlisted || 0}</div>
            <div className="kpi-sub">⭐ Interview Ready</div>
            <div className="trend-neutral"><span>•</span> In Progress</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="kpi-card">
            <div className="kpi-label">Selected</div>
            <div className="kpi-value text-success">{breakdown?.selected || 0}</div>
            <div className="kpi-sub">🎉 Job Offers</div>
            <div className="trend-up"><span>↑</span> Placed Status</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="kpi-card">
            <div className="kpi-label">Rejected</div>
            <div className="kpi-value text-danger">{breakdown?.rejected || 0}</div>
            <div className="kpi-sub">❌ Archived Applications</div>
            <div className="trend-down"><span>•</span> Not Selected</div>
          </div>
        </div>
      </div>

      {totalApplications === 0 ? (
        <div className="panel-card p-5 text-center">
          <div style={{ fontSize: '2.5rem' }}>🎓</div>
          <p className="mt-3 fw-semibold mb-1">No active placement applications yet</p>
          <small className="text-muted d-block mb-4">Explore upcoming campus recruitment drives and submit applications before deadlines.</small>
          <Link to="/student/drives" className="btn btn-sm btn-primary fw-bold px-4" style={{ borderRadius: '6px' }}>
            Browse & Apply for Drives
          </Link>
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-lg-6 mx-auto">
            <div className="panel-card">
              <div className="panel-header text-center">
                <h5 className="panel-title">Application Status Distribution</h5>
              </div>
              <div className="panel-body d-flex justify-content-center">
                <div style={{ maxWidth: '340px', width: '100%' }}>
                  <Pie data={chartData} options={chartOptions} />
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
