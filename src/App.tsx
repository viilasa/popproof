import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { AuthPage } from './components/auth/AuthPage';
import { Dashboard } from './components/Dashboard';
import LandingPage from './pages/LandingPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RefundPage from './pages/RefundPage';

function AppContent() {
  const { user, loading } = useAuth();

  // A password-recovery link signs the user in; keep them on the reset form instead of the dashboard
  const [recovering, setRecovering] = useState(() => {
    const hash = window.location.hash;
    return hash.includes('type=recovery') || hash === '#reset-password';
  });
  useEffect(() => {
    const onHash = () => { if (window.location.hash === '#reset-password') setRecovering(true); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Check URL path for terms/privacy/refund pages
  const getInitialMode = (): 'landing' | 'login' | 'signup' | 'terms' | 'privacy' | 'refund' => {
    const path = window.location.pathname;
    if (path === '/terms') return 'terms';
    if (path === '/privacy') return 'privacy';
    if (path === '/refund') return 'refund';
    return 'landing';
  };
  
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'signup' | 'terms' | 'privacy' | 'refund'>(getInitialMode);
  const [pendingPlanSlug, setPendingPlanSlug] = useState<string | null>(() => {
    // Check if there's a pending plan from localStorage
    return localStorage.getItem('proofedge_pending_plan');
  });

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (recovering) {
    return <AuthPage initialMode="reset-password" />;
  }

  // If user is authenticated, show dashboard or payment processing
  if (user) {
    const path = window.location.pathname;
    // Billing path - show dashboard with billing section
    if (path === '/billing') {
      return <Dashboard initialSection="billing" />;
    }
    // Check if there's a pending plan to redirect to billing
    const pendingPlan = localStorage.getItem('proofedge_pending_plan');
    if (pendingPlan) {
      localStorage.removeItem('proofedge_pending_plan');
      return <Dashboard initialSection="billing" pendingPlanSlug={pendingPlan} />;
    }
    return <Dashboard />;
  }

  // If user clicked "Log in" or "Get Started", show auth page
  if (authMode === 'login' || authMode === 'signup') {
    return (
      <AuthPage 
        onBackToLanding={() => setAuthMode('landing')} 
        initialMode={authMode === 'signup' ? 'register' : 'login'}
      />
    );
  }

  // Show Terms page
  if (authMode === 'terms') {
    return <TermsPage onBack={() => {
      window.history.pushState({}, '', '/');
      setAuthMode('landing');
    }} />;
  }

  // Show Privacy page
  if (authMode === 'privacy') {
    return <PrivacyPage onBack={() => {
      window.history.pushState({}, '', '/');
      setAuthMode('landing');
    }} />;
  }

  // Show Refund page
  if (authMode === 'refund') {
    return <RefundPage onBack={() => {
      window.history.pushState({}, '', '/');
      setAuthMode('landing');
    }} />;
  }

  // Otherwise, show landing page
  return (
    <LandingPage 
      onShowLogin={() => setAuthMode('login')} 
      onShowSignup={(planSlug?: string) => {
        // Store the selected plan if any
        if (planSlug) {
          localStorage.setItem('proofedge_pending_plan', planSlug);
          setPendingPlanSlug(planSlug);
        }
        setAuthMode('signup');
      }}
      onShowTerms={() => {
        window.history.pushState({}, '', '/terms');
        setAuthMode('terms');
      }}
      onShowPrivacy={() => {
        window.history.pushState({}, '', '/privacy');
        setAuthMode('privacy');
      }}
      onShowRefund={() => {
        window.history.pushState({}, '', '/refund');
        setAuthMode('refund');
      }}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;