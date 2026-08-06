import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import NotificationDrawer, { useNotificationCount } from '../../components/common/NotificationDrawer';
import './student.css';

ChartJS.register(ArcElement, Tooltip, Legend);

const StudentDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [drives, setDrives]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime]       = useState(new Date());
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { count: unreadCount, refresh: refreshCount } = useNotificationCount();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const [analysis, setAnalysis] = useState(null);
  const [skills, setSkills]       = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsMissing, setInsightsMissing] = useState(false);

  const fileInputRef = useRef(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setAnalysisError('Only PDF files are allowed.');
      return;
    }
    try {
      setUploadingResume(true);
      setAnalysisError(null);
      setInsightsMissing(false);
      const fd = new FormData();
      fd.append('resume', file);
      await api.post('/student/upload-resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fetchResumeInsights();
      if (data) {
        setData(prev => ({ ...prev, resume_uploaded: true }));
      }
    } catch (err) {
      console.error("Resume upload failed:", err);
      setAnalysisError(err.response?.data?.error || 'Failed to upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  useEffect(() => {
    Promise.all([
      api.get('/student/dashboard/summary'),
      api.get('/student/drives'),
    ]).then(([summaryRes, drivesRes]) => {
      setData(summaryRes.data);
      setDrives(drivesRes.data || []);
      if (summaryRes.data?.resume_uploaded) {
        fetchResumeInsights();
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const fetchResumeInsights = () => {
    setLoadingInsights(true);
    setAnalysisError(null);
    setInsightsMissing(false);
    
    api.get('/student/resume-analysis')
      .then(analysisRes => {
        setAnalysis(analysisRes.data);
        return api.get('/student/skills');
      })
      .then(skillsRes => {
        setSkills(skillsRes.data);
      })
      .catch(err => {
        console.error("Error fetching AI insights:", err);
        const errMsg = err.response?.data?.error;
        if (err.response?.status === 404 && (!errMsg || !errMsg.includes("Resume file"))) {
          setInsightsMissing(true);
        } else {
          setAnalysisError(errMsg || "Failed to load AI insights.");
        }
      })
      .finally(() => {
        setLoadingInsights(false);
      });
  };

  const handleReScanResume = () => {
    setLoadingInsights(true);
    setAnalysisError(null);
    api.post('/student/resume-analysis/re-scan')
      .then(res => {
        setAnalysis(res.data.analysis);
        return api.get('/student/skills');
      })
      .then(skillsRes => {
        setSkills(skillsRes.data);
      })
      .catch(err => {
        console.error("Re-scan error:", err);
        setAnalysisError(err.response?.data?.error || "Failed to re-scan resume.");
      })
      .finally(() => {
        setLoadingInsights(false);
      });
  };
  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const sb = data?.status_breakdown || {};

  const doughnutData = {
    labels: ['Selected', 'Shortlisted', 'Applied', 'Rejected'],
    datasets: [{
      data: [sb.selected || 0, sb.shortlisted || 0, sb.applied || 0, sb.rejected || 0],
      backgroundColor: ['#16A34A', '#D97706', '#2563EB', '#DC2626'],
      borderWidth: 0,
      spacing: 2,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } } },
  };

  // Closing soon = drives sorted by deadline, nearest first, show top 3
  const today = new Date();
  const closingSoon = [...drives]
    .filter(d => d.application_deadline)
    .map(d => ({
      ...d,
      daysLeft: Math.ceil((new Date(d.application_deadline) - today) / 86400000),
    }))
    .filter(d => d.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3);

  if (loading) {
    return (
      <div className="sp-page">
        <div className="sp-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: '#6B7280' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <div>Loading your dashboard…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      {/* ── TOPBAR ── */}
      <div className="sp-topbar">
        <span className="sp-topbar__title">Dashboard</span>
        <div className="sp-topbar__right">
          <span className="sp-live-badge"><span className="sp-live-dot" />LIVE</span>
          <span className="sp-time-badge">{timeStr} IST</span>
          <span className="sp-role-badge">STUDENT</span>
          <button
            className="sp-topbar__bell"
            title="Notifications"
            onClick={() => setIsDrawerOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="sp-topbar__bell-badge">{unreadCount}</span>}
          </button>
          <button className="sp-btn-ghost" onClick={() => { logout(); navigate('/login'); }}>Sign Out</button>
          <Link to="/student/drives" className="sp-btn-primary" style={{ display:'inline-flex',alignItems:'center',textDecoration:'none',gap:'6px' }}>
            Browse Drives
          </Link>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="sp-content">
        {/* Breadcrumb */}
        <div className="sp-breadcrumb">
          <Link to="/student">Home</Link>
          <span className="sp-breadcrumb__sep">›</span>
          <span>Dashboard</span>
        </div>

        {/* KPI Cards */}
        <div className="sp-kpi-grid">
          <div className="sp-kpi-card">
            <span className="sp-kpi-card__label">Applied Drives</span>
            <div className="sp-kpi-card__value">{data?.applied_drives || 0}</div>
            <span className="sp-chip sp-chip--blue">{data?.eligible_drives || 0} eligible</span>
          </div>
          <div className="sp-kpi-card">
            <span className="sp-kpi-card__label">Shortlisted</span>
            <div className="sp-kpi-card__value">{sb.shortlisted || 0}</div>
            <span className="sp-kpi-card__sub">{sb.shortlisted > 0 ? 'Awaiting result' : 'Keep applying!'}</span>
          </div>
          <div className="sp-kpi-card">
            <span className="sp-kpi-card__label">Selected</span>
            <div className="sp-kpi-card__value" style={{ color: sb.selected > 0 ? '#16A34A' : undefined }}>
              {sb.selected || 0}
            </div>
            {sb.selected > 0
              ? <span className="sp-chip sp-chip--green">Offer received!</span>
              : <span className="sp-kpi-card__sub">Aim for it!</span>}
          </div>
          <div className="sp-kpi-card">
            <span className="sp-kpi-card__label">Upcoming Interviews</span>
            <div className="sp-kpi-card__value">{data?.interview_count || 0}</div>
            {data?.upcoming_interview
              ? <span className="sp-kpi-card__sub">Next: {data.upcoming_interview.date}</span>
              : <span className="sp-kpi-card__sub">None scheduled</span>}
          </div>
        </div>

        {/* Profile Completeness Bar */}
        <div className="sp-profile-bar">
          <span className="sp-profile-bar__label">Profile Completeness</span>
          <div className="sp-profile-bar__track">
            <div className="sp-profile-bar__fill" style={{ width: `${data?.profile_completion || 0}%` }} />
          </div>
          <span className="sp-profile-bar__pct">{data?.profile_completion || 0}%</span>
          <Link to="/student/profile" className="sp-btn-primary" style={{ textDecoration:'none',fontSize:'12px',height:'28px',display:'inline-flex',alignItems:'center',padding:'0 12px' }}>
            Complete Profile
          </Link>
        </div>

        {/* AI Resume Insights Section */}
        {data?.resume_uploaded && (
          <div className="sp-panel" style={{ marginBottom: '16px' }}>
            <div className="sp-panel__header" style={{ borderBottom: '1px solid var(--sidebar-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="sp-panel__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✨ AI Resume Insights & ATS Analysis
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {analysis && (
                  <button
                    onClick={handleReScanResume}
                    className="btn btn-sm btn-outline-secondary px-3 py-1 fs-8 fw-semibold"
                    disabled={loadingInsights}
                    style={{ border: '1px solid #d1d5db', borderRadius: '6px' }}
                  >
                    {loadingInsights ? 'Scanning...' : '🔄 Re-Scan'}
                  </button>
                )}
                {analysis && (
                  <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 fs-8 fw-semibold">
                    Overall Rating: {analysis.overall_rating}
                  </span>
                )}
              </div>
            </div>
            
            <div className="sp-panel__body">
              {loadingInsights ? (
                <div className="text-center py-4" style={{ color: '#6B7280' }}>
                  <div className="spinner-border spinner-border-sm text-teal me-2" style={{ color: '#0F766E' }} role="status"></div>
                  <span>Generating your AI resume score and ATS compatibility insights...</span>
                </div>
              ) : insightsMissing ? (
                <div className="alert alert-warning mb-0 text-center rounded-3 p-4">
                  <span className="fs-1 d-block mb-2">🔍</span>
                  <div className="fw-semibold mb-1">AI Resume Insights Pending</div>
                  <p className="text-muted fs-7 mb-3">Your resume is uploaded, but the AI analysis report was not found. Please click below to generate your insights or re-upload your resume.</p>
                  <div className="d-flex justify-content-center gap-2">
                    <button 
                      onClick={fetchResumeInsights} 
                      className="btn btn-sm btn-teal text-white fw-semibold px-3 py-1"
                      style={{ backgroundColor: '#0F766E' }}
                    >
                      Retry Analysis
                    </button>
                    <Link to="/student/profile" className="btn btn-sm btn-outline-secondary px-3 py-1">
                      Go to Profile
                    </Link>
                  </div>
                </div>
              ) : analysisError ? (
                <div className="alert alert-danger mb-0 text-center rounded-3 p-4">
                  <span className="fs-1 d-block mb-2">⚠️</span>
                  <div className="fw-semibold mb-1">Failed to Load AI Resume Insights</div>
                  <p className="text-muted fs-7 mb-3">{analysisError}</p>
                  <div className="d-flex justify-content-center gap-2">
                    <button 
                      onClick={fetchResumeInsights} 
                      className="btn btn-sm btn-teal text-white fw-semibold px-3 py-1"
                      style={{ backgroundColor: '#0F766E' }}
                      disabled={uploadingResume}
                    >
                      Retry
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleResumeUpload} 
                      accept=".pdf" 
                      style={{ display: 'none' }} 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="btn btn-sm btn-outline-danger px-3 py-1"
                      style={{ borderRadius: '6px' }}
                      disabled={uploadingResume}
                    >
                      {uploadingResume ? 'Uploading...' : 'Re-upload Resume (PDF)'}
                    </button>
                  </div>
                </div>
              ) : !analysis ? (
                <div className="text-center py-4" style={{ color: '#6B7280' }}>
                  <span className="text-muted">No resume analysis available. Please upload a resume.</span>
                </div>
              ) : (
                <div>
                  {/* Scores Grid */}
                  <div className="row g-4 mb-4 align-items-center">
                    {/* circular ATS indicator */}
                    <div className="col-md-3 d-flex flex-column align-items-center justify-content-center border-end">
                      <div style={{ width: '120px', height: '120px', position: 'relative' }}>
                        {/* Circular Progress SVG */}
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
                            strokeDasharray={`${analysis.ats_score}, 100`}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
                          />
                        </svg>
                        <div style={{ position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                          <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--bs-body-color)' }}>{analysis.ats_score}</span>
                          <div style={{ fontSize: '9px', color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>ATS Score</div>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <span className="badge bg-primary-subtle text-primary fw-bold" style={{ fontSize: '10px' }}>
                          {analysis.ats_overall_rating}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Scores */}
                    <div className="col-md-5 border-end px-4">
                      <h6 className="fw-bold text-dark mb-3">Resume Metrics Breakdown (Resume Score: {analysis.resume_score}/100)</h6>
                      <div className="d-flex flex-column gap-2">
                        {[
                          { label: 'Technical Skills', val: analysis.tech_skills_score, color: '#0F766E' },
                          { label: 'Communication', val: analysis.communication_score, color: '#2563EB' },
                          { label: 'Education', val: analysis.education_score, color: '#06B6D4' },
                          { label: 'Projects Quality', val: analysis.projects_score, color: '#EA580C' },
                          { label: 'Experience Relevance', val: analysis.experience_score, color: '#16A34A' }
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
                                aria-valuemin="0"
                                aria-valuemax="100"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ATS specific breakdowns */}
                    <div className="col-md-4 px-4">
                      <h6 className="fw-bold text-dark mb-3">ATS Scan Health</h6>
                      <div className="d-flex flex-column gap-3">
                        {[
                          { label: 'Headings Readability', val: analysis.ats_headings_score },
                          { label: 'Contact Info Found', val: analysis.ats_contact_score },
                          { label: 'Keyword Match Density', val: analysis.ats_keyword_score }
                        ].map(atsMetric => (
                          <div key={atsMetric.label} className="d-flex align-items-center justify-content-between border-bottom pb-2">
                            <span className="fs-7 text-muted fw-medium">{atsMetric.label}</span>
                            <span className={`badge ${atsMetric.val >= 80 ? 'bg-success-subtle text-success' : atsMetric.val >= 50 ? 'bg-warning-subtle text-warning' : 'bg-danger-subtle text-danger'} fw-bold px-2 py-1`}>
                              {atsMetric.val}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  {skills && Object.keys(skills).length > 0 && (
                    <div className="mb-4 border-top pt-4">
                      <h6 className="fw-bold text-dark mb-3">🤖 AI Extracted Skills Badges</h6>
                      <div className="d-flex flex-column gap-3">
                        {Object.entries(skills).map(([category, items]) => {
                          if (!items || items.length === 0) return null;
                          return (
                            <div key={category} className="d-flex align-items-start gap-2">
                              <span className="text-muted fw-bold fs-8 text-uppercase mt-1" style={{ width: '180px', flexShrink: 0 }}>
                                {category}
                              </span>
                              <div className="d-flex flex-wrap gap-1">
                                {items.map(s => (
                                  <span key={s} className="badge bg-info-subtle text-info fw-semibold border border-info-subtle rounded-pill px-2 py-1 fs-8">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses Panel */}
                  <div className="row g-3 border-top pt-4">
                    <div className="col-md-6">
                      <div className="card p-3 border-success-subtle bg-success-subtle bg-opacity-10 h-100" style={{ borderRadius: '10px' }}>
                        <h6 className="fw-bold text-success mb-2">💪 Resume Strengths</h6>
                        <ul className="fs-7 text-dark mb-0 ps-3">
                          {analysis.strengths.map((str, idx) => (
                            <li key={idx} className="mb-1">{str}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card p-3 border-danger-subtle bg-danger-subtle bg-opacity-10 h-100" style={{ borderRadius: '10px' }}>
                        <h6 className="fw-bold text-danger mb-2">⚠️ Areas for Improvement (Weaknesses)</h6>
                        <ul className="fs-7 text-dark mb-0 ps-3">
                          {analysis.weaknesses.map((weak, idx) => (
                            <li key={idx} className="mb-1">{weak}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Missing sections & suggestions */}
                  <div className="row g-3 mt-1">
                    {/* ATS Missing keywords & suggestions */}
                    <div className="col-md-6">
                      <div className="card p-3 border-light h-100" style={{ borderRadius: '10px', background: 'var(--ad-hover-bg)' }}>
                        <h6 className="fw-bold text-dark mb-2">⚡ ATS Optimization & Missing Keywords</h6>
                        {analysis.ats_missing_keywords.length > 0 && (
                          <div className="mb-2">
                            <span className="fs-8 fw-bold text-muted d-block mb-1">RECOMMENDED KEYWORDS:</span>
                            <div className="d-flex flex-wrap gap-1">
                              {analysis.ats_missing_keywords.map((kw, idx) => (
                                <span key={idx} className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-3 px-2 py-1 fs-8">
                                  +{kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <ul className="fs-7 text-muted ps-3 mb-0">
                          {analysis.ats_suggestions.map((sug, idx) => (
                            <li key={idx} className="mb-1">{sug}</li>
                          ))}
                          {analysis.ats_formatting_issues.map((issue, idx) => (
                            <li key={idx} className="text-danger mb-1">Formatting: {issue}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Overall AI suggestions */}
                    <div className="col-md-6">
                      <div className="card p-3 border-light h-100" style={{ borderRadius: '10px', background: 'var(--ad-hover-bg)' }}>
                        <h6 className="fw-bold text-dark mb-2">💡 Tips & AI Suggestions</h6>
                        <ul className="fs-7 text-muted ps-3 mb-0">
                          {analysis.suggestions.map((sug, idx) => (
                            <li key={idx} className="mb-1">{sug}</li>
                          ))}
                          {analysis.improvement_tips.map((tip, idx) => (
                            <li key={idx} className="mb-1">{tip}</li>
                          ))}
                          {analysis.grammar_issues.map((g, idx) => (
                            <li key={idx} className="text-warning mb-1">Grammar: {g}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

        {/* Main 2-col grid */}
        <div className="sp-main-grid">
          {/* LEFT — Application Status + Upcoming Interviews */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Application Status Breakdown */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Application Status Breakdown</span>
                <Link to="/student/applications" className="sp-panel__link">View all →</Link>
              </div>
              <div className="sp-panel__body" style={{ display:'flex', gap:'24px', alignItems:'center' }}>
                <div style={{ width:'160px', height:'160px', flexShrink:0 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <div className="sp-doughnut-legend" style={{ flex:1 }}>
                  {[
                    { label:'Selected',    color:'#16A34A', count: sb.selected    || 0 },
                    { label:'Shortlisted', color:'#D97706', count: sb.shortlisted || 0 },
                    { label:'Applied',     color:'#2563EB', count: sb.applied     || 0 },
                    { label:'Rejected',    color:'#DC2626', count: sb.rejected    || 0 },
                  ].map(item => (
                    <div className="sp-legend-row" key={item.label}>
                      <span className="sp-legend-dot-label">
                        <span className="sp-legend-dot" style={{ background: item.color }} />
                        {item.label}
                      </span>
                      <span className="sp-legend-count">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Interviews */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Upcoming Interviews</span>
                <Link to="/student/interviews" className="sp-panel__link">All →</Link>
              </div>
              <div className="sp-panel__body">
                {data?.upcoming_interview ? (
                  <div className="sp-interview-card">
                    <div className="sp-interview-card__company">
                      {data.upcoming_interview.company_name} · {data.upcoming_interview.job_title}
                    </div>
                    <div className="sp-interview-card__title">{data.upcoming_interview.date}</div>
                    <div className="sp-interview-card__meta">Round 1 — Technical Interview</div>
                    <span className={`sp-mode-badge sp-mode--${data.upcoming_interview.mode}`}>
                      {data.upcoming_interview.mode === 'online' ? '🌐' : '📍'} {data.upcoming_interview.mode === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ) : (
                  <div style={{ textAlign:'center', padding:'24px 0', color:'#9CA3AF' }}>
                    <div style={{ fontSize:'28px', marginBottom:'8px' }}>📅</div>
                    <div style={{ fontSize:'13px' }}>No interviews scheduled yet</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Closing Soon + Quick Actions */}
          <div className="sp-side-col">
            {/* Closing Soon */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Closing Soon</span>
                <Link to="/student/drives" className="sp-panel__link">Browse →</Link>
              </div>
              <div className="sp-panel__body">
                {closingSoon.length === 0 ? (
                  <div style={{ textAlign:'center', color:'#9CA3AF', padding:'16px 0', fontSize:'13px' }}>No upcoming deadlines</div>
                ) : closingSoon.map(d => (
                  <div className="sp-closing-item" key={d.id}>
                    <div>
                      <div className="sp-closing-item__title">{d.company_name} · {d.job_title}</div>
                      <div className="sp-closing-item__sub">{d.package_lpa} LPA</div>
                    </div>
                    <span className={`sp-days-left ${d.daysLeft <= 2 ? 'sp-days--urgent' : d.daysLeft <= 5 ? 'sp-days--medium' : 'sp-days--ok'}`}>
                      {d.daysLeft}d left
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="sp-panel">
              <div className="sp-panel__header">
                <span className="sp-panel__title">Quick Actions</span>
              </div>
              <div className="sp-panel__body">
                <Link to="/student/drives" className="sp-quick-btn sp-quick-btn--primary">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Browse Open Drives
                </Link>
                <Link to="/student/profile" className="sp-quick-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Complete Profile ({data?.profile_completion || 0}%)
                </Link>
                <Link to="/student/applications" className="sp-quick-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  My Applications
                </Link>
                <Link to="/student/interviews" className="sp-quick-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Interviews
                </Link>
              </div>
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

export default StudentDashboard;
