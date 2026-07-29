import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Sidebar = () => {
  const { role, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [completeness, setCompleteness] = useState(100);

  useEffect(() => {
    if (isAuthenticated && role === 'student') {
      api.get('/student/profile')
        .then(res => {
          if (res.data && res.data.profile_completeness !== undefined) {
            setCompleteness(res.data.profile_completeness);
          }
        })
        .catch(err => console.warn('Sidebar profile completeness check error:', err));
    }
  }, [isAuthenticated, role, location.pathname]);

  if (!isAuthenticated || !role) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="p-3 border-bottom d-flex align-items-center gap-2" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="logo-box">EC</div>
        <div className="d-flex flex-column lh-1">
          <span className="fw-bold text-truncate" style={{ fontSize: '14px', letterSpacing: '-0.3px' }}>EEC Placements</span>
          <span className="text-muted" style={{ fontSize: '10px', marginTop: '2px' }}>Easwari Engineering</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-grow-1 overflow-auto py-2">
        {role === 'admin' && (
          <>
            <div className="nav-section-label">Overview</div>
            <Link to="/admin" className={`sidebar-nav-item ${isActive('/admin') ? 'active' : ''}`}>
              <span>📊</span> Dashboard
            </Link>

            <div className="nav-section-label">Manage</div>
            <Link to="/admin/companies/pending" className={`sidebar-nav-item ${isActive('/admin/companies/pending') ? 'active' : ''}`}>
              <span>🏢</span> Pending Companies
            </Link>
            <Link to="/admin/drives/pending" className={`sidebar-nav-item ${isActive('/admin/drives/pending') ? 'active' : ''}`}>
              <span>🎯</span> Pending Drives
            </Link>
            <Link to="/admin/students" className={`sidebar-nav-item ${isActive('/admin/students') ? 'active' : ''}`}>
              <span>🎓</span> Students List
            </Link>
          </>
        )}

        {role === 'company' && (
          <>
            <div className="nav-section-label">Overview</div>
            <Link to="/company" className={`sidebar-nav-item ${isActive('/company') ? 'active' : ''}`}>
              <span>📊</span> Dashboard
            </Link>

            <div className="nav-section-label">Drives</div>
            <Link to="/company/drives/create" className={`sidebar-nav-item ${isActive('/company/drives/create') ? 'active' : ''}`}>
              <span>➕</span> Create Drive
            </Link>
            <Link to="/company/drives" className={`sidebar-nav-item ${isActive('/company/drives') ? 'active' : ''}`}>
              <span>💼</span> My Drives
            </Link>
          </>
        )}

        {role === 'student' && (
          <>
            <div className="nav-section-label">Overview</div>
            <Link to="/student" className={`sidebar-nav-item ${isActive('/student') ? 'active' : ''}`}>
              <span>📊</span> Dashboard
            </Link>
            <Link to="/student/profile" className={`sidebar-nav-item ${isActive('/student/profile') ? 'active' : ''}`}>
              <span>👤</span> My Profile
              {completeness < 75 && (
                <span className="ms-auto" style={{ color: '#d97706', fontSize: '12px' }} title="Profile incomplete">●</span>
              )}
            </Link>

            <div className="nav-section-label">Applications</div>
            <Link to="/student/drives" className={`sidebar-nav-item ${isActive('/student/drives') ? 'active' : ''}`}>
              <span>🔍</span> Browse Drives
            </Link>
            <Link to="/student/applications" className={`sidebar-nav-item ${isActive('/student/applications') ? 'active' : ''}`}>
              <span>📝</span> My Applications
            </Link>
            <Link to="/student/interviews" className={`sidebar-nav-item ${isActive('/student/interviews') ? 'active' : ''}`}>
              <span>📅</span> My Interviews
            </Link>
          </>
        )}
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-top" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button 
          onClick={handleLogout} 
          className="sidebar-nav-item w-100 border-0 text-start bg-transparent text-danger px-2"
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
