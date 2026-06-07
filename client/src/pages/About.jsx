import React from 'react';
import { Briefcase, Users, Award, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

const About = ({ onPageChange }) => {
  return (
    <div className="about-page-container">
      {/* 1. Intro Hero Section */}
      <section className="about-hero-section">
        <div className="container about-hero-content">
          <span className="about-subtitle-glow">About JobPortal Pro</span>
          <h1 className="about-main-title">
            The Future of <br />
            <span className="accent-glow-text">Recruitment, Simplified.</span>
          </h1>
          <p className="about-description-text">
            We are dedicated to building a seamless, direct connection between top-tier industry candidates and global companies looking to build their dream teams.
          </p>
        </div>
      </section>

      {/* 2. Core Pillars / Values Section */}
      <section className="about-pillars-section">
        <div className="container">
          <div className="about-section-header">
            <h2 className="about-section-heading">Our Core Pillars</h2>
            <p className="about-section-subheading">What drives our design and platform philosophy daily.</p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon-wrap">
                <Briefcase size={24} />
              </div>
              <h3 className="pillar-title">Direct Connections</h3>
              <p className="pillar-desc">
                No middleman recruitment agencies. Candidates talk directly to company hiring managers, leading to transparent, fast hiring.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-wrap">
                <ShieldCheck size={24} />
              </div>
              <h3 className="pillar-title">Trust & Verification</h3>
              <p className="pillar-desc">
                Every job post and recruiter account is checked and verified to protect candidates from spam and fraudulent job offers.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-wrap">
                <Award size={24} />
              </div>
              <h3 className="pillar-title">Premium Experience</h3>
              <p className="pillar-desc">
                Clean bento-style cards, dark and light mode adaptation, and responsive dashboards engineered with performance in mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Workflow Section */}
      <section className="about-workflow-section">
        <div className="container">
          <div className="about-section-header">
            <h2 className="about-section-heading">How It Works</h2>
            <p className="about-section-subheading">Custom workflows tailored for candidates and recruiters.</p>
          </div>

          <div className="workflow-split-grid">
            {/* Candidate Workflow */}
            <div className="workflow-column candidate-flow">
              <div className="workflow-header">
                <Users size={20} className="flow-icon" />
                <h3>For Candidates</h3>
              </div>
              <div className="workflow-steps-list">
                <div className="workflow-step-item">
                  <span className="step-num">01</span>
                  <div className="step-details">
                    <h4>Create Your Account</h4>
                    <p>Register as a candidate and set up your personal industry profile.</p>
                  </div>
                </div>
                <div className="workflow-step-item">
                  <span className="step-num">02</span>
                  <div className="step-details">
                    <h4>Browse Open Roles</h4>
                    <p>Search real-time listings by keywords, types, experience, or salary.</p>
                  </div>
                </div>
                <div className="workflow-step-item">
                  <span className="step-num">03</span>
                  <div className="step-details">
                    <h4>Apply Instantly</h4>
                    <p>Submit your details in a simplified apply form and track application status live.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recruiter Workflow */}
            <div className="workflow-column recruiter-flow">
              <div className="workflow-header">
                <Briefcase size={20} className="flow-icon" />
                <h3>For Recruiters</h3>
              </div>
              <div className="workflow-steps-list">
                <div className="workflow-step-item">
                  <span className="step-num">01</span>
                  <div className="step-details">
                    <h4>Post Job Listings</h4>
                    <p>Define requirements, compensation, location settings, and publish roles immediately.</p>
                  </div>
                </div>
                <div className="workflow-step-item">
                  <span className="step-num">02</span>
                  <div className="step-details">
                    <h4>Review Candidate Pool</h4>
                    <p>Access applicant lists in a consolidated, clean recruitment dashboard.</p>
                  </div>
                </div>
                <div className="workflow-step-item">
                  <span className="step-num">03</span>
                  <div className="step-details">
                    <h4>Manage Status Safely</h4>
                    <p>Mark candidates as Under Review, Shortlisted, or Rejected to direct feedback cycles.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dynamic CTA Block */}
      <section className="about-cta-section">
        <div className="container about-cta-inner">
          <h2>Ready to Find Your Next Career Step?</h2>
          <p>Join thousands of candidates and recruiters already using JobPortal Pro.</p>
          <div className="about-cta-buttons">
            <button 
              className="about-primary-cta" 
              onClick={() => onPageChange('jobs')}
            >
              Browse Jobs
              <ArrowRight size={18} />
            </button>
            <button 
              className="about-secondary-cta" 
              onClick={() => onPageChange('signup')}
            >
              Register Now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
