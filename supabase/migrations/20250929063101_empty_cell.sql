/*
  # Fix RLS policies to resolve infinite recursion and access issues

  1. Domains table
    - Allow anonymous SELECT for domain lookup during sign-in
    - Allow anonymous INSERT for domain creation during sign-up
    - Allow authenticated users to read domains

  2. Profiles table
    - Allow users to read their own profile (fixes infinite recursion)
    - Allow users to insert their own profile during sign-up
    - Allow users to update their own profile

  3. Remove problematic policies that cause recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow anonymous read access to domains" ON domains;
DROP POLICY IF EXISTS "Allow anonymous insert access to domains" ON domains;
DROP POLICY IF EXISTS "Domains are publicly readable" ON domains;
DROP POLICY IF EXISTS "Users can read profiles in their domain" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Domains table policies
CREATE POLICY "Anonymous can read domains for auth"
  ON domains
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can create domains during signup"
  ON domains
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read domains"
  ON domains
  FOR SELECT
  TO authenticated
  USING (true);

-- Profiles table policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);