import React from 'react';
import { useAuth } from './hooks/useAuth';
import DomainEntryPage from './components/auth/DomainEntryPage';
import AuthPage from './components/auth/AuthPage';
import OnboardingCompanySetup from './components/auth/OnboardingCompanySetup';
import Dashboard from './components/dashboard/Dashboard';

const App = () => {
  const { user, profile, domain, loading, needsOnboarding, selectedDomain } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Not authenticated - show domain entry or auth page
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

  // Fully authenticated and onboarded - show dashboard
  return <Dashboard />;
};

export default App;