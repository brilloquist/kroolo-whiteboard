import React, { useState } from 'react';
import { Layers3, Building, Upload, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const OnboardingCompanySetup = () => {
  const { profile, domain } = useAuth();
  const [companyName, setCompanyName] = useState(domain?.display_name || '');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !domain) return;

    setLoading(true);
    setError('');

    try {
      // Update domain with company name
      const { error: domainError } = await supabase
        .from('domains')
        .update({
          display_name: companyName.trim(),
        })
        .eq('id', domain.id);

      if (domainError) throw domainError;

      // Upload logo if provided
      if (logo && profile) {
        const fileExt = logo.name.split('.').pop();
        const fileName = `${domain.id}/logo.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, logo, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          // Don't fail the whole process for logo upload
        }
      }

      // Refresh the page to load updated data
      window.location.reload();

    } catch (error: any) {
      console.error('Company setup error:', error);
      setError(error.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Layers3 className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Welcome to kroolo</h1>
          <p className="text-gray-300 text-xl leading-relaxed">
            Let's set up your workspace
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-white text-sm font-medium flex items-center space-x-2">
                <Building className="h-4 w-4" />
                <span>Company Name</span>
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm text-lg"
                placeholder="Acme Corporation"
              />
            </div>

            <div className="space-y-3">
              <label className="text-white text-sm font-medium flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Company Logo (Optional)</span>
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/10 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors"
                  >
                    Choose File
                  </label>
                  <p className="text-gray-400 text-sm mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !companyName.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Setting up...</span>
                </div>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  <span>Complete Setup</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              You can change these settings later in your workspace
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCompanySetup;