import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
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
      </div>
    </div>
  );
}