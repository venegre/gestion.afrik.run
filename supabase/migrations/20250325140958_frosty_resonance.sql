/*
  # Fix recursive admin policies

  1. Changes
    - Remove recursive admin policies
    - Create non-recursive policies for admin access
    - Simplify policy structure
*/

-- Drop existing policies
DROP POLICY IF EXISTS "View own record" ON app_users;
DROP POLICY IF EXISTS "Admin access" ON app_users;

-- Create new non-recursive policies
CREATE POLICY "Enable read access for users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    is_admin = true
  );

CREATE POLICY "Enable insert for admins only"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin = true);

CREATE POLICY "Enable update for admins only"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (is_admin = true)
  WITH CHECK (is_admin = true);

CREATE POLICY "Enable delete for admins only"
  ON app_users
  FOR DELETE
  TO authenticated
  USING (is_admin = true);
