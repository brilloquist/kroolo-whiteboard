import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/dashboard/Dashboard';

const AppContent = () => {
  const { user, profile } = useAuth();

  console.log('AppContent render - user:', !!user, 'profile:', !!profile);

  // Show dashboard if user is authenticated and has profile
  if (user && profile) {
    console.log('Showing dashboard');
    return <Dashboard />;
  }

  // Show auth page for unauthenticated users or users without profile
  console.log('Showing auth page');
  return <AuthPage />;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;