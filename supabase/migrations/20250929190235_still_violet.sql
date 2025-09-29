/*
  # Comprehensive RLS Policies and Business Rules

  1. New Tables
    - `invite_tokens` for domain-limited invite links
    - Updated RLS policies for all existing tables

  2. Security
    - Comprehensive RLS policies for cross-company data protection
    - Domain enforcement at database level
    - Admin privilege management

  3. Business Rules
    - Company-scoped data access
    - Role-based permissions (admin/member)
    - Sharing permissions (editor/commenter/viewer)
*/

-- Create invite_tokens table for future invite link functionality
CREATE TABLE IF NOT EXISTS invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  whiteboard_id uuid REFERENCES whiteboards(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('editor', 'viewer', 'commenter')),
  expires_at timestamptz NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anonymous can create domains during signup" ON domains;
DROP POLICY IF EXISTS "Anonymous can read domains for auth" ON domains;
DROP POLICY IF EXISTS "Authenticated users can read domains" ON domains;

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

DROP POLICY IF EXISTS "Users can create whiteboards in their domain" ON whiteboards;
DROP POLICY IF EXISTS "Users can read whiteboards in their domain" ON whiteboards;
DROP POLICY IF EXISTS "Whiteboard owners can delete their whiteboards" ON whiteboards;
DROP POLICY IF EXISTS "Whiteboard owners can update their whiteboards" ON whiteboards;

DROP POLICY IF EXISTS "Users can read shares for accessible whiteboards" ON whiteboard_shares;
DROP POLICY IF EXISTS "Whiteboard owners can manage shares" ON whiteboard_shares;

DROP POLICY IF EXISTS "Group creators can delete their groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups in their domain" ON groups;
DROP POLICY IF EXISTS "Users can read groups in their domain" ON groups;

DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can read group members in their domain" ON group_members;

DROP POLICY IF EXISTS "Users can read group shares for accessible whiteboards" ON group_whiteboard_shares;
DROP POLICY IF EXISTS "Whiteboard owners can manage group shares" ON group_whiteboard_shares;

-- DOMAINS POLICIES
CREATE POLICY "Public can read domains for auth"
  ON domains FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service role can manage domains"
  ON domains FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- PROFILES POLICIES
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read company profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update company profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    domain_id IN (
      SELECT domain_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    domain_id IN (
      SELECT domain_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- WHITEBOARDS POLICIES
CREATE POLICY "Users can read accessible whiteboards"
  ON whiteboards FOR SELECT
  TO authenticated
  USING (
    -- Same company
    domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    AND (
      -- Owner
      owner_id = auth.uid()
      -- Directly shared
      OR id IN (
        SELECT whiteboard_id FROM whiteboard_shares 
        WHERE user_id = auth.uid()
      )
      -- Shared via group
      OR id IN (
        SELECT gws.whiteboard_id 
        FROM group_whiteboard_shares gws
        JOIN group_members gm ON gws.group_id = gm.group_id
        WHERE gm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create whiteboards in their company"
  ON whiteboards FOR INSERT
  TO authenticated
  WITH CHECK (
    domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    AND owner_id = auth.uid()
  );

CREATE POLICY "Owners and editors can update whiteboards"
  ON whiteboards FOR UPDATE
  TO authenticated
  USING (
    domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    AND (
      owner_id = auth.uid()
      OR id IN (
        SELECT whiteboard_id FROM whiteboard_shares 
        WHERE user_id = auth.uid() AND permission = 'editor'
      )
      OR id IN (
        SELECT gws.whiteboard_id 
        FROM group_whiteboard_shares gws
        JOIN group_members gm ON gws.group_id = gm.group_id
        WHERE gm.user_id = auth.uid() AND gws.permission = 'editor'
      )
    )
  )
  WITH CHECK (
    domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Only owners can delete whiteboards"
  ON whiteboards FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- WHITEBOARD_SHARES POLICIES
CREATE POLICY "Users can read shares for accessible whiteboards"
  ON whiteboard_shares FOR SELECT
  TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Owners can manage whiteboard shares"
  ON whiteboard_shares FOR ALL
  TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    whiteboard_id IN (
      SELECT id FROM whiteboards WHERE owner_id = auth.uid()
    )
    AND user_id IN (
      SELECT id FROM profiles 
      WHERE domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    )
  );

-- GROUPS POLICIES
CREATE POLICY "Users can read company groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create groups in their company"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (
    domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Group creators and admins can update groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR domain_id IN (
      SELECT domain_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Group creators and admins can delete groups"
  ON groups FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR domain_id IN (
      SELECT domain_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- GROUP_MEMBERS POLICIES
CREATE POLICY "Users can read group members in their company"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups 
      WHERE domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Group creators and admins can manage members"
  ON group_members FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups 
      WHERE created_by = auth.uid()
      OR domain_id IN (
        SELECT domain_id FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups 
      WHERE domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    )
    AND user_id IN (
      SELECT id FROM profiles 
      WHERE domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    )
  );

-- GROUP_WHITEBOARD_SHARES POLICIES
CREATE POLICY "Users can read group shares for accessible whiteboards"
  ON group_whiteboard_shares FOR SELECT
  TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Owners can manage group whiteboard shares"
  ON group_whiteboard_shares FOR ALL
  TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    whiteboard_id IN (
      SELECT id FROM whiteboards WHERE owner_id = auth.uid()
    )
    AND group_id IN (
      SELECT id FROM groups 
      WHERE domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    )
  );

-- INVITE_TOKENS POLICIES
CREATE POLICY "Users can read invite tokens for their company"
  ON invite_tokens FOR SELECT
  TO authenticated
  USING (
    domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Whiteboard owners can manage invite tokens"
  ON invite_tokens FOR ALL
  TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards WHERE owner_id = auth.uid()
    )
    OR (whiteboard_id IS NULL AND created_by = auth.uid())
  )
  WITH CHECK (
    domain_id IN (SELECT domain_id FROM profiles WHERE id = auth.uid())
    AND created_by = auth.uid()
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_domain_id ON profiles(domain_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_domain_id ON whiteboards(domain_id);
CREATE INDEX IF NOT EXISTS idx_whiteboards_owner_id ON whiteboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_shares_whiteboard_id ON whiteboard_shares(whiteboard_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_shares_user_id ON whiteboard_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_domain_id ON groups(domain_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_domain_id ON invite_tokens(domain_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token);