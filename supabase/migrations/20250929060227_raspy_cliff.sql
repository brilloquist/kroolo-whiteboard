/*
  # Kroolo Whiteboarding App Initial Schema

  1. New Tables
    - `domains` - Company/organization domains
    - `profiles` - User profiles linked to domains
    - `whiteboards` - Whiteboard data and metadata
    - `whiteboard_shares` - Sharing permissions for whiteboards
    - `groups` - User groups within domains
    - `group_members` - Users belonging to groups
    - `group_whiteboard_shares` - Group-based whiteboard sharing

  2. Security
    - Enable RLS on all tables
    - Add policies for domain-based access control
    - Ensure users can only access data from their domain

  3. Features
    - Domain-based user registration and authentication
    - Role-based whiteboard sharing (editor, viewer, commenter)
    - Group management for bulk permissions
    - Whiteboard ownership and collaboration tracking
*/

-- Domains table for company/organization management
CREATE TABLE IF NOT EXISTS domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profiles table extending Supabase auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id uuid REFERENCES domains(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(email, domain_id)
);

-- Whiteboards table
CREATE TABLE IF NOT EXISTS whiteboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  domain_id uuid REFERENCES domains(id) ON DELETE CASCADE NOT NULL,
  data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Whiteboard sharing permissions
CREATE TABLE IF NOT EXISTS whiteboard_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whiteboard_id uuid REFERENCES whiteboards(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  permission text NOT NULL CHECK (permission IN ('editor', 'viewer', 'commenter')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(whiteboard_id, user_id)
);

-- Groups for bulk permission management
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  domain_id uuid REFERENCES domains(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, domain_id)
);

-- Group membership
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group-based whiteboard sharing
CREATE TABLE IF NOT EXISTS group_whiteboard_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whiteboard_id uuid REFERENCES whiteboards(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  permission text NOT NULL CHECK (permission IN ('editor', 'viewer', 'commenter')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(whiteboard_id, group_id)
);

-- Enable Row Level Security
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_whiteboard_shares ENABLE ROW LEVEL SECURITY;

-- Domains policies (public read for registration, admin write)
CREATE POLICY "Domains are publicly readable" ON domains
  FOR SELECT TO authenticated
  USING (true);

-- Profiles policies
CREATE POLICY "Users can read profiles in their domain" ON profiles
  FOR SELECT TO authenticated
  USING (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Whiteboards policies
CREATE POLICY "Users can read whiteboards in their domain" ON whiteboards
  FOR SELECT TO authenticated
  USING (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    )
    AND (
      owner_id = auth.uid()
      OR id IN (
        SELECT whiteboard_id FROM whiteboard_shares WHERE user_id = auth.uid()
      )
      OR id IN (
        SELECT gws.whiteboard_id 
        FROM group_whiteboard_shares gws
        JOIN group_members gm ON gws.group_id = gm.group_id
        WHERE gm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create whiteboards in their domain" ON whiteboards
  FOR INSERT TO authenticated
  WITH CHECK (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    )
    AND owner_id = auth.uid()
  );

CREATE POLICY "Whiteboard owners can update their whiteboards" ON whiteboards
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Whiteboard owners can delete their whiteboards" ON whiteboards
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Whiteboard shares policies
CREATE POLICY "Users can read shares for accessible whiteboards" ON whiteboard_shares
  FOR SELECT TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Whiteboard owners can manage shares" ON whiteboard_shares
  FOR ALL TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    whiteboard_id IN (
      SELECT id FROM whiteboards WHERE owner_id = auth.uid()
    )
  );

-- Groups policies
CREATE POLICY "Users can read groups in their domain" ON groups
  FOR SELECT TO authenticated
  USING (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups in their domain" ON groups
  FOR INSERT TO authenticated
  WITH CHECK (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Group creators can update their groups" ON groups
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Group creators can delete their groups" ON groups
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Group members policies
CREATE POLICY "Users can read group members in their domain" ON group_members
  FOR SELECT TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups 
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Group creators can manage members" ON group_members
  FOR ALL TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
  );

-- Group whiteboard shares policies
CREATE POLICY "Users can read group shares for accessible whiteboards" ON group_whiteboard_shares
  FOR SELECT TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Whiteboard owners can manage group shares" ON group_whiteboard_shares
  FOR ALL TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    whiteboard_id IN (
      SELECT id FROM whiteboards WHERE owner_id = auth.uid()
    )
  );

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whiteboards_updated_at BEFORE UPDATE ON whiteboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();