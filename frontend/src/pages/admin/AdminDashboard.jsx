import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [branchRate, setBranchRate] = useState([]);
  const [driveTrend, setDriveTrend] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [statsRes, branchRes, trendRes, studentsRes] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          api.get('/admin/dashboard/branch-placement-rate'),
          api.get('/admin/dashboard/drive-trend'),
          api.get('/admin/students')
        ]);

        setStats(statsRes.data);
        setBranchRate(branchRes.data);
        setDriveTrend(trendRes.data);
        setRecentStudents(studentsRes.data.slice(0, 5));
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to fetch dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5 fade-in">
        <div className="spinner-border text-primary shadow-sm" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted fw-medium">Loading dashboard statistics and analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-danger shadow-sm p-4 text-center fade-in">
        <div className="text-danger mb-3" style={{ fontSize: '2.5rem' }}><i className="bi bi-exclamation-triangle-fill"></i></div>
        <h5 className="fw-bold text-dark mb-2">Error Loading Dashboard</h5>
        <p className="text-muted mb-4">{error}</p>
        <button className="btn btn-outline-danger fw-semibold rounded-pill px-4 mx-auto" onClick={() => window.location.reload()}>
          <i className="bi bi-arrow-clockwise me-2"></i>Retry Loading
        </button>
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const barChartData = {
    labels: branchRate.map(item => item.branch),
    datasets: [
      {
        label: 'Placement Rate (%)',
        data: branchRate.map(item => item.placement_rate),
        backgroundColor: 'rgba(79, 70, 229, 0.85)',
        borderWidth: 0,
        borderRadius: 8,
        barPercentage: 0.5
      },
    ],
  };

  const chartCommonOptions = {
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
    }
  };

  const barChartOptions = {
    ...chartCommonOptions,
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif", weight: '500' }, color: '#64748b' } },
      y: { 
        beginAtZero: true, 
        max: 100, 
        grid: { color: 'rgba(226, 232, 240, 0.8)', borderDash: [5, 5] },
        ticks: { callback: (val) => val + '%', font: { family: "'Inter', sans-serif" }, color: '#94a3b8' },
        border: { display: false }
      }
    }
  };

  const lineChartData = {
    labels: driveTrend.map(item => item.month),
    datasets: [
      {
        label: 'Applications Count',
        data: driveTrend.map(item => item.count),
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 1)',
        tension: 0.4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: 'rgba(16, 185, 129, 1)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
    ],
  };

  const lineChartOptions = {
    ...chartCommonOptions,
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: "'Inter', sans-serif", weight: '500' }, color: '#64748b' } },
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
      {/* Greeting Header */}
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Good morning, Admin 👋</h4>
        <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>{todayFormatted} &mdash; Here is what is happening across placement drives today.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-4 mb-4">
        <div className="col-sm-6 col-xl-3">
          <div className="card card-hover border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Students</h6>
                  <h3 className="fw-black text-dark mb-0">{stats?.total_students || 0}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-people-fill fs-5"></i>
                </div>
              </div>
              <p className="text-muted small fw-medium mb-0"><i className="bi bi-arrow-up-right text-success me-1"></i> Registered Candidates</p>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card card-hover border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Companies</h6>
                  <h3 className="fw-black text-dark mb-0">{stats?.total_companies || 0}</h3>
                </div>
                <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-buildings-fill fs-5"></i>
                </div>
              </div>
              <p className="text-muted small fw-medium mb-0"><i className="bi bi-arrow-up-right text-success me-1"></i> Verified Accounts</p>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card card-hover border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Drives</h6>
                  <h3 className="fw-black text-dark mb-0">{stats?.total_drives || 0}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-briefcase-fill fs-5"></i>
                </div>
              </div>
              <p className="text-muted small fw-medium mb-0"><i className="bi bi-dash text-secondary me-1"></i> Active Recruitment Drives</p>
            </div>
          </div>
        </div>

        <div className="col-sm-6 col-xl-3">
          <div className="card card-hover border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h6 className="text-muted fw-bold mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Total Selections</h6>
                  <h3 className="fw-black text-dark mb-0">{stats?.total_selections || 0}</h3>
                </div>
                <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-trophy-fill fs-5"></i>
                </div>
              </div>
              <p className="text-muted small fw-medium mb-0"><i className="bi bi-arrow-up-right text-success me-1"></i> Successfully Placed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold text-dark mb-1">Placement Rate by Branch</h5>
              <small className="text-secondary fw-medium">Percentage of registered students placed across academic departments.</small>
            </div>
            <div className="card-body p-4" style={{ minHeight: '300px' }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h5 className="fw-bold text-dark mb-1">Monthly Application Trend</h5>
              <small className="text-secondary fw-medium">Volume of student job applications received per month.</small>
            </div>
            <div className="card-body p-4" style={{ minHeight: '300px' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Student Registrations */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold text-dark mb-0">Recent Student Registrations</h5>
          <span className="badge badge-soft-info px-3 py-2 fs-6">
            <i className="bi bi-people-fill me-2"></i>{stats?.total_students || 0} Total
          </span>
        </div>

        {recentStudents.length === 0 ? (
          <div className="card-body text-center py-5">
            <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="bi bi-inbox text-muted fs-3"></i>
            </div>
            <p className="text-muted fw-medium mb-0">No registered students found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3 text-muted small fw-bold">#</th>
                  <th className="px-4 py-3 text-muted small fw-bold">STUDENT NAME</th>
                  <th className="px-4 py-3 text-muted small fw-bold">ROLL NUMBER</th>
                  <th className="px-4 py-3 text-muted small fw-bold">BRANCH</th>
                  <th className="px-4 py-3 text-muted small fw-bold">CGPA</th>
                  <th className="px-4 py-3 text-muted small fw-bold">STATUS</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {recentStudents.map((student, idx) => (
                  <tr key={student.id}>
                    <td className="px-4 text-muted fw-semibold">{idx + 1}</td>
                    <td className="px-4 fw-bold text-dark">{student.name}</td>
                    <td className="px-4 text-secondary">{student.roll_number}</td>
                    <td className="px-4"><span className="badge badge-soft-primary">{student.branch}</span></td>
                    <td className="px-4 fw-bold text-dark">{student.cgpa}</td>
                    <td className="px-4">
                      {student.is_blacklisted ? (
                        <span className="badge badge-soft-danger px-2 py-1"><i className="bi bi-slash-circle-fill me-1"></i>Blacklisted</span>
                      ) : (
                        <span className="badge badge-soft-success px-2 py-1"><i className="bi bi-check-circle-fill me-1"></i>Active</span>
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

export default AdminDashboard;
