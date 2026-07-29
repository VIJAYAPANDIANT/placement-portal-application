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
        setSuccessMessage('Drive submitted for Admin approval');
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
    <div className="row justify-content-center">
      <div className="col-lg-9">
        <div className="panel-card">
          <div className="panel-header">
            <h5 className="panel-title">📢 Post New Placement Drive</h5>
            <span className="status-pill pill-info">EEC Placements Partner</span>
          </div>
          <div className="panel-body">
            {successMessage && (
              <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                <strong>Success!</strong> {successMessage}
                <button type="button" className="btn-close" onClick={() => setSuccessMessage(null)} aria-label="Close"></button>
              </div>
            )}

            {errorMessage && (
              <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                <strong>Error:</strong> {errorMessage}
                <button type="button" className="btn-close" onClick={() => setErrorMessage(null)} aria-label="Close"></button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="job_title" className="form-label fw-bold" style={{ fontSize: '12px' }}>JOB TITLE *</label>
                <input
                  type="text"
                  className="form-control"
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  placeholder="e.g. Associate Software Development Engineer"
                  required
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label htmlFor="package_lpa" className="form-label fw-bold" style={{ fontSize: '12px' }}>PACKAGE (LPA) *</label>
                  <input
                    type="number"
                    className="form-control"
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
                <div className="col-md-6">
                  <label htmlFor="eligibility_cgpa" className="form-label fw-bold" style={{ fontSize: '12px' }}>MINIMUM CGPA *</label>
                  <input
                    type="number"
                    className="form-control"
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

              <div className="mb-3">
                <label className="form-label fw-bold d-block" style={{ fontSize: '12px' }}>ELIGIBLE ACADEMIC BRANCHES *</label>
                <div className="p-3 border rounded" style={{ background: 'var(--table-hover)', borderColor: 'var(--card-border)' }}>
                  <div className="row">
                    {branchesOptions.map(branch => (
                      <div key={branch} className="col-md-4 col-6 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`branch-${branch}`}
                            checked={formData.eligible_branches.includes(branch)}
                            onChange={() => handleCheckboxChange(branch)}
                          />
                          <label className="form-check-label ps-1" style={{ fontSize: '13px' }} htmlFor={`branch-${branch}`}>
                            {branch}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="application_deadline" className="form-label fw-bold" style={{ fontSize: '12px' }}>APPLICATION DEADLINE *</label>
                <input
                  type="date"
                  className="form-control"
                  id="application_deadline"
                  name="application_deadline"
                  value={formData.application_deadline}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="job_description" className="form-label fw-bold" style={{ fontSize: '12px' }}>JOB DESCRIPTION & REQUIREMENTS *</label>
                <textarea
                  className="form-control"
                  id="job_description"
                  name="job_description"
                  rows="5"
                  value={formData.job_description}
                  onChange={handleChange}
                  placeholder="Describe key responsibilities, required technical skills, and selection process..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-bold"
                style={{ borderRadius: '8px' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting Drive Request...
                  </>
                ) : (
                  'Submit Drive Request for Admin Approval'
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
