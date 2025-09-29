import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthPage from './components/auth/AuthPage';
import OnboardingCompanySetup from './components/auth/OnboardingCompanySetup';
import Dashboard from './components/dashboard/Dashboard';
import DomainEntryPage from './components/auth/DomainEntryPage';

const AppContent = () => {
  const { user, profile, domain, loading, needsOnboarding, selectedDomain } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (!selectedDomain) {
      return <DomainEntryPage />;
    }
    return <AuthPage domain={selectedDomain} />;
  }

  // Authenticated but needs onboarding
  if (needsOnboarding || !profile || !domain) {
    return <OnboardingCompanySetup />;
  }

  // Fully authenticated and onboarded
  return <Dashboard />;
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;