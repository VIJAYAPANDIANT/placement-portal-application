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

  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleViewAIAnalysis = async (studentId, studentName) => {
    setSelectedStudentName(studentName);
    setSelectedAnalysis(null);
    setAnalysisError(null);
    setLoadingAnalysis(true);
    setShowModal(true);
    try {
      const res = await api.get(`/admin/student/${studentId}/resume-analysis`);
      setSelectedAnalysis(res.data);
    } catch (err) {
      console.error('Error fetching student AI review:', err);
      setAnalysisError(err.response?.data?.error || 'No AI Resume Analysis has been generated for this student yet.');
    } finally {
      setLoadingAnalysis(false);
    }
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
                          className="btn btn-sm btn-outline-info px-2 py-1 fs-8"
                          style={{ borderRadius: '6px' }}
                          onClick={() => handleViewAIAnalysis(s.id, s.name)}
                          title="View AI Resume Insights"
                        >
                          ✨ AI Review
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

      {/* Bootstrap Modal for AI Resume Insights */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-3 shadow-lg" style={{ background: 'var(--ad-white)', color: 'var(--ad-text)' }}>
              <div className="modal-header border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold text-dark mb-0">🤖 AI Resume Analysis — {selectedStudentName}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body p-4">
                {loadingAnalysis ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary mb-2" role="status"></div>
                    <div className="text-muted fs-7">Fetching AI resume score and ATS compatibility metrics...</div>
                  </div>
                ) : analysisError ? (
                  <div className="alert alert-warning mb-0 text-center rounded-3">
                    <span className="fs-1 d-block mb-2">📄</span>
                    <div className="fw-semibold mb-1">{analysisError}</div>
                    <small className="text-muted">Once this student uploads a PDF resume, the AI analysis report will generate automatically.</small>
                  </div>
                ) : selectedAnalysis ? (
                  <div>
                    {/* Overall Rating & Score Row */}
                    <div className="row g-4 mb-4 align-items-center">
                      {/* circular ATS Score */}
                      <div className="col-md-4 d-flex flex-column align-items-center justify-content-center border-end">
                        <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="rgba(0,0,0,0.06)"
                              strokeWidth="3.5"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#0F766E"
                              strokeWidth="3.5"
                              strokeDasharray={`${selectedAnalysis.ats_score}, 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--bs-body-color)' }}>{selectedAnalysis.ats_score}</span>
                            <div style={{ fontSize: '8px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>ATS Score</div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <span className="badge bg-primary-subtle text-primary fw-bold fs-9">
                            {selectedAnalysis.ats_overall_rating}
                          </span>
                        </div>
                      </div>

                      {/* Ratings Breakdown */}
                      <div className="col-md-8 px-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="fw-bold text-dark mb-0">Resume Quality (Overall Rating: {selectedAnalysis.overall_rating})</h6>
                          <span className="badge bg-teal text-white fw-bold px-2 py-1" style={{ backgroundColor: '#0F766E' }}>Score: {selectedAnalysis.resume_score}/100</span>
                        </div>
                        <div className="d-flex flex-column gap-2">
                          {[
                            { label: 'Technical Core Skills', val: selectedAnalysis.tech_skills_score, color: '#0F766E' },
                            { label: 'Communication & Layout', val: selectedAnalysis.communication_score, color: '#2563EB' },
                            { label: 'Academic Presentation', val: selectedAnalysis.education_score, color: '#06B6D4' },
                            { label: 'Projects Detail', val: selectedAnalysis.projects_score, color: '#EA580C' },
                            { label: 'Work Experience Relevance', val: selectedAnalysis.experience_score, color: '#16A34A' }
                          ].map(metric => (
                            <div key={metric.label}>
                              <div className="d-flex justify-content-between fs-8 fw-semibold mb-1" style={{ color: 'var(--ad-muted)' }}>
                                <span>{metric.label}</span>
                                <span>{metric.val}/100</span>
                              </div>
                              <div className="progress" style={{ height: '6px', borderRadius: '10px', background: 'rgba(0,0,0,0.06)' }}>
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{ width: `${metric.val}%`, borderRadius: '10px', backgroundColor: metric.color }}
                                  aria-valuenow={metric.val}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses Panel */}
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <div className="card p-3 border-success-subtle bg-success-subtle bg-opacity-10 h-100" style={{ borderRadius: '10px' }}>
                          <h6 className="fw-bold text-success mb-2">💪 Candidate Strengths</h6>
                          <ul className="fs-7 text-dark mb-0 ps-3">
                            {selectedAnalysis.strengths.map((str, idx) => (
                              <li key={idx} className="mb-1">{str}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card p-3 border-danger-subtle bg-danger-subtle bg-opacity-10 h-100" style={{ borderRadius: '10px' }}>
                          <h6 className="fw-bold text-danger mb-2">⚠️ Candidate Weaknesses</h6>
                          <ul className="fs-7 text-dark mb-0 ps-3">
                            {selectedAnalysis.weaknesses.map((weak, idx) => (
                              <li key={idx} className="mb-1">{weak}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="card p-3 border-light mb-0" style={{ borderRadius: '10px', background: 'var(--ad-hover-bg)' }}>
                      <h6 className="fw-bold text-dark mb-2">💡 AI Improvement Suggestions</h6>
                      <ul className="fs-7 text-muted ps-3 mb-0">
                        {selectedAnalysis.suggestions.map((sug, idx) => (
                          <li key={idx} className="mb-1">{sug}</li>
                        ))}
                        {selectedAnalysis.improvement_tips.map((tip, idx) => (
                          <li key={idx} className="mb-1">{tip}</li>
                        ))}
                        {selectedAnalysis.ats_suggestions.map((ats, idx) => (
                          <li key={idx} className="mb-1">ATS Optimization: {ats}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="modal-footer border-top py-2 px-3">
                <button type="button" className="btn btn-sm btn-secondary px-3" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
