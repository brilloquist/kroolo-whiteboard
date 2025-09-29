import React, { useState, useEffect } from 'react';
import { Layers3, Building, Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const DomainEntryPage = () => {
  const { setSelectedDomain } = useAuth();
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [customDomain, setCustomDomain] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data?.map(d => d.name) || []);
    } catch (error) {
      console.error('Error loading domains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
  };

  const handleCustomDomain = () => {
    if (customDomain.trim()) {
      setSelectedDomain(customDomain.trim());
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
          <p className="text-gray-300 text-lg">Choose your workspace</p>
        </div>

        {/* Domain Selection Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {loading ? (
            <div className="text-center text-white">Loading workspaces...</div>
          ) : (
            <div className="space-y-4">
              {domains.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-medium mb-3">Existing Workspaces</h3>
                  {domains.map(domain => (
                    <button
                      key={domain}
                      onClick={() => handleDomainSelect(domain)}
                      className="w-full flex items-center space-x-3 p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-left"
                    >
                      <Building className="h-5 w-5 text-blue-400" />
                      <span className="text-white">{domain}</span>
                    </button>
                  ))}
                </div>
              )}

              {domains.length > 0 && <div className="border-t border-white/20 pt-4" />}

              {!showCustomInput ? (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-colors"
                >
                  <Plus className="h-5 w-5 text-white" />
                  <span className="text-white font-medium">Create New Workspace</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="Enter your company domain"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCustomDomain}
                      disabled={!customDomain.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomDomain('');
                      }}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DomainEntryPage;