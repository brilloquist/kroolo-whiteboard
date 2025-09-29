import React, { useState } from 'react';
import { Layers3, Eye, EyeOff, Mail, User, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';

import AuthPage from './components/auth/AuthPage';
import OnboardingCompanySetup from './components/auth/OnboardingCompanySetup';
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user created');

      // Step 2: Create or get domain
      const domainName = companyName.toLowerCase().replace(/\s+/g, '-');
      
      let domainId: string;
      const { data: existingDomain } = await supabase
        .from('domains')
        .select('id')
        .eq('name', domainName)
        .maybeSingle();

      if (existingDomain) {
        domainId = existingDomain.id;
      } else {
        const { data: newDomain, error: domainError } = await supabase
          .from('domains')
          .insert({
            name: domainName,
            display_name: companyName,
          })
          .select('id')
          .single();

        if (domainError) throw domainError;
        domainId = newDomain.id;
      }

      // Step 3: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          domain_id: domainId,
          email,
          full_name: fullName,
          role: 'member',
        });

      if (profileError) throw profileError;

      // Step 4: Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

    } catch (error: any) {
      console.error('Sign up error:', error);
      if (error.message === 'User already registered') {
        setError('This email is already registered. Please switch to the "Sign In" tab.');
      } else {
        setError(error.message || 'Sign up failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.message === 'Invalid login credentials') {
        setError('Invalid email or password. Please check your credentials or create an account if you haven\'t already.');
      } else {
        setError(error.message || 'Sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Layers3 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">kroolo</h1>
          <p className="text-gray-300 text-lg">
            {isSignUp ? 'Create your workspace' : 'Welcome back'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-white text-sm font-medium flex items-center space-x-2">
                    <Building className="h-4 w-4" />
                    <span>Company Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                    placeholder="Acme Corporation"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-white text-sm font-medium flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                placeholder="john@company.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                isSignUp ? 'Create Workspace' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setEmail('');
                setPassword('');
                setFullName('');
                setCompanyName('');
  const { user, profile, domain, needsOnboarding } = useAuth();
              className="text-blue-300 hover:text-blue-200 text-sm transition-colors"
  console.log('AppContent render - user:', !!user, 'profile:', !!profile, 'domain:', !!domain, 'needsOnboarding:', needsOnboarding);
              {isSignUp 
  // Show onboarding if user needs to set up company
  if (user && profile && needsOnboarding) {
    console.log('Showing onboarding');
    return <OnboardingCompanySetup />;
  }

  // Show dashboard if user is authenticated and has profile and domain
  if (user && profile && domain) {
              }
            </button>
          </div>
        </div>
  // Show domain entry for unauthenticated users
    </div>
  return <DomainEntryPage />;
};

export default AuthPage;