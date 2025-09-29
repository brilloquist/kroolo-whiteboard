import React, { useState } from 'react';
import { Layers3, ArrowRight, Building } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AuthPage from './AuthPage';

const DomainEntryPage = () => {
  const { selectedDomain, setSelectedDomain } = useAuth();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);

  // If domain is selected, show auth page
  if (selectedDomain) {
    return <AuthPage domain={selectedDomain} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    try {
      // Clean up domain input
      const cleanDomain = domain.toLowerCase().trim().replace(/\s+/g, '-');
      setSelectedDomain(cleanDomain);
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
            Enter your workspace domain
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-white text-sm font-medium flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Workspace Domain</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm pr-32"
                  placeholder="your-company"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  .kroolo.com
                </div>
              </div>
              <p className="text-gray-400 text-xs">
                Enter your company's workspace domain
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !domain.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have a workspace yet?{' '}
              <button
                type="button"
                onClick={() => setSelectedDomain('new')}
                className="text-blue-300 hover:text-blue-200 transition-colors font-medium"
              >
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DomainEntryPage;