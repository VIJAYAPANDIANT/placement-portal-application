import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterCompany from './pages/RegisterCompany';

// Import Admin Dashboard Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingCompanies from './pages/admin/PendingCompanies';
import PendingDrives from './pages/admin/PendingDrives';
import StudentList from './pages/admin/StudentList';

// Import Company Dashboard Pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import CreateDrive from './pages/company/CreateDrive';
import MyDrives from './pages/company/MyDrives';
import DriveApplicants from './pages/company/DriveApplicants';

// Import Student Dashboard Pages
import StudentDashboard from './pages/student/StudentDashboard';
import BrowseDrives from './pages/student/BrowseDrives';
import MyApplications from './pages/student/MyApplications';
import MyInterviews from './pages/student/MyInterviews';
import StudentProfile from './pages/student/StudentProfile';

const MainLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isAuthPage = ['/login', '/register/student', '/register/company'].includes(location.pathname);

  if (!isAuthenticated || isAuthPage) {
    return <div className="min-vh-100">{children}</div>;
  }

  const getPageTitle = (path) => {
    if (path === '/admin') return 'Admin Dashboard';
    if (path === '/admin/companies/pending') return 'Pending Companies';
    if (path === '/admin/drives/pending') return 'Pending Drives';
    if (path === '/admin/students') return 'Student Directory';
    if (path === '/company') return 'Company Dashboard';
    if (path === '/company/drives/create') return 'Create Placement Drive';
    if (path === '/company/drives') return 'Manage Drives';
    if (path.startsWith('/company/drives/')) return 'Drive Applicants';
    if (path === '/student') return 'Student Dashboard';
    if (path === '/student/profile') return 'My Student Profile';
    if (path === '/student/drives') return 'Browse Drives';
    if (path === '/student/applications') return 'My Applications';
    if (path === '/student/interviews') return 'Scheduled Interviews';
    return 'Placement Portal';
  };

  return (
    <div className="d-flex min-vh-100">
      <Sidebar />
      <div className="main-content flex-grow-1 d-flex flex-column">
        {/* Topbar Header */}
        <header className="topbar">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold fs-6">{getPageTitle(location.pathname)}</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-md-block" style={{ fontSize: '12px' }}>
              <span className="fw-semibold text-muted d-block">{currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="fw-bold" style={{ letterSpacing: '0.5px' }}>{currentTime.toLocaleTimeString()}</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content View */}
        <main className="p-4 flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainLayout>
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register/student" element={<RegisterStudent />} />
          <Route path="/register/company" element={<RegisterCompany />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/companies/pending" element={<ProtectedRoute role="admin"><PendingCompanies /></ProtectedRoute>} />
          <Route path="/admin/drives/pending" element={<ProtectedRoute role="admin"><PendingDrives /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute role="admin"><StudentList /></ProtectedRoute>} />
          
          {/* Company Routes */}
          <Route path="/company" element={<ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>} />
          <Route path="/company/drives/create" element={<ProtectedRoute role="company"><CreateDrive /></ProtectedRoute>} />
          <Route path="/company/drives" element={<ProtectedRoute role="company"><MyDrives /></ProtectedRoute>} />
          <Route path="/company/drives/:id/applicants" element={<ProtectedRoute role="company"><DriveApplicants /></ProtectedRoute>} />
          
          {/* Student Routes */}
          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
          <Route path="/student/drives" element={<ProtectedRoute role="student"><BrowseDrives /></ProtectedRoute>} />
          <Route path="/student/applications" element={<ProtectedRoute role="student"><MyApplications /></ProtectedRoute>} />
          <Route path="/student/interviews" element={<ProtectedRoute role="student"><MyInterviews /></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </MainLayout>
    </AuthProvider>
  );
}

export default App;
