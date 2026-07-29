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

    if (!validateForm()) return;

    setLoading(true);
    try {
      // POST user credentials to backend login endpoint
      const response = await api.post('/auth/login', { email, password });
      
      // Extract the JWT token from the response
      // Support both `access_token` (returned by actual backend) and `token` fallback
      const token = response.data.access_token || response.data.token;
      
      if (!token) {
        throw new Error('Token not found in response');
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

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <h2 className="text-center mb-4 fw-bold">Sign In</h2>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError('')}
                    aria-label="Close"
                  ></button>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="emailInput"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="passwordInput" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="passwordInput"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  ) : 'Login'}
                </button>
              </form>

              <hr className="my-4" />

              <div className="text-center small text-muted">
                Don't have an account? <br />
                <Link to="/register/student" className="text-decoration-none me-3">Register as Student</Link>
                |
                <Link to="/register/company" className="text-decoration-none ms-3">Register as Company</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
