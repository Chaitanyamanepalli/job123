const API_BASE = 'http://localhost:5000/api';

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

export const api = {
  // Auth Endpoints
  async signup(fullName, email, password, role) {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, role }),
    });
    return handleResponse(response);
  },

  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async getMe() {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Jobs Endpoints
  async getJobs({ search = '', location = '', jobType = 'All', experience = 'All', sort = 'Latest', page = 1, limit = 6, myJobs = false } = {}) {
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
    const response = await fetch(`${API_BASE}/jobs?${query.toString()}`, {
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  async getJobById(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}`);
    return handleResponse(response);
  },

  async createJob(jobData) {
    const response = await fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  async updateJob(id, jobData) {
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(jobData),
    });
    return handleResponse(response);
  },

  async deleteJob(id) {
    const response = await fetch(`${API_BASE}/jobs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  // Applications Endpoints
  async applyJob(jobId, applicantData) {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/apply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(applicantData),
    });
    return handleResponse(response);
  },

  async getApplicationsByJob(jobId) {
    const response = await fetch(`${API_BASE}/jobs/${jobId}/applications`, {
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  async getUserApplications() {
    const response = await fetch(`${API_BASE}/applications/user`, {
      headers: getHeaders(null),
    });
    return handleResponse(response);
  },

  async updateApplicationStatus(applicationId, status) {
    const response = await fetch(`${API_BASE}/applications/${applicationId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  async forgotPassword(email) {
    const response = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  async resetPassword(token, password) {
    const response = await fetch(`${API_BASE}/auth/reset-password/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },
};
