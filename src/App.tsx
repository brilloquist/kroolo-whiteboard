import React from 'react';
import { useAuth } from './hooks/useAuth';
import DomainEntryPage from './components/auth/DomainEntryPage';
import OnboardingCompanySetup from './components/auth/OnboardingCompanySetup';
import Dashboard from './components/dashboard/Dashboard';

const AppContent = () => {
  const { user, profile, domain, needsOnboarding } = useAuth();

  console.log('AppContent render - user:', !!user, 'profile:', !!profile, 'domain:', !!domain, 'needsOnboarding:', needsOnboarding);

  // Show onboarding if user needs to set up company
  if (user && profile && needsOnboarding) {
    console.log('Showing onboarding');
    return <OnboardingCompanySetup />;
  }

  // Show dashboard if user is authenticated and has profile and domain
  if (user && profile && domain) {
    console.log('Showing dashboard');
    return <Dashboard />;
  }

  // Show domain entry for unauthenticated users
  console.log('Showing domain entry');
  return <DomainEntryPage />;
};

const App = () => {
  return <AppContent />;
};

export default App;