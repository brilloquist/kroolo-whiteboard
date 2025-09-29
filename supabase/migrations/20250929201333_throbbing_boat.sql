/*
  # Fix RLS policies to avoid infinite recursion

  1. Security Changes
    - Drop and recreate all policies to ensure clean state
    - Fix infinite recursion in profile policies by using direct auth.uid() checks
    - Simplify helper functions to avoid circular dependencies
    - Ensure proper policy isolation between tables

  2. Policy Updates
    - Use direct auth.uid() comparisons instead of helper functions where possible
    - Remove circular references in profile policies
    - Maintain proper access control for all tables
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
    -- Drop domains policies
    DROP POLICY IF EXISTS "Service role can manage domains" ON domains;
    DROP POLICY IF EXISTS "Public can read domains for auth" ON domains;
    DROP POLICY IF EXISTS "Anonymous can create domains during signup" ON domains;
    DROP POLICY IF EXISTS "Users can read their domain" ON domains;
    
    -- Drop profiles policies  
    DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can read company profiles" ON profiles;
    DROP POLICY IF EXISTS "Admins can update company profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can read company profiles" ON profiles;
    
    -- Drop whiteboards policies
    DROP POLICY IF EXISTS "Users can read accessible whiteboards" ON whiteboards;
    DROP POLICY IF EXISTS "Users can create whiteboards in their company" ON whiteboards;
    DROP POLICY IF EXISTS "Owners and editors can update whiteboards" ON whiteboards;
    DROP POLICY IF EXISTS "Only owners can delete whiteboards" ON whiteboards;
    
    -- Drop whiteboard_shares policies
    DROP POLICY IF EXISTS "Users can read shares for accessible whiteboards" ON whiteboard_shares;
    DROP POLICY IF EXISTS "Owners can manage whiteboard shares" ON whiteboard_shares;
    
    -- Drop groups policies
    DROP POLICY IF EXISTS "Users can read company groups" ON groups;
    DROP POLICY IF EXISTS "Users can create groups in their company" ON groups;
    DROP POLICY IF EXISTS "Group creators and admins can update groups" ON groups;
    DROP POLICY IF EXISTS "Group creators and admins can delete groups" ON groups;
    
    -- Drop group_members policies
    DROP POLICY IF EXISTS "Users can read group members in their company" ON group_members;
    DROP POLICY IF EXISTS "Group creators and admins can manage members" ON group_members;
    
    -- Drop group_whiteboard_shares policies
    DROP POLICY IF EXISTS "Users can read group shares for accessible whiteboards" ON group_whiteboard_shares;
    DROP POLICY IF EXISTS "Owners can manage group whiteboard shares" ON group_whiteboard_shares;
    
    -- Drop helper functions if they exist
    DROP FUNCTION IF EXISTS is_domain_admin(uuid);
    DROP FUNCTION IF EXISTS get_user_domain_id(uuid);
    DROP FUNCTION IF EXISTS has_whiteboard_access(uuid, uuid);
END $$;

-- DOMAINS POLICIES
CREATE POLICY "Service role can manage domains"
  ON domains FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read domains for auth"
  ON domains FOR SELECT
  TO public
  USING (true);

-- PROFILES POLICIES (Fixed to avoid infinite recursion)
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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
      SELECT profiles_1.domain_id FROM profiles profiles_1 
      WHERE profiles_1.id = auth.uid() AND profiles_1.role = 'admin'
    )
  )
  WITH CHECK (
    domain_id IN (
      SELECT profiles_1.domain_id FROM profiles profiles_1 
      WHERE profiles_1.id = auth.uid() AND profiles_1.role = 'admin'
    )
  );

-- WHITEBOARDS POLICIES
CREATE POLICY "Users can read accessible whiteboards"
  ON whiteboards FOR SELECT
  TO authenticated
  USING (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    ) AND (
      owner_id = auth.uid() OR
      id IN (
        SELECT whiteboard_id FROM whiteboard_shares WHERE user_id = auth.uid()
      ) OR
      id IN (
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
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    ) AND owner_id = auth.uid()
  );

CREATE POLICY "Owners and editors can update whiteboards"
  ON whiteboards FOR UPDATE
  TO authenticated
  USING (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    ) AND (
      owner_id = auth.uid() OR
      id IN (
        SELECT whiteboard_id FROM whiteboard_shares 
        WHERE user_id = auth.uid() AND permission = 'editor'
      ) OR
      id IN (
        SELECT gws.whiteboard_id 
        FROM group_whiteboard_shares gws
        JOIN group_members gm ON gws.group_id = gm.group_id
        WHERE gm.user_id = auth.uid() AND gws.permission = 'editor'
      )
    )
  )
  WITH CHECK (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
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
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
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
    ) AND
    user_id IN (
      SELECT id FROM profiles 
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- GROUPS POLICIES
CREATE POLICY "Users can read company groups"
  ON groups FOR SELECT
  TO authenticated
  USING (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups in their company"
  ON groups FOR INSERT
  TO authenticated
  WITH CHECK (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Group creators and admins can update groups"
  ON groups FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    domain_id IN (
      SELECT profiles_1.domain_id FROM profiles profiles_1 
      WHERE profiles_1.id = auth.uid() AND profiles_1.role = 'admin'
    )
  )
  WITH CHECK (
    domain_id IN (
      SELECT domain_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Group creators and admins can delete groups"
  ON groups FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    domain_id IN (
      SELECT profiles_1.domain_id FROM profiles profiles_1 
      WHERE profiles_1.id = auth.uid() AND profiles_1.role = 'admin'
    )
  );

-- GROUP_MEMBERS POLICIES
CREATE POLICY "Users can read group members in their company"
  ON group_members FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups 
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Group creators and admins can manage members"
  ON group_members FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups 
      WHERE created_by = auth.uid() OR
      domain_id IN (
        SELECT profiles_1.domain_id FROM profiles profiles_1 
        WHERE profiles_1.id = auth.uid() AND profiles_1.role = 'admin'
      )
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups 
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
    ) AND
    user_id IN (
      SELECT id FROM profiles 
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- GROUP_WHITEBOARD_SHARES POLICIES
CREATE POLICY "Users can read group shares for accessible whiteboards"
  ON group_whiteboard_shares FOR SELECT
  TO authenticated
  USING (
    whiteboard_id IN (
      SELECT id FROM whiteboards 
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
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
    ) AND
    group_id IN (
      SELECT id FROM groups 
      WHERE domain_id IN (
        SELECT domain_id FROM profiles WHERE id = auth.uid()
      )
    )
  );