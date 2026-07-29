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
  Legend
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
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading dashboard statistics and analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-card p-4 text-center border-danger">
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <h5 className="mt-2 text-danger">Error Loading Dashboard</h5>
        <p className="text-muted mb-3">{error}</p>
        <button className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()}>
          Retry Loading
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
        backgroundColor: 'rgba(37, 99, 235, 0.6)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: (val) => val + '%' }
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
        backgroundColor: 'rgba(20, 184, 166, 0.15)',
        borderColor: 'rgba(20, 184, 166, 1)',
        tension: 0.3,
        pointBackgroundColor: 'rgba(20, 184, 166, 1)',
      },
    ],
  };

  const lineChartOptions = {
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
      {/* Greeting Header */}
      <div className="mb-4">
        <h4 className="fw-bold mb-1">Good morning, Admin 👋</h4>
        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>{todayFormatted} — Here is what is happening across placement drives today.</p>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="kpi-card">
            <div className="kpi-label">Total Students</div>
            <div className="kpi-value text-primary">{stats?.total_students || 0}</div>
            <div className="kpi-sub">🎓 Registered Candidates</div>
            <div className="trend-up"><span>↑</span> Active Cohort</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kpi-card">
            <div className="kpi-label">Total Companies</div>
            <div className="kpi-value text-success">{stats?.total_companies || 0}</div>
            <div className="kpi-sub">🏢 Approved Hiring Partners</div>
            <div className="trend-up"><span>↑</span> Verified Accounts</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kpi-card">
            <div className="kpi-label">Total Drives</div>
            <div className="kpi-value text-warning">{stats?.total_drives || 0}</div>
            <div className="kpi-sub">🎯 Active Recruitment Drives</div>
            <div className="trend-neutral"><span>•</span> Ongoing Drives</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="kpi-card">
            <div className="kpi-label">Total Selections</div>
            <div className="kpi-value text-info">{stats?.total_selections || 0}</div>
            <div className="kpi-sub">🎉 Successfully Placed</div>
            <div className="trend-up"><span>↑</span> Placed Students</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h5 className="panel-title">Placement Rate by Branch — 2025–26 Batch</h5>
                <small className="text-muted" style={{ fontSize: '11px' }}>Percentage of registered students placed across academic departments.</small>
              </div>
            </div>
            <div className="panel-body">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h5 className="panel-title">Monthly Application Trend</h5>
                <small className="text-muted" style={{ fontSize: '11px' }}>Volume of student job applications received per month during the current academic year.</small>
              </div>
            </div>
            <div className="panel-body">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Student Registrations */}
      <div className="panel-card mt-4">
        <div className="panel-header">
          <h5 className="panel-title">Recent Student Registrations</h5>
          <span className="status-pill pill-info">
            🎓 {stats?.total_students || 0} Registered Students
          </span>
        </div>

        {recentStudents.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-0">No registered students found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enhanced-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((student, idx) => (
                  <tr key={student.id}>
                    <td className="text-muted fw-bold" style={{ fontSize: '11px' }}>{idx + 1}</td>
                    <td className="fw-bold">{student.name}</td>
                    <td>{student.roll_number}</td>
                    <td>
                      <span className="status-pill pill-purple">
                        {student.branch}
                      </span>
                    </td>
                    <td className="fw-bold">{student.cgpa}</td>
                    <td>
                      {student.is_blacklisted ? (
                        <span className="status-pill pill-danger">● Blacklisted</span>
                      ) : (
                        <span className="status-pill pill-success">● Active</span>
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
