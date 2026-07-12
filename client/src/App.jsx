// ====================================================
// Root Client Application Container (Single Page Router)
//
// This is the core file of the client application.
// It wraps the entire app in a ThemeProvider, manages client-side routing state,
// stores session credentials globally, enforces route security guards,
// and coordinates overlay modals (like the Logout and Application popups).
//
// Features:
// - Mock Routing: Simulates a router using popstate and window.history history stacks.
// - Authorization Guards: Verifies user roles and session tokens to block unauthorized page views.
// - Shared Toast alerts: Renders a floating notification banner on success or error messages.
// - Persistent session restoration: Recovers user profiles from localStorage or sessionStorage on page reload.
//
// Used by:
// - main.jsx (renders <App /> inside root element container)
// ====================================================

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
import { io } from 'socket.io-client';
import CandidateDashboard from './pages/CandidateDashboard';
import SavedJobs from './pages/SavedJobs';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import RecruiterAnalytics from './pages/RecruiterAnalytics';
import AIPreparation from './pages/AIPreparation';

// Purpose:
// Orchestrates visual routing views, authentication updates, and alert notifications.
//
// Input:
// None.
//
// Output:
// Returns the global visual frame (Navbar, Page View, Footer, Toast, Modal overlays).
const AppContent = () => {
  // Simulates URL location pathname routing state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Authenticated user profile and session JWT token keys
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  });

  // Global search filters synced across Home hero and Job Search page
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalLocation, setGlobalLocation] = useState('');
  
  // Control toggles for overlay modals
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [jobToApply, setJobToApply] = useState(null);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Socket.IO client instance
  const [socket, setSocket] = useState(null);

  // Initialize and clean up Socket.IO connection based on user session
  useEffect(() => {
    if (user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      const newSocket = io(socketUrl);
      setSocket(newSocket);

      // Register active user session
      newSocket.emit('join', user._id);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  // Alert banner state
  const [alert, setAlert] = useState(null);

  // Trigger floating alert banner
  const triggerAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // Listen for real-time notification alerts
  useEffect(() => {
    if (socket) {
      socket.on('notification', (data) => {
        // Automatically pop a toast message
        triggerAlert(data.message, 'success');
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);
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

  // Purpose:
  // Updates the browser history stack and sets current route state path.
  //
  // Input:
  // to (string) - The target URL path (e.g. '/login').
  const navigate = (to) => {
    window.history.pushState(null, '', to);
    setCurrentPath(to);
    window.scrollTo(0, 0); // Scroll page back to top on transitions
  };

  // Listen for browser forward/back button popstate events
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Purpose:
  // Opens the application modal. Prompts guests to log in first.
  //
  // Input:
  // job (object) - The target job document candidate clicked.
  const handleApplyTrigger = (job) => {
    if (!user) {
      triggerAlert('Please login to continue.', 'error');
      navigate('/login');
      return;
    }
    setJobToApply(job);
    setApplyModalOpen(true);
  };

  // Adds recently applied job IDs to the local candidate tracking list
  const handleApplySuccess = () => {
    triggerAlert('Application submitted successfully! Track it in "My Applications".');
    if (jobToApply) {
      setAppliedJobIds(prev => [...prev, jobToApply._id]);
    }
  };

  // Purpose:
  // Saves newly authenticated credentials, triggers toast, and redirects to role dashboard.
  //
  // Input:
  // - authUser (object): Signed-in user profile.
  // - authToken (string): JWT session token.
  const handleAuthSuccess = (authUser, authToken) => {
    setUser(authUser);
    setToken(authToken);
    triggerAlert(`Logged in successfully as ${authUser.fullName}!`);
    navigate('/');
  };

  // Triggers the Logout Confirmation Overlay Popup modal
  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  // Purpose:
  // Destroys token keys on logout confirmation, resets session, and navigates home.
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

  // Purpose:
  // Central page route redirection helper.
  //
  // Input:
  // - page (string): Target page alias or path.
  // - params (object): Additional queries (like job details ID).
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
    } else if (target === 'analytics' || target === '/recruiter/analytics') {
      navigate('/recruiter/analytics');
    } else if (target === 'candidate-dashboard' || target === '/candidate/dashboard') {
      navigate('/candidate/dashboard');
    } else if (target === 'ai-preparation' || target === '/ai-preparation') {
      navigate('/ai-preparation');
    } else if (target === 'saved-jobs' || target === '/saved-jobs') {
      navigate('/saved-jobs');
    } else if (target === 'chat' || target === '/chat') {
      if (params.recipientId) {
        navigate(`/chat?recipientId=${params.recipientId}`);
      } else {
        navigate('/chat');
      }
    } else if (target === 'admin-dashboard' || target === '/admin/dashboard') {
      navigate('/admin/dashboard');
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

  // Purpose:
  // Decodes the current window URL pathname and maps it to a structured route state name.
  //
  // Input:
  // None (reads currentPath state).
  //
  // Output:
  // Returns an object containing the resolved page name and dynamic path parameters.
  const parseRoute = () => {
    let path = currentPath;
    
    // Resolve static pages first
    if (path === '/' || path === '') return { name: 'home' };
    if (path === '/jobs') return { name: 'jobs' };
    if (path === '/my-applications') return { name: 'my-applications' };
    if (path === '/profile' || path === '/recruiter/profile') return { name: 'profile' };
    if (path === '/login') return { name: 'login' };
    if (path === '/signup') return { name: 'signup' };
    if (path === '/forgot-password') return { name: 'forgot-password' };
    if (path === '/about') return { name: 'about' };
    if (path === '/candidate/dashboard') return { name: 'candidate-dashboard' };
    if (path === '/ai-preparation') return { name: 'ai-preparation' };
    if (path === '/saved-jobs') return { name: 'saved-jobs' };
    if (path.startsWith('/chat')) {
      const queryIndex = path.indexOf('?');
      let recipientId = null;
      if (queryIndex !== -1) {
        const searchParams = new URLSearchParams(path.substring(queryIndex));
        recipientId = searchParams.get('recipientId');
      }
      return { name: 'chat', params: { recipientId } };
    }
    if (path === '/admin/dashboard') return { name: 'admin-dashboard' };

    // Resolve Reset Password token path pattern using dynamic regex matching
    const resetPasswordMatch = path.match(/^\/reset-password\/([a-zA-Z0-9_-]+)$/);
    if (resetPasswordMatch) {
      return { name: 'reset-password', params: { token: resetPasswordMatch[1] } };
    }

    // Resolve Recruiter paths (handled within RecruiterDashboard component router sub-view)
    if (path === '/recruiter/analytics') {
      return { name: 'recruiter-analytics' };
    }
    if (path === '/recruiter/dashboard' || path === '/recruiter/jobs' || path === '/recruiter/create-job' || path.startsWith('/recruiter/edit-job') || path === '/recruiter/applications') {
      return { name: 'recruiter-dashboard' };
    }

    // Resolve dynamic Candidate Job Details path pattern: /jobs/:id
    const jobDetailsMatch = path.match(/^\/jobs\/([a-fA-F0-9]{24}|[0-9]+)$/);
    if (jobDetailsMatch) {
      return { name: 'job-details', params: { id: jobDetailsMatch[1] } };
    }

    // Fallback default path
    return { name: 'home' };
  };

  const currentRoute = parseRoute();

  // Enforce Route Protection and Role Authorization Guards
  useEffect(() => {
    const route = parseRoute();
    const publicPaths = ['home', 'jobs', 'job-details', 'login', 'signup', 'forgot-password', 'reset-password', 'about'];
    const recruiterPaths = ['recruiter-dashboard', 'recruiter-analytics'];
    const candidatePaths = ['my-applications', 'candidate-dashboard', 'saved-jobs', 'ai-preparation'];
    const adminPaths = ['admin-dashboard'];

    if (!user) {
      // Guest checks
      if (!publicPaths.includes(route.name) && route.name !== 'profile') {
        triggerAlert('Please login to continue.', 'error');
        navigate('/login');
      }
    } else {
      // Admin checks - can access public pages, profile, admin-dashboard, and chat
      if (user.role === 'admin') {
        if (!publicPaths.includes(route.name) && route.name !== 'admin-dashboard' && route.name !== 'profile' && route.name !== 'chat') {
          triggerAlert('Redirected to Admin Dashboard', 'success');
          navigate('/admin/dashboard');
        }
      }
      // Candidate checks
      if (user.role === 'candidate') {
        if (recruiterPaths.includes(route.name) || adminPaths.includes(route.name)) {
          triggerAlert('Unauthorized Access', 'error');
          navigate('/jobs');
        }
      }
      // Recruiter checks
      if (user.role === 'recruiter') {
        if (candidatePaths.includes(route.name) || adminPaths.includes(route.name)) {
          triggerAlert('Unauthorized Access: Redirected to Recruiter Dashboard.', 'error');
          navigate('/recruiter/dashboard');
        }
      }
      // Prevent authenticated users visiting login/signup
      if (route.name === 'login' || route.name === 'signup') {
        navigate('/');
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
            user={user}
          />
        );
      case 'recruiter-dashboard':
        return (
          <RecruiterDashboard 
            currentPath={currentPath}
            onPageChange={handlePageChange}
          />
        );
      case 'recruiter-analytics':
        return (
          <RecruiterAnalytics 
            onPageChange={handlePageChange}
          />
        );
      case 'candidate-dashboard':
        return <CandidateDashboard onPageChange={handlePageChange} user={user} />;
      case 'ai-preparation':
        return <AIPreparation onPageChange={handlePageChange} user={user} />;
      case 'saved-jobs':
        return <SavedJobs onPageChange={handlePageChange} onApply={handleApplyTrigger} />;
      case 'chat':
        return <Chat onPageChange={handlePageChange} user={user} socket={socket} pageParams={currentRoute.params || {}} />;
      case 'admin-dashboard':
        return <AdminDashboard onPageChange={handlePageChange} user={user} />;
      case 'my-applications':
        return <MyApplications onPageChange={handlePageChange} onApply={handleApplyTrigger} onLogout={handleLogout} />;
      case 'profile':
        return <Profile user={user} setUser={setUser} onPageChange={handlePageChange} socket={socket} />;
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
        socket={socket}
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
