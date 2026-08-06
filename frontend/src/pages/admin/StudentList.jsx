import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import './admin.css';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/students');
      setStudents(res.data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.response?.data?.message || 'Failed to fetch student directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlacklist = async (id) => {
    try {
      setAlert(null);
      const response = await api.put(`/admin/students/${id}/blacklist`);
      const newStatus = response.data.is_blacklisted;
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_blacklisted: newStatus } : s))
      );
      setAlert({
        type: 'success',
        message: response.data.message || `Student blacklist status updated successfully.`,
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      console.error('Error blacklisting student:', err);
      setAlert({ type: 'danger', message: 'Failed to update student blacklist status.' });
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (window.confirm(`Are you absolutely sure you want to permanently delete the student account for "${name}"? This will remove all their placement drive applications and cannot be undone.`)) {
      try {
        setAlert(null);
        await api.delete(`/admin/students/${id}`);
        setStudents((prev) => prev.filter((s) => s.id !== id));
        setAlert({
          type: 'success',
          message: `Student account for "${name}" has been permanently deleted.`,
        });
        setTimeout(() => setAlert(null), 3000);
      } catch (err) {
        console.error('Error deleting student:', err);
        setAlert({
          type: 'danger',
          message: err.response?.data?.message || 'Failed to delete student account.',
        });
      }
    }
  };

  const getLastActiveBadge = (lastActiveStr) => {
    if (!lastActiveStr) return <span className="text-muted fs-8">Never</span>;
    const lastActiveDate = new Date(lastActiveStr);
    const diffMs = new Date() - lastActiveDate;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return <span className="text-success fw-bold fs-8" title={lastActiveDate.toLocaleString()}>Just now</span>;
    }
    if (diffMins < 60) {
      return <span className="text-success fw-bold fs-8" title={lastActiveDate.toLocaleString()}>{diffMins}m ago</span>;
    }
    if (diffHours < 24) {
      return <span className="text-dark fs-8" title={lastActiveDate.toLocaleString()}>{diffHours}h ago</span>;
    }
    if (diffDays < 30) {
      return <span className="text-dark fs-8" title={lastActiveDate.toLocaleString()}>{diffDays}d ago</span>;
    }
    return (
      <span className="badge bg-danger-subtle text-danger fw-semibold" title={lastActiveDate.toLocaleString()}>
        Inactive ({diffDays}d)
      </span>
    );
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = branchFilter === 'All' || s.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const uniqueBranches = ['All', ...Array.from(new Set(students.map((s) => s.branch).filter(Boolean)))];

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-extrabold mb-1 text-dark">Student Management & Registry</h4>
          <p className="text-muted fs-7 mb-0">Oversee student academic credentials, blacklist compliance, and profiles.</p>
        </div>
        <button className="btn btn-saas-outline d-inline-flex align-items-center gap-2">
          <i className="bi bi-download"></i> Export Directory CSV
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type} rounded-3 mb-4`} role="alert">
          {alert.message}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="card saas-card border-0 p-3 mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label fs-8 text-uppercase text-muted fw-bold mb-1">BRANCH FILTER</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="form-select saas-input fw-semibold"
            >
              {uniqueBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-8">
            <label className="form-label fs-8 text-uppercase text-muted fw-bold mb-1">SEARCH CANDIDATES</label>
            <input
              type="text"
              placeholder="Search student by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-control saas-input"
            />
          </div>
        </div>
      </div>

      {/* Student Registry Table */}
      <div className="card saas-card border-0 p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold text-dark mb-0">Student Registry</h6>
          <span className="badge bg-light text-dark border">
            {filteredStudents.length} Students
          </span>
        </div>

        {loading ? (
          <SkeletonLoader type="table" count={5} />
        ) : error ? (
          <div className="alert alert-danger mb-0">{error}</div>
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            title="No Students Found"
            message="No registered students match your search filter."
            icon="bi-person-search"
          />
        ) : (
          <div className="table-responsive">
            <table className="table align-middle border-top">
              <thead className="table-light fs-7 text-uppercase text-muted">
                <tr>
                  <th>Student Name</th>
                  <th>Roll Number</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Last Active</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span className="fw-bold text-dark d-block">{s.name}</span>
                      <small className="text-muted fs-8">{s.email}</small>
                    </td>
                    <td>{s.roll_number}</td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary fw-semibold">{s.branch}</span>
                    </td>
                    <td><span className="fw-extrabold text-dark">{s.cgpa}</span></td>
                    <td>{getLastActiveBadge(s.last_active_at)}</td>
                    <td>
                      {s.is_blacklisted ? (
                        <StatusBadge status="rejected" />
                      ) : (
                        <StatusBadge status="approved" />
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          className={`btn btn-sm px-3 py-1 fs-8 ${
                            s.is_blacklisted ? 'btn-success' : 'btn-outline-danger'
                          }`}
                          style={{ borderRadius: '6px' }}
                          onClick={() => handleToggleBlacklist(s.id)}
                        >
                          {s.is_blacklisted ? 'Reinstate' : 'Blacklist'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger px-2 py-1 fs-8"
                          style={{ borderRadius: '6px', border: '1px solid #fee2e2' }}
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          title="Delete Student Permanently"
                        >
                          🗑️
                        </button>
                      </div>
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

export default StudentList;
