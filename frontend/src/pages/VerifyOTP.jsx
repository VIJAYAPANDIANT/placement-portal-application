import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Login.css';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const email = location.state?.email || '';
  
  // State variables
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Countdown timer for OTP expiration (5 minutes = 300 seconds)
  const [expiresIn, setExpiresIn] = useState(300);
  
  // Lockout countdown timer for resend button (60 seconds)
  const [resendCooldown, setResendCooldown] = useState(60);

  // References for OTP input elements to control auto-focus
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Redirect if no email state is passed
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Expiration countdown effect
  useEffect(() => {
    if (expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresIn]);

  // Resend button cooldown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle key inputs in 6 boxes
  const handleChange = (index, value) => {
    // Only accept numeric inputs
    if (value && isNaN(value)) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next box if populated
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace back-focus
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && !isNaN(pasteData)) {
      const pasteArray = pasteData.split('');
      setOtp(pasteArray);
      inputRefs[5].current.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    if (expiresIn <= 0) {
      setError('OTP has expired. Please request a new OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpCode
      });

      const token = response.data.access_token || response.data.token;
      if (!token) {
        throw new Error('Token not found in response');
      }

      setSuccess('Verification successful! Logging in...');
      
      // Delay navigation slightly so they can see success state
      setTimeout(() => {
        const userRole = login(token);
        if (userRole === 'student') {
          navigate('/student');
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.message || 'OTP verification failed. Please try again.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setSuccess('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);

    try {
      await api.post('/auth/resend-otp', { email });
      setSuccess('A new verification code has been sent to your email.');
      setExpiresIn(300); // Reset 5-minute timer
      setResendCooldown(60); // Reset 60-second resend limit
      inputRefs[0].current.focus(); // Focus first input
    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.message || 'Failed to resend OTP. Please try again later.';
      setError(serverMessage);
    } finally {
      setLoading(false);
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

      {/* MAIN CONTAINER */}
      <main className="login-main-container container-fluid d-flex flex-column align-items-center justify-content-center">
        <div className="animate-slide-up" style={{ width: '100%', maxWidth: '450px' }}>
          <div className="premium-login-card hover-scale w-100">
            
            {/* Page Header */}
            <div className="text-center mb-4">
              <span className="fs-1 d-block mb-2" role="img" aria-label="shield">🔑</span>
              <h2 className="card-welcome fs-3">OTP Verification</h2>
              <p className="card-subtitle text-muted mt-2">
                We've sent a 6-digit verification code to <br />
                <strong className="text-dark" style={{ color: 'var(--login-text) !important' }}>{email}</strong>
              </p>
            </div>

            {/* Error and Success Alerts */}
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

            {success && (
              <div className="alert alert-success alert-dismissible fade show" role="alert" style={{ borderRadius: '10px' }}>
                <strong>Success:</strong> {success}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSuccess('')}
                  aria-label="Close alert"
                ></button>
              </div>
            )}

            {/* OTP Input Form */}
            <form onSubmit={handleVerify} noValidate>
              <div className="d-flex justify-content-between gap-2 mb-4" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={inputRefs[idx]}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    className="login-input text-center fw-bold fs-4 p-0"
                    style={{ width: '50px', height: '54px', borderRadius: '10px' }}
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    disabled={loading || expiresIn <= 0}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Countdown Timer */}
              <div className="text-center mb-4">
                {expiresIn > 0 ? (
                  <span className="text-muted" style={{ fontSize: '14px', fontWeight: '500' }}>
                    OTP expires in: <strong className="text-danger">{formatTime(expiresIn)}</strong>
                  </span>
                ) : (
                  <span className="text-danger fw-bold" style={{ fontSize: '14px' }}>
                    OTP has expired. Please request a new OTP.
                  </span>
                )}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                className="login-submit-btn hover-scale mb-3"
                disabled={loading || expiresIn <= 0 || otp.join('').length < 6}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Verifying...
                  </>
                ) : 'Verify & Sign In'}
              </button>
            </form>

            <div className="divider">OR</div>

            {/* Resend Cooldown Action */}
            <button
              type="button"
              className="demo-credentials-trigger hover-scale mb-3"
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              style={{
                borderColor: resendCooldown > 0 ? 'var(--login-border)' : 'var(--login-primary)',
                color: resendCooldown > 0 ? 'var(--login-secondary-text)' : 'var(--login-primary)',
                background: 'transparent'
              }}
            >
              {resendCooldown > 0 ? (
                `Resend available in ${resendCooldown}s`
              ) : (
                '✉️ Resend Verification OTP'
              )}
            </button>

            {/* Back to Login Action */}
            <Link to="/login" className="register-btn hover-scale w-100">
              ← Back to Login
            </Link>

          </div>
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
    </div>
  );
};

export default VerifyOTP;
