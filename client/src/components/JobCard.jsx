import React, { useState } from 'react';
import { MapPin, Clock, Bookmark, Calendar } from 'lucide-react';

export const CompanyLogo = ({ company = '', logo = '', size = 32 }) => {
  const normalizedLogo = (logo || company).toLowerCase();

  if (normalizedLogo.includes('google')) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width={size * 0.9} height={size * 0.9}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      </div>
    );
  }

  if (normalizedLogo.includes('microsoft')) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 23 23" width={size * 0.8} height={size * 0.8}>
          <rect x="0" y="0" width="10.5" height="10.5" fill="#f25022"/>
          <rect x="11.5" y="0" width="10.5" height="10.5" fill="#7fba00"/>
          <rect x="0" y="11.5" width="10.5" height="10.5" fill="#00a4ef"/>
          <rect x="11.5" y="11.5" width="10.5" height="10.5" fill="#ffb900"/>
        </svg>
      </div>
    );
  }

  if (normalizedLogo.includes('amazon')) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width={size * 0.9} height={size * 0.9}>
          <path fill="#111111" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.25 14.5c-.75.45-1.5.6-2.25.6-1.5 0-2.25-.9-2.25-2.15 0-2 2-2.5 4.5-2.5v.4c0 .9-.3 1.5-.9 1.95c-.3.2-.6.3-.9.3-.4 0-.7-.1-.9-.3-.2-.2-.3-.5-.3-.9 0-.6.4-1.1 1.2-1.3l1.5-.3v4.5zm0-5.4l-1.5.3c-1.8.3-2.7 1.2-2.7 2.6 0 1.5 1 2.45 2.5 2.45 1 0 1.85-.45 2.45-1.2h.1l.1 1h1.5v-6c0-1.8-1-2.75-3-2.75-1.65 0-2.9.7-3.3 1.7l1.3.7c.3-.6.9-.9 1.7-.9 1.15 0 1.75.5 1.75 1.6v.8zm.5 7.4c-2 1.3-4.6 2-7.1 2-1.8 0-3.6-.3-5.2-.9l.5-1.3c1.4.5 3 .75 4.7.75 2.2 0 4.5-.6 6.2-1.7l1 1.2z" />
        </svg>
      </div>
    );
  }

  if (normalizedLogo.includes('deloitte')) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width={size * 0.9} height={size * 0.9}>
          <circle cx="12" cy="12" r="10" fill="#111111" />
          <text x="6" y="17" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="bold">D</text>
          <circle cx="16" cy="16" r="1.8" fill="#86bc25" />
        </svg>
      </div>
    );
  }

  // Generic Logo Fallback
  const firstLetter = company ? company.charAt(0).toUpperCase() : 'J';
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899'
  ];
  // Stable color choice based on company name hash
  const charCodeSum = company.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bgColor = colors[charCodeSum % colors.length];

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '8px',
      backgroundColor: bgColor,
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: size * 0.45
    }}>
      {firstLetter}
    </div>
  );
};

const JobCard = ({ job, onViewDetails, onApply }) => {
  const [isBookmarked, setIsBookmarked] = useState(() => {
    const savedStr = localStorage.getItem('savedJobIds') || '[]';
    return JSON.parse(savedStr).includes(job._id);
  });

  const formatSalary = (amount) => {
    if (job.salaryRange) return job.salaryRange;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount) + ' / yr';
  };

  const getPostedDays = () => {
    const createdDate = new Date(job.createdAt || Date.now());
    const diffTime = Math.abs(new Date() - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const handleBookmarkToggle = (e) => {
    e.stopPropagation();
    const savedStr = localStorage.getItem('savedJobIds') || '[]';
    let saved = JSON.parse(savedStr);
    let nextState = false;
    if (saved.includes(job._id)) {
      saved = saved.filter(id => id !== job._id);
      nextState = false;
    } else {
      saved.push(job._id);
      nextState = true;
    }
    localStorage.setItem('savedJobIds', JSON.stringify(saved));
    setIsBookmarked(nextState);
  };

  const cardClick = () => {
    onViewDetails(job._id);
  };

  return (
    <div className="job-portal-card" onClick={cardClick}>
      {/* Top row: Company Logo & Titles, plus Save button */}
      <div className="card-top-row">
        <div className="card-brand-group">
          <CompanyLogo company={job.company} logo={job.logo} size={42} />
          <div className="card-titles">
            <h3 className="card-job-title">{job.title}</h3>
            <span className="card-company-name">{job.company}</span>
          </div>
        </div>
        
        <button 
          onClick={handleBookmarkToggle}
          className={`card-bookmark-btn ${isBookmarked ? 'active' : ''}`}
          title={isBookmarked ? "Saved" : "Save Job"}
        >
          <Bookmark size={18} fill={isBookmarked ? "var(--accent)" : "none"} stroke={isBookmarked ? "var(--accent)" : "currentColor"} />
        </button>
      </div>

      {/* Metadata Indicators */}
      <div className="card-meta-row">
        <div className="card-meta-item" title="Location">
          <MapPin size={15} />
          <span>{job.location}</span>
        </div>
        <div className="card-meta-item" title="Job Type">
          <Clock size={15} />
          <span>{job.jobType}</span>
        </div>
        <div className="card-meta-item" title="Experience Required">
          <Calendar size={15} />
          <span>{job.experience || 'Fresher'}</span>
        </div>
      </div>

      {/* Footer Row: Salary and Days Posted */}
      <div className="card-footer-row">
        <div className="card-salary-info">
          {formatSalary(job.salary)}
        </div>
        <div className="card-posted-date">
          {getPostedDays()}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
