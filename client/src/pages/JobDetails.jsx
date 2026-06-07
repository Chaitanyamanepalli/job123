import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { CompanyLogo } from '../components/JobCard';
import { ArrowLeft, MapPin, Clock, Bookmark, Calendar, Check, Globe, Users, Building, Flag } from 'lucide-react';

const companyInfoMap = {
  google: {
    mission: "Google's mission is to organize the world's information and make it universally accessible and useful.",
    website: "www.google.com",
    size: "10,000+ employees",
    industry: "Technology",
    founded: "1998"
  },
  microsoft: {
    mission: "Microsoft's mission is to empower every person and every organization on the planet to achieve more.",
    website: "www.microsoft.com",
    size: "10,000+ employees",
    industry: "Technology",
    founded: "1975"
  },
  amazon: {
    mission: "Amazon's mission is to be Earth's most customer-centric company, Earth's best employer, and Earth's safest place to work.",
    website: "www.amazon.com",
    size: "10,000+ employees",
    industry: "Technology / E-commerce",
    founded: "1994"
  },
  deloitte: {
    mission: "Deloitte's mission is to help our clients and our people excel. We are committed to lead the profession and shape the future.",
    website: "www.deloitte.com",
    size: "10,000+ employees",
    industry: "Consulting",
    founded: "1845"
  }
};

const getCompanyInfo = (companyName) => {
  const key = (companyName || '').toLowerCase();
  if (companyInfoMap[key]) return companyInfoMap[key];
  return {
    mission: `${companyName} is a leading innovator dedicated to delivering excellence and pushing boundaries in its field.`,
    website: `www.${key.replace(/[^a-z0-9]/g, '') || 'company'}.com`,
    size: "1,000 - 5,000 employees",
    industry: "Technology",
    founded: "2010"
  };
};

const parseJobDescription = (desc) => {
  if (!desc) return { overview: '', responsibilities: [], requirements: [] };
  
  const responsibilitiesIndex = desc.indexOf('Responsibilities:');
  const requirementsIndex = desc.indexOf('Requirements:');
  
  if (responsibilitiesIndex === -1 || requirementsIndex === -1) {
    return {
      overview: desc,
      responsibilities: [
        'Collaborate with developers and stakeholders to deliver high-quality features.',
        'Optimize application for maximum speed and scalability.',
        'Implement responsive design best practices.'
      ],
      requirements: [
        'Prior experience in a similar software engineering role.',
        'Strong problem-solving and communication skills.',
        'Familiarity with modern web technology stacks.'
      ]
    };
  }
  
  const overview = desc.substring(0, responsibilitiesIndex).trim();
  
  const responsibilitiesText = desc.substring(responsibilitiesIndex + 17, requirementsIndex).trim();
  const responsibilities = responsibilitiesText
    .split('\n')
    .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter(line => line.length > 0);
    
  const requirementsText = desc.substring(requirementsIndex + 13).trim();
  const requirements = requirementsText
    .split('\n')
    .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
    .filter(line => line.length > 0);
    
  return { overview, responsibilities, requirements };
};

