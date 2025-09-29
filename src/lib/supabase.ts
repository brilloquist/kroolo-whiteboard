import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type Database = {
  public: {
    Tables: {
      domains: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          domain_id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: 'admin' | 'member';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          domain_id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          role?: 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          domain_id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
      };
      whiteboards: {
        Row: {
          id: string;
          title: string;
          description: string;
          owner_id: string;
          domain_id: string;
          data: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          owner_id: string;
          domain_id: string;
          data?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          owner_id?: string;
          domain_id?: string;
          data?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
        };
      };
      whiteboard_shares: {
        Row: {
          id: string;
          whiteboard_id: string;
          user_id: string;
          permission: 'editor' | 'viewer' | 'commenter';
          created_at: string;
        };
        Insert: {
          id?: string;
          whiteboard_id: string;
          user_id: string;
          permission: 'editor' | 'viewer' | 'commenter';
          created_at?: string;
        };
        Update: {
          id?: string;
          whiteboard_id?: string;
          user_id?: string;
          permission?: 'editor' | 'viewer' | 'commenter';
          created_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          domain_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          domain_id: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          domain_id?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      group_whiteboard_shares: {
        Row: {
          id: string;
          whiteboard_id: string;
          group_id: string;
          permission: 'editor' | 'viewer' | 'commenter';
          created_at: string;
        };
        Insert: {
          id?: string;
          whiteboard_id: string;
          group_id: string;
          permission: 'editor' | 'viewer' | 'commenter';
          created_at?: string;
        };
        Update: {
          id?: string;
          whiteboard_id?: string;
          group_id?: string;
          permission?: 'editor' | 'viewer' | 'commenter';
          created_at?: string;
        };
      };
    };
  };
};