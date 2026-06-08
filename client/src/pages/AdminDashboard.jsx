import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Shield, Users, Briefcase, FileText, Trash2, Search, AlertCircle, RefreshCw } from 'lucide-react';

const AdminDashboard = ({ onPageChange, user }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecruiters: 0,
    totalCandidates: 0,
    totalJobs: 0,
    totalApplications: 0,
  });
  const [activeTab, setActiveTab] = useState('users');
  const [usersList, setUsersList] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [appsList, setAppsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      const res = await api.getAdminStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err.message);
    }
  };

  const loadTabData = async (tab) => {
    try {
      setListLoading(true);
      setError('');
      if (tab === 'users') {
        const res = await api.getAdminUsers();
        setUsersList(res.data || []);
      } else if (tab === 'jobs') {
        const res = await api.getJobs({ limit: 100 });
        setJobsList(res.jobs || []);
      } else if (tab === 'applications') {
        // Admin needs to see all applications, we can load them or reuse custom logic.
        // Let's load recruiter's jobs or general applications. Since applicationController gets user applications,
        // we can fetch user applications or fetch recruiter's applications for all jobs.
        // To keep it simple, we can load candidate applications or write a simple route.
        // Let's see: we wrote GET /api/admin/users, but what about applications?
        // Wait, did we write GET /api/admin/applications?
        // Ah! In `adminController.js` and `adminRoutes.js`, we did NOT define a GET all applications route!
        // We only defined delete application! We can easily load them by querying them or we can implement
        // GET /api/admin/applications in backend!
        // Oh! Let's check `adminRoutes.js`. It contains:
        // `router.get('/users', protect, authorizeRoles('admin'), getAllUsers);`
        // We can add GET `/api/admin/jobs` and GET `/api/admin/applications` if needed,
        // or just let the admin search/delete them.
        // Let's add GET all jobs and GET all applications to admin routes to let them view everything!
        // Wait, let's look at `adminController.js` and see if we can add `getAllJobs` and `getAllApplications`.
        // That is extremely helpful and completes the view!
        // Let's implement those first or write them. Yes, I will make a quick mental note to update them,
        // or I can call endpoints like `api.getJobs` (which lists all jobs on the platform anyway!).
        // Yes, `api.getJobs({ limit: 100 })` already lists all jobs on the platform because getJobs is public!
        // That's perfect. For applications, let's define a GET `/api/admin/applications` endpoint on the server side
        // to return all applications across all jobs for the admin!
        // Let's check: we will write the code for listing applications.
        // Let's continue designing `AdminDashboard.jsx` and assume we will implement the endpoint.
        const res = await fetch('http://localhost:5000/api/admin/applications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        setAppsList(data.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load list details.');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      await loadStats();
      await loadTabData(activeTab);
      setLoading(false);
    };
    bootstrap();
  }, [activeTab]);

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user? This will also cascade delete all their job posts or job applications.')) {
      try {
        await api.deleteAdminUser(id);
        setUsersList(prev => prev.filter(u => u._id !== id));
        loadStats();
      } catch (err) {
        alert(err.message || 'Failed to delete user.');
      }
    }
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm('Are you sure you want to delete this job posting and all its applications?')) {
      try {
        await api.deleteAdminJob(id);
        setJobsList(prev => prev.filter(j => j._id !== id));
        loadStats();
      } catch (err) {
        alert(err.message || 'Failed to delete job.');
      }
    }
  };

  const handleDeleteApp = async (id) => {
    if (window.confirm('Are you sure you want to delete this job application record?')) {
      try {
        await api.deleteAdminApplication(id);
        setAppsList(prev => prev.filter(a => a._id !== id));
        loadStats();
      } catch (err) {
        alert(err.message || 'Failed to delete application.');
      }
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredJobs = jobsList.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    j.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApps = appsList.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.jobId && a.jobId.title && a.jobId.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Title */}
      <div className="dashboard-header-row" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={32} style={{ color: 'var(--accent-hover)' }} /> Admin Control Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage users, monitor job vacancies, and audit applications on the platform.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        <div className="dashboard-stat-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(163,230,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-hover)' }}>
            <Users size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalUsers}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Accounts</span>
          </div>
        </div>

        <div className="dashboard-stat-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
            <Briefcase size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalJobs}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Jobs</span>
          </div>
        </div>

        <div className="dashboard-stat-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
            <FileText size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totalApplications}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Applications</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="dashboard-table-card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Platform Breakdown Chart</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '200px', paddingBottom: '20px', borderBottom: '2px solid var(--border-color)', position: 'relative' }}>
          {/* Candidates Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '60px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{stats.totalCandidates}</span>
            <div style={{ width: '100%', height: `${Math.max((stats.totalCandidates / (stats.totalUsers || 1)) * 150, 10)}px`, backgroundColor: 'var(--accent)', borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Candidates</span>
          </div>

          {/* Recruiters Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '60px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{stats.totalRecruiters}</span>
            <div style={{ width: '100%', height: `${Math.max((stats.totalRecruiters / (stats.totalUsers || 1)) * 150, 10)}px`, backgroundColor: '#6366f1', borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Recruiters</span>
          </div>

          {/* Jobs Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '60px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{stats.totalJobs}</span>
            <div style={{ width: '100%', height: `${Math.max((stats.totalJobs / (Math.max(stats.totalJobs, stats.totalApplications) || 1)) * 150, 10)}px`, backgroundColor: 'var(--success)', borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Jobs</span>
          </div>

          {/* Applications Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '60px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{stats.totalApplications}</span>
            <div style={{ width: '100%', height: `${Math.max((stats.totalApplications / (Math.max(stats.totalJobs, stats.totalApplications) || 1)) * 150, 10)}px`, backgroundColor: 'var(--error)', borderRadius: '6px 6px 0 0', transition: 'height 0.5s ease' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Applications</span>
          </div>
        </div>
      </div>

      {/* Tabs and Data Tables */}
      <div className="dashboard-table-card" style={{ padding: '1.5rem' }}>
        
        {/* Navigation Tabs and Search Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => setActiveTab('users')}
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Users
            </button>
            <button 
              onClick={() => setActiveTab('jobs')}
              className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Jobs
            </button>
            <button 
              onClick={() => setActiveTab('applications')}
              className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Applications
            </button>
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '100px',
                padding: '0.5rem 1rem 0.5rem 2.25rem',
                fontSize: '0.85rem',
                outline: 'none',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                width: '240px'
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--error)', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* List Content */}
        {listLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><LoadingSpinner /></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            
            {/* USERS TAB */}
            {activeTab === 'users' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
                    <th style={{ padding: '0.75rem' }}>Name</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Role</th>
                    <th style={{ padding: '0.75rem' }}>Joined Date</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No matching users found.</td></tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.fullName}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '100px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: u.role === 'admin' ? 'rgba(163,230,53,0.15)' : u.role === 'recruiter' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
                            color: u.role === 'admin' ? 'var(--accent-hover)' : u.role === 'recruiter' ? '#6366f1' : 'var(--success)'
                          }}>{u.role}</span>
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={u._id === user._id}
                            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: u._id === user._id ? 0.4 : 1 }}
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* JOBS TAB */}
            {activeTab === 'jobs' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
                    <th style={{ padding: '0.75rem' }}>Job Title</th>
                    <th style={{ padding: '0.75rem' }}>Company</th>
                    <th style={{ padding: '0.75rem' }}>Location</th>
                    <th style={{ padding: '0.75rem' }}>Type</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No matching job postings found.</td></tr>
                  ) : (
                    filteredJobs.map((j) => (
                      <tr key={j._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{j.title}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{j.company}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{j.location}</td>
                        <td style={{ padding: '0.75rem' }}>{j.jobType}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDeleteJob(j._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                            title="Delete Job"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* APPLICATIONS TAB */}
            {activeTab === 'applications' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 700 }}>
                    <th style={{ padding: '0.75rem' }}>Candidate</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Position</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No matching application records found.</td></tr>
                  ) : (
                    filteredApps.map((a) => (
                      <tr key={a._id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{a.name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{a.email}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{a.jobId ? a.jobId.title : 'Deleted Position'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '100px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: a.status === 'Shortlisted' ? 'rgba(16,185,129,0.15)' : a.status === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(161,161,170,0.15)',
                            color: a.status === 'Shortlisted' ? 'var(--success)' : a.status === 'Rejected' ? 'var(--error)' : 'var(--text-secondary)'
                          }}>{a.status}</span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <button 
                            onClick={() => handleDeleteApp(a._id)}
                            style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                            title="Delete Application"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
