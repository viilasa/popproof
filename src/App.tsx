import React from 'react';
import { AuthProvider } from './components/auth/AuthProvider';
import { AuthGuard } from './components/auth/AuthGuard';
import { AuthPage } from './components/auth/AuthPage';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <AuthProvider>
      <AuthGuard fallback={<AuthPage />}>
        <Dashboard />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;