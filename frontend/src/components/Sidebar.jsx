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

  if (!isAuthenticated || !role) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar d-flex flex-column">
      {/* Brand Header */}
      <div className="p-4 border-bottom d-flex align-items-center gap-3">
        <div className="bg-primary text-white rounded d-flex align-items-center justify-content-center shadow-sm" style={{ width: '36px', height: '36px', fontWeight: 'bold', fontSize: '1.2rem' }}>
          P
        </div>
        <div className="d-flex flex-column lh-1">
          <span className="fw-bold fs-5 text-dark" style={{ letterSpacing: '-0.5px' }}>PlaceLink</span>
          <span className="text-muted" style={{ fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Enterprise</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-grow-1 overflow-auto p-3">
        
        {role === 'admin' && (
          <>
            <div className="text-uppercase text-muted fw-bold mb-2 ps-3 mt-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>Overview</div>
            <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
              <i className="bi bi-grid-1x2-fill"></i> Dashboard
            </Link>

            <div className="text-uppercase text-muted fw-bold mb-2 ps-3 mt-4" style={{ fontSize: '10px', letterSpacing: '1px' }}>Manage</div>
            <Link to="/admin/companies/pending" className={`nav-link ${isActive('/admin/companies/pending') ? 'active' : ''}`}>
              <i className="bi bi-building-check"></i> Pending Companies
            </Link>
            <Link to="/admin/drives/pending" className={`nav-link ${isActive('/admin/drives/pending') ? 'active' : ''}`}>
              <i className="bi bi-briefcase-fill"></i> Pending Drives
            </Link>
            <Link to="/admin/students" className={`nav-link ${isActive('/admin/students') ? 'active' : ''}`}>
              <i className="bi bi-people-fill"></i> Students List
            </Link>
          </>
        )}

        {role === 'company' && (
          <>
            <div className="text-uppercase text-muted fw-bold mb-2 ps-3 mt-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>Overview</div>
            <Link to="/company" className={`nav-link ${isActive('/company') ? 'active' : ''}`}>
              <i className="bi bi-grid-1x2-fill"></i> Dashboard
            </Link>

            <div className="text-uppercase text-muted fw-bold mb-2 ps-3 mt-4" style={{ fontSize: '10px', letterSpacing: '1px' }}>Drives</div>
            <Link to="/company/drives/create" className={`nav-link ${isActive('/company/drives/create') ? 'active' : ''}`}>
              <i className="bi bi-plus-square-fill"></i> Post New Drive
            </Link>
            <Link to="/company/drives" className={`nav-link ${isActive('/company/drives') ? 'active' : ''}`}>
              <i className="bi bi-briefcase-fill"></i> My Drives
            </Link>
          </>
        )}

        {role === 'student' && (
          <>
            <div className="text-uppercase text-muted fw-bold mb-2 ps-3 mt-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>Overview</div>
            <Link to="/student" className={`nav-link ${isActive('/student') ? 'active' : ''}`}>
              <i className="bi bi-grid-1x2-fill"></i> Dashboard
            </Link>
            <Link to="/student/profile" className={`nav-link ${isActive('/student/profile') ? 'active' : ''}`}>
              <i className="bi bi-person-badge-fill"></i> My Profile
              {completeness < 75 && (
                <span className="badge bg-warning ms-auto rounded-circle p-1" title="Profile incomplete">!</span>
              )}
            </Link>

            <div className="text-uppercase text-muted fw-bold mb-2 ps-3 mt-4" style={{ fontSize: '10px', letterSpacing: '1px' }}>Applications</div>
            <Link to="/student/drives" className={`nav-link ${isActive('/student/drives') ? 'active' : ''}`}>
              <i className="bi bi-search"></i> Browse Drives
            </Link>
            <Link to="/student/applications" className={`nav-link ${isActive('/student/applications') ? 'active' : ''}`}>
              <i className="bi bi-file-earmark-check-fill"></i> My Applications
            </Link>
            <Link to="/student/interviews" className={`nav-link ${isActive('/student/interviews') ? 'active' : ''}`}>
              <i className="bi bi-calendar2-check-fill"></i> My Interviews
            </Link>
          </>
        )}
      </div>

      {/* Logout Footer */}
      <div className="p-3 border-top mt-auto">
        <button 
          onClick={handleLogout} 
          className="btn btn-light w-100 text-start text-danger d-flex align-items-center gap-2 border-0 shadow-none"
          style={{ padding: '0.75rem 1.25rem', fontWeight: '500' }}
        >
          <i className="bi bi-box-arrow-right"></i> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
