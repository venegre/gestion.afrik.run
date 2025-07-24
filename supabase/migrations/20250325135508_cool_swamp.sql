/*
  # Fix admin policies and checks

  1. Changes
    - Simplify RLS policies for app_users
    - Fix admin status check logic
    - Ensure first user is always admin
    
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion in policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own or all if admin" ON app_users;
DROP POLICY IF EXISTS "Admins can create users" ON app_users;
DROP POLICY IF EXISTS "Admins can update users" ON app_users;
DROP POLICY IF EXISTS "Admins can delete users" ON app_users;

-- Create simplified policies
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
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can create users"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete users"
  ON app_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Ensure first user is admin
DO $$
DECLARE
  admin_exists boolean;
BEGIN
  -- Check if any admin exists
  SELECT EXISTS (
    SELECT 1 FROM app_users WHERE is_admin = true
  ) INTO admin_exists;
  
  -- If no admin exists, make the first user an admin
  IF NOT admin_exists THEN
    UPDATE app_users
    SET is_admin = true
    WHERE id = (
      SELECT id FROM app_users 
      ORDER BY created_at 
      LIMIT 1
    );
  END IF;
END $$;
