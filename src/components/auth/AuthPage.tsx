import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ResetPasswordForm } from './ResetPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthPageProps {
  onBackToLanding?: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthPage({ onBackToLanding, initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Check for reset password hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#reset-password') {
      setMode('reset-password');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center py-6 sm:py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl" />
      </div>
      
      {/* Back to Landing Page Button - Fixed position */}
      {onBackToLanding && (
        <button
          onClick={onBackToLanding}
          className="fixed top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors group bg-white/80 backdrop-blur-sm px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg shadow-sm"
        >
          <ArrowLeft size={14} className="sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="hidden sm:inline">Back to home</span>
          <span className="sm:hidden">Back</span>
        </button>
      )}
      
      {/* Content wrapper - wider for register mode */}
      <div className={`w-full relative z-10 ${mode === 'register' ? 'max-w-6xl' : 'max-w-md'}`}>
        {mode === 'login' && (
          <LoginForm
            onSwitchToRegister={() => setMode('register')}
            onSwitchToForgotPassword={() => setMode('forgot-password')}
          />
        )}
        {mode === 'register' && (
          <RegisterForm onSwitchToLogin={() => setMode('login')} />
        )}
        {mode === 'forgot-password' && (
          <ForgotPasswordForm onBack={() => setMode('login')} />
        )}
        {mode === 'reset-password' && (
          <ResetPasswordForm />
        )}
      </div>
    </div>
  );
}