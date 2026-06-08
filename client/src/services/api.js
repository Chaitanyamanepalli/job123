// ====================================================
// API Service Wrapper (fetch client wrappers)
//
// This file serves as the unified interface for making HTTP requests to the backend API.
// It wraps standard fetch calls, automatically inserts auth tokens, and parses response logs.
//
// Features:
// - Appends active session token in headers ('Authorization: Bearer <token>') for protected endpoints.
// - Formats URL query strings for searching, filtering, sorting, and pagination.
// - Handles global network error messages.
//
// Used by:
// - Pages and components (Home, Jobs, JobDetails, Login, Signup, RecruiterDashboard) to fetch/mutate data.
// ====================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Purpose:
// Generates request headers dynamically, inserting authorization Bearer token if found.
//
// Input:
// contentType (string) - HTTP Content-Type header value.
//
// Output:
// Returns a header object containing Content-Type and Authorization keys.
const getHeaders = (contentType = 'application/json') => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Purpose:
// Processes the API response, parses JSON, and throws structured errors on failures.
//
// Input:
// response (Response object) - The raw HTTP response.
//
// Output:
// Returns the parsed JSON payload, or throws an Error object.
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.message || 'Something went wrong';
    const error = new Error(errorMsg);
    error.errors = data.errors || null;
    throw error;
  }
  return data;
};

// Main API interface export
export const api = {
  
  // ====================================================
  // AUTHENTICATION ENDPOINTS
  // ====================================================

  // Registers a new user account (Candidate or Recruiter)
  async signup(fullName, email, password, role) {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role }),
    });
    return handleResponse(response);
  },

  // Authenticates user and gets JWT token
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  // Fetches current session user profile info
  async getMe() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ====================================================
  // JOBS ENDPOINTS
  // ====================================================

  // Fetches lists of job postings with filters
  async getJobs({ search = '', location = '', jobType = 'All', experience = 'All', sort = 'Latest', page = 1, limit = 6, myJobs = false, minSalary = '', maxSalary = '', company = '' } = {}) {
    const query = new URLSearchParams({
      search,
      location,
      jobType,
      experience,
      sort,
      page: String(page),
      limit: String(limit),
    });
    if (myJobs) {
      query.append('myJobs', 'true');
    }
    if (minSalary) {
      query.append('minSalary', String(minSalary));
    }
    if (maxSalary) {
      query.append('maxSalary', String(maxSalary));
    }
    if (company) {
      query.append('company', company);
    }
    const response = await fetch(`${API_BASE}/jobs?${query.toString()}`, {
      headers: getHeaders(null), // No Content-Type needed for GET requests
    });
    return handleResponse(response);
  },

  // Fetches details of a single job posting by ID
  async getJobById(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}`);
    return handleResponse(response);
  },

  // Posts a new job listing (Recruiter-only)
  async createJob(jobData) {
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  // Updates an existing job listing details (Recruiter-only)
  async updateJob(id, jobData) {
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  // Deletes an existing job listing (Recruiter-only)
  async deleteJob(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // ====================================================
  // APPLICATION ENDPOINTS
  // ====================================================

  // Submits a new job application form (Candidate-only)
  async applyJob(jobId, applicantData) {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(applicantData),
    });
    return handleResponse(response);
  },

  // Fetches list of applications for a specific job (Recruiter-only)
  async getApplicationsByJob(jobId) {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/applications`, {
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Fetches current candidate's applied applications history list
  async getUserApplications() {
    const response = await fetch(`${API_BASE}/applications/user`, {
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Updates review status of candidate application (Recruiter-only)
  async updateApplicationStatus(applicationId, status) {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // Requests a password reset link email
  async forgotPassword(email) {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Resets user password using the token link
  async resetPassword(token, password) {
    const response = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },

  // ====================================================
  // DASHBOARD STATISTICS ENDPOINTS
  // ====================================================
  async getRecruiterStats() {
    const response = await fetch(`${API_BASE}/dashboard/recruiter`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getCandidateStats() {
    const response = await fetch(`${API_BASE}/dashboard/candidate`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getAdminStats() {
    const response = await fetch(`${API_BASE}/dashboard/admin`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // ====================================================
  // SAVED JOBS ENDPOINTS
  // ====================================================
  async getSavedJobs() {
    const response = await fetch(`${API_BASE}/users/saved-jobs`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async saveJob(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}/save`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async unsaveJob(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}/save`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // ====================================================
  // CANDIDATE PROFILE & UPLOADS ENDPOINTS
  // ====================================================
  async updateProfile(profileData) {
    const response = await fetch(`${API_BASE}/users/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(response);
  },

  async uploadResume(formData) {
    const response = await fetch(`${API_BASE}/users/resume`, {
      method: 'POST',
      headers: getHeaders(null), // Let browser set Content-Type with boundary for multipart
      body: formData,
    });
    return handleResponse(response);
  },

  async uploadLogo(formData) {
    const response = await fetch(`${API_BASE}/jobs/upload-logo`, {
      method: 'POST',
      headers: getHeaders(null), // Let browser set Content-Type with boundary for multipart
      body: formData,
    });
    return handleResponse(response);
  },

  // ====================================================
  // CHAT ENDPOINTS
  // ====================================================
  async getConversations() {
    const response = await fetch(`${API_BASE}/chat/conversations`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getMessages(conversationId) {
    const response = await fetch(`${API_BASE}/chat/messages/${conversationId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async sendMessage(recipientId, text) {
    const response = await fetch(`${API_BASE}/chat/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ recipientId, text }),
    });
    return handleResponse(response);
  },

  // ====================================================
  // ADMIN PANEL ENDPOINTS
  // ====================================================
  async getAdminUsers() {
    const response = await fetch(`${API_BASE}/admin/users`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async deleteAdminUser(id) {
    const response = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  async deleteAdminJob(id) {
    const response = await fetch(`${API_BASE}/admin/jobs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  async deleteAdminApplication(id) {
    const response = await fetch(`${API_BASE}/admin/applications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // ====================================================
  // NOTIFICATIONS ENDPOINTS
  // ====================================================
  async getNotifications() {
    const response = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async markNotificationsRead() {
    const response = await fetch(`${API_BASE}/notifications/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
