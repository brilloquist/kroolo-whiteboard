import React, { useState } from 'react';
import { Layers3, ArrowRight, Building } from 'lucide-react';

interface DomainEntryPageProps {
  onDomainSubmit: (domain: string) => void;
}

const DomainEntryPage = ({ onDomainSubmit }: DomainEntryPageProps) => {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    try {
      // Clean up domain input
      const cleanDomain = domain.toLowerCase().trim().replace(/\s+/g, '-');
      onDomainSubmit(cleanDomain);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Logo and Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Layers3 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">kroolo</h1>
          <p className="text-gray-300 text-xl leading-relaxed">
            Enter your company domain to access your workspace
          </p>
        </div>

        {/* Domain Entry Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-white text-sm font-medium flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Company Domain</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm text-lg"
                  placeholder="acme-corp"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  .kroolo.com
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                This will be your unique workspace identifier
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !domain.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Checking...</span>
                </div>
              ) : (
                <>
                  <span>Continue to Workspace</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Don't have a workspace yet?{' '}
              <button
                type="button"
                onClick={() => onDomainSubmit('new')}
                className="text-blue-300 hover:text-blue-200 transition-colors font-medium"
              >
                Create one
              </button>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Your domain is how your team finds and accesses your shared whiteboards
          </p>
        </div>
      </div>
    </div>
  );
};

export default DomainEntryPage;