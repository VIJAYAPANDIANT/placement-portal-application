import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import NotificationDrawer from './common/NotificationDrawer';

const Navbar = () => {
  const { isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/auth/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top py-2.5 shadow-xs">
        <div className="container-fluid px-4">
          <Link className="navbar-brand d-flex align-items-center gap-2 text-dark" to="/">
            <div className="rounded-3 p-2 bg-teal text-white fw-extrabold d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', backgroundColor: '#0d9488' }}>
              P
            </div>
            <div>
              <span className="fw-extrabold tracking-tight fs-5 text-dark d-block leading-none">PlaceLink</span>
              <small className="text-muted fs-8 text-uppercase tracking-wider fw-bold">v1.0 • {role || 'PORTAL'}</small>
            </div>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto ms-4 align-items-center gap-1">
              {isAuthenticated && role === 'student' && (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/student" end>Overview</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/student/drives">Browse Drives</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/student/applications">My Applications</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/student/interviews">Interviews</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/student/profile">Profile</NavLink>
                  </li>
                </>
              )}

              {isAuthenticated && role === 'company' && (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/company" end>Overview</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/company/drives/create">Post New Drive</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/company/drives">My Drives</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/company/applicants">Applicants</NavLink>
                  </li>
                </>
              )}

              {isAuthenticated && role === 'admin' && (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/admin" end>Overview</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/admin/companies/pending">Pending Companies</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/admin/drives/pending">Pending Drives</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link px-3 fw-semibold text-secondary" to="/admin/students">Student Directory</NavLink>
                  </li>
                </>
              )}
            </ul>

            <ul className="navbar-nav ms-auto align-items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Live Status Badge */}
                  <li className="nav-item d-none d-lg-block">
                    <span className="badge bg-emerald-subtle text-emerald fw-semibold px-2.5 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5 fs-8">
                      <span className="badge-dot" style={{ backgroundColor: '#10b981' }}></span>
                      LIVE {currentTime} IST
                    </span>
                  </li>

                  {/* Role Badge */}
                  <li className="nav-item">
                    <span className="badge bg-primary-subtle text-primary text-uppercase px-2.5 py-1.5 rounded-pill fw-bold fs-8">
                      {role}
                    </span>
                  </li>

                  {/* Notification Bell */}
                  <li className="nav-item">
                    <button
                      className="btn btn-light rounded-circle p-2 position-relative border-0"
                      onClick={() => setIsDrawerOpen(true)}
                      style={{ width: '38px', height: '38px' }}
                    >
                      <i className="bi bi-bell text-secondary fs-6"></i>
                      {unreadCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                          <span className="visually-hidden">New notifications</span>
                        </span>
                      )}
                    </button>
                  </li>

                  {/* Sign Out Button */}
                  <li className="nav-item">
                    <button className="btn btn-saas-outline btn-sm px-3" onClick={handleLogout}>
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink className="nav-link fw-semibold" to="/login">Login</NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="btn btn-saas-primary btn-sm px-3" to="/register/student">Register</NavLink>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Notification Drawer Component */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
      />
    </>
  );
};

export default Navbar;
