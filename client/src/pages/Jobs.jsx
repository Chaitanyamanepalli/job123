import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import JobCard from '../components/JobCard';
import SkeletonCard from '../components/SkeletonCard';
import { Search, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';

const Jobs = ({ globalSearch, setGlobalSearch, globalLocation, setGlobalLocation, onPageChange, onApply }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Top Search states
  const [searchTerm, setSearchTerm] = useState(globalSearch || '');
  const [locationTerm, setLocationTerm] = useState(globalLocation || '');

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

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Build query params
      const typeQuery = selectedTypes.length === 0 ? 'All' : selectedTypes.join(',');
      const expQuery = selectedExps.length === 0 ? 'All' : selectedExps.join(',');

      const res = await api.getJobs({
        search: searchTerm,
        location: locationTerm,
        jobType: typeQuery,
        experience: expQuery,
        sort: sortBy,
        page: currentPage,
        limit: 5 // 5 jobs per page
      });

      setJobs(res.jobs || []);
      setTotalPages(res.totalPages || 1);
      setTotalJobs(res.totalJobs || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationTerm, selectedTypes, selectedExps, sortBy, currentPage]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setGlobalSearch(searchTerm);
    setGlobalLocation(locationTerm);
    setCurrentPage(1);
  };

  const handleTypeCheck = (type) => {
    setCurrentPage(1);
    if (type === 'All') {
      setSelectedTypes([]);
      return;
    }

    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleExpCheck = (exp) => {
    setCurrentPage(1);
    if (exp === 'All') {
      setSelectedExps([]);
      return;
    }

    setSelectedExps(prev => {
      if (prev.includes(exp)) {
        return prev.filter(e => e !== exp);
      } else {
        return [...prev, exp];
      }
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setLocationTerm('');
    setGlobalSearch('');
    setGlobalLocation('');
    setSelectedTypes([]);
    setSelectedExps([]);
    setSortBy('Latest');
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

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
