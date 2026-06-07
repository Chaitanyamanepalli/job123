import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import JobCard, { CompanyLogo } from '../components/JobCard';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  ClipboardCheck, 
  ArrowRight, 
  LayoutDashboard, 
  Bookmark, 
  User, 
  LogOut,
  MoreVertical
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const MyApplications = ({ onPageChange, onApply, onLogout }) => {
  // Retrieve authenticated candidate user details
  const user = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');

  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'saved-jobs'
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Saved Jobs state
  const [savedJobs, setSavedJobs] = useState([]);
  const [savedJobsLoading, setSavedJobsLoading] = useState(false);

  // Local filtering & search states for applications
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('Most Recent');

  const fetchUserApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getUserApplications();
      setApplications(res.applications || []);
    } catch (err) {
      setError(err.message || 'Failed to load applications.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSavedJobs = useCallback(async () => {
    const savedStr = localStorage.getItem('savedJobIds') || '[]';
    const savedIds = JSON.parse(savedStr);
    
    if (savedIds.length === 0) {
      setSavedJobs([]);
      return;
    }

    try {
      setSavedJobsLoading(true);
      const jobsList = [];
      await Promise.all(
        savedIds.map(async (id) => {
          try {
            const res = await api.getJobById(id);
            if (res.job) {
              jobsList.push(res.job);
            }
          } catch (err) {
            console.error(`Error loading saved job ${id}:`, err.message);
          }
        })
      );
      setSavedJobs(jobsList);
    } catch (err) {
      console.error('Error fetching saved jobs:', err.message);
    } finally {
      setSavedJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchUserApplications();
    } else if (activeTab === 'saved-jobs') {
      fetchSavedJobs();
    }
  }, [activeTab, fetchUserApplications, fetchSavedJobs]);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  const handlePlaceholderNav = (name) => {
    if (name === 'Profile') {
      onPageChange('/profile');
    } else {
      alert(`${name} section is coming soon! Feel free to explore My Applications or Profile.`);
    }
  };

  // Filter application list client-side
  const getFilteredApplications = () => {
    let result = [...applications];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(app => {
        const title = app.jobId?.title?.toLowerCase() || '';
        const company = app.jobId?.company?.toLowerCase() || '';
        return title.includes(query) || company.includes(query);
      });
    }

    if (selectedType !== 'All' && selectedType !== 'All Job Types') {
      result = result.filter(app => app.jobId?.jobType === selectedType);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.appliedAt).getTime();
      const dateB = new Date(b.appliedAt).getTime();
      return sortBy === 'Most Recent' ? dateB - dateA : dateA - dateB;
    });

    return result;
  };

  const filteredApps = getFilteredApplications();
  const jobTypes = ['All Job Types', 'Full Time', 'Part Time', 'Contract', 'Internship', 'Remote'];

  // Stats Counters
  const totalCount = applications.length;
  const underReviewCount = applications.filter(a => a.status === 'Under Review').length;
  const shortlistedCount = applications.filter(a => a.status === 'Shortlisted').length;
  const rejectedCount = applications.filter(a => a.status === 'Rejected').length;

  return (
    <div className="candidate-dashboard-page-wrapper">
      <div className="dashboard-double-columns">
        
        {/* Left Column Sidebar */}
        <aside className="dashboard-left-sidebar">
          <div className="sidebar-profile-card">
            <div className="profile-avatar-large" style={{ width: '80px', height: '80px', fontSize: '1.75rem', margin: '0 auto 1rem auto' }}>
              {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
            </div>
            <h3 className="sidebar-user-name">{user.fullName || 'Candidate User'}</h3>
            <span className="sidebar-user-email">{user.email || 'candidate@gmail.com'}</span>
          </div>

          <nav className="sidebar-menu-nav">
            <button type="button" onClick={() => handlePlaceholderNav('Dashboard')} className="sidebar-menu-item">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            
            <button 
              type="button" 
              className={`sidebar-menu-item ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              <ClipboardCheck size={18} />
              <span>My Applications</span>
            </button>

            <button 
              type="button" 
              className={`sidebar-menu-item ${activeTab === 'saved-jobs' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved-jobs')}
            >
              <Bookmark size={18} />
              <span>Saved Jobs</span>
            </button>

            <button type="button" onClick={() => handlePlaceholderNav('Profile')} className="sidebar-menu-item">
              <User size={18} />
              <span>Profile</span>
            </button>

            <div className="sidebar-menu-divider"></div>

            <button type="button" onClick={handleLogoutClick} className="sidebar-menu-item logout">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* Right Column Content Panel */}
        <main className="dashboard-right-panel">
          
          {/* View Tab: Applications */}
          {activeTab === 'applications' && (
            <>
              <h1 className="dashboard-panel-title">My Applications</h1>

              {/* Live Stats Widgets */}
              <div className="dashboard-stats-grid">
                <div className="stat-widget-card">
                  <span className="stat-widget-label">Total Applications Submitted</span>
                  <span className="stat-widget-number">{totalCount}</span>
                </div>
                <div className="stat-widget-card">
                  <span className="stat-widget-label">Under Review</span>
                  <span className="stat-widget-number">{underReviewCount}</span>
                </div>
                <div className="stat-widget-card">
                  <span className="stat-widget-label">Shortlisted</span>
                  <span className="stat-widget-number text-success">{shortlistedCount}</span>
                </div>
                <div className="stat-widget-card">
                  <span className="stat-widget-label">Rejected</span>
                  <span className="stat-widget-number text-danger">{rejectedCount}</span>
                </div>
              </div>

              {/* Filters and search row */}
              <div className="dashboard-list-toolbar">
                <div className="dashboard-search-input-wrap">
                  <Search size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by job title or company" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="dashboard-search-inner-input"
                  />
                </div>

                <div className="dashboard-dropdowns-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <CustomSelect
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    options={jobTypes.map(t => ({ value: t, label: t }))}
                  />

                  <CustomSelect
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    options={[
                      { value: 'Most Recent', label: 'Most Recent' },
                      { value: 'Oldest', label: 'Oldest' }
                    ]}
                  />
                </div>
              </div>

              {/* Applications List */}
              {loading ? (
                <LoadingSpinner />
              ) : error ? (
                <div className="empty-state-container" style={{ borderColor: 'var(--error)' }}>
                  <h3 className="empty-state-title">An Error Occurred</h3>
                  <p className="empty-state-desc">{error}</p>
                  <button className="btn btn-secondary" onClick={fetchUserApplications}>Retry</button>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="empty-state-container" style={{ padding: '3rem 2rem' }}>
                  <ClipboardCheck size={40} className="empty-state-icon" />
                  <h3 className="empty-state-title">You haven't applied for any jobs yet.</h3>
                  <p className="empty-state-desc">
                    {totalCount === 0 
                      ? "Browse active vacancies on our Job Board and submit your applications!" 
                      : "Try widening your keyword search or switching filters."}
                  </p>
                  {totalCount === 0 && (
                    <button className="btn btn-primary" onClick={() => onPageChange('jobs')}>
                      Explore Jobs <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="dashboard-applications-list-container">
                  {filteredApps.map((app) => (
                    <div key={app._id} className="app-log-row-item">
                      {app.jobId ? (
                        <>
                          {/* Company Details left */}
                          <div className="app-log-brand-meta">
                            <CompanyLogo company={app.jobId.company} logo={app.jobId.logo} size={42} />
                            <div className="app-log-titles">
                              <h3 className="app-log-job-title">{app.jobId.title}</h3>
                              <div className="app-log-company-details">
                                <span className="app-log-company-name">{app.jobId.company}</span>
                                <span className="details-dot-divider">&bull;</span>
                                <MapPin size={13} />
                                <span className="app-log-location">{app.jobId.location}</span>
                                <span className="details-dot-divider">&bull;</span>
                                <Clock size={13} />
                                <span className="app-log-type">{app.jobId.jobType}</span>
                                {app.jobId.experience && (
                                  <>
                                    <span className="details-dot-divider">&bull;</span>
                                    <span className="app-log-exp">{app.jobId.experience}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Applied Date middle */}
                          <div className="app-log-applied-date-col">
                            <span className="app-log-date-label">Applied on</span>
                            <span className="app-log-date-value">
                              {new Date(app.appliedAt).toLocaleDateString(undefined, { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>

                          {/* Status badge and actions right */}
                          <div className="app-log-status-actions-col">
                            <span className={`status-tracking-badge ${app.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {app.status}
                            </span>
                            
                            <button 
                              type="button" 
                              className="app-log-option-btn"
                              onClick={() => onPageChange('job-details', { id: app.jobId._id })}
                              title="View Job Details"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ padding: '0.5rem 0', width: '100%' }}>
                          <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            This job listing was deleted by the recruiter.
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={14} />
                            <span>Applied on {new Date(app.appliedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* View Tab: Saved Jobs */}
          {activeTab === 'saved-jobs' && (
            <>
              <h1 className="dashboard-panel-title">Saved Jobs</h1>

              {savedJobsLoading ? (
                <LoadingSpinner />
              ) : savedJobs.length === 0 ? (
                <div className="empty-state-container" style={{ padding: '3rem 2rem' }}>
                  <Bookmark size={40} className="empty-state-icon" style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
                  <h3 className="empty-state-title">You haven't saved any jobs yet.</h3>
                  <p className="empty-state-desc">
                    Browse active vacancies on our Job Board and save jobs to track them here!
                  </p>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onPageChange('jobs')}>
                    Explore Jobs <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="jobs-list-col-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                  {savedJobs.map((job) => (
                    <JobCard 
                      key={job._id}
                      job={job}
                      onViewDetails={(id) => onPageChange('job-details', { id })}
                      onApply={onApply}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
};

export default MyApplications;
