import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Remember Me state
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password alert state
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState('');

  // Demo panel toggle
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  // Contact modal state
  const [showContactModal, setShowContactModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load theme and remembered email on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleFillDemo = (role) => {
    if (role === 'admin') {
      setEmail('admin@placement.com');
      setPassword('admin123');
    } else if (role === 'company') {
      setEmail('hr@google.com');
      setPassword('company123');
    } else if (role === 'student') {
      setEmail('student@example.com');
      setPassword('student123');
    }
    setError('');
    setForgotPasswordMsg('');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setForgotPasswordMsg('Please contact the Placement Portal Administrator at admin@placement.com to reset your password.');
  };

  // Validate form fields on the client side
  const validateForm = () => {
    if (!email || !password) {
      setError('Both email and password are required.');
      return false;
    }
    // Simple email regex pattern
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotPasswordMsg('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      // POST user credentials to backend login endpoint
      const response = await api.post('/auth/login', { email, password });
      
      // If OTP was sent successfully (Student verification), redirect to OTP view
      if (response.data?.message === "OTP sent successfully") {
        if (rememberMe) {
          localStorage.setItem('remembered_email', email);
        } else {
          localStorage.removeItem('remembered_email');
        }
        navigate('/verify-otp', { state: { email } });
        return;
      }
      
      // Extract the JWT token from the response
      // Support both `access_token` (returned by actual backend) and `token` fallback
      const token = response.data.access_token || response.data.token;
      
      if (!token) {
        throw new Error('Token not found in response');
      }

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      // Log user in and extract their role
      const userRole = login(token);

      if (userRole) {
        // Redirect to corresponding dashboard
        if (userRole === 'admin') navigate('/admin');
        else if (userRole === 'company') navigate('/company');
        else if (userRole === 'student') navigate('/student');
        else navigate('/');
      } else {
        setError('Failed to extract user role from token.');
      }
    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleScrollTo = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* TOP NAVBAR */}
      <nav className="navbar navbar-expand-lg login-navbar px-lg-5 px-3">
        <div className="container-fluid d-flex align-items-center justify-content-between p-0">
          <Link className="navbar-brand animate-fade-down" to="/">
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="36" height="36" rx="8" fill="url(#logoGrad)" />
              <path d="M10 18C10 14.6863 12.6863 12 16 12H20C23.3137 12 26 14.6863 26 18C26 21.3137 23.3137 24 20 24H16C12.6863 24 10 21.3137 10 18Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="15" cy="18" r="3" fill="white" />
              <circle cx="21" cy="18" r="3" fill="#10B981" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0F766E" />
                  <stop offset="1" stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </svg>
            <span className="ms-2">Place<span className="logo-accent">Link</span></span>
          </Link>

          <div className="d-flex align-items-center gap-3 animate-fade-down">
            <div className="login-nav-links d-flex gap-2">
              <button onClick={() => handleScrollTo('about-section')} className="btn p-0 login-nav-link">About</button>
              <button onClick={() => handleScrollTo('features-section')} className="btn p-0 login-nav-link">Features</button>
              <button onClick={() => setShowContactModal(true)} className="btn p-0 login-nav-link">Contact</button>
            </div>
            
            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 border-0 py-2 px-3"
              style={{ borderRadius: '10px', fontSize: '14px', background: 'rgba(15, 118, 110, 0.05)', color: 'var(--login-text)' }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              aria-label="Toggle dark mode"
            >
              <span>{theme === 'light' ? '🌙 Dark' : '☀️ Light'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER (SPLIT-SCREEN) */}
      <main className="login-main-container container-fluid">
        <div className="login-split-row">
          
          {/* LEFT SIDE (60%) */}
          <section id="about-section" className="login-left-pane animate-slide-up">
            <h1 className="portal-tagline">
              Campus Placement Portal
            </h1>
            <p className="portal-subtitle">
              Connecting Students with Companies through a Smart Placement Platform
            </p>

            {/* Features List */}
            <div id="features-section" className="features-grid animate-fade-left animate-delay-1">
              {[
                'AI Resume Analysis',
                'ATS Score',
                'Skill Extraction',
                'Resume Upload',
                'Placement Drives',
                'Interview Scheduling',
                'Live Analytics',
                'Notifications'
              ].map((feature, idx) => (
                <div className="feature-item" key={idx}>
                  <span className="feature-icon-wrapper" aria-hidden="true">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Statistics */}
            <div className="statistics-bar animate-fade-left animate-delay-2">
              {[
                { count: '1248+', label: 'Students' },
                { count: '95+', label: 'Companies' },
                { count: '412+', label: 'Placed Students' },
                { count: '24+', label: 'Live Drives' }
              ].map((stat, idx) => (
                <div className="stat-item" key={idx}>
                  <span className="stat-number">{stat.count}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>

            {/* SVG Illustration */}
            <div className="illustration-container animate-fade-left animate-delay-3 d-none d-md-flex">
              <svg className="illustration-svg" viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Campus Placement Illustration">
                <defs>
                  <filter id="svgShadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.06" floodColor="#0F172A" />
                  </filter>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#2563EB" />
                  </linearGradient>
                </defs>

                {/* Central Work Station / Dashboard */}
                <rect x="110" y="80" width="280" height="170" rx="12" className="svg-device-body" fill="#475569" />
                <rect x="120" y="90" width="260" height="140" rx="6" className="svg-device-screen" fill="#0F172A" />
                <rect x="230" y="250" width="40" height="30" className="svg-device-stand" fill="#334155" />
                <ellipse cx="250" cy="280" rx="50" ry="8" className="svg-device-stand-base" fill="#334155" />

                {/* Code/Charts on Laptop Screen */}
                <path d="M140 200 L180 150 L220 170 L260 120 L300 140 L360 100" stroke="url(#chartGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="180" cy="150" r="4" fill="#10B981" />
                <circle cx="260" cy="120" r="4" fill="#2563EB" />
                <circle cx="360" cy="100" r="4" fill="#3B82F6" />
                
                {/* Floating Dashboard Card 1 (ATS Score) */}
                <g filter="url(#svgShadow)" className="svg-card animate-float-slow">
                  <rect x="40" y="50" width="130" height="70" rx="10" className="svg-card-bg" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                  <circle cx="65" cy="85" r="16" fill="rgba(16, 185, 129, 0.1)" />
                  <path d="M60 85 L63 88 L70 81" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="92" y="77" className="svg-card-title" fill="#6B7280" fontSize="10" fontWeight="600" fontFamily="Inter">ATS MATCH</text>
                  <text x="92" y="95" className="svg-card-value" fill="#111827" fontSize="16" fontWeight="800" fontFamily="Inter">92%</text>
                </g>

                {/* Floating Dashboard Card 2 (Interview Scheduled) */}
                <g filter="url(#svgShadow)" className="svg-card animate-float-medium">
                  <rect x="330" y="190" width="140" height="75" rx="10" className="svg-card-bg" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                  <circle cx="360" cy="227" r="16" fill="rgba(37, 99, 235, 0.1)" />
                  <rect x="352" y="219" width="16" height="16" rx="3" stroke="#2563EB" strokeWidth="1.5" />
                  <path d="M352 224 H368 M356 217 V220 M364 217 V220" stroke="#2563EB" strokeWidth="1.5" />
                  <text x="386" y="217" className="svg-card-title" fill="#6B7280" fontSize="9" fontWeight="600" fontFamily="Inter">INTERVIEW</text>
                  <text x="386" y="232" className="svg-card-value" fill="#111827" fontSize="12" fontWeight="700" fontFamily="Inter">Google Inc.</text>
                  <text x="386" y="245" className="svg-card-sub" fill="#10B981" fontSize="9" fontWeight="600" fontFamily="Inter">Today 2:00 PM</text>
                </g>

                {/* Floating Dashboard Card 3 (Skill Extraction) */}
                <g filter="url(#svgShadow)" className="svg-card animate-float-fast">
                  <rect x="320" y="30" width="140" height="70" rx="10" className="svg-card-bg" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
                  <circle cx="350" cy="65" r="16" fill="rgba(15, 118, 110, 0.1)" />
                  <path d="M346 59 H354 V67 H346 Z" stroke="#0F766E" strokeWidth="1.5" />
                  <path d="M343 62 L347 58 M351 66 L355 62" stroke="#0F766E" strokeWidth="1.5" />
                  <text x="376" y="58" className="svg-card-title" fill="#6B7280" fontSize="9" fontWeight="600" fontFamily="Inter">SKILL MATRIX</text>
                  <rect x="376" y="66" width="36" height="14" rx="4" fill="#0F766E" />
                  <text x="382" y="76" fill="#FFFFFF" fontSize="8" fontWeight="600" fontFamily="Inter">React</text>
                  <rect x="416" y="66" width="32" height="14" rx="4" fill="#10B981" />
                  <text x="422" y="76" fill="#FFFFFF" fontSize="8" fontWeight="600" fontFamily="Inter">Flask</text>
                </g>
              </svg>
            </div>
          </section>

          {/* RIGHT SIDE (40% - LOGIN CARD) */}
          <section className="login-right-pane animate-slide-up animate-delay-1">
            <div className="premium-login-card hover-scale">
              <h2 className="card-welcome">👋 Welcome Back</h2>
              <p className="card-subtitle">Sign in to continue to PlaceLink</p>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert" style={{ borderRadius: '10px' }}>
                  <strong>Error:</strong> {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError('')}
                    aria-label="Close alert"
                  ></button>
                </div>
              )}

              {forgotPasswordMsg && (
                <div className="alert alert-info alert-dismissible fade show" role="alert" style={{ borderRadius: '10px', fontSize: '14px' }}>
                  {forgotPasswordMsg}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setForgotPasswordMsg('')}
                    aria-label="Close alert"
                  ></button>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="login-field-group">
                  <label htmlFor="emailInput" className="login-label">Email address</label>
                  <input
                    type="email"
                    className="login-input"
                    id="emailInput"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="login-field-group">
                  <label htmlFor="passwordInput" className="login-label">Password</label>
                  <input
                    type="password"
                    className="login-input"
                    id="passwordInput"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="form-actions">
                  <label className="remember-checkbox-label" htmlFor="rememberCheckbox">
                    <input
                      type="checkbox"
                      id="rememberCheckbox"
                      className="remember-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember Me
                  </label>
                  <a href="#forgot" onClick={handleForgotPassword} className="forgot-link">
                    Forgot Password?
                  </a>
                </div>

                <button
                  type="submit"
                  className="login-submit-btn hover-scale"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Signing In...
                    </>
                  ) : 'Login'}
                </button>
              </form>

              <div className="divider">OR</div>

              {/* Registration Links */}
              <div className="register-links">
                <Link to="/register/student" className="register-btn hover-scale">
                  Register as Student
                </Link>
                <Link to="/register/company" className="register-btn hover-scale">
                  Register as Company
                </Link>
              </div>

              {/* Demo Credentials Section */}
              <button
                type="button"
                className="demo-credentials-trigger hover-scale"
                onClick={() => setShowDemoPanel(!showDemoPanel)}
                aria-expanded={showDemoPanel}
              >
                🔑 Demo Credentials
              </button>

              {showDemoPanel && (
                <div className="demo-credentials-panel animate-slide-up">
                  <div className="demo-account-row">
                    <div>
                      <span className="demo-account-label">Admin:</span>
                      <span className="demo-account-details ms-2">admin@placement.com</span>
                    </div>
                    <button
                      type="button"
                      className="demo-fill-btn"
                      onClick={() => handleFillDemo('admin')}
                    >
                      Fill
                    </button>
                  </div>
                  <div className="demo-account-row">
                    <div>
                      <span className="demo-account-label">Company:</span>
                      <span className="demo-account-details ms-2">hr@google.com</span>
                    </div>
                    <button
                      type="button"
                      className="demo-fill-btn"
                      onClick={() => handleFillDemo('company')}
                    >
                      Fill
                    </button>
                  </div>
                  <div className="demo-account-row">
                    <div>
                      <span className="demo-account-label">Student:</span>
                      <span className="demo-account-details ms-2">student@example.com</span>
                    </div>
                    <button
                      type="button"
                      className="demo-fill-btn"
                      onClick={() => handleFillDemo('student')}
                    >
                      Fill
                    </button>
                  </div>
                  <small className="text-muted" style={{ fontSize: '10px', marginTop: '4px', display: 'block' }}>
                    *For Student, please register first if the account doesn't exist yet.
                  </small>
                </div>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="login-footer">
        <div>© 2026 PlaceLink</div>
        <div className="footer-tech-stack">
          <span>Built using</span>
          <span className="tech-badge">React</span>
          <span className="tech-badge">Flask</span>
          <span className="tech-badge">SQLite</span>
          <span className="tech-badge">Bootstrap</span>
        </div>
      </footer>

      {/* CONTACT DETAILS MODAL */}
      {showContactModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }} role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px', border: '1px solid var(--login-border)', background: 'var(--login-card-bg)', color: 'var(--login-text)' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold" style={{ fontSize: '20px' }}>📞 Contact Placement Office</h5>
                <button type="button" className="btn-close" onClick={() => setShowContactModal(false)} aria-label="Close"></button>
              </div>
              <div className="modal-body py-4">
                <p className="mb-3">For placement enquiries, corporate collaborations, or portal assistance, reach out to us:</p>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-3">
                    <span style={{ fontSize: '20px' }}>🏢</span>
                    <div>
                      <div className="fw-semibold">Placement Cell Headquarters</div>
                      <div className="text-muted small">Admin Block, 3rd Floor</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span style={{ fontSize: '20px' }}>✉️</span>
                    <div>
                      <div className="fw-semibold">Email Us</div>
                      <div className="text-muted small">admin@placement.com</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3">
                    <span style={{ fontSize: '20px' }}>📞</span>
                    <div>
                      <div className="fw-semibold">Phone Helpline</div>
                      <div className="text-muted small">8248964979</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn w-100 py-2 fw-semibold" style={{ background: 'var(--login-primary)', color: '#fff', borderRadius: '10px' }} onClick={() => setShowContactModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
