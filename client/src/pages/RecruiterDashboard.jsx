// ====================================================
// Recruiter Dashboard Component
//
// This page acts as the central workspace for recruiters.
// It allows recruiters to:
// 1. View overall statistics (total jobs, total applications, active posts).
// 2. Create new job vacancy posts.
// 3. Edit existing job vacancies.
// 4. View candidate applications for all postings or specific vacancies.
// 5. Update candidates' application statuses (Under Review, Shortlisted, Rejected).
//
// Features:
// - Fetches the recruiter's own posted jobs.
// - Resolves matching edit job IDs dynamically using regex pattern queries.
// - Supports modal overlay displaying candidate contact details and resumes.
//
// Used by:
// - App.jsx (loaded when route paths target '/recruiter/*')
// ====================================================

import { useEffect, useState } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Briefcase, 
  AlertTriangle, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Mail, 
  PhoneCall, 
  UserPlus,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

// Purpose:
// Main control panel component for recruiter accounts. Handles dashboard sub-views.
//
// Input:
// - currentPath (string): The active URL path (helps determine which view is loaded).
// - onPageChange (function): Callback function to switch paths.
//
// Output:
// Renders the specific Recruiter sub-page (dashboard stats, edit form, create form, or all applications).
const RecruiterDashboard = ({ currentPath, onPageChange }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard statistics
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    activeJobs: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  
  // Job counts mapping to keep track of applications for each job
  const [appCounts, setAppCounts] = useState({});

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    salaryType: 'Fixed',
    minSalary: '',
    maxSalary: '',
    jobType: 'Full Time',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);

  // Applications viewer state (legacy modal support inside dashboard table)
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalApplications, setModalApplications] = useState([]);
  const [modalAppsLoading, setModalAppsLoading] = useState(false);

  // Parse edit job ID
  const editJobMatch = currentPath.match(/^\/recruiter\/edit-job\/([a-fA-F0-9]{24}|[0-9]+)$/);
  const editJobId = editJobMatch ? editJobMatch[1] : null;

  // Purpose:
  // Loads all data needed for the dashboard (jobs, applicant counters, and recent application logs).
  //
  // Input:
  // None.
  //
  // Output:
  // Populates jobs list, appCounts map, stats object, and recentApplications list states.
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load recruiter's own jobs
      const res = await api.getJobs({ page: 1, limit: 100, myJobs: true });
      const recruiterJobs = res.jobs || [];
      setJobs(recruiterJobs);

      // Fetch applications for each job to show count in table and calculate stats
      const results = await Promise.all(
        recruiterJobs.map(async (job) => {
          try {
            const appRes = await api.getApplicationsByJob(job._id);
            const count = appRes.count || 0;
            const appsWithJob = (appRes.applications || []).map(app => ({
              ...app,
              jobTitle: job.title,
              companyName: job.company,
            }));
            return { jobId: job._id, count, applications: appsWithJob };
          } catch {
            return { jobId: job._id, count: 0, applications: [] };
          }
        })
      );

      const counts = {};
      let totalAppsCount = 0;
      let allApps = [];

      results.forEach(result => {
        counts[result.jobId] = result.count;
        totalAppsCount += result.count;
        allApps = allApps.concat(result.applications);
      });
      
      setAppCounts(counts);
      setStats({
        totalJobs: recruiterJobs.length,
        totalApplications: totalAppsCount,
        activeJobs: recruiterJobs.length,
      });

      // Sort applications descending by date and take top 5 for "Recent Applications"
      allApps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      setRecentApplications(allApps);
      
    } catch (err) {
      setError(err.message || 'Failed to retrieve dashboard listings.');
    } finally {
      setLoading(false);
    }
  };

  // Run the data load whenever path transitions occur
  useEffect(() => {
    fetchDashboardData();
  }, [currentPath]);

  // Load job details for Edit view if editJobId URL exists
  useEffect(() => {
    if (editJobId) {
      const fetchJobDetails = async () => {
        try {
          const res = await api.getJobById(editJobId);
          
          let salaryType = 'Fixed';
          let minSalary = '';
          let maxSalary = '';
          let salary = String(res.job.salary);

          if (res.job.salaryRange) {
            const rangeMatch = res.job.salaryRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
            if (rangeMatch) {
              salaryType = 'Range';
              minSalary = String(parseFloat(rangeMatch[1]) * 100000);
              maxSalary = String(parseFloat(rangeMatch[2]) * 100000);
            }
          }

          setFormData({
            title: res.job.title,
            company: res.job.company,
            location: res.job.location,
            salary,
            salaryType,
            minSalary,
            maxSalary,
            jobType: res.job.jobType,
            description: res.job.description,
          });
        } catch {
          setError('Failed to fetch job details for editing.');
        }
      };
      fetchJobDetails();
    }
  }, [editJobId]);

  // Resets the create/edit forms back to their clean empty states
  const resetForm = () => {
    setFormData({
      title: '',
      company: '',
      location: '',
      salary: '',
      salaryType: 'Fixed',
      minSalary: '',
      maxSalary: '',
      jobType: 'Full Time',
      description: '',
    });
    setFormErrors({});
  };

  // Purpose:
  // Checks that all required form text inputs (title, description, salary, company, location) are correctly populated.
  //
  // Input:
  // None (reads from formData state).
  //
  // Output:
  // Returns true if forms are fully valid, false otherwise. Sets formErrors state.
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Job title is required';
    if (!formData.company.trim()) errors.company = 'Company name is required';
    if (!formData.location.trim()) errors.location = 'Location is required';
    
    if (formData.salaryType === 'Fixed') {
      if (formData.salary === '' || formData.salary === null) {
        errors.salary = 'Salary is required';
      } else {
        const num = Number(formData.salary);
        if (isNaN(num) || num <= 0) {
          errors.salary = 'Salary must be a positive number';
        }
      }
    } else {
      if (!formData.minSalary) {
        errors.minSalary = 'Minimum salary is required';
      } else {
        const minNum = Number(formData.minSalary);
        if (isNaN(minNum) || minNum <= 0) {
          errors.minSalary = 'Minimum salary must be a positive number';
        }
      }

      if (!formData.maxSalary) {
        errors.maxSalary = 'Maximum salary is required';
      } else {
        const maxNum = Number(formData.maxSalary);
        if (isNaN(maxNum) || maxNum <= 0) {
          errors.maxSalary = 'Maximum salary must be a positive number';
        }
      }

      if (formData.minSalary && formData.maxSalary) {
        const minNum = Number(formData.minSalary);
        const maxNum = Number(formData.maxSalary);
        if (minNum >= maxNum) {
          errors.maxSalary = 'Maximum salary must be greater than minimum salary';
        }
      }
    }

    if (!formData.description.trim()) errors.description = 'Job description is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handles update updates for any input fields inside the job forms
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Purpose:
  // Submits a new job posting form to create a new job vacancy.
  //
  // Input:
  // e (Event) - Submit event.
  //
  // Output:
  // Saves job on server and navigates the recruiter back to dashboard screen.
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormSubmitLoading(true);
      const payload = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        jobType: formData.jobType,
        description: formData.description,
      };

      if (formData.salaryType === 'Fixed') {
        payload.salary = Number(formData.salary);
        payload.salaryRange = `₹ ${Number(formData.salary) / 100000} LPA`;
      } else {
        payload.salary = (Number(formData.minSalary) + Number(formData.maxSalary)) / 2;
        payload.salaryRange = `₹ ${Number(formData.minSalary) / 100000} - ${Number(formData.maxSalary) / 100000} LPA`;
      }

      await api.createJob(payload);
      resetForm();
      onPageChange('/recruiter/dashboard');
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to create job.' });
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Purpose:
  // Submits the edited details of a job posting to save changes.
  //
  // Input:
  // e (Event) - Submit event.
  //
  // Output:
  // Updates job on server and navigates the recruiter back to dashboard screen.
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormSubmitLoading(true);
      const payload = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        jobType: formData.jobType,
        description: formData.description,
      };

      if (formData.salaryType === 'Fixed') {
        payload.salary = Number(formData.salary);
        payload.salaryRange = `₹ ${Number(formData.salary) / 100000} LPA`;
      } else {
        payload.salary = (Number(formData.minSalary) + Number(formData.maxSalary)) / 2;
        payload.salaryRange = `₹ ${Number(formData.minSalary) / 100000} - ${Number(formData.maxSalary) / 100000} LPA`;
      }

      await api.updateJob(editJobId, payload);
      resetForm();
      onPageChange('/recruiter/dashboard');
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to update job.' });
    } finally {
      setFormSubmitLoading(false);
    }
  };

  // Purpose:
  // Deletes an existing job advertisement.
  //
  // Input:
  // id (string) - The unique job database ID.
  //
  // Output:
  // Removes job and triggers re-fetch of dashboard listings on success.
  const handleDeleteJob = async (id) => {
    if (window.confirm('Are you sure you want to delete this job listing? All associated candidate applications will also be deleted.')) {
      try {
        await api.deleteJob(id);
        fetchDashboardData();
      } catch (err) {
        alert(err.message || 'Failed to delete job.');
      }
    }
  };

  // Purpose:
  // Opens the modal overlay showing the complete list of candidate applications for a specific job.
  //
  // Input:
  // job (object) - The target job object.
  //
  // Output:
  // Opens the applications modal list and retrieves applicants list from backend.
  const openAppsModal = async (job) => {
    setSelectedJob(job);
    setIsAppsModalOpen(true);
    try {
      setModalAppsLoading(true);
      const res = await api.getApplicationsByJob(job._id);
      setModalApplications(res.applications || []);
    } catch (err) {
      alert(err.message || 'Failed to fetch applications.');
    } finally {
      setModalAppsLoading(false);
    }
  };

  // Purpose:
  // Updates the evaluation status of a candidate application (e.g. Under Review -> Shortlisted).
  //
  // Input:
  // - appId (string): Candidate application ID.
  // - newStatus (string): The selected status value ("Under Review", "Shortlisted", "Rejected").
  //
  // Output:
  // Saves status updates to backend and synchronizes UI tables.
  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      // Re-fetch all data to synchronize
      fetchDashboardData();
      // Update modal list if open
      if (isAppsModalOpen) {
        setModalApplications(prev => 
          prev.map(app => app._id === appId ? { ...app, status: newStatus } : app)
        );
      }
    } catch (err) {
      alert(err.message || 'Failed to update application status.');
    }
  };

  if (loading) return <LoadingSpinner />;

  // Render Subview: Create Job
  if (currentPath === '/recruiter/create-job') {
    return (
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '720px' }}>
        <div className="dashboard-header-row" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>Create Job Posting</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Publish a new vacancy to hire talent.</p>
          </div>
        </div>

        <div className="dashboard-table-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleCreateSubmit}>
            {formErrors.submit && (
              <div style={{ color: 'var(--error)', padding: '0.75rem', marginBottom: '1.25rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                {formErrors.submit}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title} 
                onChange={handleInputChange} 
                className={`form-input ${formErrors.title ? 'input-error' : ''}`} 
                placeholder="e.g. Senior Frontend Engineer"
              />
              {formErrors.title && <span className="form-error-msg">{formErrors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input 
                type="text" 
                name="company"
                value={formData.company} 
                onChange={handleInputChange} 
                className={`form-input ${formErrors.company ? 'input-error' : ''}`} 
                placeholder="e.g. Stripe"
              />
              {formErrors.company && <span className="form-error-msg">{formErrors.company}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location} 
                onChange={handleInputChange} 
                className={`form-input ${formErrors.location ? 'input-error' : ''}`} 
                placeholder="e.g. San Francisco, CA or Remote"
              />
              {formErrors.location && <span className="form-error-msg">{formErrors.location}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Salary Type</label>
              <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: 'var(--bg-primary)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, salaryType: 'Fixed' }))}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    background: formData.salaryType === 'Fixed' ? 'var(--bg-secondary)' : 'none',
                    color: formData.salaryType === 'Fixed' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: formData.salaryType === 'Fixed' ? '0 2px 8px rgba(0, 0, 0, 0.05)' : 'none',
                    border: formData.salaryType === 'Fixed' ? '1px solid var(--border-color)' : '1px solid transparent',
                  }}
                >
                  Fixed Salary
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, salaryType: 'Range' }))}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    background: formData.salaryType === 'Range' ? 'var(--bg-secondary)' : 'none',
                    color: formData.salaryType === 'Range' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: formData.salaryType === 'Range' ? '0 2px 8px rgba(0, 0, 0, 0.05)' : 'none',
                    border: formData.salaryType === 'Range' ? '1px solid var(--border-color)' : '1px solid transparent',
                  }}
                >
                  Salary Range
                </button>
              </div>
            </div>

            {formData.salaryType === 'Fixed' ? (
              <div className="form-group">
                <label className="form-label">Salary (Annual, INR)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>₹</span>
                  <input 
                    type="number" 
                    name="salary"
                    value={formData.salary} 
                    onChange={handleInputChange} 
                    className={`form-input ${formErrors.salary ? 'input-error' : ''}`} 
                    placeholder="e.g. 800000"
                    style={{ paddingLeft: '2rem' }}
                  />
                </div>
                {formErrors.salary && <span className="form-error-msg">{formErrors.salary}</span>}
                {formData.salary && !formErrors.salary && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-hover)' }}>
                      ₹ {Number(formData.salary) / 100000} LPA
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Min Salary (Annual, INR)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>₹</span>
                    <input 
                      type="number" 
                      name="minSalary"
                      value={formData.minSalary} 
                      onChange={handleInputChange} 
                      className={`form-input ${formErrors.minSalary ? 'input-error' : ''}`} 
                      placeholder="e.g. 600000"
                      style={{ paddingLeft: '2rem' }}
                    />
                  </div>
                  {formErrors.minSalary && <span className="form-error-msg">{formErrors.minSalary}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Max Salary (Annual, INR)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>₹</span>
                    <input 
                      type="number" 
                      name="maxSalary"
                      value={formData.maxSalary} 
                      onChange={handleInputChange} 
                      className={`form-input ${formErrors.maxSalary ? 'input-error' : ''}`} 
                      placeholder="e.g. 1000000"
                      style={{ paddingLeft: '2rem' }}
                    />
                  </div>
                  {formErrors.maxSalary && <span className="form-error-msg">{formErrors.maxSalary}</span>}
                </div>
                {formData.minSalary && formData.maxSalary && !formErrors.minSalary && !formErrors.maxSalary && (
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-hover)' }}>
                      ₹ {Number(formData.minSalary) / 100000} - {Number(formData.maxSalary) / 100000} LPA
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Job Type</label>
              <select 
                name="jobType" 
                value={formData.jobType} 
                onChange={handleInputChange} 
                className="form-select"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Job Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                className={`form-textarea ${formErrors.description ? 'input-error' : ''}`} 
                placeholder="Detail the job requirements, day-to-day operations, and technical stack details..."
                style={{ minHeight: '180px' }}
              />
              {formErrors.description && <span className="form-error-msg">{formErrors.description}</span>}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => onPageChange('/recruiter/dashboard')}>Cancel</button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={formSubmitLoading}
              >
                {formSubmitLoading ? 'Creating...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render Subview: Edit Job
  if (editJobId) {
    return (
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem', maxWidth: '720px' }}>
        <div className="dashboard-header-row" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>Edit Job Posting</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Modify your existing vacancy details.</p>
          </div>
        </div>

        <div className="dashboard-table-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleEditSubmit}>
            {formErrors.submit && (
              <div style={{ color: 'var(--error)', padding: '0.75rem', marginBottom: '1.25rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 500 }}>
                {formErrors.submit}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Job Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title} 
                onChange={handleInputChange} 
                className={`form-input ${formErrors.title ? 'input-error' : ''}`} 
              />
              {formErrors.title && <span className="form-error-msg">{formErrors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input 
                type="text" 
                name="company"
                value={formData.company} 
                onChange={handleInputChange} 
                className={`form-input ${formErrors.company ? 'input-error' : ''}`} 
              />
              {formErrors.company && <span className="form-error-msg">{formErrors.company}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input 
                type="text" 
                name="location"
                value={formData.location} 
                onChange={handleInputChange} 
                className={`form-input ${formErrors.location ? 'input-error' : ''}`} 
              />
              {formErrors.location && <span className="form-error-msg">{formErrors.location}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Salary Type</label>
              <div style={{ display: 'flex', gap: '0.75rem', backgroundColor: 'var(--bg-primary)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, salaryType: 'Fixed' }))}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    background: formData.salaryType === 'Fixed' ? 'var(--bg-secondary)' : 'none',
                    color: formData.salaryType === 'Fixed' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: formData.salaryType === 'Fixed' ? '0 2px 8px rgba(0, 0, 0, 0.05)' : 'none',
                    border: formData.salaryType === 'Fixed' ? '1px solid var(--border-color)' : '1px solid transparent',
                  }}
                >
                  Fixed Salary
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, salaryType: 'Range' }))}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem',
                    borderRadius: '8px',
                    background: formData.salaryType === 'Range' ? 'var(--bg-secondary)' : 'none',
                    color: formData.salaryType === 'Range' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: formData.salaryType === 'Range' ? '0 2px 8px rgba(0, 0, 0, 0.05)' : 'none',
                    border: formData.salaryType === 'Range' ? '1px solid var(--border-color)' : '1px solid transparent',
                  }}
                >
                  Salary Range
                </button>
              </div>
            </div>

            {formData.salaryType === 'Fixed' ? (
              <div className="form-group">
                <label className="form-label">Salary (Annual, INR)</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>₹</span>
                  <input 
                    type="number" 
                    name="salary"
                    value={formData.salary} 
                    onChange={handleInputChange} 
                    className={`form-input ${formErrors.salary ? 'input-error' : ''}`} 
                    placeholder="e.g. 800000"
                    style={{ paddingLeft: '2rem' }}
                  />
                </div>
                {formErrors.salary && <span className="form-error-msg">{formErrors.salary}</span>}
                {formData.salary && !formErrors.salary && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-hover)' }}>
                      ₹ {Number(formData.salary) / 100000} LPA
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Min Salary (Annual, INR)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>₹</span>
                    <input 
                      type="number" 
                      name="minSalary"
                      value={formData.minSalary} 
                      onChange={handleInputChange} 
                      className={`form-input ${formErrors.minSalary ? 'input-error' : ''}`} 
                      placeholder="e.g. 600000"
                      style={{ paddingLeft: '2rem' }}
                    />
                  </div>
                  {formErrors.minSalary && <span className="form-error-msg">{formErrors.minSalary}</span>}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Max Salary (Annual, INR)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>₹</span>
                    <input 
                      type="number" 
                      name="maxSalary"
                      value={formData.maxSalary} 
                      onChange={handleInputChange} 
                      className={`form-input ${formErrors.maxSalary ? 'input-error' : ''}`} 
                      placeholder="e.g. 1000000"
                      style={{ paddingLeft: '2rem' }}
                    />
                  </div>
                  {formErrors.maxSalary && <span className="form-error-msg">{formErrors.maxSalary}</span>}
                </div>
                {formData.minSalary && formData.maxSalary && !formErrors.minSalary && !formErrors.maxSalary && (
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Preview:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-hover)' }}>
                      ₹ {Number(formData.minSalary) / 100000} - {Number(formData.maxSalary) / 100000} LPA
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Job Type</label>
              <select 
                name="jobType" 
                value={formData.jobType} 
                onChange={handleInputChange} 
                className="form-select"
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Job Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                className={`form-textarea ${formErrors.description ? 'input-error' : ''}`} 
                style={{ minHeight: '180px' }}
              />
              {formErrors.description && <span className="form-error-msg">{formErrors.description}</span>}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => onPageChange('/recruiter/dashboard')}>Cancel</button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={formSubmitLoading}
              >
                {formSubmitLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Render Subview: Applications received across all jobs
  if (currentPath === '/recruiter/applications') {
    return (
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <div className="dashboard-header-row" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em' }}>All Applications Received</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Review candidates and manage statuses across your active listings.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => onPageChange('/recruiter/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        {recentApplications.length === 0 ? (
          <div className="dashboard-table-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <UserPlus size={48} className="empty-state-icon" style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem auto' }} />
            <h3 className="empty-state-title">No applications received yet</h3>
            <p className="empty-state-desc">Vacancies you publish will collect applications here.</p>
            <button className="btn btn-primary animate-hover" style={{ marginTop: '1rem' }} onClick={() => onPageChange('/recruiter/create-job')}>
              Publish a Vacancy
            </button>
          </div>
        ) : (
          <div className="app-viewer-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {recentApplications.map((app) => (
              <div key={app._id} className="app-viewer-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{app.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, marginTop: '0.15rem' }}>
                      Applied for: {app.jobTitle}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Company: {app.companyName}
                    </p>
                  </div>
                  <span className="badge badge-secondary" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Calendar size={10} />
                    {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.85rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} />
                    <span>{app.email}</span>
                  </div>
                  {app.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <PhoneCall size={14} />
                      <span>{app.phone}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Status:</span>
                    <select
                      value={app.status || 'Under Review'}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.8rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <span className={`status-tracking-badge ${app.status ? app.status.toLowerCase().replace(/\s+/g, '-') : 'under-review'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    {app.status || 'Under Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render Subview: Manage Jobs / Recruiter Dashboard
  const isManageJobs = currentPath === '/recruiter/jobs';

  return (
    <div className="container dashboard-layout" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* Dashboard Stats Panel (only shown on /recruiter/dashboard) */}
      {!isManageJobs && (
        <>
          <div className="dashboard-header-row">
            <div>
              <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Recruiter Dashboard</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Welcome to your workspace. Here is an overview of your statistics.</p>
            </div>
            <button className="btn btn-primary" onClick={() => onPageChange('/recruiter/create-job')}>
              <Plus size={18} /> Create Job Post
            </button>
          </div>

          {/* Stats Cards Row */}
          <div className="dashboard-stats-grid">
            <div className="recruiter-stat-card animate-hover" onClick={() => onPageChange('/recruiter/jobs')}>
              <div className="stat-card-left">
                <span className="stat-card-label">Total Jobs Posted</span>
                <span className="stat-card-number">{stats.totalJobs}</span>
              </div>
              <div className="stat-card-icon-wrap">
                <Briefcase size={22} />
              </div>
            </div>

            <div className="recruiter-stat-card animate-hover" onClick={() => onPageChange('/recruiter/applications')}>
              <div className="stat-card-left">
                <span className="stat-card-label">Total Applications</span>
                <span className="stat-card-number">{stats.totalApplications}</span>
              </div>
              <div className="stat-card-icon-wrap">
                <Users size={22} />
              </div>
            </div>

            <div className="recruiter-stat-card animate-hover" onClick={() => onPageChange('/recruiter/jobs')}>
              <div className="stat-card-left">
                <span className="stat-card-label">Active Jobs</span>
                <span className="stat-card-number">{stats.activeJobs}</span>
              </div>
              <div className="stat-card-icon-wrap">
                <TrendingUp size={22} />
              </div>
            </div>
          </div>

          {/* Recent Applications Listing */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Recent Applications</h2>
              <button className="view-all-jobs-link" onClick={() => onPageChange('/recruiter/applications')}>
                View All <ArrowRight size={16} />
              </button>
            </div>

            {recentApplications.length === 0 ? (
              <div className="dashboard-table-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>You haven't received any candidate applications yet.</p>
              </div>
            ) : (
              <div className="dashboard-table-card" style={{ padding: '0' }}>
                <div className="table-responsive">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Applied Position</th>
                        <th>Applied Date</th>
                        <th>Evaluation Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplications.slice(0, 5).map((app) => (
                        <tr key={app._id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{app.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.email}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{app.jobTitle}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.companyName}</div>
                          </td>
                          <td>
                            <span>{new Date(app.appliedAt).toLocaleDateString()}</span>
                          </td>
                          <td>
                            <span className={`status-tracking-badge ${app.status.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                              {app.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={app.status || 'Under Review'}
                              onChange={(e) => handleStatusChange(app._id, e.target.value)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="Under Review">Under Review</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Manage Jobs View (header details if path is /recruiter/jobs) */}
      {isManageJobs && (
        <div className="dashboard-header-row" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Manage Job Listings</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Edit, remove, or check specific applicants for your vacancies.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => onPageChange('/recruiter/dashboard')}>
              Back to Dashboard
            </button>
            <button className="btn btn-primary" onClick={() => onPageChange('/recruiter/create-job')}>
              <Plus size={18} /> Create Job Post
            </button>
          </div>
        </div>
      )}

      {/* Active Listings / Manage Jobs Table */}
      <div>
        {isManageJobs && (
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>Active Vacancy Postings</h2>
        )}
        
        {error && (
          <div className="empty-state-container" style={{ borderColor: 'var(--error)' }}>
            <AlertTriangle size={48} className="empty-state-icon" style={{ color: 'var(--error)' }} />
            <h3 className="empty-state-title">Dashboard Loading Failed</h3>
            <p className="empty-state-desc">{error}</p>
            <button className="btn btn-secondary" onClick={fetchDashboardData}>Reload</button>
          </div>
        )}

        {!error && (
          <div className="dashboard-table-card">
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Job Details</th>
                    <th>Job Type</th>
                    <th>Salary Range</th>
                    <th>Date Posted</th>
                    <th>Applications</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                        <div className="empty-state-container" style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
                          <Briefcase size={40} className="empty-state-icon" />
                          <h3 className="empty-state-title">No jobs created yet</h3>
                          <p className="empty-state-desc">Click "Create Job Post" to post your first listing.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job._id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{job.title}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                            <span>{job.company}</span>
                            <span>&bull;</span>
                            <MapPin size={12} />
                            <span>{job.location}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-secondary">{job.jobType}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>
                            {job.salaryRange || `₹ ${job.salary.toLocaleString()} / yr`}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>
                            <Calendar size={14} style={{ color: 'var(--accent)' }} />
                            <span>
                              {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', gap: '0.35rem' }}
                            onClick={() => openAppsModal(job)}
                          >
                            <Users size={14} />
                            <span>{appCounts[job._id] || 0} Applied</span>
                          </button>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="btn btn-secondary btn-icon"
                              title="Edit Job"
                              onClick={() => onPageChange(`/recruiter/edit-job/${job._id}`)}
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="btn btn-danger btn-icon"
                              title="Delete Job"
                              onClick={() => handleDeleteJob(job._id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* APPLICATIONS LIST MODAL (Legacy Dashboard trigger fallback) */}
      <Modal
        isOpen={isAppsModalOpen}
        onClose={() => setIsAppsModalOpen(false)}
        title={selectedJob ? `Applications: ${selectedJob.title}` : 'Applications'}
        footer={<button className="btn btn-secondary" onClick={() => setIsAppsModalOpen(false)}>Close</button>}
      >
        {modalAppsLoading ? (
          <LoadingSpinner />
        ) : modalApplications.length === 0 ? (
          <div className="empty-state-container" style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: '2rem 1rem' }}>
            <UserPlus size={36} className="empty-state-icon" />
            <h4 className="empty-state-title" style={{ fontSize: '1.15rem' }}>No applications yet</h4>
            <p className="empty-state-desc" style={{ fontSize: '0.9rem' }}>Candidates applying for this role will appear here.</p>
          </div>
        ) : (
          <div className="app-viewer-list">
            {modalApplications.map((app) => (
              <div key={app._id} className="app-viewer-card">
                <div className="app-viewer-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>{app.name}</span>
                  <span className="badge badge-secondary" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={12} />
                    {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} />
                    <span>{app.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PhoneCall size={14} />
                    <span>{app.phone}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Evaluate Status:</span>
                    <select
                      value={app.status || 'Under Review'}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.85rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="Under Review">Under Review</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <span className={`status-tracking-badge ${app.status ? app.status.toLowerCase().replace(/\s+/g, '-') : 'under-review'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    {app.status || 'Under Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RecruiterDashboard;
