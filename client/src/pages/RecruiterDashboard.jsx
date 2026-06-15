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
  Sparkles, 
  Calendar, 
  Mail, 
  PhoneCall, 
  UserPlus,
  ArrowRight,
  TrendingUp,
  FileText,
  MessageSquare,
  CheckCircle
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
  const backendBase = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
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
    logo: '',
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);

  // Applications viewer state (legacy modal support inside dashboard table)
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalApplications, setModalApplications] = useState([]);
  const [modalAppsLoading, setModalAppsLoading] = useState(false);

  // Search & Filter state for Applicants view
  const [appSearchKeyword, setAppSearchKeyword] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');
  const [appJobFilter, setAppJobFilter] = useState('');
  const [filteredApps, setFilteredApps] = useState([]);
  const [appsSearchLoading, setAppsSearchLoading] = useState(false);

  // Bulk Selection state
  const [selectedAppIds, setSelectedAppIds] = useState([]);

  // Notes state
  const [notesAppId, setNotesAppId] = useState(null);
  const [selectedCandidateName, setSelectedCandidateName] = useState('');
  const [appNotes, setAppNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // Interview modal state
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [interviewAppId, setInterviewAppId] = useState(null);
  const [activeInterview, setActiveInterview] = useState(null);
  const [interviewFormData, setInterviewFormData] = useState({
    date: '',
    time: '',
    mode: 'Online',
    meetingLink: '',
    remarks: '',
  });
  const [interviewSubmitLoading, setInterviewSubmitLoading] = useState(false);

  // Recent Activities
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Local toast alert banner
  const [localToast, setLocalToast] = useState(null);

  const triggerLocalToast = (message, type = 'success') => {
    setLocalToast({ message, type });
    setTimeout(() => setLocalToast(null), 4000);
  };

  // Notes operations
  const fetchNotes = async (appId) => {
    try {
      setNotesLoading(true);
      const res = await api.getNotes(appId);
      setAppNotes(res.notes || []);
    } catch (err) {
      triggerLocalToast(err.message || 'Failed to load notes', 'error');
    } finally {
      setNotesLoading(false);
    }
  };

  const handleOpenNotes = (app) => {
    setNotesAppId(app._id);
    setSelectedCandidateName(app.name);
    setIsNotesModalOpen(true);
    fetchNotes(app._id);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    try {
      await api.createNote(notesAppId, newNoteText);
      setNewNoteText('');
      fetchNotes(notesAppId);
      triggerLocalToast('Note added successfully');
    } catch (err) {
      triggerLocalToast(err.message || 'Failed to add note', 'error');
    }
  };

  const handleUpdateNote = async (noteId) => {
    if (!editingNoteText.trim()) return;
    try {
      await api.updateNote(noteId, editingNoteText);
      setEditingNoteId(null);
      setEditingNoteText('');
      fetchNotes(notesAppId);
      triggerLocalToast('Note updated successfully');
    } catch (err) {
      triggerLocalToast(err.message || 'Failed to update note', 'error');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await api.deleteNote(noteId);
        fetchNotes(notesAppId);
        triggerLocalToast('Note deleted successfully');
      } catch (err) {
        triggerLocalToast(err.message || 'Failed to delete note', 'error');
      }
    }
  };

  // Interview operations
  const fetchInterviewForApp = async (appId) => {
    try {
      const res = await api.getInterviewByApplication(appId);
      if (res.interview) {
        setActiveInterview(res.interview);
        setInterviewFormData({
          date: res.interview.date ? new Date(res.interview.date).toISOString().split('T')[0] : '',
          time: res.interview.time || '',
          mode: res.interview.mode || 'Online',
          meetingLink: res.interview.meetingLink || '',
          remarks: res.interview.remarks || '',
        });
      } else {
        setActiveInterview(null);
        setInterviewFormData({
          date: '',
          time: '',
          mode: 'Online',
          meetingLink: '',
          remarks: '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch interview:', err.message);
    }
  };

  const handleOpenInterviewModal = (app) => {
    setInterviewAppId(app._id);
    setSelectedCandidateName(app.name);
    setIsInterviewModalOpen(true);
    fetchInterviewForApp(app._id);
  };

  const handleScheduleOrUpdateInterview = async (e) => {
    e.preventDefault();
    const { date, time, mode, meetingLink, remarks } = interviewFormData;
    if (!date || !time || !mode) {
      triggerLocalToast('Please fill all required fields', 'error');
      return;
    }
    try {
      setInterviewSubmitLoading(true);
      if (activeInterview) {
        await api.updateInterview(activeInterview._id, {
          date,
          time,
          mode,
          meetingLink,
          remarks,
          status: activeInterview.status
        });
        triggerLocalToast('Interview schedule updated successfully');
      } else {
        await api.scheduleInterview({
          applicationId: interviewAppId,
          date,
          time,
          mode,
          meetingLink,
          remarks
        });
        triggerLocalToast('Interview scheduled successfully');
      }
      setIsInterviewModalOpen(false);
      performAppsSearch(); // refresh search list
      fetchDashboardData();
    } catch (err) {
      triggerLocalToast(err.message || 'Failed to save interview schedule', 'error');
    } finally {
      setInterviewSubmitLoading(false);
    }
  };

  const handleCancelInterview = async (interviewId) => {
    if (window.confirm('Are you sure you want to cancel and remove this interview schedule?')) {
      try {
        await api.cancelInterview(interviewId);
        setIsInterviewModalOpen(false);
        performAppsSearch();
        fetchDashboardData();
        triggerLocalToast('Interview cancelled successfully');
      } catch (err) {
        triggerLocalToast(err.message || 'Failed to cancel interview', 'error');
      }
    }
  };

  // Bulk Actions
  const toggleSelectRow = (appId) => {
    setSelectedAppIds(prev => {
      if (prev.includes(appId)) {
        return prev.filter(id => id !== appId);
      } else {
        return [...prev, appId];
      }
    });
  };

  const toggleSelectAll = (appsOnPage) => {
    if (selectedAppIds.length === appsOnPage.length) {
      setSelectedAppIds([]);
    } else {
      setSelectedAppIds(appsOnPage.map(app => app._id));
    }
  };

  const handleBulkStatusChange = async (targetStatus) => {
    if (selectedAppIds.length === 0) return;
    try {
      await api.bulkUpdateApplications(selectedAppIds, targetStatus);
      triggerLocalToast(`Bulk updated ${selectedAppIds.length} applicants to ${targetStatus} successfully`);
      setSelectedAppIds([]);
      performAppsSearch();
      fetchDashboardData();
    } catch (err) {
      triggerLocalToast(err.message || 'Bulk status change failed', 'error');
    }
  };

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

      // Fetch recruiter activities
      try {
        setActivitiesLoading(true);
        const actRes = await api.getRecentActivities();
        setRecentActivities(actRes.activities || []);
      } catch (actErr) {
        console.error('Error fetching activities:', actErr.message);
      } finally {
        setActivitiesLoading(false);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to retrieve dashboard listings.');
    } finally {
      setLoading(false);
    }
  };

  // Real-time applicant search & filter loader
  const performAppsSearch = async () => {
    try {
      setAppsSearchLoading(true);
      const res = await api.searchApplications({
        keyword: appSearchKeyword,
        status: appStatusFilter,
        jobId: appJobFilter
      });
      setFilteredApps(res.applications || []);
    } catch (err) {
      console.error('Failed to search applications:', err.message);
    } finally {
      setAppsSearchLoading(false);
    }
  };

  useEffect(() => {
    if (currentPath === '/recruiter/applications') {
      performAppsSearch();
    }
  }, [appSearchKeyword, appStatusFilter, appJobFilter, currentPath]);

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
            logo: res.job.logo || '',
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
      logo: '',
    });
    setFormErrors({});
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('File size exceeds the 2MB limit.');
      return;
    }

    const data = new FormData();
    data.append('logo', file);

    try {
      setLogoUploading(true);
      const res = await api.uploadLogo(data);
      if (res.success && res.data?.logoUrl) {
        setFormData(prev => ({ ...prev, logo: res.data.logoUrl }));
      }
    } catch (err) {
      alert(err.message || 'Failed to upload logo.');
    } finally {
      setLogoUploading(false);
    }
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
        logo: formData.logo || '',
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
        logo: formData.logo || '',
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

  const handleCloseJob = async (id) => {
    if (window.confirm('Are you sure you want to close this job listing? Candidates will no longer be able to apply.')) {
      try {
        await api.closeJob(id);
        fetchDashboardData();
      } catch (err) {
        alert(err.message || 'Failed to close job.');
      }
    }
  };

  const handleReopenJob = async (id) => {
    if (window.confirm('Are you sure you want to reopen this job listing? Candidates will be able to apply again.')) {
      try {
        await api.reopenJob(id);
        fetchDashboardData();
      } catch (err) {
        alert(err.message || 'Failed to reopen job.');
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
      triggerLocalToast(`Application status updated to ${newStatus}`);
      fetchDashboardData();
      if (currentPath === '/recruiter/applications') {
        performAppsSearch();
      }
      if (isAppsModalOpen) {
        setModalApplications(prev => 
          prev.map(app => app._id === appId ? { ...app, status: newStatus } : app)
        );
      }
    } catch (err) {
      triggerLocalToast(err.message || 'Failed to update application status.', 'error');
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
              <label className="form-label">Company Logo (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                {formData.logo ? (
                  <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                    <img 
                      src={`${backendBase}${formData.logo}`} 
                      alt="Company Logo Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0 0 0 8px',
                        padding: '0.2rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove Logo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '10px', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    Logo
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="logo-upload-input"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="logo-upload-input"
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    {logoUploading ? 'Uploading...' : 'Upload Logo'}
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    PNG, JPG or JPEG up to 2MB.
                  </span>
                </div>
              </div>
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
              <label className="form-label">Company Logo (Optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                {formData.logo ? (
                  <div style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                    <img 
                      src={`${backendBase}${formData.logo}`} 
                      alt="Company Logo Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0 0 0 8px',
                        padding: '0.2rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove Logo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '10px', border: '2px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    Logo
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    id="logo-edit-upload-input"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="logo-edit-upload-input"
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    {logoUploading ? 'Uploading...' : 'Upload Logo'}
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    PNG, JPG or JPEG up to 2MB.
                  </span>
                </div>
              </div>
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

        {/* Search & Filters Row */}
        <div 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '1rem', 
            marginBottom: '1.5rem', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
            {/* Search Input */}
            <div style={{ flex: '2', minWidth: '200px', position: 'relative' }}>
              <input
                type="text"
                placeholder="Search candidate by name, email, or skills..."
                value={appSearchKeyword}
                onChange={(e) => setAppSearchKeyword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem', borderRadius: '100px' }}
              />
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
            </div>

            {/* Job Filter Select */}
            <div style={{ flex: '1', minWidth: '150px' }}>
              <select
                value={appJobFilter}
                onChange={(e) => setAppJobFilter(e.target.value)}
                className="form-select"
                style={{ borderRadius: '100px', cursor: 'pointer' }}
              >
                <option value="">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter Select */}
            <div style={{ flex: '1', minWidth: '150px' }}>
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="form-select"
                style={{ borderRadius: '100px', cursor: 'pointer' }}
              >
                <option value="All">All Statuses</option>
                <option value="Applied">Applied</option>
                <option value="Under Review">Under Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Rejected">Rejected</option>
                <option value="Hired">Hired</option>
              </select>
            </div>
          </div>

          {/* Export to CSV Button */}
          <button
            onClick={async () => {
              try {
                triggerLocalToast('Exporting candidate list...');
                await api.exportApplications(appJobFilter);
              } catch (err) {
                triggerLocalToast(err.message || 'Export failed', 'error');
              }
            }}
            className="btn btn-secondary"
            style={{ borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <span>Export CSV</span>
          </button>
        </div>

        {/* Bulk Actions Control Bar */}
        {selectedAppIds.length > 0 && (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '0.75rem 1.25rem', 
              backgroundColor: 'rgba(99, 102, 241, 0.08)', 
              border: '1px solid rgba(99, 102, 241, 0.2)', 
              borderRadius: '12px', 
              marginBottom: '1.25rem',
              animation: 'modalSlideUp 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedAppIds.length} candidate{selectedAppIds.length > 1 ? 's' : ''} selected
              </span>
              <button 
                onClick={() => setSelectedAppIds([])} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
              >
                Clear selection
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleBulkStatusChange('Under Review')} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Mark Under Review
              </button>
              <button 
                onClick={() => handleBulkStatusChange('Shortlisted')} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                Mark Shortlisted
              </button>
              <button 
                onClick={() => handleBulkStatusChange('Rejected')} 
                className="btn btn-danger" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                Mark Rejected
              </button>
              <button 
                onClick={() => handleBulkStatusChange('Hired')} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--success)' }}
              >
                Mark Hired
              </button>
            </div>
          </div>
        )}

        {appsSearchLoading ? (
          <LoadingSpinner />
        ) : filteredApps.length === 0 ? (
          <div className="dashboard-table-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <UserPlus size={48} className="empty-state-icon" style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem auto' }} />
            <h3 className="empty-state-title">No matching applications found</h3>
            <p className="empty-state-desc">Try modifying your search keywords or filter settings.</p>
          </div>
        ) : (
          <div className="dashboard-table-card" style={{ margin: 0 }}>
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center', padding: '1.15rem 1rem' }}>
                      <input 
                        type="checkbox" 
                        checked={filteredApps.length > 0 && selectedAppIds.length === filteredApps.length} 
                        onChange={() => toggleSelectAll(filteredApps)}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                    </th>
                    <th>Candidate Info</th>
                    <th>Position</th>
                    <th>Extracted Skills</th>
                    <th>Workflow Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => {
                    const skills = app.candidateId?.skills || app.candidateId?.parsedResumeData?.skills || [];
                    let skillsList = [];
                    if (Array.isArray(skills)) {
                      skillsList = skills;
                    } else if (typeof skills === 'string' && skills.trim()) {
                      skillsList = skills.split(',').map(s => s.trim());
                    }

                    const resumeToUse = app.resumeUrl || app.candidateId?.resumeUrl;

                    return (
                      <tr key={app._id} style={{ verticalAlign: 'middle' }}>
                        <td style={{ textAlign: 'center', padding: '1.25rem 1rem' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedAppIds.includes(app._id)} 
                            onChange={() => toggleSelectRow(app._id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.025rem' }}>{app.name}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Mail size={12} /> {app.email}
                            </span>
                            {app.phone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <PhoneCall size={12} /> {app.phone}
                              </span>
                            )}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent)' }}>
                              <Calendar size={12} /> Applied: {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{app.jobTitle}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{app.companyName}</div>
                          
                          {/* Resume Actions inline under job info */}
                          {resumeToUse ? (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <a 
                                href={`${backendBase}${resumeToUse}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <FileText size={10} />
                                <span>View</span>
                              </a>
                              <a 
                                href={`${backendBase}${resumeToUse}`} 
                                download
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <span>Download</span>
                              </a>
                            </div>
                          ) : (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', marginTop: '0.25rem' }}>No Resume</div>
                          )}
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          {skillsList.length === 0 ? (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>None extracted</span>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {skillsList.slice(0, 5).map((skill, index) => (
                                <span 
                                  key={index} 
                                  className="badge badge-secondary"
                                  style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '0.15rem 0.4rem', 
                                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                                    color: '#6366f1',
                                    border: '1px solid rgba(99, 102, 241, 0.15)',
                                    borderRadius: '6px'
                                  }}
                                >
                                  {skill}
                                </span>
                              ))}
                              {skillsList.length > 5 && (
                                <span 
                                  style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', alignSelf: 'center', fontWeight: 500 }}
                                >
                                  +{skillsList.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                            <span 
                              className={`status-tracking-badge ${app.status ? app.status.toLowerCase().replace(/\s+/g, '-') : 'under-review'}`} 
                              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', width: 'fit-content' }}
                            >
                              {app.status || 'Under Review'}
                            </span>
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
                                outline: 'none',
                                width: '130px'
                              }}
                            >
                              <option value="Applied">Applied</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Interview Scheduled">Interview Scheduled</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Hired">Hired</option>
                            </select>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleOpenNotes(app)}
                              className="btn btn-secondary btn-icon"
                              style={{ padding: '0.4rem' }}
                              title="Notes"
                            >
                              <FileText size={15} />
                            </button>
                            
                            <button
                              onClick={() => handleOpenInterviewModal(app)}
                              className="btn btn-secondary btn-icon"
                              style={{ padding: '0.4rem' }}
                              title="Schedule Interview"
                            >
                              <Calendar size={15} />
                            </button>
                            
                            {app.candidateId && (
                              <button
                                onClick={() => onPageChange('chat', { recipientId: app.candidateId._id })}
                                className="btn btn-secondary btn-icon"
                                style={{ padding: '0.4rem' }}
                                title="Message Candidate"
                              >
                                <MessageSquare size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Subview: Manage Jobs / Recruiter Dashboard
  const isManageJobs = currentPath === '/recruiter/jobs';

  return (
    <div className="container dashboard-layout" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative' }}>
      {/* Ambient background glow orbs */}
      <div className="glow-orb-container">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
      </div>
      
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

          {/* Two Columns Grid for Recent Applications & Recent Activities */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            
            {/* Left: Recent Applications */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Recent Applications</h2>
                <button className="view-all-jobs-link" onClick={() => onPageChange('/recruiter/applications')}>
                  View All <ArrowRight size={16} />
                </button>
              </div>

              {recentApplications.length === 0 ? (
                <div className="dashboard-table-card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center', margin: 0 }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You haven't received any candidate applications yet.</p>
                </div>
              ) : (
                <div className="dashboard-table-card" style={{ padding: '0', margin: 0 }}>
                  <div className="table-responsive">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Candidate</th>
                          <th>Position</th>
                          <th>Evaluation Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentApplications.slice(0, 5).map((app) => (
                          <tr key={app._id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{app.name}</div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>{app.email}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{app.jobTitle}</div>
                              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>{app.companyName}</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <span className={`status-tracking-badge ${app.status ? app.status.toLowerCase().replace(/\s+/g, '-') : 'under-review'}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', width: 'fit-content' }}>
                                  {app.status || 'Under Review'}
                                </span>
                                <select
                                  value={app.status || 'Under Review'}
                                  onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                  style={{
                                    padding: '0.2rem 0.4rem',
                                    fontSize: '0.75rem',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    width: '115px'
                                  }}
                                >
                                  <option value="Applied">Applied</option>
                                  <option value="Under Review">Under Review</option>
                                  <option value="Shortlisted">Shortlisted</option>
                                  <option value="Interview Scheduled">Interview Scheduled</option>
                                  <option value="Rejected">Rejected</option>
                                  <option value="Hired">Hired</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Recent Activity Log */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Recent ATS Activity</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>System logs</span>
              </div>

              <div 
                className="dashboard-table-card" 
                style={{ 
                  padding: '1.25rem', 
                  margin: 0, 
                  height: '345px', 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.75rem' 
                }}
              >
                {activitiesLoading ? (
                  <LoadingSpinner />
                ) : recentActivities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: 'var(--text-secondary)', margin: 'auto 0' }}>
                    No recent system activity logs available.
                  </div>
                ) : (
                  recentActivities.slice(0, 10).map((activity) => (
                    <div 
                      key={activity._id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)', 
                        backgroundColor: 'var(--bg-primary)',
                        fontSize: '0.875rem' 
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                        <div style={{ marginTop: '0.4rem', display: 'flex', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-primary)', fontWeight: 500, textAlign: 'left' }}>{activity.action}</span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: '1rem', alignSelf: 'center' }}>
                        {new Date(activity.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

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
                    <th>Status</th>
                    <th>Date Posted</th>
                    <th>Applications</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
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
                          <span className={`status-tracking-badge ${(job.jobStatus || 'Open').toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                            {job.jobStatus || 'Open'}
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
                          <div className="table-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {job.jobStatus === 'Closed' ? (
                              <button 
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                onClick={() => handleReopenJob(job._id)}
                              >
                                Reopen Job
                              </button>
                            ) : (
                              <button 
                                className="btn btn-danger"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                onClick={() => handleCloseJob(job._id)}
                              >
                                Close Job
                              </button>
                            )}
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

                {app.candidateId && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.35rem' }}>
                      <Sparkles size={12} />
                      <span>Extracted ATS Resume Details:</span>
                    </div>
                    <div>&bull; <strong>Name:</strong> {app.candidateId.parsedResumeData?.name || app.name || app.candidateId.fullName || 'Not specified'}</div>
                    <div>&bull; <strong>Education:</strong> {app.candidateId.education || app.candidateId.parsedResumeData?.education || 'Not specified'}</div>
                    <div>&bull; <strong>Experience:</strong> {app.candidateId.experience || app.candidateId.parsedResumeData?.experience || 'Not specified'}</div>
                    <div>&bull; <strong>Skills:</strong> {app.candidateId.skills && app.candidateId.skills.length > 0 
                      ? app.candidateId.skills.join(', ') 
                      : (app.candidateId.parsedResumeData?.skills && app.candidateId.parsedResumeData.skills.length > 0 ? app.candidateId.parsedResumeData.skills.join(', ') : 'Not specified')}
                    </div>
                    {app.candidateId.location && (
                      <div>&bull; <strong>Location:</strong> {app.candidateId.location}</div>
                    )}
                    
                    {/* View & Download Resume Section */}
                    {(() => {
                      const resumeToUse = app.resumeUrl || app.candidateId.resumeUrl;
                      return resumeToUse ? (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <a 
                            href={`${backendBase}${resumeToUse}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <FileText size={12} />
                            <span>View Resume</span>
                          </a>
                          <a 
                            href={`${backendBase}${resumeToUse}`} 
                            download
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <span>Download Resume</span>
                          </a>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>No resume uploaded</div>
                      );
                    })()}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        <option value="Applied">Applied</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Hired">Hired</option>
                      </select>
                    </div>
                    <span className={`status-tracking-badge ${app.status ? app.status.toLowerCase().replace(/\s+/g, '-') : 'under-review'}`} style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                      {app.status || 'Under Review'}
                    </span>
                  </div>
                  
                  {app.candidateId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                      onClick={() => {
                        setIsAppsModalOpen(false);
                        onPageChange('chat', { recipientId: app.candidateId._id });
                      }}
                    >
                      <MessageSquare size={14} />
                      <span>Message Candidate</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* NOTES MODAL */}
      <Modal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        title={`Evaluation Notes: ${selectedCandidateName}`}
        footer={<button className="btn btn-secondary" onClick={() => setIsNotesModalOpen(false)}>Close</button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Add Note Form */}
          <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Type a new evaluation note..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="form-input"
              style={{ flex: 1 }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Plus size={16} /> Add Note
            </button>
          </form>

          {/* Notes List */}
          {notesLoading ? (
            <LoadingSpinner />
          ) : appNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
              No private notes recorded for this candidate yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {appNotes.map((note) => (
                <div 
                  key={note._id} 
                  style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)', 
                    backgroundColor: 'var(--bg-primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  {editingNoteId === note._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="form-textarea"
                        style={{ minHeight: '80px', fontSize: '0.9rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditingNoteText('');
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleUpdateNote(note._id)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: '0.925rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', textAlign: 'left' }}>
                        {note.note}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                        <span>
                          {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                            onClick={() => {
                              setEditingNoteId(note._id);
                              setEditingNoteText(note.note);
                            }}
                          >
                            <Edit size={12} /> Edit
                          </button>
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.15rem' }}
                            onClick={() => handleDeleteNote(note._id)}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* INTERVIEW MODAL */}
      <Modal
        isOpen={isInterviewModalOpen}
        onClose={() => setIsInterviewModalOpen(false)}
        title={activeInterview ? `Update Interview: ${selectedCandidateName}` : `Schedule Interview: ${selectedCandidateName}`}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
            {activeInterview && (
              <button 
                type="button" 
                className="btn btn-danger" 
                style={{ marginRight: 'auto', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                onClick={() => handleCancelInterview(activeInterview._id)}
              >
                Cancel Interview
              </button>
            )}
            <button className="btn btn-secondary" onClick={() => setIsInterviewModalOpen(false)}>Close</button>
            <button 
              className="btn btn-primary" 
              onClick={handleScheduleOrUpdateInterview}
              disabled={interviewSubmitLoading}
            >
              {interviewSubmitLoading ? 'Saving...' : activeInterview ? 'Update Schedule' : 'Schedule'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleScheduleOrUpdateInterview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input 
              type="date" 
              value={interviewFormData.date} 
              onChange={(e) => setInterviewFormData(prev => ({ ...prev, date: e.target.value }))}
              className="form-input"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Time *</label>
            <input 
              type="time" 
              value={interviewFormData.time} 
              onChange={(e) => setInterviewFormData(prev => ({ ...prev, time: e.target.value }))}
              className="form-input"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Interview Mode *</label>
            <select 
              value={interviewFormData.mode} 
              onChange={(e) => setInterviewFormData(prev => ({ ...prev, mode: e.target.value }))}
              className="form-select"
              required
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Meeting Link / Location</label>
            <input 
              type="text" 
              placeholder={interviewFormData.mode === 'Online' ? 'https://meet.google.com/abc-defg-hij' : 'Office address / Location details'}
              value={interviewFormData.meetingLink} 
              onChange={(e) => setInterviewFormData(prev => ({ ...prev, meetingLink: e.target.value }))}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Remarks / Instructions for Candidate</label>
            <textarea 
              placeholder="e.g. Please bring a copy of your resume and portfolio..."
              value={interviewFormData.remarks} 
              onChange={(e) => setInterviewFormData(prev => ({ ...prev, remarks: e.target.value }))}
              className="form-textarea"
              style={{ minHeight: '80px' }}
            />
          </div>
        </form>
      </Modal>

      {/* Local floating notification toast banner */}
      {localToast && (
        <div 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: localToast.type === 'error' ? 'var(--error)' : 'var(--success)',
            color: '#ffffff',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: localToast.type === 'error' ? '0 10px 25px rgba(239, 68, 68, 0.3)' : '0 10px 25px rgba(34, 197, 94, 0.3)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600,
            animation: 'modalSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {localToast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          <span>{localToast.message}</span>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
