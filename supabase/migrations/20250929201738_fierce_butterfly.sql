/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current RLS policies on profiles table are causing infinite recursion
    - Policies are likely referencing the profiles table within their own definitions
    
  2. Solution
    - Drop all existing policies on profiles table
    - Create simple, non-recursive policies
    - Use direct auth.uid() comparisons without subqueries to profiles table
    
  3. Security
    - Users can read/update their own profile
    - Service role has full access for system operations
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Company members can read profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can read company profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update company profiles" ON profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);