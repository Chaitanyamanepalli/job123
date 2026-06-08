// ====================================================
// Jobs Search Explorer Page Component
//
// This page provides candidate search and filtering controls.
// Users can query jobs by title keyword, location, job type checkboxes,
// experience level checkboxes, and sort orders.
//
// Features:
// - Syncs search parameters with home page quick actions.
// - Supports server-side paginated queries (5 items per page).
// - Interactive checkbox sidebar updates search results reactively.
//
// Used by:
// - App.jsx (when navigation path targets '/jobs')
// ====================================================

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import JobCard from '../components/JobCard';
import SkeletonCard from '../components/SkeletonCard';
import { Search, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

// Purpose:
// Displays lists of job advertisements with sidebar filters.
//
// Input:
// - globalSearch, setGlobalSearch (string/function): The keyword query shared globally.
// - globalLocation, setGlobalLocation (string/function): The location query shared globally.
// - onPageChange (function): Navigates to a specific screen (e.g. Job details view).
// - onApply (function): Starts the CV submit modal overlay.
//
// Output:
// Renders the list of matching job listings.
const Jobs = ({ globalSearch, setGlobalSearch, globalLocation, setGlobalLocation, onPageChange, onApply }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Top Search states
  const [searchTerm, setSearchTerm] = useState(globalSearch || '');
  const [locationTerm, setLocationTerm] = useState(globalLocation || '');

  // Advanced Sidebar Filter states
  const [companyFilter, setCompanyFilter] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');

  // Checklist Filter arrays
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedExps, setSelectedExps] = useState([]);

  // Sorting
  const [sortBy, setSortBy] = useState('Latest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Sync with globalSearch (e.g. redirect from Hero popular tags)
  useEffect(() => {
    setSearchTerm(globalSearch || '');
    setCurrentPage(1);
  }, [globalSearch]);

  // Sync with globalLocation
  useEffect(() => {
    setLocationTerm(globalLocation || '');
    setCurrentPage(1);
  }, [globalLocation]);

  // Purpose:
  // Fetches matching jobs from the backend based on current filter state.
  //
  // Input:
  // None (reads state parameters: searchTerm, locationTerm, selectedTypes, selectedExps, sortBy, currentPage).
  //
  // Output:
  // Stores returned job list, total jobs count, and total page count in state.
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Build parameters string for types and experience levels. If none selected, default to 'All'.
      const typeQuery = selectedTypes.length === 0 ? 'All' : selectedTypes.join(',');
      const expQuery = selectedExps.length === 0 ? 'All' : selectedExps.join(',');

      // Send the query to the server
      const res = await api.getJobs({
        search: searchTerm,
        location: locationTerm,
        jobType: typeQuery,
        experience: expQuery,
        sort: sortBy,
        page: currentPage,
        limit: 5, // 5 jobs per page
        minSalary,
        maxSalary,
        company: companyFilter
      });

      setJobs(res.jobs || []);
      setTotalPages(res.totalPages || 1);
      setTotalJobs(res.totalJobs || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationTerm, selectedTypes, selectedExps, sortBy, currentPage, minSalary, maxSalary, companyFilter]);

  // Fetch jobs whenever search terms or filter parameters change
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Purpose:
  // Triggers search when pressing Enter or clicking the Search button.
  //
  // Input:
  // e (Event) - Submit event.
  //
  // Output:
  // Updates global queries and resets search results back to Page 1.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setGlobalSearch(searchTerm);
    setGlobalLocation(locationTerm);
    setCurrentPage(1);
  };

  // Purpose:
  // Selects or deselects job type filters (e.g. Full Time, Part Time).
  //
  // Input:
  // type (string) - The checkbox name selected.
  //
  // Output:
  // Toggles item in selectedTypes array and resets pagination to page 1.
  const handleTypeCheck = (type) => {
    setCurrentPage(1);
    if (type === 'All') {
      setSelectedTypes([]); // Reset all filters
      return;
    }

    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type); // Uncheck it
      } else {
        return [...prev, type]; // Check it
      }
    });
  };

  // Purpose:
  // Selects or deselects experience level filters (e.g. Fresher, 1-3 Years).
  //
  // Input:
  // exp (string) - The experience name selected.
  //
  // Output:
  // Toggles item in selectedExps array and resets pagination to page 1.
  const handleExpCheck = (exp) => {
    setCurrentPage(1);
    if (exp === 'All') {
      setSelectedExps([]); // Reset all filters
      return;
    }

    setSelectedExps(prev => {
      if (prev.includes(exp)) {
        return prev.filter(e => e !== exp); // Uncheck it
      } else {
        return [...prev, exp]; // Check it
      }
    });
  };

  // Purpose:
  // Clears all active filters and input fields.
  //
  // Input:
  // None.
  //
  // Output:
  // Resets state variables to original empty lists and navigates back to Page 1.
  const handleResetFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setGlobalSearch('');
    setGlobalLocation('');
    setSelectedTypes([]);
    setSelectedExps([]);
    setCompanyFilter('');
    setMinSalary('');
    setMaxSalary('');
    setSortBy('Latest');
    setCurrentPage(1);
  };

  // Purpose:
  // Updates the sort ordering configuration.
  //
  // Input:
  // e (Event) - Select change event.
  //
  // Output:
  // Updates sortBy state and resets to Page 1.
  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  // Purpose:
  // Navigates to a different page number in the paginated job listing.
  //
  // Input:
  // pageNum (number) - The page number target.
  //
  // Output:
  // Updates current page index and scrolls page back to top.
  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      window.scrollTo(0, 0);
    }
  };

  const jobTypes = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Remote'];
  const expLevels = ['Fresher', '1-3 Years', '3-5 Years', '5+ Years'];

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Search Header Row */}
      <form onSubmit={handleSearchSubmit} className="jobs-header-search-form">
        <div className="search-box-input-group">
          <div className="search-field-icon-wrap">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search jobs, company or keywords" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-box-field-input"
            />
          </div>
          
          <div className="search-field-separator"></div>
          
          <div className="search-field-icon-wrap">
            <MapPin size={18} />
            <input 
              type="text" 
              placeholder="All Locations" 
              value={locationTerm}
              onChange={(e) => setLocationTerm(e.target.value)}
              className="search-box-field-input"
            />
          </div>
          
          <button type="submit" className="search-box-submit-btn">
            Search
          </button>
        </div>

        <div className="jobs-sort-dropdown-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="sort-label-text">Sort by:</span>
          <CustomSelect
            value={sortBy}
            onChange={handleSortChange}
            options={[
              { value: 'Latest', label: 'Latest' },
              { value: 'Oldest', label: 'Oldest' },
              { value: 'Alphabetical', label: 'Alphabetical (A-Z)' },
              { value: 'Salary High To Low', label: 'Salary: High to Low' },
              { value: 'Salary Low To High', label: 'Salary: Low to High' }
            ]}
          />
        </div>
      </form>

      {/* Main Grid Layout */}
      <div className="jobs-page-grid-layout" style={{ marginTop: '2rem' }}>
        
        {/* Left Column Sidebar Filters */}
        <aside className="jobs-filter-sidebar">
          <div className="filter-title-header">Filter by</div>

          {/* Company Search Input */}
          <div className="filter-block-section">
            <div className="filter-block-title">Company Name</div>
            <input
              type="text"
              placeholder="Search Company..."
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                fontSize: '0.85rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                outline: 'none',
                marginTop: '0.5rem'
              }}
            />
          </div>

          {/* Salary Range Inputs */}
          <div className="filter-block-section">
            <div className="filter-block-title">Salary Range (Annual INR)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>₹</span>
                <input
                  type="number"
                  placeholder="Min Salary"
                  value={minSalary}
                  onChange={(e) => {
                    setMinSalary(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem 0.6rem 1.75rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>₹</span>
                <input
                  type="number"
                  placeholder="Max Salary"
                  value={maxSalary}
                  onChange={(e) => {
                    setMaxSalary(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem 0.6rem 1.75rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>
              {minSalary && maxSalary && Number(minSalary) >= Number(maxSalary) && (
                <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>
                  Max salary must exceed min salary
                </span>
              )}
            </div>
          </div>
          
          {/* Job Type checklist */}
          <div className="filter-block-section">
            <div className="filter-block-title">Job Type</div>
            <div className="filter-checklist-wrapper">
              <label className="filter-checkbox-label">
                <input 
                  type="checkbox"
                  checked={selectedTypes.length === 0}
                  onChange={() => handleTypeCheck('All')}
                />
                <span className="checkmark-text">All Types</span>
              </label>
              
              {jobTypes.map((type) => (
                <label key={type} className="filter-checkbox-label">
                  <input 
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeCheck(type)}
                  />
                  <span className="checkmark-text">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Experience Level checklist */}
          <div className="filter-block-section">
            <div className="filter-block-title">Experience Level</div>
            <div className="filter-checklist-wrapper">
              <label className="filter-checkbox-label">
                <input 
                  type="checkbox"
                  checked={selectedExps.length === 0}
                  onChange={() => handleExpCheck('All')}
                />
                <span className="checkmark-text">All Levels</span>
              </label>

              {expLevels.map((exp) => (
                <label key={exp} className="filter-checkbox-label">
                  <input 
                    type="checkbox"
                    checked={selectedExps.includes(exp)}
                    onChange={() => handleExpCheck(exp)}
                  />
                  <span className="checkmark-text">{exp}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Reset Filters button */}
          <button 
            type="button" 
            onClick={handleResetFilters}
            className="filter-reset-action-btn"
          >
            Reset Filters
          </button>
        </aside>

        {/* Right Column Jobs List */}
        <main className="jobs-list-main-col">
          <div className="jobs-result-header-row">
            <span className="jobs-count-found">
              {loading ? 'Searching jobs...' : `${totalJobs} Jobs found`}
            </span>
          </div>

          {error && (
            <div className="empty-state-container" style={{ borderColor: 'var(--error)' }}>
              <AlertTriangle size={48} className="empty-state-icon" style={{ color: 'var(--error)' }} />
              <h3 className="empty-state-title">An Error Occurred</h3>
              <p className="empty-state-desc">{error}</p>
              <button className="btn btn-secondary" onClick={fetchJobs}>
                <RefreshCw size={16} /> Try Again
              </button>
            </div>
          )}

          {!error && (
            <div className="jobs-list-col-container">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <SkeletonCard key={idx} />
                ))
              ) : jobs.length === 0 ? (
                <div className="empty-state-container">
                  <Search size={48} className="empty-state-icon" />
                  <h3 className="empty-state-title">No Results Found</h3>
                  <p className="empty-state-desc">
                    Try adjusting your keywords, expanding location, or resetting filters.
                  </p>
                  <button className="btn btn-primary" onClick={handleResetFilters}>
                    Reset All Filters
                  </button>
                </div>
              ) : (
                jobs.map((job) => (
                  <JobCard 
                    key={job._id} 
                    job={job} 
                    onViewDetails={(id) => onPageChange('job-details', { id })}
                    onApply={onApply}
                  />
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="pagination-container-overhaul">
              <button 
                className="page-nav-icon-btn" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &lt;
              </button>
              
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNumber = idx + 1;
                return (
                  <button
                    key={pageNumber}
                    className={`page-nav-num-btn ${currentPage === pageNumber ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button 
                className="page-nav-icon-btn" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                &gt;
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Jobs;
