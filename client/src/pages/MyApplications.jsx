// ====================================================
// Candidate Dashboard / Applications Tracker Page
//
// This component renders the personal dashboard screen for logged-in candidates.
// It displays a navigation sidebar on the left and selected tabs (My Applications or Saved Jobs) on the right.
//
// Features:
// - Fetches a list of the user's submitted job applications (status, date, details).
// - Fetches lists of saved job posts from LocalStorage.
// - Supports client-side live filtering (by company keyword, job type dropdowns, sorting order).
// - Displays status counters: Under Review, Shortlisted, Rejected.
//
// Used by:
// - App.jsx (loaded when route state targets '/dashboard' and user role is 'candidate')
// ====================================================

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
  MoreVertical,
  Eye,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import Modal from '../components/Modal';

// Purpose:
// Displays candidate's job hunting statistics, bookmarks, and logs.
//
// Input:
// - onPageChange (function): Navigation function callback.
// - onApply (function): Starts the application form popup.
// - onLogout (function): Triggers session destruction.
//
// Output:
// Renders the Sidebar Layout and Active Panel contents.
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

  // Application status detail modal state
  const [selectedAppForStatus, setSelectedAppForStatus] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [chatLoadingMap, setChatLoadingMap] = useState({});

  // Purpose:
  // Fetches all job applications submitted by this candidate from backend.
  //
  // Input:
  // None.
  //
  // Output:
  // Sets applications state array on success, or sets error state on failure.
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

  // Purpose:
  // Reads saved job IDs from LocalStorage and fetches each job's details from backend.
  //
  // Input:
  // None.
  //
  // Output:
  // populates savedJobs state array with complete job objects.
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
      // Fetch each job record concurrently
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

  // Sync tab navigation action triggers
  useEffect(() => {
    if (activeTab === 'applications') {
      fetchUserApplications();
    } else if (activeTab === 'saved-jobs') {
      fetchSavedJobs();
    }
  }, [activeTab, fetchUserApplications, fetchSavedJobs]);

  // Purpose:
  // Handles click events on the Sidebar Logout button.
  //
  // Input:
  // None.
  //
  // Output:
  // Clears user storage and takes candidate back to the Landing home page.
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout(); // Delegated to global confirmation modal in App.jsx
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/';
    }
  };

  // Purpose:
  // Shows alerts for sidebar buttons that are not implemented yet.
  //
  // Input:
  // name (string) - Button name.
  const handlePlaceholderNav = (name) => {
    if (name === 'Profile') {
      onPageChange('/profile');
    } else {
      alert(`${name} section is coming soon! Feel free to explore My Applications or Profile.`);
    }
  };

  const handleViewStatusClick = (app) => {
    setSelectedAppForStatus(app);
    setIsStatusModalOpen(true);
  };

  const handleChatRecruiter = async (app) => {
    if (!app || !app.jobId || !app.jobId.postedBy) {
      alert("Recruiter details are not available for this job.");
      return;
    }
    
    const recruiterId = app.jobId.postedBy;
    
    try {
      setChatLoadingMap(prev => ({ ...prev, [app._id]: true }));
      // Automatically create or retrieve conversation
      await api.createConversation(app._id);
      onPageChange('chat', { recipientId: recruiterId });
    } catch (err) {
      alert(err.message || 'Failed to open chat conversation.');
    } finally {
      setChatLoadingMap(prev => ({ ...prev, [app._id]: false }));
    }
  };

  // Purpose:
  // Processes client-side search query, type selection, and sorting.
  //
  // Input:
  // None (reads applications, searchTerm, selectedType, sortBy states).
  //
  // Output:
  // Returns filtered and sorted applications array.
  const getFilteredApplications = () => {
    let result = [...applications];

    // Filter by company name or job title matching the search keyword
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(app => {
        const title = app.jobId?.title?.toLowerCase() || '';
        const company = app.jobId?.company?.toLowerCase() || '';
        return title.includes(query) || company.includes(query);
      });
    }

    // Filter by dropdown type selection
    if (selectedType !== 'All' && selectedType !== 'All Job Types') {
      result = result.filter(app => app.jobId?.jobType === selectedType);
    }

    // Sort by most recent application date or oldest application date
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
  const pendingCount = applications.filter(a => {
    const s = a.applicationStatus || a.status || 'Pending';
    return s === 'Pending' || s === 'Under Review';
  }).length;
  const shortlistedCount = applications.filter(a => (a.applicationStatus || a.status) === 'Shortlisted').length;
  const acceptedCount = applications.filter(a => (a.applicationStatus || a.status) === 'Accepted').length;
  const rejectedCount = applications.filter(a => (a.applicationStatus || a.status) === 'Rejected').length;

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
              <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div className="stat-widget-card">
                  <span className="stat-widget-label">Total Applications</span>
                  <span className="stat-widget-number">{totalCount}</span>
                </div>
                <div className="stat-widget-card">
                  <span className="stat-widget-label">Pending / Review</span>
                  <span className="stat-widget-number text-warning" style={{ color: '#d97706' }}>{pendingCount}</span>
                </div>
                <div className="stat-widget-card">
                  <span className="stat-widget-label">Shortlisted</span>
                  <span className="stat-widget-number text-info" style={{ color: '#0ea5e9' }}>{shortlistedCount}</span>
                </div>
                <div className="stat-widget-card">
                  <span className="stat-widget-label">Accepted</span>
                  <span className="stat-widget-number text-success">{acceptedCount}</span>
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
                          <div className="app-log-status-actions-col" style={{ display: 'flex', gap: '0.50rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className={`status-tracking-badge ${(app.applicationStatus || app.status || 'Pending').toLowerCase().replace(/\s+/g, '-')}`}>
                              {app.applicationStatus || app.status || 'Pending'}
                            </span>
                            
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', height: '34px' }}
                              onClick={() => handleViewStatusClick(app)}
                              title="View Application Status"
                            >
                              <Eye size={14} />
                              <span>View Status</span>
                            </button>

                            <button 
                              type="button" 
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', height: '34px' }}
                              onClick={() => handleChatRecruiter(app)}
                              disabled={chatLoadingMap[app._id]}
                              title="Chat Recruiter"
                            >
                              <MessageSquare size={14} />
                              <span>{chatLoadingMap[app._id] ? 'Connecting...' : 'Chat Recruiter'}</span>
                            </button>
                            
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

      {/* Application Status Detail Modal */}
      {selectedAppForStatus && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedAppForStatus(null);
          }}
          title="Application Process Tracker"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              {selectedAppForStatus.resumeUrl ? (
                <a 
                  href={`${api.defaults?.baseURL || 'http://localhost:5000'}${selectedAppForStatus.resumeUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary"
                  style={{ fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  View Submitted Resume
                </a>
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No resume attached</span>
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedAppForStatus(null);
                  }}
                >
                  Close
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    const app = selectedAppForStatus;
                    setIsStatusModalOpen(false);
                    setSelectedAppForStatus(null);
                    handleChatRecruiter(app);
                  }}
                >
                  Chat Recruiter
                </button>
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.5rem 0' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                {selectedAppForStatus.jobId?.title || 'Job Title'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{selectedAppForStatus.jobId?.company || 'Company'}</span>
                <span>&bull;</span>
                <span>{selectedAppForStatus.jobId?.location || 'Location'}</span>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Applied on: {new Date(selectedAppForStatus.appliedAt).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {/* Stepper tracker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative', paddingLeft: '1.5rem' }}>
              {/* Vertical timeline line */}
              <div style={{
                position: 'absolute',
                left: '6px',
                top: '10px',
                bottom: '10px',
                width: '2px',
                backgroundColor: 'var(--border-color)',
                zIndex: 1
              }}></div>

              {/* Step 1: Applied */}
              <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 2 }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  border: '3px solid var(--bg-primary)',
                  marginLeft: '-21px',
                  boxShadow: '0 0 0 2px #10b981'
                }}></div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Application Submitted
                    <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  </h4>
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                    Your application and resume were successfully sent to the recruiter.
                  </p>
                </div>
              </div>

              {/* Step 2: Under Review */}
              {(() => {
                const currentStatus = selectedAppForStatus.applicationStatus || selectedAppForStatus.status || 'Pending';
                const isStepCompleted = ['Shortlisted', 'Accepted', 'Rejected'].includes(currentStatus);
                const isStepActive = ['Pending', 'Under Review'].includes(currentStatus);
                
                return (
                  <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 2 }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: isStepCompleted ? '#10b981' : isStepActive ? '#f59e0b' : 'var(--border-color)',
                      border: '3px solid var(--bg-primary)',
                      marginLeft: '-21px',
                      boxShadow: `0 0 0 2px ${isStepCompleted ? '#10b981' : isStepActive ? '#f59e0b' : 'transparent'}`
                    }}></div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: isStepActive ? '#d97706' : 'inherit' }}>
                        Recruiter Review
                      </h4>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {isStepCompleted 
                          ? 'The recruiter completed review of your application.' 
                          : isStepActive 
                          ? 'The recruiter is currently reviewing your profile and skills.' 
                          : 'Pending initial application screening.'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Step 3: Final Selection */}
              {(() => {
                const currentStatus = selectedAppForStatus.applicationStatus || selectedAppForStatus.status || 'Pending';
                const isAccepted = currentStatus === 'Accepted';
                const isRejected = currentStatus === 'Rejected';
                const isShortlisted = currentStatus === 'Shortlisted';
                const isDecided = isAccepted || isRejected || isShortlisted;
                
                let title = 'Selection Decision';
                let desc = 'Final recruitment status decision from the hiring team.';
                let color = 'var(--text-secondary)';
                let dotColor = 'var(--border-color)';
                
                if (isAccepted) {
                  title = 'Application Accepted';
                  desc = 'Fantastic news! The hiring manager has accepted your application. They will contact you shortly.';
                  color = '#10b981';
                  dotColor = '#10b981';
                } else if (isRejected) {
                  title = 'Application Rejected';
                  desc = 'The recruiter decided to proceed with other candidates. Keep searching and applying!';
                  color = '#ef4444';
                  dotColor = '#ef4444';
                } else if (isShortlisted) {
                  title = 'Application Shortlisted';
                  desc = 'Great job! You have been shortlisted for this position. The recruiter will initiate chat soon!';
                  color = '#0ea5e9';
                  dotColor = '#0ea5e9';
                }

                return (
                  <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 2 }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      border: '3px solid var(--bg-primary)',
                      marginLeft: '-21px',
                      boxShadow: `0 0 0 2px ${isDecided ? dotColor : 'transparent'}`
                    }}></div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: color }}>
                        {title}
                      </h4>
                      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyApplications;
