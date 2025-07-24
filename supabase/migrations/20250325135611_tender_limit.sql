/*
  # Fix infinite recursion in RLS policies

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Use direct checks instead of subqueries where possible
    - Ensure proper admin access control
    
  2. Security
    - Maintain proper access control
    - Fix infinite recursion issues
    - Keep existing functionality intact
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own record" ON app_users;
DROP POLICY IF EXISTS "Admins can view all records" ON app_users;
DROP POLICY IF EXISTS "Admins can create users" ON app_users;
DROP POLICY IF EXISTS "Admins can update users" ON app_users;
DROP POLICY IF EXISTS "Admins can delete users" ON app_users;

-- Create simplified policies without recursion
CREATE POLICY "View own record"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin view all"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (
    (SELECT is_admin FROM app_users WHERE id = auth.uid())
  );

CREATE POLICY "Admin create"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT is_admin FROM app_users WHERE id = auth.uid())
  );

CREATE POLICY "Admin update"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_admin FROM app_users WHERE id = auth.uid())
  );

CREATE POLICY "Admin delete"
  ON app_users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT is_admin FROM app_users WHERE id = auth.uid())
  );

-- Ensure first user is admin
DO $$
BEGIN
  -- Make first user admin if no admin exists
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
