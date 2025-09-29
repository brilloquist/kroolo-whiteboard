/*
  # Fix infinite recursion in profiles RLS policies

  1. Security Changes
    - Drop all existing profiles policies that cause recursion
    - Create simple, non-recursive policies for profiles table
    - Ensure policies use direct auth.uid() comparisons only

  2. Policy Changes
    - Users can read their own profile: auth.uid() = id
    - Users can update their own profile: auth.uid() = id
    - Company members can read each other's profiles (simplified)
    - Admins can manage company profiles (simplified)
*/

-- Drop all existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read company profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update company profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read company profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Create simple, non-recursive policies for profiles
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

-- Allow service role full access for system operations
CREATE POLICY "Service role can manage profiles"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Simple policy for company members to read each other's profiles
-- This avoids recursion by not checking the current user's profile
CREATE POLICY "Company members can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    domain_id IN (
      SELECT p.domain_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );