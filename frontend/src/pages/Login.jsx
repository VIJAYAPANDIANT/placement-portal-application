import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email || !password) {
      setError('Both email and password are required.');
      return false;
    }
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

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.access_token || response.data.token;
      
      if (!token) throw new Error('Token not found in response');

      const userRole = login(token);

      if (userRole) {
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

  return (
    <div className="auth-wrapper fade-in">
      <div className="row g-0 w-100">
        
        {/* Left Side: Branding Cover */}
        <div className="col-lg-6 d-none d-lg-flex auth-cover">
          <div className="position-relative z-1">
            <h1 className="display-4 fw-bold mb-4">PlaceLink</h1>
            <p className="lead fw-light px-5 mb-5">
              The modern bridge connecting world-class talent with enterprise opportunities.
            </p>
            
            <div className="d-flex justify-content-center gap-4 mt-4">
              <div className="text-center">
                <h3 className="fw-bold mb-1">500+</h3>
                <p className="small opacity-75">Companies</p>
              </div>
              <div className="text-center">
                <h3 className="fw-bold mb-1">10k+</h3>
                <p className="small opacity-75">Placements</p>
              </div>
              <div className="text-center">
                <h3 className="fw-bold mb-1">98%</h3>
                <p className="small opacity-75">Success Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="col-lg-6 auth-form-container">
          <div className="w-100 mx-auto" style={{ maxWidth: '420px' }}>
            <div className="text-center mb-5">
              <h2 className="fw-bold text-dark mb-2">Welcome Back</h2>
              <p className="text-muted">Please sign in to your account</p>
            </div>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  id="emailInput"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="emailInput">Email address</label>
              </div>

              <div className="form-floating mb-4">
                <input
                  type="password"
                  className="form-control"
                  id="passwordInput"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="passwordInput">Password</label>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="rememberMe" />
                  <label className="form-check-label text-muted small" htmlFor="rememberMe">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-primary text-decoration-none small fw-semibold">Forgot password?</a>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-3 fw-bold fs-6 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-muted small mb-2">Don't have an account?</p>
              <div className="d-flex justify-content-center gap-3">
                <Link to="/register/student" className="btn btn-outline-primary btn-sm px-3 rounded-pill fw-semibold">
                  Student
                </Link>
                <Link to="/register/company" className="btn btn-outline-primary btn-sm px-3 rounded-pill fw-semibold">
                  Recruiter
                </Link>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