const JobDetails = ({ pageParams, onPageChange, onApply, appliedJobIds = [] }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(() => {
    if (!pageParams || !pageParams.id) return false;
    const savedStr = localStorage.getItem('savedJobIds') || '[]';
    return JSON.parse(savedStr).includes(pageParams.id);
  });

  useEffect(() => {
    if (pageParams && pageParams.id) {
      const savedStr = localStorage.getItem('savedJobIds') || '[]';
      setIsBookmarked(JSON.parse(savedStr).includes(pageParams.id));
    }
  }, [pageParams]);

  const handleBookmarkToggle = () => {
    if (!job) return;
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

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError('');
        if (!pageParams || !pageParams.id) {
          throw new Error('No job ID provided');
        }
        const res = await api.getJobById(pageParams.id);
        setJob(res.job);
      } catch (err) {
        setError(err.message || 'Failed to retrieve job details.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [pageParams]);

  if (loading) return <LoadingSpinner />;

  if (error || !job) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem' }}>
        <div className="empty-state-container" style={{ borderColor: 'var(--error)' }}>
          <h3 className="empty-state-title">Job Details Unavailable</h3>
          <p className="empty-state-desc">{error || 'The job listing could not be found.'}</p>
          <button className="btn btn-secondary" onClick={() => onPageChange('jobs')}>
            <ArrowLeft size={16} /> Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const { overview, responsibilities, requirements } = parseJobDescription(job.description);
  const companyInfo = getCompanyInfo(job.company);

  const getPostedDays = () => {
    const createdDate = new Date(job.createdAt || Date.now());
    const diffTime = Math.abs(new Date() - createdDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const formatSalary = (amount) => {
    if (job.salaryRange) return job.salaryRange;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount) + ' / yr';
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      
      {/* Back button */}
      <button 
        type="button"
        onClick={() => onPageChange('jobs')}
        className="back-to-jobs-link-btn"
      >
        <ArrowLeft size={16} />
        <span>Back to jobs</span>
      </button>

      {/* Main Details Grid */}
      <div className="job-details-page-grid-layout" style={{ marginTop: '1.5rem' }}>
        
        {/* Left Column main details */}
        <div className="job-details-main-content-area">
          
          {/* Header Card */}
          <div className="job-details-header-card">
            <div className="details-header-top">
              <div className="details-brand-meta">
                <CompanyLogo company={job.company} logo={job.logo} size={54} />
                <div className="details-titles">
                  <h1 className="details-job-title">{job.title}</h1>
                  <span className="details-company-name">{job.company}</span>
                </div>
              </div>
              
              <div className="details-salary-display">
                {formatSalary(job.salary)}
              </div>
            </div>

            {/* Metadata Badges & Timestamps */}
            <div className="details-header-meta-row">
              <div className="details-meta-item">
                <MapPin size={16} />
                <span>{job.location}</span>
              </div>
              <div className="details-meta-item">
                <Clock size={16} />
                <span>{job.jobType}</span>
              </div>
              <div className="details-meta-item">
                <Calendar size={16} />
                <span>Posted {getPostedDays()}</span>
              </div>
              <div className="details-meta-item">
                <Users size={16} />
                <span>{job.experience || 'Fresher'} Exp</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="details-header-actions">
              {job && appliedJobIds.includes(job._id) ? (
                <button 
                  className="details-action-apply-now-btn"
                  disabled
                  style={{
                    backgroundColor: 'var(--success)',
                    color: '#ffffff',
                    cursor: 'not-allowed',
                    opacity: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Check size={18} />
                  <span>Applied</span>
                </button>
              ) : (
                <button 
                  className="details-action-apply-now-btn"
                  onClick={() => onApply(job)}
                >
                  Apply Now
                </button>
              )}
              
              <button 
                className={`details-action-save-job-btn ${isBookmarked ? 'active' : ''}`}
                onClick={handleBookmarkToggle}
              >
                <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                <span>{isBookmarked ? "Saved" : "Save Job"}</span>
              </button>
            </div>
          </div>

          {/* Description Sections */}
          <div className="job-details-body-info-card">
            
            {/* Overview */}
            <div className="details-info-section">
              <h3 className="details-section-heading">Job Description</h3>
              <p className="details-section-text">{overview}</p>
            </div>

            {/* Responsibilities */}
            {responsibilities.length > 0 && (
              <div className="details-info-section">
                <h3 className="details-section-heading">Responsibilities</h3>
                <div className="details-bullet-checklist">
                  {responsibilities.map((resp, i) => (
                    <div key={i} className="details-checklist-item">
                      <div className="details-check-icon-box">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="details-checklist-text">{resp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {requirements.length > 0 && (
              <div className="details-info-section">
                <h3 className="details-section-heading">Requirements</h3>
                <div className="details-bullet-checklist">
                  {requirements.map((req, i) => (
                    <div key={i} className="details-checklist-item">
                      <div className="details-check-icon-box">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span className="details-checklist-text">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column sidebar: About Company */}
        <aside className="job-details-sidebar-col">
          <div className="about-company-side-card">
            <div className="about-company-header">
              <h3 className="about-company-heading">About Company</h3>
            </div>
            
            <div className="about-company-brand-row">
              <CompanyLogo company={job.company} logo={job.logo} size={40} />
              <span className="about-company-name-text">{job.company}</span>
            </div>

            <p className="about-company-mission-statement">
              {companyInfo.mission}
            </p>

            <div className="about-company-stats-list">
              <div className="company-stat-item">
                <Globe size={18} className="company-stat-icon" />
                <div className="company-stat-details">
                  <span className="company-stat-label">Website</span>
                  <a href={`https://${companyInfo.website}`} target="_blank" rel="noopener noreferrer" className="company-stat-link">
                    {companyInfo.website}
                  </a>
                </div>
              </div>

              <div className="company-stat-item">
                <Users size={18} className="company-stat-icon" />
                <div className="company-stat-details">
                  <span className="company-stat-label">Company Size</span>
                  <span className="company-stat-value">{companyInfo.size}</span>
                </div>
              </div>

              <div className="company-stat-item">
                <Building size={18} className="company-stat-icon" />
                <div className="company-stat-details">
                  <span className="company-stat-label">Industry</span>
                  <span className="company-stat-value">{companyInfo.industry}</span>
                </div>
              </div>

              <div className="company-stat-item">
                <Flag size={18} className="company-stat-icon" />
                <div className="company-stat-details">
                  <span className="company-stat-label">Founded</span>
                  <span className="company-stat-value">{companyInfo.founded}</span>
                </div>
              </div>
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
};

export default JobDetails;
