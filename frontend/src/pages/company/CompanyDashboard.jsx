import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CompanyDashboard = () => {
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFunnelData();
  }, []);

  const fetchFunnelData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/company/dashboard/funnel');
      setFunnel(res.data);
    } catch (err) {
      console.error('Error fetching funnel stats:', err);
      setError(err.response?.data?.error || 'Failed to fetch recruitment funnel stats.');
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
        <p className="mt-3 text-muted fw-medium">Loading recruitment analytics...</p>
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

  const chartData = {
    labels: ['Applied', 'Shortlisted', 'Selected', 'Rejected'],
    datasets: [
      {
        label: 'Candidates Count',
        data: [
          funnel?.applied || 0,
          funnel?.shortlisted || 0,
          funnel?.selected || 0,
          funnel?.rejected || 0
        ],
        backgroundColor: [
          'rgba(79, 70, 229, 0.85)', // Indigo
          'rgba(245, 158, 11, 0.85)', // Amber
          'rgba(16, 185, 129, 0.85)', // Emerald
          'rgba(239, 68, 68, 0.85)'   // Red
        ],
        borderWidth: 0,
        borderRadius: 8,
        barPercentage: 0.6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { family: "'Inter', sans-serif", size: 13, weight: '600' },
        bodyFont: { family: "'Inter', sans-serif", size: 14, weight: 'bold' },
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: "'Inter', sans-serif", weight: '500' }, color: '#64748b' }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(226, 232, 240, 0.8)', borderDash: [5, 5] },
        ticks: { stepSize: 1, font: { family: "'Inter', sans-serif" }, color: '#94a3b8' },
        border: { display: false }
      }
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Welcome, Hiring Partner 👋</h4>
        <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Track student application volume and candidate progression through your recruitment funnel.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-4 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card card-hover border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Applied</h6>
                  <h3 className="fw-black text-dark mb-0">{funnel?.applied || 0}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-file-earmark-text-fill fs-5"></i>
                </div>
              </div>
              <p className="text-muted small fw-medium mb-0"><i className="bi bi-arrow-up-right text-success me-1"></i> Inbound Profiles</p>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card card-hover border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Shortlisted</h6>
                  <h3 className="fw-black text-dark mb-0">{funnel?.shortlisted || 0}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-star-fill fs-5"></i>
                </div>
              </div>
              <p className="text-muted small fw-medium mb-0"><i className="bi bi-dash text-secondary me-1"></i> Interview Stage</p>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card card-hover border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Selected</h6>
                  <h3 className="fw-black text-dark mb-0">{funnel?.selected || 0}</h3>
                </div>
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-trophy-fill fs-5"></i>
                </div>
              </div>
              <p className="text-muted small fw-medium mb-0"><i className="bi bi-arrow-up-right text-success me-1"></i> Offers Extended</p>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card card-hover border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Rejected</h6>
                  <h3 className="fw-black text-dark mb-0">{funnel?.rejected || 0}</h3>
                </div>
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-x-circle-fill fs-5"></i>
                </div>
              </div>
              <p className="text-muted small fw-medium mb-0"><i className="bi bi-dash text-secondary me-1"></i> Profiles Archived</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Card */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold text-dark mb-0">Recruitment Funnel Stage Overview</h5>
            <small className="text-secondary fw-medium">Visualizing student counts at each progression stage.</small>
          </div>
          <div className="bg-light rounded p-2 text-muted">
            <i className="bi bi-bar-chart-fill fs-5"></i>
          </div>
        </div>
        <div className="card-body p-4" style={{ height: '350px' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

    </div>
  );
};

export default CompanyDashboard;
