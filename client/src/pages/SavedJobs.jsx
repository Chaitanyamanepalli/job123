import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import JobCard from '../components/JobCard';
import { Bookmark, Search, AlertCircle } from 'lucide-react';

const SavedJobs = ({ onPageChange, onApply }) => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSavedJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getSavedJobs();
      setSavedJobs(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch saved jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleRemoveBookmark = async (e, jobId) => {
    e.stopPropagation(); // Prevents navigating to details
    try {
      await api.unsaveJob(jobId);
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
    } catch (err) {
      alert(err.message || 'Failed to remove job bookmark.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Header section */}
      <div className="dashboard-header-row" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bookmark size={32} style={{ color: 'var(--accent-hover)' }} /> Saved Jobs
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Browse and apply for the job postings you have bookmarked.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--error)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '2rem' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {savedJobs.length === 0 ? (
        <div className="empty-state-container" style={{ margin: '3rem auto', maxWidth: '480px' }}>
          <Search size={48} className="empty-state-icon" style={{ opacity: 0.4 }} />
          <h3 className="empty-state-title">No Bookmarks Saved</h3>
          <p className="empty-state-desc">
            You haven't bookmarked any jobs yet. Browse our jobs page and save positions you like!
          </p>
          <button className="btn btn-primary" onClick={() => onPageChange('/jobs')}>
            Search Jobs Now
          </button>
        </div>
      ) : (
        <div 
          className="featured-jobs-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {savedJobs.map((job) => (
            <JobCard 
              key={job._id}
              job={job}
              onViewDetails={(id) => onPageChange('job-details', { id })}
              onApply={onApply}
              isSavedPage={true}
              onRemoveBookmark={(e) => handleRemoveBookmark(e, job._id)}
            />
          ))}
        </div>
      )}

    </div>
  );
};

export default SavedJobs;
