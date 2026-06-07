// ====================================================
// Home Page Component
//
// This is the main landing page of the JobPortal Pro application.
// It displays a welcoming hero section with search bars, popular terms,
// and shows a grid of 4 featured job listings.
//
// Features:
// - A double-input search box for filtering job titles and locations.
// - Quick search pills for popular job tags like Developer or Designer.
// - An interactive list of recently posted featured jobs.
//
// Used by:
// - App.jsx (when the visual page state matches '/')
// ====================================================

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import JobCard from '../components/JobCard';
import SkeletonCard from '../components/SkeletonCard';
import { Search, MapPin, ArrowRight } from 'lucide-react';

// Purpose:
// Draws a modern, SVG-based floating icon illustration on the right side of the hero section.
//
// Input:
// None.
//
// Output:
// Returns SVG code representing an employee working at a desk.
const HeroIllustration = () => (
  <svg viewBox="0 0 500 400" width="100%" height="100%" style={{ maxWidth: '480px', margin: 'auto', display: 'block' }}>
    {/* Background Decorative Rings */}
    <circle cx="150" cy="180" r="120" fill="rgba(163, 230, 53, 0.04)" />
    <circle cx="380" cy="220" r="90" fill="rgba(163, 230, 53, 0.03)" />
    
    {/* Floating Elements */}
    {/* Checkmark bubble */}
    <g transform="translate(100, 70)" filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.06))">
      <circle cx="20" cy="20" r="18" fill="#a3e635" />
      <path d="M13 20l5 5 9-9" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>

    {/* Floating JOB Card */}
    <g transform="translate(300, 50)" filter="drop-shadow(0px 10px 20px rgba(0,0,0,0.05))">
      <rect x="0" y="0" width="110" height="60" rx="12" fill="#111111" />
      <rect x="15" y="15" width="45" height="8" rx="4" fill="#a3e635" />
      <rect x="15" y="28" width="60" height="6" rx="3" fill="rgba(255,255,255,0.4)" />
      <circle cx="85" cy="30" r="10" fill="rgba(255,255,255,0.1)" />
      <path d="M82 30h6M85 27v6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Browser Card Frame */}
    <g transform="translate(140, 100)" filter="drop-shadow(0px 15px 35px rgba(0,0,0,0.08))">
      {/* Frame body */}
      <rect x="0" y="0" width="260" height="180" rx="16" fill="var(--bg-secondary)" stroke="var(--border-color)" strokeWidth="1" />
      
      {/* Top bar */}
      <path d="M0 16 C0 7 7 0 16 0 H 244 C 253 0 260 7 260 16 V 30 H 0 Z" fill="var(--bg-primary)" />
      <circle cx="15" cy="15" r="4" fill="#ff5f56" />
      <circle cx="27" cy="15" r="4" fill="#ffbd2e" />
      <circle cx="39" cy="15" r="4" fill="#27c93f" />

      {/* Grid search elements in browser */}
      <rect x="15" y="45" width="150" height="12" rx="4" fill="var(--border-color)" />
      <circle cx="230" cy="51" r="10" fill="rgba(163, 230, 53, 0.2)" />
      <path d="M227 54l3-3m0 0a3.5 3.5 0 1 0-5-5 3.5 3.5 0 0 0 5 5z" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Decorative charts/lists */}
      <rect x="15" y="75" width="230" height="24" rx="6" fill="var(--bg-primary)" />
      <circle cx="30" cy="87" r="6" fill="#3b82f6" />
      <rect x="45" y="81" width="100" height="6" rx="3" fill="var(--text-primary)" />
      <rect x="45" y="91" width="60" height="4" rx="2" fill="var(--text-secondary)" />

      <rect x="15" y="110" width="230" height="24" rx="6" fill="var(--bg-primary)" />
      <circle cx="30" cy="122" r="6" fill="#10b981" />
      <rect x="45" y="116" width="80" height="6" rx="3" fill="var(--text-primary)" />
      <rect x="45" y="126" width="50" height="4" rx="2" fill="var(--text-secondary)" />

      <rect x="15" y="145" width="230" height="20" rx="6" fill="var(--bg-primary)" />
      <circle cx="30" cy="155" r="6" fill="#f59e0b" />
      <rect x="45" y="151" width="120" height="6" rx="3" fill="var(--text-primary)" />
    </g>

    {/* Green Plant */}
    <g transform="translate(100, 240)">
      {/* Plant Pot */}
      <path d="M15 50 L25 50 L28 25 L12 25 Z" fill="#d1a37a" />
      {/* Stems & Leaves */}
      <path d="M20 25 Q15 10 5 12 Q15 0 20 25" fill="#22c55e" />
      <path d="M20 25 Q25 8 35 15 Q25 0 20 25" fill="#15803d" />
      <path d="M20 25 Q20 5 15 -5 Q28 0 20 25" fill="#4ade80" />
      {/* Ground shadows */}
      <ellipse cx="20" cy="50" rx="10" ry="2" fill="rgba(0,0,0,0.15)" />
    </g>

    {/* Working Girl Illustration */}
    <g transform="translate(260, 160)">
      {/* Shadow */}
      <ellipse cx="60" cy="150" rx="80" ry="12" fill="rgba(0,0,0,0.08)" />

      {/* Chair */}
      <path d="M30 145 H60 L55 90 H35 Z" fill="#374151" />
      <rect x="40" y="145" width="5" height="15" fill="#1f2937" />
      <rect x="50" y="145" width="5" height="15" fill="#1f2937" />

      {/* Body & Clothes */}
      <rect x="30" y="90" width="40" height="60" rx="10" fill="#a3e635" /> {/* Green Jacket */}
      <path d="M40 70 L60 70 L55 90 H45 Z" fill="#1f2937" /> {/* Shirt */}

      {/* Head & Hair */}
      <circle cx="50" cy="55" r="14" fill="#fcd34d" /> {/* Face */}
      <path d="M36 50 C36 30, 64 30, 64 50 C64 54, 66 65, 62 70 C58 75, 42 75, 38 70 C34 65, 36 54, 36 50 Z" fill="#111111" /> {/* Hair */}
      
      {/* Desk and Laptop */}
      <rect x="-30" y="140" width="140" height="10" rx="4" fill="#f3f4f6" stroke="var(--border-color)" strokeWidth="1" /> {/* Table */}
      <path d="M0 140 L20 120 H40 L20 140 Z" fill="#374151" /> {/* Laptop base */}
      <rect x="22" y="100" width="30" height="20" rx="2" fill="#111111" /> {/* Laptop screen */}
      <rect x="25" y="103" width="24" height="14" fill="#a3e635" opacity="0.9" /> {/* Screen light */}
      <path d="M-10 140 L-15 160" stroke="#9ca3af" strokeWidth="3" /> {/* Table legs */}
      <path d="M90 140 L95 160" stroke="#9ca3af" strokeWidth="3" />
    </g>
  </svg>
);

