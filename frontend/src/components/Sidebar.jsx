import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Sidebar = () => {
  const { role, isAuthenticated, logout, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ pendingCompanies: 0, pendingDrives: 0 });
  const [companyDetails, setCompanyDetails] = useState({ name: 'PhonePe HR', domain: 'PhonePe · Fintech', initials: 'PP' });

  // Decode JWT to get email for dynamic company name if available
  useEffect(() => {
    if (isAuthenticated && role === 'company' && token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        if (payload && payload.email) {
          const email = payload.email.toLowerCase();
          if (email.includes('tcs')) {
            setCompanyDetails({ name: 'TCS Recruiter', domain: 'TCS · IT Services', initials: 'TC' });
          } else if (email.includes('google')) {
            setCompanyDetails({ name: 'Google Recruiter', domain: 'Google · Tech', initials: 'GO' });
          } else if (email.includes('microsoft')) {
            setCompanyDetails({ name: 'Microsoft HR', domain: 'Microsoft · Tech', initials: 'MS' });
          } else {
            // General fallback
            const prefix = email.split('@')[0];
            const cleanPrefix = prefix.replace(/[._-]/g, ' ').toUpperCase();
            setCompanyDetails({
              name: `${cleanPrefix} HR`,
              domain: `${cleanPrefix} · Corporate`,
              initials: cleanPrefix.slice(0, 2)
            });
          }
        }
      } catch (err) {
        console.error('Error decoding token in sidebar:', err);
      }
    }
  }, [isAuthenticated, role, token]);

  useEffect(() => {
    if (isAuthenticated && role === 'admin') {
      Promise.all([
        api.get('/admin/companies/pending').catch(() => ({ data: [] })),
        api.get('/admin/drives/pending').catch(() => ({ data: [] })),
      ]).then(([compRes, driveRes]) => {
        setCounts({
          pendingCompanies: compRes.data?.length || 0,
          pendingDrives: driveRes.data?.length || 0,
        });
      });
    }
  }, [isAuthenticated, role, location.pathname]);

  if (!isAuthenticated || !role) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="saas-sidebar d-flex flex-column" style={{ background: '#ffffff', borderRight: '1px solid #E5E7EB', width: '220px', minWidth: '220px' }}>
      
      {/* ── Brand / Logo ── */}
      <div className="d-flex align-items-center gap-2 px-3" style={{ height: '56px', borderBottom: '1px solid #E5E7EB', flexShrink: 0 }}>
        <div
          style={{
            width: '32px', height: '32px',
            background: '#0F766E',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '15px', color: '#fff', flexShrink: 0,
          }}
        >
          P
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
            PlaceLink
          </div>
          <div style={{ fontSize: '9px', color: '#6B7280', fontWeight: 700, letterSpacing: '0.5px', marginTop: '2px' }}>
            {role === 'admin' ? 'v1.0 - ADMIN' : role === 'company' ? 'v1.0 - COMPANY' : 'v1.0 - STUDENT'}
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <div className="flex-grow-1 overflow-auto py-3 px-2" style={{ overflowY: 'auto' }}>
        {role === 'admin' && (
          <>
            <div className="sidebar-heading">OVERVIEW</div>
            <Link to="/admin" className={`sidebar-item${isActive('/admin') ? ' active' : ''}`}>
              <i className="bi bi-grid-1x2-fill me-2" style={{ fontSize: '14px' }}></i>
              Dashboard
            </Link>

            <div className="sidebar-heading" style={{ marginTop: '16px' }}>MANAGE</div>
            <Link to="/admin/companies/pending" className={`sidebar-item justify-content-between${isActive('/admin/companies/pending') ? ' active' : ''}`}>
              <span className="d-flex align-items-center">
                <i className="bi bi-building me-2" style={{ fontSize: '14px' }}></i>
                Pending Companies
              </span>
              {counts.pendingCompanies > 0 && (
                <span style={{ background: '#EF4444', color: '#fff', borderRadius: '10px', fontSize: '9px', fontWeight: 700, minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {counts.pendingCompanies}
                </span>
              )}
            </Link>
            <Link to="/admin/drives/pending" className={`sidebar-item justify-content-between${isActive('/admin/drives/pending') ? ' active' : ''}`}>
              <span className="d-flex align-items-center">
                <i className="bi bi-briefcase me-2" style={{ fontSize: '14px' }}></i>
                Pending Drives
              </span>
              {counts.pendingDrives > 0 && (
                <span style={{ background: '#0F766E', color: '#fff', borderRadius: '10px', fontSize: '9px', fontWeight: 700, minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                  {counts.pendingDrives}
                </span>
              )}
            </Link>
            <Link to="/admin/students" className={`sidebar-item${isActive('/admin/students') ? ' active' : ''}`}>
              <i className="bi bi-people me-2" style={{ fontSize: '14px' }}></i>
              Students List
            </Link>
          </>
        )}

        {role === 'company' && (
          <>
            <div className="sidebar-heading">RECRUITMENT</div>
            <Link to="/company" className={`sidebar-item${isActive('/company') ? ' active' : ''}`}>
              <i className="bi bi-grid-1x2-fill me-2" style={{ fontSize: '14px' }}></i>
              Overview
            </Link>
            <Link to="/company/drives/create" className={`sidebar-item${isActive('/company/drives/create') ? ' active' : ''}`}>
              <i className="bi bi-plus-circle me-2" style={{ fontSize: '14px' }}></i>
              Post New Drive
            </Link>
            <Link to="/company/drives" className={`sidebar-item${isActive('/company/drives') ? ' active' : ''}`}>
              <i className="bi bi-folder me-2" style={{ fontSize: '14px' }}></i>
              My Drives
            </Link>
            <Link to="/company/applicants" className={`sidebar-item${isActive('/company/applicants') ? ' active' : ''}`}>
              <i className="bi bi-people me-2" style={{ fontSize: '14px' }}></i>
              Applicants
            </Link>
          </>
        )}

        {role === 'student' && (
          <>
            <div className="sidebar-heading">STUDENT PORTAL</div>
            <Link to="/student" className={`sidebar-item${isActive('/student') ? ' active' : ''}`}>
              <i className="bi bi-grid-1x2-fill me-2" style={{ fontSize: '14px' }}></i>
              Dashboard
            </Link>
            <Link to="/student/drives" className={`sidebar-item${isActive('/student/drives') ? ' active' : ''}`}>
              <i className="bi bi-briefcase me-2" style={{ fontSize: '14px' }}></i>
              Browse Drives
            </Link>
            <Link to="/student/applications" className={`sidebar-item${isActive('/student/applications') ? ' active' : ''}`}>
              <i className="bi bi-file-earmark-check" style={{ fontSize: '14px' }}></i>
              My Applications
            </Link>
            <Link to="/student/interviews" className={`sidebar-item${isActive('/student/interviews') ? ' active' : ''}`}>
              <i className="bi bi-calendar-event" style={{ fontSize: '14px' }}></i>
              My Interviews
            </Link>
            <Link to="/student/profile" className={`sidebar-item${isActive('/student/profile') ? ' active' : ''}`}>
              <i className="bi bi-person" style={{ fontSize: '14px' }}></i>
              My Profile
            </Link>
          </>
        )}
      </div>

      {/* ── Footer Recruiter / Admin Section ── */}
      {role === 'company' && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
            <div
              style={{
                width: '32px', height: '32px',
                background: '#DBEAFE',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '11px', color: '#1D4ED8', flexShrink: 0
              }}
            >
              {companyDetails.initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {companyDetails.name}
              </div>
              <div style={{ fontSize: '10px', color: '#6B7280', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {companyDetails.domain}
              </div>
            </div>
          </div>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} title="Connected"></div>
        </div>
      )}

      {role === 'admin' && (
        <div style={{ padding: '14px 16px', borderTop: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }}></div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontSize: '13px', color: '#EF4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="bi bi-box-arrow-left"></i>
            Sign Out
          </button>
        </div>
      )}

    </aside>
  );
};

export default Sidebar;
