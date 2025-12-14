import { useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { AuthPage } from './components/auth/AuthPage';
import { Dashboard } from './components/Dashboard';
import LandingPage from './pages/LandingPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

function AppContent() {
  const { user, loading } = useAuth();
  
  // Check URL path for terms/privacy pages
  const getInitialMode = (): 'landing' | 'login' | 'signup' | 'terms' | 'privacy' => {
    const path = window.location.pathname;
    if (path === '/terms') return 'terms';
    if (path === '/privacy') return 'privacy';
    return 'landing';
  };
  
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'signup' | 'terms' | 'privacy'>(getInitialMode);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is authenticated, show dashboard
  if (user) {
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

  // Otherwise, show landing page
  return (
    <LandingPage 
      onShowLogin={() => setAuthMode('login')} 
      onShowSignup={() => setAuthMode('signup')}
      onShowTerms={() => {
        window.history.pushState({}, '', '/terms');
        setAuthMode('terms');
      }}
      onShowPrivacy={() => {
        window.history.pushState({}, '', '/privacy');
        setAuthMode('privacy');
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