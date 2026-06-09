import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { User, Mail, Shield, Briefcase, FileText, CheckCircle2, ChevronRight, AlertCircle, Plus, X, Upload, MapPin, Sparkles } from 'lucide-react';
import Modal from '../components/Modal';

const Profile = ({ user: initialUser, setUser: setParentUser, onPageChange }) => {
  const [user, setUser] = useState(initialUser);
  const [stats, setStats] = useState({
    totalApplicationsSubmitted: 0,
    totalJobsPosted: 0,
    totalApplicationsReceived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user.fullName || '',
    location: user.location || '',
    experience: user.experience || '',
    education: user.education || '',
    skills: user.skills ? user.skills.join(', ') : '',
  });

  // Resume state
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Profile strength calculation
  const calculateStrength = (u) => {
    let score = 0;
    if (u.fullName) score += 15;
    if (u.email) score += 15;
    if (u.skills && u.skills.length > 0) score += 20;
    if (u.experience) score += 20;
    if (u.location) score += 10;
    if (u.education) score += 10;
    if (u.resumeUrl) score += 10;
    return score;
  };

  const strength = calculateStrength(user);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Refresh user details from backend
        const meRes = await api.getMe();
        setUser(meRes.user);
        
        // Update editForm state
        setEditForm({
          fullName: meRes.user.fullName || '',
          location: meRes.user.location || '',
          experience: meRes.user.experience || '',
          education: meRes.user.education || '',
          skills: meRes.user.skills ? meRes.user.skills.join(', ') : '',
        });

        if (meRes.user.role === 'candidate') {
          const appRes = await api.getUserApplications();
          setStats(prev => ({
            ...prev,
            totalApplicationsSubmitted: appRes.count || 0,
          }));
        } else if (meRes.user.role === 'recruiter') {
          const jobsRes = await api.getJobs({ myJobs: true, limit: 100 });
          const recruiterJobs = jobsRes.jobs || [];
          
          const counts = await Promise.all(
            recruiterJobs.map(async (job) => {
              try {
                const jobAppRes = await api.getApplicationsByJob(job._id);
                return jobAppRes.count || 0;
              } catch (e) {
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
        setError(err.message || 'Failed to retrieve profile data.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [initialUser]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccessMsg('');
      
      const payload = {
        fullName: editForm.fullName,
        location: editForm.location,
        experience: editForm.experience,
        education: editForm.education,
        skills: editForm.skills,
      };

      const res = await api.updateProfile(payload);
      setUser(res.data);
      if (setParentUser) setParentUser(res.data);
      // Synchronize localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
      if (storedUser) {
        const updated = { ...storedUser, ...res.data };
        if (localStorage.getItem('user')) localStorage.setItem('user', JSON.stringify(updated));
        if (sessionStorage.getItem('user')) sessionStorage.setItem('user', JSON.stringify(updated));
      }

      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  // Preview modal action handlers
  const handleConfirmSaveProfile = async () => {
    try {
      setError('');
      setSuccessMsg('');
      
      const payload = {
        fullName: parsedPreview.name || user.fullName,
        location: editForm.location || user.location,
        experience: parsedPreview.experience || 'Fresher',
        education: parsedPreview.education || 'Not specified',
        skills: parsedPreview.skills ? parsedPreview.skills.join(', ') : '',
      };

      const res = await api.updateProfile(payload);
      setUser(res.data);
      if (setParentUser) setParentUser(res.data);
      
      // Synchronize localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
      if (storedUser) {
        const updated = { ...storedUser, ...res.data };
        localStorage.setItem('user', JSON.stringify(updated));
        sessionStorage.setItem('user', JSON.stringify(updated));
      }

      setEditForm({
        fullName: res.data.fullName || '',
        location: res.data.location || '',
        experience: res.data.experience || '',
        education: res.data.education || '',
        skills: res.data.skills ? res.data.skills.join(', ') : '',
      });

      setSuccessMsg('Profile updated and saved successfully with resume details!');
      setIsPreviewModalOpen(false);
      setParsedPreview(null);
    } catch (err) {
      setError(err.message || 'Failed to save profile details.');
    }
  };

  const handleEditBeforeSaving = () => {
    setEditForm({
      fullName: parsedPreview.name || editForm.fullName || user.fullName,
      location: editForm.location || user.location,
      experience: parsedPreview.experience || editForm.experience || user.experience || 'Fresher',
      education: parsedPreview.education || editForm.education || user.education || 'Not specified',
      skills: parsedPreview.skills && parsedPreview.skills.length > 0
        ? parsedPreview.skills.join(', ')
        : editForm.skills || (user.skills ? user.skills.join(', ') : ''),
    });

    setIsEditing(true);
    setIsPreviewModalOpen(false);
    setParsedPreview(null);
  };

  // Multer PDF Resume Upload & Parsing
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF resume files are allowed.');
      return;
    }

    try {
      setError('');
      setSuccessMsg('');
      setUploadingResume(true);

      const formData = new FormData();
      formData.append('resume', file);

      const res = await api.uploadResume(formData);
      
      const updatedUser = res.data?.user || res.user;
      const parsedData = res.parsedData || res.data?.parsedData;

      if (updatedUser) {
        setUser(updatedUser);
        if (setParentUser) setParentUser(updatedUser);
        
        // Sync localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user'));
        if (storedUser) {
          const updated = { ...storedUser, ...updatedUser };
          localStorage.setItem('user', JSON.stringify(updated));
          sessionStorage.setItem('user', JSON.stringify(updated));
        }
      }

      if (parsedData && (parsedData.skills?.length > 0 || parsedData.name || parsedData.education !== 'Not specified' || parsedData.experience !== 'Fresher')) {
        setParsedPreview(parsedData);
        setIsPreviewModalOpen(true);
        setSuccessMsg('Resume parsed successfully. Please review the extracted details.');
      } else {
        setError('Unable to extract information from this resume. Please fill profile details manually.');
      }
    } catch (err) {
      setError(err.message || 'Failed to parse and upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="profile-container-layout" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Profile Card Header */}
        <div className="profile-header-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--card-shadow)' }}>
          <div className="profile-avatar-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className="profile-avatar-large" style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#111111', fontWeight: 800, fontSize: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="profile-title-details">
              <h1 className="profile-name" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{user.fullName}</h1>
              <div className="profile-role-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'var(--bg-primary)', padding: '0.35rem 0.75rem', borderRadius: '100px', width: 'fit-content', marginTop: '0.35rem', fontSize: '0.8rem', fontWeight: 600 }}>
                <Shield size={14} />
                <span style={{ textTransform: 'capitalize' }}>{user.role}</span>
              </div>
            </div>
          </div>

          {user.role === 'candidate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                <span>Profile Strength</span>
                <span style={{ color: 'var(--success)' }}>{strength}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${strength}%`, height: '100%', backgroundColor: 'var(--success)', borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: 'var(--error)', padding: '0.75rem 1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ color: 'var(--success)', padding: '0.75rem 1rem', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Details and Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }} className="jobs-page-grid-layout">
          
          {/* Left Panel: Profile fields */}
          <div className="profile-info-card" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '2rem', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 className="profile-section-title" style={{ fontSize: '1.2rem', fontWeight: 800 }}>Profile Details</h3>
              {user.role === 'candidate' && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setIsEditing(!isEditing)}
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    value={editForm.fullName} 
                    onChange={handleEditChange} 
                    className="form-input" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input 
                    type="text" 
                    name="location" 
                    value={editForm.location} 
                    onChange={handleEditChange} 
                    className="form-input" 
                    placeholder="e.g. Hyderabad, India" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Experience</label>
                  <input 
                    type="text" 
                    name="experience" 
                    value={editForm.experience} 
                    onChange={handleEditChange} 
                    className="form-input" 
                    placeholder="e.g. 3 Years, Fresher" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Education</label>
                  <input 
                    type="text" 
                    name="education" 
                    value={editForm.education} 
                    onChange={handleEditChange} 
                    className="form-input" 
                    placeholder="e.g. B.Tech in CSE" 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Skills (Comma-separated)</label>
                  <input 
                    type="text" 
                    name="skills" 
                    value={editForm.skills} 
                    onChange={handleEditChange} 
                    className="form-input" 
                    placeholder="e.g. React, Node.js, Python, SQL" 
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '0.6rem 1.5rem' }}>
                  Save Changes
                </button>
              </form>
            ) : (
              <div className="profile-details-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="profile-detail-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <User size={20} style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Full Name</span>
                    <span style={{ fontWeight: 700 }}>{user.fullName}</span>
                  </div>
                </div>

                <div className="profile-detail-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Mail size={20} style={{ color: 'var(--text-secondary)' }} />
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Email Address</span>
                    <span style={{ fontWeight: 700 }}>{user.email}</span>
                  </div>
                </div>

                {user.role === 'candidate' && (
                  <>
                    <div className="profile-detail-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <MapPin size={20} style={{ color: 'var(--text-secondary)' }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Location</span>
                        <span style={{ fontWeight: 700 }}>{user.location || 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="profile-detail-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Briefcase size={20} style={{ color: 'var(--text-secondary)' }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Experience</span>
                        <span style={{ fontWeight: 700 }}>{user.experience || 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="profile-detail-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <FileText size={20} style={{ color: 'var(--text-secondary)' }} />
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Education</span>
                        <span style={{ fontWeight: 700 }}>{user.education || 'Not specified'}</span>
                      </div>
                    </div>

                    <div className="profile-detail-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Skills</span>
                      {user.skills && user.skills.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                          {user.skills.map((skill, idx) => (
                            <span 
                              key={idx} 
                              style={{ 
                                backgroundColor: 'var(--bg-primary)', 
                                border: '1px solid var(--border-color)', 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '100px', 
                                fontSize: '0.8rem', 
                                fontWeight: 600 
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No skills listed yet.</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Resume Upload & Account Metrics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Candidate Resume Section */}
            {user.role === 'candidate' && (
              <div className="profile-info-card" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.75rem', boxShadow: 'var(--card-shadow)' }}>
                <h3 className="profile-section-title" style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Resume Upload</h3>
                
                {user.resumeUrl ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                      <FileText size={28} style={{ color: 'var(--accent-hover)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>Resume PDF Document</span>
                        <a 
                          href={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'}${user.resumeUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--accent-hover)', fontWeight: 600 }}
                        >
                          View Resume
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Upload your PDF resume to auto-fill your profile details.
                  </p>
                )}

                <div 
                  style={{ 
                    border: '2px dashed var(--border-color)', 
                    borderRadius: '10px', 
                    padding: '1.5rem', 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'var(--bg-primary)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleResumeUpload}
                    disabled={uploadingResume}
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      width: '100%', 
                      height: '100%', 
                      opacity: 0, 
                      cursor: 'pointer' 
                    }} 
                  />
                  <Upload size={24} style={{ margin: '0 auto 0.5rem auto', color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>
                    {uploadingResume ? 'Parsing PDF resume...' : (user.resumeUrl ? 'Replace Resume' : 'Upload Resume')}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                    Max file size 5MB
                  </span>
                </div>
              </div>
            )}

            {/* Metrics Statistics */}
            <div className="profile-info-card" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.75rem', boxShadow: 'var(--card-shadow)' }}>
              <h3 className="profile-section-title" style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Account Statistics</h3>
              
              <div className="profile-stats-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {user.role === 'candidate' ? (
                  <div 
                    className="profile-stat-box" 
                    onClick={() => onPageChange('/my-applications')} 
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-primary)' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(163,230,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-hover)' }}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, display: 'block', lineHeight: 1.1 }}>{stats.totalApplicationsSubmitted}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Submitted Applications</span>
                    </div>
                    <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div 
                      className="profile-stat-box" 
                      onClick={() => onPageChange('/recruiter/dashboard')} 
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-primary)' }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                        <Briefcase size={20} />
                      </div>
                      <div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, display: 'block', lineHeight: 1.1 }}>{stats.totalJobsPosted}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Job Vacancies</span>
                      </div>
                      <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
                    </div>

                    <div 
                      className="profile-stat-box" 
                      onClick={() => onPageChange('/recruiter/dashboard')} 
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-primary)' }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, display: 'block', lineHeight: 1.1 }}>{stats.totalApplicationsReceived}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Received Applications</span>
                      </div>
                      <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Resume Parse Preview Modal */}
      {parsedPreview && (
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
            setParsedPreview(null);
          }}
          title="Parsed Resume Details Preview"
          footer={
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleEditBeforeSaving}
              >
                Edit Before Saving
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmSaveProfile}
              >
                Save Profile
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Resume parsed successfully. Please review the extracted details below.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', backgroundColor: 'var(--bg-primary)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Candidate Name</span>
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{parsedPreview.name || 'Not detected'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Education</span>
                <span style={{ fontWeight: 700 }}>{parsedPreview.education || 'Not detected'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Experience</span>
                <span style={{ fontWeight: 700 }}>{parsedPreview.experience || 'Not detected'}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>Matched Skills</span>
                {parsedPreview.skills && parsedPreview.skills.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {parsedPreview.skills.map((s, i) => (
                      <span key={i} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>None detected</span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Profile;
