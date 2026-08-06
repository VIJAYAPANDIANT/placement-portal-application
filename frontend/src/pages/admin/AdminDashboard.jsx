import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './admin.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [branchData, setBranchData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [pendingCompaniesList, setPendingCompaniesList] = useState([]);
  const [pendingDrivesList, setPendingDrivesList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Listen to external theme changes (like sidebar toggles)
  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('theme') || 'light');
    };
    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
    window.dispatchEvent(new Event('themechange'));
  };

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [extRes, branchRes, trendRes, pendCompRes, pendDriveRes] = await Promise.all([
        api.get('/admin/dashboard/extended-stats').catch(() => null),
        api.get('/admin/dashboard/branch-placement-rate').catch(() => ({ data: [] })),
        api.get('/admin/dashboard/drive-trend').catch(() => ({ data: [] })),
        api.get('/admin/companies/pending').catch(() => ({ data: [] })),
        api.get('/admin/drives/pending').catch(() => ({ data: [] })),
      ]);

      setStats(extRes?.data || null);
      setBranchData(branchRes?.data || []);
      setTrendData(trendRes?.data || []);
      setPendingCompaniesList(pendCompRes?.data || []);
      setPendingDrivesList(pendDriveRes?.data || []);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => { logout(); navigate('/login'); };


  // ─── Chart Data ────────────────────────────────────────────────────────────
  const branchChartData = {
    labels: branchData.map(b => b.branch),
    datasets: [{
      label: 'Placement Rate (%)',
      data: branchData.map(b => b.placement_rate),
      backgroundColor: '#0F766E',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const branchChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.parsed.y}%` }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: '#F1F5F9' },
        ticks: { font: { size: 11 }, color: '#6B7280', callback: v => v + '%' },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#6B7280' },
      },
    },
  };

  // ─── Monthly Trend Bar Chart (per-bar colors) ──────────────────────────────
  const BAR_COLORS = [
    '#E0E7FF','#E0E7FF','#E0E7FF','#E0E7FF',
    '#E0E7FF','#E0E7FF','#E0E7FF','#E0E7FF',
    '#A855F7','#A855F7','#2563EB','#0F766E',
  ];
  // assign colors by month index (12 months)
  const trendColors = trendData.map((_, i) => BAR_COLORS[i] || '#E0E7FF');

  const trendBarData = {
    labels: trendData.map(d => d.month.slice(0, 3)),
    datasets: [{
      label: 'Applications',
      data: trendData.map(d => d.count),
      backgroundColor: trendColors,
      borderRadius: 6,
      borderSkipped: false,
      barPercentage: 0.7,
    }],
  };

  const trendBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} applications` } },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#F1F5F9' },
        ticks: { font: { size: 11 }, color: '#6B7280', precision: 0 },
      },
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: '#6B7280' },
      },
    },
  };

  // Peak month calculation
  const peakEntry = trendData.reduce((max, d) => d.count > (max?.count || 0) ? d : max, null);
  const peakMonth = peakEntry?.month?.slice(0, 3) || '–';
  const peakCount = peakEntry?.count || 0;

  const pkgDist = stats?.package_distribution || {};
  const doughnutData = {
    labels: ['10–20 LPA', '20+ LPA', '5–10 LPA', '< 5 LPA'],
    datasets: [{
      data: [
        pkgDist['10 - 20 LPA'] || 0,
        pkgDist['20+ LPA'] || 0,
        pkgDist['5 - 10 LPA'] || 0,
        pkgDist['< 5 LPA'] || 0,
      ],
      backgroundColor: ['#06B6D4', '#2563EB', '#0F766E', '#F59E0B'],
      borderWidth: 0,
      spacing: 2,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } },
    },
    cutout: '68%',
  };

  // ─── Formatted time ────────────────────────────────────────────────────────
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const recentSelections = stats?.recent_selections || [];

  return (
    <div className="admin-page">
      {/* ── TOP NAVBAR ─────────────────────────────────────────────────────── */}
      <div className="admin-topbar">
        <span className="admin-topbar__title">Admin Dashboard</span>
        <div className="admin-topbar__right">
          <span className="admin-topbar__datetime">
            <span className="admin-topbar__date">{dateStr}</span>
            <span className="admin-topbar__time">{timeStr}</span>
          </span>

          {/* Bell Notification Icon */}
          <button
            className="admin-topbar__bell-btn"
            onClick={() => setIsDrawerOpen(true)}
            title="Notifications"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="admin-topbar__bell-badge">{unreadCount}</span>
            )}
          </button>

          <button className="admin-topbar__theme-btn" onClick={toggleTheme}>
            {theme === 'light' ? '☀ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      <div className="admin-content">

        {/* Main Title */}
        <div className="admin-hero mb-4">
          <div>
            <h1 className="admin-hero__title">Placement Cell Control Hub</h1>
            <p className="admin-hero__subtitle">Global metrics, company review funnel, and institution-wide placement trends.</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn-admin-outline" onClick={handleSignOut}>Sign Out</button>
            <button className="btn-admin-primary">Monthly Report</button>
          </div>
        </div>

        {/* ── KPI STAT CARDS ────────────────────────────────────────────── */}
        <div className="admin-kpi-grid mb-4">
          <div className="admin-kpi-card">
            <div className="admin-kpi-card__accent admin-kpi-card__accent--blue"></div>
            <div className="admin-kpi-card__body">
              <span className="admin-kpi-card__label">TOTAL STUDENTS</span>
              <div className="admin-kpi-card__value">{stats?.total_students ?? '–'}</div>
              <span className="admin-kpi-card__sub">{stats?.placed_students ?? 0} students placed</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-card__accent admin-kpi-card__accent--teal"></div>
            <div className="admin-kpi-card__body">
              <span className="admin-kpi-card__label">PLACEMENT RATE</span>
              <div className="admin-kpi-card__value">
                {stats?.placement_rate ?? '–'}%
                {stats && (
                  <span className="admin-kpi-card__badge admin-kpi-card__badge--green ms-2">
                    2025-26 Batch
                  </span>
                )}
              </div>
              <span className="admin-kpi-card__sub">Of registered students</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-card__accent admin-kpi-card__accent--cyan"></div>
            <div className="admin-kpi-card__body">
              <span className="admin-kpi-card__label">APPROVED COMPANIES</span>
              <div className="admin-kpi-card__value">{stats?.total_companies ?? '–'}</div>
              <span className="admin-kpi-card__sub">{stats?.pending_companies ?? 0} awaiting approval</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-card__accent admin-kpi-card__accent--yellow"></div>
            <div className="admin-kpi-card__body">
              <span className="admin-kpi-card__label">HIGHEST / AVG PKG</span>
              <div className="admin-kpi-card__value">{stats?.highest_package ?? '–'} LPA</div>
              <span className="admin-kpi-card__sub">Average: {stats?.average_package ?? '–'} LPA</span>
            </div>
          </div>
        </div>

        {/* ── CHARTS ROW ────────────────────────────────────────────────── */}
        <div className="admin-charts-row mb-4">

          {/* Branch-wise Placement Rate — progress bars */}
          <div className="admin-panel">
            <div className="admin-panel__header">
              <span className="admin-panel__title">Branch-wise Placement Rate</span>
              <Link to="/admin/students" className="admin-panel__link">Students →</Link>
            </div>
            <div className="admin-panel__body">
              {branchData.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {branchData.map((item, idx) => {
                    const BRANCH_COLORS = ['#0F766E','#2563EB','#7C3AED','#C026D3','#EA580C','#DC2626'];
                    const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
                    return (
                      <div key={item.branch}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{item.branch}</span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color }}>{item.placement_rate}%</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '4px', background: '#F1F5F9', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(item.placement_rate, 100)}%`,
                              background: color,
                              borderRadius: '4px',
                              transition: 'width 0.8s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="admin-empty">No branch data available</div>
              )}
            </div>
          </div>

          {/* Application Trend (Monthly) — colored bar chart */}
          <div className="admin-panel">
            <div className="admin-panel__header">
              <span className="admin-panel__title">Application Trend (Monthly)</span>
            </div>
            <div className="admin-panel__body">
              <div style={{ height: '220px' }}>
                {trendData.some(d => d.count > 0) ? (
                  <Bar data={trendBarData} options={trendBarOptions} />
                ) : (
                  <div className="admin-empty">No application data yet</div>
                )}
              </div>
              {peakCount > 0 && (
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: '10px', display: 'flex', gap: '16px', fontSize: '13px', color: '#6B7280' }}>
                  <span><strong style={{ color: '#111827' }}>Peak: {peakCount}</strong> ({peakMonth})</span>
                  <span style={{ color: '#16A34A', fontWeight: 600 }}>↑ 55% MoM</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW: Doughnut + Recent Placed Students Table ─────────── */}
        <div className="admin-bottom-row">
          {/* Package Distribution */}
          <div className="admin-panel admin-panel--narrow">
            <div className="admin-panel__header">
              <span className="admin-panel__title">Package Distribution</span>
            </div>
            <div className="admin-panel__body">
              <div style={{ height: '200px', position: 'relative' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              <div className="admin-doughnut-legend">
                <span className="admin-legend-item"><span className="admin-legend-dot" style={{ background: '#06B6D4' }}></span>10 - 20 LPA</span>
                <span className="admin-legend-item"><span className="admin-legend-dot" style={{ background: '#2563EB' }}></span>20+ LPA</span>
                <span className="admin-legend-item"><span className="admin-legend-dot" style={{ background: '#0F766E' }}></span>5 - 10 LPA</span>
                <span className="admin-legend-item"><span className="admin-legend-dot" style={{ background: '#F59E0B' }}></span>&lt; 5 LPA</span>
              </div>
            </div>
          </div>

          {/* Recent Placed Students Table */}
          <div className="admin-panel admin-panel--wide">
            <div className="admin-panel__header">
              <span className="admin-panel__title">Recent Placed Students</span>
              <Link to="/admin/students" className="admin-panel__link">All Students Directory →</Link>
            </div>
            <div className="admin-panel__body p-0">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>COMPANY</th>
                    <th>ROLE</th>
                    <th>PACKAGE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSelections.length > 0 ? (
                    recentSelections.map((sel, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold">{sel.student_name}</td>
                        <td>{sel.company_name}</td>
                        <td>{sel.job_title}</td>
                        <td className="admin-table__pkg">{sel.package_lpa} LPA</td>
                        <td><span className="admin-status-pill admin-status-pill--selected">SELECTED</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">No placements recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); refreshCount(); }}
      />
    </div>
  );
};

export default AdminDashboard;
