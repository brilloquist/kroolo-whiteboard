import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  domain_id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

interface Domain {
  id: string;
  name: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  domain: Domain | null;
  loading: boolean;
  needsOnboarding: boolean;
  selectedDomain: string | null;
  setSelectedDomain: (domain: string | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setDomain(null);
        setNeedsOnboarding(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Load profile with domain information
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          domains (*)
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        // User might need onboarding if profile doesn't exist
        setNeedsOnboarding(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setDomain(profileData.domains);
      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setNeedsOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setDomain(null);
    setNeedsOnboarding(false);
    setSelectedDomain(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    domain,
    loading,
    needsOnboarding,
    selectedDomain,
    setSelectedDomain,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};