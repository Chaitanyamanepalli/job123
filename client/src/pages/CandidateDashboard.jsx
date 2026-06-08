import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Briefcase, FileText, Bookmark, Calendar, ArrowRight, User, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const CandidateDashboard = ({ onPageChange, user }) => {
  const [stats, setStats] = useState({
    appliedJobsCount: 0,
    savedJobsCount: 0,
    recentlyAppliedJobs: [],
    profileCompletionPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.getCandidateStats();
        setStats(res.data);
      } catch (err) {
        setError(err.message || 'Failed to retrieve stats.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Shortlisted':
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'Rejected':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'Under Review':
      default:
        return { backgroundColor: 'rgba(161, 161, 170, 0.15)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' };
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Header Banner */}
      <div className="dashboard-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
            Welcome Back, <span style={{ color: 'var(--accent-hover)' }}>{user.fullName}</span>!
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Track your applications, saved jobs, and profile credentials here.
          </p>
        </div>
        <button 
          onClick={() => onPageChange('/jobs')} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          Explore Jobs <ArrowRight size={16} />
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Cards Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}
      >
        {/* Applied Jobs Stats Card */}
        <div className="dashboard-stat-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center', color: 'var(--accent-hover)' }}>
            <Briefcase size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>{stats.appliedJobsCount}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Applied Jobs</span>
          </div>
        </div>

        {/* Saved Jobs Stats Card */}
        <div 
          className="dashboard-stat-card" 
          onClick={() => onPageChange('/saved-jobs')}
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--card-shadow)', cursor: 'pointer', transition: 'all 0.25s ease' }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center', color: '#6366f1' }}>
            <Bookmark size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>{stats.savedJobsCount}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Saved Bookmarks</span>
          </div>
        </div>

        {/* Profile Completion Card */}
        <div 
          className="dashboard-stat-card" 
          onClick={() => onPageChange('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: 'var(--card-shadow)', cursor: 'pointer' }}
        >
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center', color: 'var(--success)' }}>
            <User size={28} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.1 }}>{stats.profileCompletionPercentage}%</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Strength</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${stats.profileCompletionPercentage}%`, height: '100%', backgroundColor: 'var(--success)', borderRadius: '4px', transition: 'width 0.5s ease-out' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', flexWrap: 'wrap', gridTemplateColumns: '1fr' }} className="jobs-page-grid-layout">
        
        {/* Left column: Recently Applied Jobs */}
        <main className="dashboard-table-card" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>Recently Applied</h2>
          
          {stats.recentlyAppliedJobs.length === 0 ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Briefcase size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p style={{ fontWeight: 600 }}>No application records found.</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Start applying for jobs to trace status updates.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.recentlyAppliedJobs.map((app) => (
                <div 
                  key={app._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{app.jobId ? app.jobId.title : 'Deleted Position'}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      {app.jobId ? app.jobId.company : 'N/A'} • {app.jobId ? app.jobId.location : 'N/A'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                      <Calendar size={12} /> Applied on {new Date(app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <span 
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '100px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      ...getStatusStyle(app.status)
                    }}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Right column: Action Board & Tips */}
        <aside className="dashboard-table-card" style={{ padding: '1.75rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-hover)' }}>
            <Sparkles size={20} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Profile Tips</h2>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
            A completed profile increases your profile visibility to top recruiting companies by up to 5x.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.profileCompletionPercentage < 100 ? (
              <div 
                onClick={() => onPageChange('/profile')}
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(163, 230, 53, 0.05)',
                  border: '1px dashed var(--accent)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                <CheckCircle2 size={18} style={{ color: 'var(--accent)' }} />
                <span>Complete profile registration to reach 100%</span>
              </div>
            ) : (
              <div 
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}
              >
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span style={{ color: 'var(--success)' }}>Profile fully completed! Excellent.</span>
              </div>
            )}

            <button 
              className="btn btn-secondary" 
              onClick={() => onPageChange('/profile')}
              style={{ width: '100%', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              Update Profile <ArrowRight size={14} />
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => onPageChange('/my-applications')}
              style={{ width: '100%', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              View Full History <ArrowRight size={14} />
            </button>
          </div>
        </aside>

      </div>

    </div>
  );
};

export default CandidateDashboard;
