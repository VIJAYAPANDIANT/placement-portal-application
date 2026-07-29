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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading recruitment analytics...</p>
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
          'rgba(37, 99, 235, 0.65)',
          'rgba(217, 119, 6, 0.65)',
          'rgba(22, 163, 74, 0.65)',
          'rgba(220, 38, 38, 0.65)'
        ],
        borderColor: [
          'rgba(37, 99, 235, 1)',
          'rgba(217, 119, 6, 1)',
          'rgba(22, 163, 74, 1)',
          'rgba(220, 38, 38, 1)'
        ],
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } }
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Welcome, Hiring Partner 👋</h4>
        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>Track student application volume and candidate progression through your recruitment funnel.</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="kpi-card">
            <div className="kpi-label">Total Applied</div>
            <div className="kpi-value text-info">{funnel?.applied || 0}</div>
            <div className="kpi-sub">📝 Applications Received</div>
            <div className="trend-up"><span>↑</span> Inbound Profiles</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kpi-card">
            <div className="kpi-label">Shortlisted</div>
            <div className="kpi-value text-warning">{funnel?.shortlisted || 0}</div>
            <div className="kpi-sub">⭐ Qualified Candidates</div>
            <div className="trend-neutral"><span>•</span> Interview Stage</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kpi-card">
            <div className="kpi-label">Selected</div>
            <div className="kpi-value text-success">{funnel?.selected || 0}</div>
            <div className="kpi-sub">🎉 Offers Extended</div>
            <div className="trend-up"><span>↑</span> Hired Candidates</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kpi-card">
            <div className="kpi-label">Rejected</div>
            <div className="kpi-value text-danger">{funnel?.rejected || 0}</div>
            <div className="kpi-sub">❌ Profiles Archived</div>
            <div className="trend-down"><span>•</span> Not Selected</div>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <div>
            <h5 className="panel-title">Recruitment Funnel Stage Overview</h5>
            <small className="text-muted" style={{ fontSize: '11px' }}>Visualizing student counts at each progression stage of active placement drives.</small>
          </div>
        </div>
        <div className="panel-body">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
