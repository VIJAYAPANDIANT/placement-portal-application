import React, { useState } from 'react';
import api from '../../utils/api';

const CreateDrive = () => {
  const initialFormState = {
    job_title: '',
    job_description: '',
    eligibility_cgpa: '',
    eligible_branches: [],
    application_deadline: '',
    package_lpa: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const branchesOptions = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (branch) => {
    setFormData(prev => {
      const branches = prev.eligible_branches.includes(branch)
        ? prev.eligible_branches.filter(b => b !== branch)
        : [...prev.eligible_branches, branch];
      return {
        ...prev,
        eligible_branches: branches
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (formData.eligible_branches.length === 0) {
      setErrorMessage('Please select at least one eligible branch.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        job_title: formData.job_title,
        job_description: formData.job_description,
        eligibility_cgpa: parseFloat(formData.eligibility_cgpa),
        eligible_branches: formData.eligible_branches,
        application_deadline: formData.application_deadline,
        package_lpa: parseFloat(formData.package_lpa)
      };

      const res = await api.post('/company/drives', payload);
      
      if (res.status === 201) {
        setSuccessMessage('Drive submitted successfully. Waiting for Admin approval.');
        setFormData(initialFormState);
      }
    } catch (err) {
      console.error('Error creating drive:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to submit drive request. Please check fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center fade-in">
      <div className="col-lg-9 col-xl-8">
        
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">Post New Placement Drive</h4>
          <p className="text-secondary mb-0" style={{ fontSize: '0.95rem' }}>Create a new recruitment drive. Your listing will be published once approved by the placement cell.</p>
        </div>

        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show mb-4 shadow-sm" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)} aria-label="Close"></button>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-danger alert-dismissible fade show mb-4 shadow-sm" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
            <button type="button" className="btn-close" onClick={() => setErrorMessage(null)} aria-label="Close"></button>
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold text-dark mb-0">Drive Details</h5>
            <span className="badge badge-soft-primary px-3 py-2 fs-6">
              <i className="bi bi-shield-check me-2"></i>Verified Partner
            </span>
          </div>
          
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="job_title" className="form-label fw-bold text-dark small">JOB TITLE <span className="text-danger">*</span></label>
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-briefcase-fill text-muted"></i></span>
                  <input
                    type="text"
                    className="form-control border-start-0 ps-0"
                    id="job_title"
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    placeholder="e.g. Associate Software Development Engineer"
                    required
                  />
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label htmlFor="package_lpa" className="form-label fw-bold text-dark small">PACKAGE (LPA) <span className="text-danger">*</span></label>
                  <div className="input-group shadow-sm">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-cash-stack text-success"></i></span>
                    <input
                      type="number"
                      className="form-control border-start-0 ps-0"
                      id="package_lpa"
                      name="package_lpa"
                      value={formData.package_lpa}
                      onChange={handleChange}
                      placeholder="e.g. 8.5"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="eligibility_cgpa" className="form-label fw-bold text-dark small">MINIMUM CGPA <span className="text-danger">*</span></label>
                  <div className="input-group shadow-sm">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-mortarboard-fill text-warning"></i></span>
                    <input
                      type="number"
                      className="form-control border-start-0 ps-0"
                      id="eligibility_cgpa"
                      name="eligibility_cgpa"
                      value={formData.eligibility_cgpa}
                      onChange={handleChange}
                      placeholder="e.g. 7.5"
                      min="0"
                      max="10"
                      step="0.1"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-dark small">ELIGIBLE ACADEMIC BRANCHES <span className="text-danger">*</span></label>
                <div className="bg-light p-4 rounded border">
                  <div className="row g-3">
                    {branchesOptions.map(branch => (
                      <div key={branch} className="col-md-4 col-6">
                        <div className="form-check custom-checkbox">
                          <input
                            className="form-check-input shadow-sm"
                            type="checkbox"
                            id={`branch-${branch}`}
                            checked={formData.eligible_branches.includes(branch)}
                            onChange={() => handleCheckboxChange(branch)}
                          />
                          <label className="form-check-label fw-semibold text-secondary ps-2" htmlFor={`branch-${branch}`}>
                            {branch}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="application_deadline" className="form-label fw-bold text-dark small">APPLICATION DEADLINE <span className="text-danger">*</span></label>
                <div className="input-group shadow-sm">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-calendar-event text-primary"></i></span>
                  <input
                    type="date"
                    className="form-control border-start-0 ps-0"
                    id="application_deadline"
                    name="application_deadline"
                    value={formData.application_deadline}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="mb-5">
                <label htmlFor="job_description" className="form-label fw-bold text-dark small">JOB DESCRIPTION & REQUIREMENTS <span className="text-danger">*</span></label>
                <textarea
                  className="form-control shadow-sm p-3"
                  id="job_description"
                  name="job_description"
                  rows="6"
                  value={formData.job_description}
                  onChange={handleChange}
                  placeholder="Describe key responsibilities, required technical skills, and the selection process..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-3 fw-bold rounded-pill shadow-sm fs-6"
                disabled={loading}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Submitting...</>
                ) : (
                  <><i className="bi bi-send-fill me-2"></i>Submit Drive Request</>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CreateDrive;
