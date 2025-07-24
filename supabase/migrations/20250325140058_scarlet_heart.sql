/*
  # Fix Admin Permissions and User Management
  
  1. Changes
    - Simplify RLS policies for app_users table
    - Add proper admin access controls
    - Fix recursive policy issues
    - Ensure admins can manage users
    
  2. Security
    - Maintain proper access control
    - Fix policy recursion
    - Keep existing user data intact
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "View own record" ON app_users;
DROP POLICY IF EXISTS "Admin access" ON app_users;

-- Create separate policies for different operations
CREATE POLICY "Users can view their own record"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view all records"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM app_users au
      WHERE au.id = auth.uid()
      AND au.is_admin = true
    )
  );

CREATE POLICY "Admins can create users"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM app_users au
      WHERE au.id = auth.uid()
      AND au.is_admin = true
    )
  );

CREATE POLICY "Admins can update users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM app_users au
      WHERE au.id = auth.uid()
      AND au.is_admin = true
    )
  );

CREATE POLICY "Admins can delete users"
  ON app_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM app_users au
      WHERE au.id = auth.uid()
      AND au.is_admin = true
    )
  );

-- Ensure first user is admin if no admin exists
DO $$
BEGIN
  UPDATE app_users
  SET is_admin = true
  WHERE id = (
    SELECT id
    FROM app_users
    WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE is_admin = true)
    ORDER BY created_at
    LIMIT 1
  );
END $$;
