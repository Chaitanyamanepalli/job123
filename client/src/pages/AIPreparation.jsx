import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FileText,
  Compass,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Upload,
  Brain,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Check,
  X,
  Play,
  RotateCcw
} from 'lucide-react';

const AIPreparation = ({ onPageChange, user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dashboard Stats State
  const [stats, setStats] = useState(null);

  // Resume Analysis State
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  // Roadmap Form & Result State
  const [roadmapForm, setRoadmapForm] = useState({
    targetRole: 'Full Stack Developer',
    currentSkillLevel: 'Beginner',
    preferredLanguage: 'JavaScript'
  });
  const [roadmap, setRoadmap] = useState(null);

  // Interview Prep State
  const [interviewType, setInterviewType] = useState('technical');
  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Quiz Form & Live State
  const [quizForm, setQuizForm] = useState({
    topic: 'JavaScript',
    difficulty: 'Medium',
    numQuestions: 5
  });
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizActive, setQuizActive] = useState(false);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);

  // Skill Recommendations State
  const [recommendations, setRecommendations] = useState(null);

  // Fetch Dashboard Stats & Recommendations on Mount
  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const statsRes = await api.getAIDashboardStats();
      setStats(statsRes.data);

      const recsRes = await api.getAIRecommendations();
      setRecommendations(recsRes.data);
    } catch (err) {
      console.error('Error fetching AI prep dashboard:', err.message);
      setError('Could not load preparation details. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Analyze Resume Handler
  const handleAnalyzeResume = async (e, useProfile = false) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!useProfile && !resumeFile) {
      setError('Please select a PDF resume file to upload.');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      if (!useProfile) {
        formData.append('resume', resumeFile);
      }
      // If we want a specific target role, pass it as text parameter
      formData.append('targetRole', roadmapForm.targetRole);

      const res = await api.analyzeResume(formData);
      setResumeAnalysis(res.data);
      setSuccess('Resume analyzed successfully!');
      
      // Refresh general stats
      const statsRes = await api.getAIDashboardStats();
      setStats(statsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to analyze resume.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Generate Roadmap Handler
  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      const res = await api.getCareerRoadmap(roadmapForm);
      setRoadmap(res.data);
      setSuccess('Career roadmap generated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to generate career roadmap.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Generate Interview Prep Questions Handler
  const handleGetInterviewPrep = async (type) => {
    setError('');
    setInterviewType(type);
    setExpandedQuestion(null);
    try {
      setLoading(true);
      const res = await api.getInterviewQuestions(type);
      setInterviewQuestions(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load interview questions.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Generate Quiz Handler
  const handleStartQuiz = async (e) => {
    e.preventDefault();
    setError('');
    setSelectedAnswers({});
    setCurrentQuizIndex(0);
    setQuizResult(null);
    try {
      setLoading(true);
      const res = await api.getQuizQuestions(
        quizForm.topic,
        quizForm.difficulty,
        quizForm.numQuestions
      );
      setQuizQuestions(res.data);
      setQuizActive(true);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleQuizSubmit = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        score++;
      }
    });

    const percent = Math.round((score / quizQuestions.length) * 100);
    setQuizResult({
      score,
      total: quizQuestions.length,
      percentage: percent
    });
    setQuizActive(false);
  };

  // Render Sub-Sections
  const renderDashboardTab = () => {
    if (!stats) return <div style={{ color: 'var(--text-secondary)' }}>No statistics recorded. Please try again.</div>;

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          
          {/* Resume Score Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" stroke="var(--border-color)" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="var(--accent)" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.resumeScore / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '1.5rem', fontWeight: 800 }}>{stats.resumeScore}</span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Resume Score</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Based on profile matching</span>
            <button className="btn-text-action" onClick={() => setActiveTab('resume')} style={{ marginTop: '0.75rem' }}>
              Optimize Resume <ArrowRight size={12} />
            </button>
          </div>

          {/* Quiz Score Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="40" stroke="var(--border-color)" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  stroke="#38bdf8" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - stats.quizScore / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              <span style={{ position: 'absolute', fontSize: '1.5rem', fontWeight: 800 }}>{stats.quizScore}%</span>
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Quiz Performance</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Average quiz score</span>
            <button className="btn-text-action" onClick={() => setActiveTab('quiz')} style={{ marginTop: '0.75rem', color: '#38bdf8' }}>
              Take A Quiz <ArrowRight size={12} />
            </button>
          </div>

          {/* Skills Learned Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.75rem', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', marginBottom: '1rem', fontSize: '2rem', fontWeight: 800 }}>
              {stats.skillsLearned}
            </div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Skills Acquired</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Registered in profile</span>
            <button className="btn-text-action" onClick={() => onPageChange('/profile')} style={{ marginTop: '0.75rem', color: 'var(--success)' }}>
              Edit Skills <ArrowRight size={12} />
            </button>
          </div>

          {/* Prep Progress Card */}
          <div className="card-glass" style={{ display: 'flex', flexDirection: 'column', padding: '1.75rem', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Preparation Stage</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Readiness</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-hover)' }}>{stats.preparationProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
              <div style={{ width: `${stats.preparationProgress}%`, height: '100%', backgroundColor: 'var(--accent)', borderRadius: '6px', transition: 'width 0.6s ease' }}></div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Continue learning and testing to approach 100% job-readiness.
            </p>
          </div>
        </div>

        {/* Dashboard Lower Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Next Steps Recommendations Card */}
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-hover)' }}>
              <Sparkles size={20} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Recommended Next Step</h2>
            </div>
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '1.25rem', borderRadius: '12px', borderLeft: '4px solid var(--accent)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {stats.recommendedNextStep}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button className="btn btn-primary" onClick={() => setActiveTab('roadmap')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Build Career Roadmap <Compass size={16} />
              </button>
              <button className="btn btn-secondary" onClick={() => setActiveTab('interview')} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Practice Mock Interviews <Brain size={16} />
              </button>
            </div>
          </div>

          {/* Quick Stats list / tips */}
          <div className="card-glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>AI Preparation Advantage</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Job seekers who complete custom roadmaps and resume scoring are 3.5x more likely to secure first-round technical interviews.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Identify hidden tech skills missing from your resume layouts.</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--success)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expand technical answers under structured role simulations.</span>
                </div>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => setActiveTab('recommendations')} style={{ width: '100%', marginTop: '1.5rem' }}>
              View Skill Recommendations
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResumeTab = () => {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }} className="tab-container-row">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* File Upload panel */}
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.7rem' }}>Upload Resume PDF</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Upload your resume in PDF format to evaluate content coverage, identify key missing keywords, and verify strengths.
            </p>

            <form onSubmit={(e) => handleAnalyzeResume(e, false)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '2rem 1.5rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', cursor: 'pointer', position: 'relative' }}>
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                <Upload size={36} style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', opacity: 0.7 }} />
                <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  {resumeFile ? resumeFile.name : 'Click or Drag PDF here'}
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Maximum file size: 5MB</span>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || !resumeFile}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Analyze Uploaded PDF <Sparkles size={16} />
              </button>
            </form>

            {user.resumeUrl && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Profile Resume Detected</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  You have already uploaded a resume to your CareerPilot AI Profile.
                </p>
                <button 
                  onClick={() => handleAnalyzeResume(null, true)} 
                  className="btn btn-secondary" 
                  disabled={loading}
                  style={{ width: '100%' }}
                >
                  Analyze Profile Resume
                </button>
              </div>
            )}
          </div>

          {/* Analysis Results View */}
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>Analysis Report</h2>

            {!resumeAnalysis ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ fontWeight: 600 }}>No Analysis Generated Yet</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Upload a PDF resume or click Analyze Profile Resume to evaluate your resume details.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                
                {/* Score section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111111', fontSize: '1.5rem', fontWeight: 800 }}>
                    {resumeAnalysis.resumeScore}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Overall Score</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Target Role: {resumeAnalysis.targetRole}</p>
                  </div>
                </div>

                {/* Extracted Skills */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> Extracted Skills
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {resumeAnalysis.extractedSkills.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>None found. Update your profile settings.</span>
                    ) : (
                      resumeAnalysis.extractedSkills.map(skill => (
                        <span key={skill} className="badge badge-success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.25rem 0.6rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Missing Skills */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <AlertCircle size={16} style={{ color: 'var(--error)' }} /> Missing Key Skills
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {resumeAnalysis.missingSkills.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>Your resume matches the target skills perfectly!</span>
                    ) : (
                      resumeAnalysis.missingSkills.map(skill => (
                        <span key={skill} className="badge badge-error" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.25rem 0.6rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>Key Strengths</h3>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {resumeAnalysis.strengths.map((str, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{str}</li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>Areas for Improvement</h3>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {resumeAnalysis.areasForImprovement.map((area, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{area}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRoadmapTab = () => {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Roadmap Form panel */}
          <div className="card-glass" style={{ padding: '1.75rem', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Roadmap Criteria</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Select target parameters to generate a custom timeline of learning milestones and recommended projects.
            </p>

            <form onSubmit={handleGenerateRoadmap} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Target Role select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Target Role</label>
                <select 
                  value={roadmapForm.targetRole}
                  onChange={(e) => setRoadmapForm(prev => ({ ...prev, targetRole: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', outline: 'none' }}
                >
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Data Scientist">Data Scientist</option>
                </select>
              </div>

              {/* Skill level select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Current Level</label>
                <select 
                  value={roadmapForm.currentSkillLevel}
                  onChange={(e) => setRoadmapForm(prev => ({ ...prev, currentSkillLevel: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', outline: 'none' }}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Language select */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Preferred Language</label>
                <select 
                  value={roadmapForm.preferredLanguage}
                  onChange={(e) => setRoadmapForm(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', outline: 'none' }}
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="TypeScript">TypeScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Generate Career Roadmap <Compass size={16} />
              </button>
            </form>
          </div>

          {/* Roadmap Results display */}
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Your Custom Learning Path</h2>

            {!roadmap ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <Compass size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ fontWeight: 600 }}>No Roadmap Generated</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Complete the parameters form to generate a visual vertical timeline.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.3s ease' }}>
                
                {/* Timeline */}
                <div style={{ position: 'relative', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Vertical Line */}
                  <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '7px', width: '2px', backgroundColor: 'var(--border-color)' }}></div>
                  
                  {roadmap.learningOrder.map((step) => (
                    <div key={step.step} style={{ position: 'relative' }}>
                      {/* Timeline dot */}
                      <div style={{ position: 'absolute', top: '4px', left: '-2.15rem', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--accent)', border: '4px solid var(--bg-secondary)', zIndex: 2 }}></div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Step {step.step}: {step.title}</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '0.15rem 0.5rem', borderRadius: '100px', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                          {step.timeline}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', lineHeight: 1.4 }}>{step.description}</p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {step.skills.map(skill => (
                          <span key={skill} style={{ fontSize: '0.7rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.45rem', borderRadius: '4px', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Suggested Projects */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Suggested Capstone Projects</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {roadmap.suggestedProjects.map((project, idx) => (
                      <div key={idx} style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{project.title}</h4>
                          <span style={{ fontSize: '0.7rem', color: project.complexity === 'Hard' ? 'var(--error)' : 'var(--accent-hover)', fontWeight: 700 }}>
                            {project.complexity}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{project.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Steps */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Interview Preparation Milestones</h3>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {roadmap.interviewPrepSteps.map((step, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderInterviewTab = () => {
    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div className="card-glass" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>AI Interview Preparation Simulator</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Choose an interview style simulation. The simulator will compile 10 targeted interview questions with professional sample answer guidelines.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <button 
              className={`btn ${interviewType === 'hr' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleGetInterviewPrep('hr')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              HR Interview
            </button>
            <button 
              className={`btn ${interviewType === 'technical' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleGetInterviewPrep('technical')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Technical Interview
            </button>
            <button 
              className={`btn ${interviewType === 'resume' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleGetInterviewPrep('resume')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              Resume-Based Interview
            </button>
          </div>
        </div>

        {/* Questions list */}
        {!interviewQuestions ? (
          <div className="card-glass" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Brain size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>Questions Not Generated</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Select one of the interview styles above to generate simulated questions.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s ease' }}>
            {interviewQuestions.map((q, idx) => (
              <div 
                key={idx} 
                className="card-glass" 
                style={{ padding: '1.25rem', border: expandedQuestion === idx ? '1px solid var(--accent)' : '1px solid var(--border-color)', transition: 'border 0.25s ease' }}
              >
                <div 
                  onClick={() => setExpandedQuestion(expandedQuestion === idx ? null : idx)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', gap: '1rem' }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--accent-hover)', fontSize: '1.1rem' }}>{idx + 1}.</span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.1rem', lineHeight: 1.4 }}>{q.q}</h3>
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.2rem' }}>
                    {expandedQuestion === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>

                {expandedQuestion === idx && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', animation: 'slideUp 0.25s ease' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-hover)', marginBottom: '0.35rem' }}>Sample Answer Blueprint:</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{q.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderQuizTab = () => {
    // 1. Quiz Settings view
    if (!quizActive && !quizResult) {
      return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div className="card-glass" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <HelpCircle size={40} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Practice Quiz Generator</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Test your conceptual knowledge of core frameworks to earn progress points.
              </p>
            </div>

            <form onSubmit={handleStartQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Topic */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Choose Topic</label>
                <select 
                  value={quizForm.topic}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, topic: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', outline: 'none' }}
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="React">React</option>
                  <option value="Node.js">Node.js</option>
                </select>
              </div>

              {/* Difficulty */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Difficulty Level</label>
                <select 
                  value={quizForm.difficulty}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, difficulty: e.target.value }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', outline: 'none' }}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Number of questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Questions Count</label>
                <select 
                  value={quizForm.numQuestions}
                  onChange={(e) => setQuizForm(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--input-bg)', outline: 'none' }}
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Start Quiz <Play size={16} />
              </button>
            </form>
          </div>
        </div>
      );
    }

    // 2. Quiz Active Screen
    if (quizActive && quizQuestions) {
      const currentQuestion = quizQuestions[currentQuizIndex];
      const selectedOption = selectedAnswers[currentQuizIndex];

      return (
        <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '720px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--accent-hover)', fontWeight: 700 }}>
                {quizForm.topic} • {quizForm.difficulty}
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Question {currentQuizIndex + 1} of {quizQuestions.length}</h2>
            </div>
            <div style={{ width: '80px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px' }}>
              <div style={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%`, height: '100%', backgroundColor: 'var(--accent)', borderRadius: '3px', transition: 'width 0.2s ease' }}></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="card-glass" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {currentQuestion.question}
            </h3>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedOption === oIdx;
                return (
                  <button 
                    key={oIdx}
                    onClick={() => handleAnswerSelect(currentQuizIndex, oIdx)}
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(163, 230, 53, 0.08)' : 'var(--bg-secondary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      color: 'var(--text-primary)',
                      fontWeight: isSelected ? 600 : 500,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSelected ? '5px solid var(--accent)' : '1px solid var(--border-color)',
                      backgroundColor: 'transparent',
                      flexShrink: 0
                    }}></div>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className="btn btn-secondary"
              onClick={() => setCurrentQuizIndex(prev => prev - 1)}
              disabled={currentQuizIndex === 0}
            >
              Previous
            </button>

            {currentQuizIndex < quizQuestions.length - 1 ? (
              <button 
                className="btn btn-primary"
                onClick={() => setCurrentQuizIndex(prev => prev + 1)}
                disabled={selectedOption === undefined}
              >
                Next Question
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={handleQuizSubmit}
                disabled={selectedOption === undefined}
                style={{ backgroundColor: 'var(--success)', color: '#ffffff' }}
              >
                Submit Answers
              </button>
            )}
          </div>
        </div>
      );
    }

    // 3. Quiz Score Result Screen
    if (quizResult && quizQuestions) {
      return (
        <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Result Card */}
          <div className="card-glass" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '2rem' }}>
            <Award size={48} style={{ color: quizResult.percentage >= 70 ? 'var(--success)' : 'var(--accent-hover)', marginBottom: '0.75rem' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Quiz Completed!</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
              You answered {quizResult.score} of {quizResult.total} questions correctly.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--border-color)' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: quizResult.percentage >= 70 ? 'var(--success)' : 'var(--text-primary)' }}>
                  {quizResult.percentage}%
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Score</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setQuizResult(null);
                  setQuizQuestions(null);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Try Again <RotateCcw size={16} />
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setQuizResult(null);
                  setQuizQuestions(null);
                  setActiveTab('dashboard');
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>

          {/* Detailed Question Review */}
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Review Answers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {quizQuestions.map((q, idx) => {
              const selectedIdx = selectedAnswers[idx];
              const correctIdx = q.correctAnswer;
              const isCorrect = selectedIdx === correctIdx;

              return (
                <div key={idx} className="card-glass" style={{ padding: '1.5rem', borderLeft: isCorrect ? '4px solid var(--success)' : '4px solid var(--error)' }}>
                  <div style={{ display: 'flex', justifyOrigin: 'flex-start', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {isCorrect ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                    ) : (
                      <AlertCircle size={18} style={{ color: 'var(--error)' }} />
                    )}
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isCorrect ? 'var(--success)' : 'var(--error)' }}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', lineHeight: 1.4 }}>
                    {q.question}
                  </h4>

                  {/* Options status */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {q.options.map((opt, oIdx) => {
                      let optionStyle = {
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'transparent'
                      };

                      if (oIdx === correctIdx) {
                        optionStyle.backgroundColor = 'rgba(16, 185, 129, 0.15)';
                        optionStyle.border = '1px solid var(--success)';
                        optionStyle.color = 'var(--success)';
                        optionStyle.fontWeight = '600';
                      } else if (oIdx === selectedIdx && !isCorrect) {
                        optionStyle.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                        optionStyle.border = '1px solid var(--error)';
                        optionStyle.color = 'var(--error)';
                        optionStyle.fontWeight = '600';
                      }

                      return (
                        <div key={oIdx} style={optionStyle}>
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation box */}
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Explanation:</strong> {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const renderRecommendationsTab = () => {
    if (!recommendations) return <div style={{ color: 'var(--text-secondary)' }}>No recommendations found.</div>;

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          
          {/* Skills & Next Tech */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Skills to improve */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>Skills to Refine</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendations.skillsToImprove.map((item, idx) => (
                  <div key={idx} style={{ paddingBottom: '1rem', borderBottom: idx < recommendations.skillsToImprove.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{item.focusArea}</span>
                      <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(163, 230, 53, 0.1)', color: 'var(--accent-hover)', border: '1px solid rgba(163, 230, 53, 0.2)', padding: '0.15rem 0.5rem', borderRadius: '100px', fontWeight: 600 }}>
                        {item.skill}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      {item.platforms.map(plat => (
                        <span key={plat} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          • {plat}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Tech */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem' }}>Technologies to Learn Next</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendations.technologiesToLearnNext.map((tech, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--accent-hover)' }}>{tech.name}</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{tech.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Certifications & Platform details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Recommended Certifications */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={20} style={{ color: 'var(--accent)' }} /> Industry Certifications
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendations.certifications.map((cert, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.75rem', borderBottom: idx < recommendations.certifications.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{cert.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Platform: {cert.platform}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-primary)', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                      <Clock size={12} /> {cert.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice platforms list */}
            <div className="card-glass" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>General Guidelines</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyOrigin: 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Practice Platforms:</span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {recommendations.practicePlatforms.map(p => (
                      <span key={p} style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyOrigin: 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Preparation Time:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-hover)' }}>{recommendations.estimatedPrepTime}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Recommendations are generated by scanning your profile description and evaluating missing credentials relative to entry-level software positions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Styles Injection */}
      <style>{`
        .card-glass {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          box-shadow: var(--card-shadow);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
        }
        .card-glass:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
        }
        .ai-sidebar-nav {
          display: flex;
          flex-direction: row;
          gap: 0.5rem;
          margin-bottom: 2rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .ai-nav-item {
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          background-color: transparent;
          border: none;
          color: var(--text-secondary);
          white-space: nowrap;
          transition: all 0.2s ease;
          display: flex;
          alignItems: center;
          gap: 0.5rem;
        }
        .ai-nav-item:hover {
          color: var(--text-primary);
          background-color: var(--bg-primary);
        }
        .ai-nav-item.active {
          color: #111111;
          background-color: var(--accent);
        }
        [data-theme="dark"] .ai-nav-item.active {
          color: #111111;
          background-color: var(--accent);
        }
        .btn-text-action {
          background: none;
          border: none;
          color: var(--accent-hover);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem;
          transition: opacity 0.2s ease;
        }
        .btn-text-action:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-hover)', marginBottom: '0.25rem' }}>
            <Brain size={24} />
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em' }}>AI Portal</span>
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
            AI Preparation Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Enhance your credentials, generate roadmaps, and practice mock technical question queries.
          </p>
        </div>
        <button 
          onClick={() => onPageChange('/candidate/dashboard')} 
          className="btn btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Toast Errors / Success alerts */}
      {error && (
        <div style={{ color: 'var(--error)', padding: '1rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '10px', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ color: 'var(--success)', padding: '1rem', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: '10px', fontSize: '0.95rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
          <span>{success}</span>
        </div>
      )}

      {/* Navigation Sub-menu */}
      <nav className="ai-sidebar-nav">
        <button className={`ai-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setError(''); setSuccess(''); }}>
          Dashboard
        </button>
        <button className={`ai-nav-item ${activeTab === 'resume' ? 'active' : ''}`} onClick={() => { setActiveTab('resume'); setError(''); setSuccess(''); }}>
          Resume Analysis
        </button>
        <button className={`ai-nav-item ${activeTab === 'roadmap' ? 'active' : ''}`} onClick={() => { setActiveTab('roadmap'); setError(''); setSuccess(''); }}>
          Career Roadmap
        </button>
        <button className={`ai-nav-item ${activeTab === 'interview' ? 'active' : ''}`} onClick={() => { setActiveTab('interview'); setError(''); setSuccess(''); }}>
          Interview Prep
        </button>
        <button className={`ai-nav-item ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => { setActiveTab('quiz'); setError(''); setSuccess(''); }}>
          Practice Quiz
        </button>
        <button className={`ai-nav-item ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => { setActiveTab('recommendations'); setError(''); setSuccess(''); }}>
          Recommendations
        </button>
      </nav>

      {/* Content views rendering */}
      {loading && !quizActive && <LoadingSpinner />}
      
      <div style={{ display: loading && !quizActive ? 'none' : 'block' }}>
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'resume' && renderResumeTab()}
        {activeTab === 'roadmap' && renderRoadmapTab()}
        {activeTab === 'interview' && renderInterviewTab()}
        {activeTab === 'quiz' && renderQuizTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
      </div>

    </div>
  );
};

export default AIPreparation;
