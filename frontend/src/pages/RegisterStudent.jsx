import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';

const RegisterStudent = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roll_number: '',
    branch: '',
    cgpa: '',
    graduation_year: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Perform form validation
  const validateForm = () => {
    const { name, email, password, roll_number, branch, cgpa, graduation_year } = formData;

    if (!name || !email || !password || !roll_number || !branch || cgpa === '' || !graduation_year) {
      setError('All fields are required.');
      return false;
    }

    const cgpaVal = parseFloat(cgpa);
    if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10) {
      setError('CGPA must be a valid number between 0.0 and 10.0.');
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
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Send register request to student endpoint
      const response = await api.post('/auth/register/student', {
        ...formData,
        cgpa: parseFloat(formData.cgpa),
        graduation_year: parseInt(formData.graduation_year, 10),
      });

      setSuccess('Student registration successful! Redirecting to login page...');
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        roll_number: '',
        branch: '',
        cgpa: '',
        graduation_year: '',
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <h2 className="text-center mb-4 fw-bold">Student Registration</h2>

              {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  {error}
                  <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="row">
                  {/* Left Column */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="password" className="form-label">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="roll_number" className="form-label">Roll Number</label>
                      <input
                        type="text"
                        className="form-control"
                        id="roll_number"
                        name="roll_number"
                        value={formData.roll_number}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="branch" className="form-label">Branch / Department</label>
                      <select
                        className="form-select"
                        id="branch"
                        name="branch"
                        value={formData.branch}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science (CSE)</option>
                        <option value="Information Technology">Information Technology (IT)</option>
                        <option value="Artificial Intelligence">Artificial Intelligence & Machine Learning (AIML)</option>
                        <option value="Electronics & Communication">Electronics & Communication (ECE)</option>
                        <option value="Electrical & Electronics">Electrical & Electronics (EEE)</option>
                        <option value="Mechanical Engineering">Mechanical Engineering (MECH)</option>
                        <option value="Civil Engineering">Civil Engineering (CIVIL)</option>
                        <option value="Data Science">Data Science (DS)</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="cgpa" className="form-label">CGPA (out of 10.0)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        className="form-control"
                        id="cgpa"
                        name="cgpa"
                        value={formData.cgpa}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="graduation_year" className="form-label">Graduation Year</label>
                      <input
                        type="number"
                        className="form-control"
                        id="graduation_year"
                        name="graduation_year"
                        placeholder="e.g. 2026"
                        value={formData.graduation_year}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : 'Register Student'}
                  </button>
                </div>
              </form>

              <hr className="my-4" />

              <div className="text-center small text-muted">
                Already have an account? <Link to="/login" className="text-decoration-none fw-semibold">Sign In</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
