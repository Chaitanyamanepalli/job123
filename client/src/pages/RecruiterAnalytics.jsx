// ====================================================
// Recruiter Analytics Page Component
//
// This page provides candidate insights, hiring status cards, and charts.
//
// Features:
// - Fetches aggregated statistics from backend.
// - Renders total jobs, active jobs, closed jobs, total applications, and stage counters.
// - Renders Applications Per Job Bar Chart.
// - Renders Hiring Funnel Chart.
// - Displays details of the top-performing job listing.
//
// Used by:
// - App.jsx (loaded under '/recruiter/analytics' path)
// ====================================================

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Briefcase, 
  Users, 
  CheckCircle, 
  XCircle, 
  Award, 
  TrendingUp, 
  ArrowLeft,
  PieChart as ChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  FunnelChart, 
  Funnel, 
  Cell
} from 'recharts';

const RecruiterAnalytics = ({ onPageChange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getRecruiterAnalytics();
      if (res.success) {
        setData(res.data);
      } else {
        throw new Error(res.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err.message || 'Failed to load recruitment insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) return <LoadingSpinner />;

  if (error || !data) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem' }}>
        <div className="empty-state-container" style={{ borderColor: 'var(--error)' }}>
          <h3 className="empty-state-title">Analytics Loading Failed</h3>
          <p className="empty-state-desc">{error || 'Unable to retrieve statistics.'}</p>
          <button className="btn btn-secondary" onClick={() => onPageChange('/recruiter/dashboard')}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { cards, topPerformingJob, charts } = data;

  // Curated color palette matching styling tokens
  const funnelColors = ['#6366F1', '#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem', position: 'relative' }}>
      {/* Ambient background glow orbs */}
      <div className="glow-orb-container">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
      </div>
      
      {/* Header Row */}
      <div className="dashboard-header-row" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChartIcon size={28} style={{ color: 'var(--accent)' }} />
            <span>Recruitment Analytics Insights</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Aggregated evaluation metrics and visual hiring funnel tracking.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => onPageChange('/recruiter/dashboard')}>
          Back to Dashboard
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="dashboard-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Total Jobs */}
        <div className="recruiter-stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Jobs</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0 0' }}>{cards.totalJobs}</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {cards.activeJobs} Active &bull; {cards.closedJobs} Closed
            </div>
          </div>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={22} />
          </div>
        </div>

        {/* Total Applicants */}
        <div className="recruiter-stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Applicants</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0 0' }}>{cards.totalApplicants}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>Across all postings</span>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
        </div>

        {/* Shortlisted */}
        <div className="recruiter-stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Shortlisted Candidates</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0 0' }}>{cards.shortlisted}</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>In review pipeline</span>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Hired */}
        <div className="recruiter-stat-card" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Offers Accepted</span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0 0', color: 'var(--success)' }}>{cards.hired}</h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Rejected: {cards.rejected}
            </div>
          </div>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={22} />
          </div>
        </div>

      </div>

      {/* Top Performing Job & Funnel overview row */}
      {topPerformingJob && (
        <div style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Top Performing Listing
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0', color: 'var(--text-primary)' }}>
              {topPerformingJob.title}
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
              Highest talent acquisition interest with a total of <strong>{topPerformingJob.applications} candidates</strong>.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)' }}>{topPerformingJob.applications}</span>
              <span style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-secondary)', fontWeight: 500 }}>Applications</span>
            </div>
            <Award size={36} style={{ color: 'var(--accent)' }} />
          </div>
        </div>
      )}

      {/* Charts Visualization Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
        
        {/* Applications Per Job Bar Chart */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '2rem 1.5rem', boxShadow: 'var(--card-shadow)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Applications Per Job listing</h3>
          
          {charts.appsPerJob.length === 0 ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No job postings available to plot.
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.appsPerJob} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <Bar dataKey="applications" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Hiring Funnel Stage Funnel Chart */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '2rem 1.5rem', boxShadow: 'var(--card-shadow)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>Hiring Conversion Funnel</h3>

          {cards.totalApplicants === 0 ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No application entries to analyze funnel stages.
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <Funnel
                    dataKey="value"
                    data={charts.hiringFunnel}
                    isAnimationActive
                  >
                    {charts.hiringFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={funnelColors[index % funnelColors.length]} />
                    ))}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default RecruiterAnalytics;
