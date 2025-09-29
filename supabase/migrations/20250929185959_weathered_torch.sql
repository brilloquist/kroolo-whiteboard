/*
  # Update RLS Policies for Comprehensive Security

  1. Security Updates
    - Enhanced RLS policies for all tables
    - Domain-based access control
    - Role-based permissions for admins
    - Proper sharing model implementation

  2. Policy Changes
    - Profiles: users can read/update own profile, admins can manage company profiles
    - Domains: read access for company members, service role for creation
    - Whiteboards: owner + shared access with proper role checking
    - Groups: company-scoped with admin/creator permissions
    - Shares: proper validation for same-company sharing

  3. Business Rules
    - First user becomes admin automatically
    - Domain enforcement for sharing
    - Role-based whiteboard access (editor/commenter/viewer)
*/

-- Drop existing policies to recreate them
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

DROP POLICY IF EXISTS "Users can create groups in their domain" ON groups;
DROP POLICY IF EXISTS "Users can read groups in their domain" ON groups;
DROP POLICY IF EXISTS "Group creators can delete their groups" ON groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;

DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can read group members in their domain" ON group_members;

DROP POLICY IF EXISTS "Users can read group shares for accessible whiteboards" ON group_whiteboard_shares;
DROP POLICY IF EXISTS "Whiteboard owners can manage group shares" ON group_whiteboard_shares;

-- Helper function to check if user is admin in their domain
CREATE OR REPLACE FUNCTION is_domain_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's domain_id
CREATE OR REPLACE FUNCTION get_user_domain_id(user_id uuid)
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT domain_id FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has whiteboard access
CREATE OR REPLACE FUNCTION has_whiteboard_access(whiteboard_id uuid, user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user is owner
  IF EXISTS (SELECT 1 FROM whiteboards WHERE id = whiteboard_id AND owner_id = user_id) THEN
    RETURN true;
  END IF;
  
  -- Check direct user shares
  IF EXISTS (
    SELECT 1 FROM whiteboard_shares 
    WHERE whiteboard_shares.whiteboard_id = has_whiteboard_access.whiteboard_id 
    AND user_id = has_whiteboard_access.user_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Check group shares
  IF EXISTS (
    SELECT 1 FROM group_whiteboard_shares gws
    JOIN group_members gm ON gws.group_id = gm.group_id
    WHERE gws.whiteboard_id = has_whiteboard_access.whiteboard_id 
    AND gm.user_id = has_whiteboard_access.user_id
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DOMAINS POLICIES
CREATE POLICY "Service role can manage domains"
  ON domains FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous can create domains during signup"
  ON domains FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can read their domain"
  ON domains FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT domain_id FROM profiles WHERE profiles.id = auth.uid())
  );

-- PROFILES POLICIES
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can read company profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    domain_id = get_user_domain_id(auth.uid()) 
    AND is_domain_admin(auth.uid())
  );

CREATE POLICY "Admins can update company profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    domain_id = get_user_domain_id(auth.uid()) 
    AND is_domain_admin(auth.uid())
  )
  WITH CHECK (
    domain_id = get_user_domain_id(auth.uid()) 
    AND is_domain_admin(auth.uid())
  );

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- WHITEBOARDS POLICIES
CREATE POLICY "Users can read accessible whiteboards"
  ON whiteboards FOR SELECT
  TO authenticated
  USING (
    domain_id = get_user_domain_id(auth.uid()) 
    AND (
      owner_id = auth.uid() 
      OR has_whiteboard_access(id, auth.uid())
    )
  );

CREATE POLICY "Users can create whiteboards in their domain"
  ON whiteboards FOR INSERT
  TO authenticated
  WITH CHECK (
    domain_id = get_user_domain_id(auth.uid()) 
    AND owner_id = auth.uid()
  );

CREATE POLICY "Owners and editors can update whiteboards"
  ON whiteboards FOR UPDATE
  TO authenticated
  USING (
    domain_id = get_user_domain_id(auth.uid()) 
    AND (
      owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM whiteboard_shares 
        WHERE whiteboard_id = id 
        AND user_id = auth.uid() 
        AND permission = 'editor'
      )
      OR EXISTS (
        SELECT 1 FROM group_whiteboard_shares gws
        JOIN group_members gm ON gws.group_id = gm.group_id
        WHERE gws.whiteboard_id = id 
        AND gm.user_id = auth.uid() 
        AND gws.permission = 'editor'
      )
    )
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
      WHERE domain_id = get_user_domain_id(auth.uid())
      AND has_whiteboard_access(id, auth.uid())
    )
  );

CREATE POLICY "Owners can manage whiteboard shares"
  ON whiteboard_shares FOR ALL
  TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE owner_id = auth.uid()
    )
    AND user_id IN (
      SELECT id FROM profiles 
      WHERE domain_id = get_user_domain_id(auth.uid())
    )
  );

-- GROUPS POLICIES
CREATE POLICY "Users can read company groups"
  ON groups FOR SELECT
  TO authenticated
  USING (domain_id = get_user_domain_id(auth.uid()));

CREATE POLICY "Admins and creators can manage groups"
  ON groups FOR ALL
  TO authenticated
  USING (
    domain_id = get_user_domain_id(auth.uid()) 
    AND (is_domain_admin(auth.uid()) OR created_by = auth.uid())
  )
  WITH CHECK (
    domain_id = get_user_domain_id(auth.uid()) 
    AND (is_domain_admin(auth.uid()) OR created_by = auth.uid())
  );

-- GROUP_MEMBERS POLICIES
CREATE POLICY "Users can read group members in their domain"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups 
      WHERE domain_id = get_user_domain_id(auth.uid())
    )
  );

CREATE POLICY "Admins and group creators can manage members"
  ON group_members FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups 
      WHERE domain_id = get_user_domain_id(auth.uid())
      AND (is_domain_admin(auth.uid()) OR created_by = auth.uid())
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups 
      WHERE domain_id = get_user_domain_id(auth.uid())
      AND (is_domain_admin(auth.uid()) OR created_by = auth.uid())
    )
    AND user_id IN (
      SELECT id FROM profiles 
      WHERE domain_id = get_user_domain_id(auth.uid())
    )
  );

-- GROUP_WHITEBOARD_SHARES POLICIES
CREATE POLICY "Users can read group shares for accessible whiteboards"
  ON group_whiteboard_shares FOR SELECT
  TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE domain_id = get_user_domain_id(auth.uid())
      AND has_whiteboard_access(id, auth.uid())
    )
  );

CREATE POLICY "Owners can manage group whiteboard shares"
  ON group_whiteboard_shares FOR ALL
  TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE owner_id = auth.uid()
    )
    AND group_id IN (
      SELECT id FROM groups 
      WHERE domain_id = get_user_domain_id(auth.uid())
    )
  );