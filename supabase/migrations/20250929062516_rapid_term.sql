/*
  # Fix domains table RLS policy

  1. Security
    - Add policy to allow authenticated users to insert domains during signup
    - This enables new domain creation when users sign up for new companies
*/

-- Allow authenticated users to insert new domains during signup
CREATE POLICY "Allow authenticated users to insert domains"
  ON domains
  FOR INSERT
  TO authenticated
  WITH CHECK (true);