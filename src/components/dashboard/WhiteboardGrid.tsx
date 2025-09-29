import React, { useState } from 'react';
import { Layers3, Eye, EyeOff, Mail, User, Building } from 'lucide-react';

interface AuthPageProps {
}

const AuthPage = ({ domain }: AuthPageProps) => {
  const { setSelectedDomain } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
    setError('');

    try {
      // Validate email domain matches selected domain (unless creating new)
      if (!isNewDomain) {
        const emailDomain = email.split('@')[1];
        if (emailDomain !== domain) {
          throw new Error(`Email must be from @${domain} domain`);
        }
      }

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user created');

      // Step 2: Call edge function to create company and profile
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          domain: isNewDomain ? email.split('@')[1] : domain,
          displayName: isNewDomain ? companyName : domain,
          userEmail: email,
          userId: authData.user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create company');
      }

      // Step 3: Sign in the user
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => setSelectedDomain(null)}
            className="mb-4 text-blue-300 hover:text-blue-200 text-sm transition-colors"
          className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg group cursor-pointer"
            ← Back to domain selection
          </button>
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Layout className="h-8 w-8 text-white opacity-60" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">kroolo</h1>
          <p className="text-gray-300 text-lg">
            {isSignUp 
              ? (isNewDomain ? 'Create your workspace' : `Join ${domain}`)
              : `Sign in to ${domain === 'new' ? 'your workspace' : domain}`
            }
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

                {isNewDomain && (
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
                )}
              </>
            )}

            <div className="space-y-2">
              <div className="flex-1 min-w-0">
                <div className="text-gray-500 text-xs truncate">
                  {whiteboard.owner?.full_name}
                </div>
                <div className="text-gray-500 text-xs">
                  {formatDate(whiteboard.updated_at)}
                </div>
              </div>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                placeholder={isNewDomain ? "john@company.com" : `john@${domain}`}
                <div className="relative ml-2">
              {!isNewDomain && (
                <p className="text-gray-400 text-sm">
                  Must be an @{domain} email address
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="mb-3">
                <AvatarList
                  users={whiteboard.collaborators}
                  maxVisible={3}
                  size="sm"
                  onClick={() => onShare(whiteboard.id)}
                />
  );
};

export default AuthPage;