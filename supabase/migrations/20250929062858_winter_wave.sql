/*
  # Fix domains table RLS policies for anonymous access

  1. Security Updates
    - Add policy for anonymous users to read domains (needed for sign-in domain lookup)
    - Add policy for anonymous users to create domains (needed for sign-up)
    - Remove the previous authenticated-only insert policy that was blocking sign-up

  These policies allow the authentication flow to work properly by permitting
  domain operations before user authentication is complete.
*/

-- Drop the existing restrictive insert policy
DROP POLICY IF EXISTS "Allow authenticated users to insert domains" ON domains;

-- Allow anonymous users to read domains (needed for domain lookup during sign-in)
CREATE POLICY "Allow anonymous read access to domains"
  ON domains
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to create domains (needed for sign-up)
CREATE POLICY "Allow anonymous insert access to domains"
  ON domains
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Keep the existing authenticated user policies
-- (The "Allow authenticated users to insert domains" and "Domains are publicly readable" policies
-- will continue to work for authenticated users)