// Purpose:
// Renders the home screen page containing a hero search bar and list of featured jobs.
//
// Input:
// - onPageChange (function): Navigates to a different page route.
// - onApply (function): Triggers the job application popup.
// - setGlobalSearch (function): Stores search terms globally in App.jsx.
// - setGlobalLocation (function): Stores location query globally in App.jsx.
//
// Output:
// Renders the Hero layout and featured jobs grid.
const Home = ({ onPageChange, onApply, setGlobalSearch, setGlobalLocation }) => {
  // Local state to store fetched jobs and loading/input states
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [locationVal, setLocationVal] = useState('');

  // Fetch featured jobs on initial component load
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        // Fetch 4 jobs to match the home grid design
        const res = await api.getJobs({ limit: 4 });
        setFeaturedJobs(res.jobs || []);
      } catch (err) {
        console.error('Error fetching featured jobs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  // Purpose:
  // Handles form submission for the main hero search box.
  //
  // Input:
  // e (Event) - Submit event.
  //
  // Output:
  // Saves queries globally and navigates to the list of all jobs with filters active.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setGlobalSearch(searchVal);
    setGlobalLocation(locationVal);
    onPageChange('jobs', { keepFilters: true });
  };

  // Purpose:
  // Handles clicks on popular tags (like "Developer" or "Designer").
  //
  // Input:
  // term (string) - The keyword tag clicked.
  //
  // Output:
  // Updates search term and redirects to Jobs page.
  const handlePopularSearch = (term) => {
    setGlobalSearch(term);
    setGlobalLocation('');
    onPageChange('jobs', { keepFilters: true });
  };

  return (
    <div className="home-page-container">
      {/* Redesigned Hero Section */}
      <section className="hero-section-overhaul">
        <div className="container hero-grid-wrapper">
          {/* Left Hero Text / Search */}
          <div className="hero-left-column">
            <h1 className="hero-main-title">
              Find Your <br />
              <span className="accent-glow-text">Dream Job</span>
            </h1>
            <p className="hero-description-text">
              Explore thousands of job opportunities from top companies and make your career move today.
            </p>

            {/* Split Search Box */}
            <form onSubmit={handleSearchSubmit} className="split-search-container">
              <div className="search-input-unit">
                <Search size={18} className="search-icon-muted" />
                <input 
                  type="text" 
                  placeholder="Job title, keyword or company" 
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="search-inner-input"
                />
              </div>
              
              <div className="search-input-divider"></div>
              
              <div className="search-input-unit">
                <MapPin size={18} className="search-icon-muted" />
                <input 
                  type="text" 
                  placeholder="Location" 
                  value={locationVal}
                  onChange={(e) => setLocationVal(e.target.value)}
                  className="search-inner-input"
                />
              </div>
              
              <button type="submit" className="hero-search-action-btn">
                Search Jobs
              </button>
            </form>

            {/* Popular Searches */}
            <div className="popular-searches-row">
              <span className="popular-searches-label">Popular Searches:</span>
              <div className="popular-searches-pills">
                {['Developer', 'Designer', 'Marketing', 'Data Analyst'].map((term) => (
                  <button 
                    key={term}
                    type="button" 
                    className="popular-search-pill"
                    onClick={() => handlePopularSearch(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Hero Illustration */}
          <div className="hero-right-column">
            <HeroIllustration />
          </div>
        </div>

        {/* Trusted By Banner */}
        <div className="container hero-trusted-by">
          <span className="trusted-by-label">Trusted by industry leaders</span>
          <div className="trusted-logos-wrap">
            <svg className="trusted-logo-svg" viewBox="0 0 24 24" width="85" height="24">
              <title>Google</title>
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.21 0-5.831-2.614-5.831-5.829s2.621-5.83 5.83-5.83c1.397 0 2.673.48 3.69 1.278l3.057-3.057C18.847 3.2 15.776 2 12.24 2 6.58 2 2 6.582 2 12.24s4.58 10.24 10.24 10.24c5.795 0 10.24-4.113 10.24-10.24 0-.648-.079-1.278-.225-1.955H12.24z" fill="currentColor"/>
            </svg>
            <svg className="trusted-logo-svg" viewBox="0 0 23 23" width="85" height="20">
              <title>Microsoft</title>
              <rect x="0" y="0" width="10.5" height="10.5" fill="currentColor"/>
              <rect x="12.5" y="0" width="10.5" height="10.5" fill="currentColor"/>
              <rect x="0" y="12.5" width="10.5" height="10.5" fill="currentColor"/>
              <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="currentColor"/>
            </svg>
            <svg className="trusted-logo-svg" viewBox="0 0 24 24" width="85" height="22">
              <title>Meta</title>
              <path d="M16.5 6c-1.2 0-2.3.5-3.2 1.3-.9-.8-2-1.3-3.2-1.3C7.4 6 5 8.4 5 11.5S7.4 17 10.1 17c1.2 0 2.3-.5 3.2-1.3.9.8 2 1.3 3.2 1.3 2.7 0 5.1-2.4 5.1-5.5S19.2 6 16.5 6zm-6.4 9c-1.6 0-3.1-1.6-3.1-3.5S8.5 8 10.1 8c1.1 0 2 .7 2.6 1.7-.8 1.1-.8 2.5 0 3.6-.6 1-1.5 1.7-2.6 1.7zm6.4 0c-1.1 0-2-.7-2.6-1.7.8-1.1.8-2.5 0-3.6.6-1 1.5-1.7 2.6-1.7 1.6 0 3.1 1.6 3.1 3.5s-1.5 3.5-3.1 3.5z" fill="currentColor"/>
            </svg>
            <svg className="trusted-logo-svg" viewBox="0 0 24 24" width="85" height="24">
              <title>Netflix</title>
              <path d="M4 2h3.5v20H4zm12.5 0H20v20h-3.5zM7.5 2h3.5l5.5 20h-3.5z" fill="currentColor"/>
            </svg>
            <svg className="trusted-logo-svg" viewBox="0 0 24 24" width="85" height="24">
              <title>Spotify</title>
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.076-.67-.135-.746-.47-.077-.337.135-.67.472-.747 3.847-.878 7.14-.5 9.82 1.14.296.18.387.563.208.86zm1.223-2.72c-.226.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.075-1.185-.413.125-.845-.106-.97-.52-.125-.413.107-.847.52-.972 3.667-1.112 8.243-.574 11.34 1.33.366.226.486.706.26 1.073zm.106-2.833C14.368 8.61 8.5 8.414 5.12 9.44c-.53.16-1.09-.142-1.25-.672-.16-.53.14-1.09.67-1.25 3.886-1.18 10.37-.954 14.39 1.432.477.283.633.9.35 1.378-.282.478-.9.633-1.377.35z" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="featured-jobs-section-home">
        <div className="container">
          <div className="section-header-row">
            <h2 className="section-main-heading">Featured Jobs</h2>
            <button 
              className="view-all-jobs-link"
              onClick={() => onPageChange('jobs')}
            >
              <span>View all jobs</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="featured-jobs-grid">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <SkeletonCard key={idx} />
              ))
            ) : featuredJobs.length === 0 ? (
              <div className="empty-state-container" style={{ gridColumn: '1 / -1' }}>
                <h3 className="empty-state-title">No jobs seeded yet</h3>
                <p className="empty-state-desc">Please run the database seeder to populate realistic jobs.</p>
              </div>
            ) : (
              featuredJobs.map((job) => (
                <JobCard 
                  key={job._id} 
                  job={job} 
                  onViewDetails={(id) => {
                    onPageChange('job-details', { id });
                  }} 
                  onApply={onApply}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
