import { useState } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { AuthPage } from './components/auth/AuthPage';
import { Dashboard } from './components/Dashboard';
import LandingPage from './pages/LandingPage';

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'signup'>('landing');

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

  // Otherwise, show landing page
  return (
    <LandingPage 
      onShowLogin={() => setAuthMode('login')} 
      onShowSignup={() => setAuthMode('signup')}
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