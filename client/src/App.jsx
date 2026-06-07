import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import { api } from './services/api';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import RecruiterDashboard from './pages/RecruiterDashboard';
import MyApplications from './pages/MyApplications';
import ApplyModal from './components/ApplyModal';
import Modal from './components/Modal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import About from './pages/About';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const AppContent = () => {
  // Navigation Path State
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Auth State
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  });

  const [globalSearch, setGlobalSearch] = useState('');
  const [globalLocation, setGlobalLocation] = useState('');
  
  // Apply Modal state
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Fetch candidate's applied jobs on mount / login
  useEffect(() => {
    const fetchAppliedJobs = async () => {
      if (user && user.role === 'candidate') {
        try {
          const res = await api.getUserApplications();
          const ids = (res.applications || [])
            .map(app => app.jobId && app.jobId._id)
            .filter(Boolean);
          setAppliedJobIds(ids);
        } catch (err) {
          console.error('Error fetching applied job IDs:', err.message);
        }
      } else {
        setAppliedJobIds([]);
      }
    };
    fetchAppliedJobs();
  }, [user]);

  // Success/Error Toast alert banner
  const [alert, setAlert] = useState(null);

  // Custom navigate function
  const navigate = (to) => {
    window.history.pushState(null, '', to);
    setCurrentPath(to);
    window.scrollTo(0, 0);
  };

  // Listen for browser navigation (back/forward keys)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const triggerAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  const handleApplyTrigger = (job) => {
    if (!user) {
      triggerAlert('Please login to continue.', 'error');
      navigate('/login');
      return;
    }
    setJobToApply(job);
    setApplyModalOpen(true);
  };

  const handleApplySuccess = () => {
    triggerAlert('Application submitted successfully! Track it in "My Applications".');
    if (jobToApply) {
      setAppliedJobIds(prev => [...prev, jobToApply._id]);
    }
  };

  const handleAuthSuccess = (authUser, authToken) => {
    setUser(authUser);
    setToken(authToken);
    triggerAlert(`Logged in successfully as ${authUser.fullName}!`);
    if (authUser.role === 'candidate') {
      navigate('/jobs');
    } else {
      navigate('/recruiter/dashboard');
    }
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const executeLogout = () => {
    setLogoutModalOpen(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setAppliedJobIds([]);
    triggerAlert('Logged out successfully.');
    navigate('/');
  };

  const handlePageChange = (page, params = {}) => {
    const target = page === '/' ? 'home' : page;
    if (target === 'home' || target === '/') {
      navigate('/');
    } else if (target === 'jobs' || target === '/jobs') {
      if (params.keepFilters !== true) {
        setGlobalSearch('');
        setGlobalLocation('');
      }
      navigate('/jobs');
    } else if (target === 'job-details') {
      navigate(`/jobs/${params.id}`);
    } else if (target === 'dashboard' || target === '/recruiter/dashboard') {
      navigate('/recruiter/dashboard');
    } else if (target === 'my-applications' || target === '/my-applications') {
      navigate('/my-applications');
    } else if (target === 'profile' || target === '/profile') {
      navigate('/profile');
    } else if (target === 'login' || target === '/login') {
      navigate('/login');
    } else if (target === 'signup' || target === '/signup') {
      navigate('/signup');
    } else {
      navigate(page);
    }
  };

  // Parse path to route
  const parseRoute = () => {
    let path = currentPath;
    
    // Static routes
    if (path === '/' || path === '') return { name: 'home' };
    if (path === '/jobs') return { name: 'jobs' };
    if (path === '/my-applications') return { name: 'my-applications' };
    if (path === '/profile' || path === '/recruiter/profile') return { name: 'profile' };
    if (path === '/login') return { name: 'login' };
    if (path === '/signup') return { name: 'signup' };
    if (path === '/forgot-password') return { name: 'forgot-password' };
    if (path === '/about') return { name: 'about' };
    const resetPasswordMatch = path.match(/^\/reset-password\/([a-zA-Z0-9_-]+)$/);
    if (resetPasswordMatch) {
      return { name: 'reset-password', params: { token: resetPasswordMatch[1] } };
    }
    if (path === '/recruiter/dashboard' || path === '/recruiter/jobs' || path === '/recruiter/create-job' || path.startsWith('/recruiter/edit-job') || path === '/recruiter/applications') {
      // Recruiter actions are handled inside recruiter-dashboard
      return { name: 'recruiter-dashboard' };
    }

    // Dynamic candidate routes
    // Match /jobs/:id
    const jobDetailsMatch = path.match(/^\/jobs\/([a-fA-F0-9]{24}|[0-9]+)$/);
    if (jobDetailsMatch) {
      return { name: 'job-details', params: { id: jobDetailsMatch[1] } };
    }

    // Fallback
    return { name: 'home' };
  };

  const currentRoute = parseRoute();

  // Enforce Route Protection and Role Authorization Guards
  useEffect(() => {
    const route = parseRoute();
    const publicPaths = ['home', 'jobs', 'job-details', 'login', 'signup', 'forgot-password', 'reset-password', 'about'];
    const recruiterPaths = ['recruiter-dashboard'];
    const candidatePaths = ['my-applications'];

    if (!user) {
      // Guest checks
      if (!publicPaths.includes(route.name) && route.name !== 'profile') {
        triggerAlert('Please login to continue.', 'error');
        navigate('/login');
      }
    } else {
      // Candidate checks
      if (user.role === 'candidate' && recruiterPaths.includes(route.name)) {
        triggerAlert('Unauthorized Access', 'error');
        navigate('/jobs');
      }
      // Recruiter checks
      if (user.role === 'recruiter' && candidatePaths.includes(route.name)) {
        triggerAlert('Unauthorized Access: Redirected to Recruiter Dashboard.', 'error');
        navigate('/recruiter/dashboard');
      }
      // Prevent authenticated users visiting login/signup
      if (route.name === 'login' || route.name === 'signup') {
        if (user.role === 'candidate') {
          navigate('/jobs');
        } else {
          navigate('/recruiter/dashboard');
        }
      }
    }
  }, [currentPath, user]);

  const renderPage = () => {
    switch (currentRoute.name) {
      case 'home':
        return (
          <Home 
            onPageChange={handlePageChange} 
            onApply={handleApplyTrigger}
            setGlobalSearch={setGlobalSearch}
            setGlobalLocation={setGlobalLocation}
          />
        );
      case 'jobs':
        return (
          <Jobs 
            globalSearch={globalSearch}
            setGlobalSearch={setGlobalSearch}
            globalLocation={globalLocation}
            setGlobalLocation={setGlobalLocation}
            onPageChange={handlePageChange} 
            onApply={handleApplyTrigger}
          />
        );
      case 'job-details':
        return (
          <JobDetails 
            pageParams={currentRoute.params} 
            onPageChange={handlePageChange} 
            onApply={handleApplyTrigger}
            appliedJobIds={appliedJobIds}
          />
        );
      case 'recruiter-dashboard':
        return (
          <RecruiterDashboard 
            currentPath={currentPath}
            onPageChange={handlePageChange}
          />
        );
      case 'my-applications':
        return <MyApplications onPageChange={handlePageChange} onApply={handleApplyTrigger} onLogout={handleLogout} />;
      case 'profile':
        return <Profile user={user} onPageChange={handlePageChange} />;
      case 'login':
        return <Login onPageChange={handlePageChange} onAuthSuccess={handleAuthSuccess} />;
      case 'signup':
        return <Signup onPageChange={handlePageChange} onAuthSuccess={handleAuthSuccess} />;
      case 'about':
        return <About onPageChange={handlePageChange} />;
      case 'forgot-password':
        return <ForgotPassword onPageChange={handlePageChange} />;
      case 'reset-password':
        return <ResetPassword token={currentRoute.params.token} onPageChange={handlePageChange} />;
      default:
        return (
          <Home 
            onPageChange={handlePageChange} 
            onApply={handleApplyTrigger}
            setGlobalSearch={setGlobalSearch}
            setGlobalLocation={setGlobalLocation}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Navbar 
        currentPage={currentRoute.name} 
        onPageChange={handlePageChange} 
        user={user}
        onLogout={handleLogout}
      />
      
      {/* Success/Error Toast notification banner */}
      {alert && (
        <div 
          style={{
            position: 'fixed',
            top: '90px',
            right: '20px',
            backgroundColor: alert.type === 'error' ? 'var(--error)' : 'var(--success)',
            color: '#ffffff',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            boxShadow: alert.type === 'error' ? '0 10px 25px rgba(239, 68, 68, 0.3)' : '0 10px 25px rgba(34, 197, 94, 0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600,
            animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {alert.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{alert.message}</span>
        </div>
      )}

      <main className="main-content">
        {renderPage()}
      </main>

      {/* Shared Apply Form Modal */}
      <ApplyModal 
        isOpen={applyModalOpen} 
        onClose={() => setApplyModalOpen(false)} 
        job={jobToApply}
        onApplySuccess={handleApplySuccess}
      />

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
        footer={
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', width: '100%' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => setLogoutModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-danger" 
              onClick={executeLogout}
              style={{ backgroundColor: 'var(--error)', color: '#ffffff' }}
            >
              Yes, Logout
            </button>
          </div>
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Are you sure you want to log out of your account? You will need to log back in to access your dashboard, applications, and saved jobs.
          </p>
        </div>
      </Modal>

      <Footer onPageChange={handlePageChange} />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
