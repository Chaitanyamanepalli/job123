import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { User, Mail, Shield, Briefcase, FileText, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

const Profile = ({ user, onPageChange }) => {
  const [stats, setStats] = useState({
    totalApplicationsSubmitted: 0,
    totalJobsPosted: 0,
    totalApplicationsReceived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');





  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        setLoading(true);
        setError('');
        if (user.role === 'candidate') {
          // Fetch candidate's applications count
          const appRes = await api.getUserApplications();
          setStats(prev => ({
            ...prev,
            totalApplicationsSubmitted: appRes.count || 0,
          }));
        } else if (user.role === 'recruiter') {
          // Fetch recruiter's jobs and calculate stats
          const jobsRes = await api.getJobs({ myJobs: true, limit: 100 });
          const recruiterJobs = jobsRes.jobs || [];
          
          const counts = await Promise.all(
            recruiterJobs.map(async (job) => {
              try {
                const jobAppRes = await api.getApplicationsByJob(job._id);
                return jobAppRes.count || 0;
              } catch (e) {
                console.error(`Error loading applications for job ${job._id}:`, e.message);
                return 0;
              }
            })
          );

          const appsCount = counts.reduce((acc, curr) => acc + curr, 0);

          setStats(prev => ({
            ...prev,
            totalJobsPosted: recruiterJobs.length,
            totalApplicationsReceived: appsCount,
          }));
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve profile stats.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileStats();
    }
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <div className="profile-container-layout">
        
        {/* Profile Card Header */}
        <div className="profile-header-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-large">
              {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="profile-title-details">
              <h1 className="profile-name">{user.fullName}</h1>
              <div className="profile-role-badge">
                <Shield size={14} />
                <span>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details and Stats Row */}
        <div className="profile-info-grid">
          
          {/* Left panel: Info */}
          <div className="profile-info-card">
            <h3 className="profile-section-title">Personal Details</h3>
            <div className="profile-details-list">
              <div className="profile-detail-item">
                <User size={18} className="detail-item-icon" />
                <div className="detail-item-text">
                  <span className="detail-item-label">Full Name</span>
                  <span className="detail-item-val">{user.fullName}</span>
                </div>
              </div>

              <div className="profile-detail-item">
                <Mail size={18} className="detail-item-icon" />
                <div className="detail-item-text">
                  <span className="detail-item-label">Email Address</span>
                  <span className="detail-item-val">{user.email}</span>
                </div>
              </div>

              <div className="profile-detail-item">
                <Shield size={18} className="detail-item-icon" />
                <div className="detail-item-text">
                  <span className="detail-item-label">User Role</span>
                  <span className="detail-item-val" style={{ textTransform: 'capitalize' }}>{user.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Role-specific stats */}
          <div className="profile-info-card">
            <h3 className="profile-section-title">Account Statistics</h3>
            
            {error && (
              <div style={{ color: 'var(--error)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {!error && (
              <div className="profile-stats-content">
                {user.role === 'candidate' ? (
                  <div className="profile-stat-box" onClick={() => onPageChange('/my-applications')} style={{ cursor: 'pointer' }}>
                    <div className="profile-stat-icon-wrap">
                      <FileText size={24} />
                    </div>
                    <div className="profile-stat-numbers">
                      <span className="profile-stat-count">{stats.totalApplicationsSubmitted}</span>
                      <span className="profile-stat-lbl">Total Applications Submitted</span>
                    </div>
                    <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="profile-stat-box" onClick={() => onPageChange('/recruiter/dashboard')} style={{ cursor: 'pointer' }}>
                      <div className="profile-stat-icon-wrap">
                        <Briefcase size={24} />
                      </div>
                      <div className="profile-stat-numbers">
                        <span className="profile-stat-count">{stats.totalJobsPosted}</span>
                        <span className="profile-stat-lbl">Total Jobs Posted</span>
                      </div>
                      <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
                    </div>

                    <div className="profile-stat-box" onClick={() => onPageChange('/recruiter/dashboard')} style={{ cursor: 'pointer' }}>
                      <div className="profile-stat-icon-wrap">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="profile-stat-numbers">
                        <span className="profile-stat-count">{stats.totalApplicationsReceived}</span>
                        <span className="profile-stat-lbl">Total Applications Received</span>
                      </div>
                      <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>



      </div>
    </div>
  );
};

export default Profile;
