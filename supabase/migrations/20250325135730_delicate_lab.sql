/*
  # Fix infinite recursion in RLS policies

  1. Changes
    - Remove recursive admin checks
    - Use direct auth.uid() checks
    - Add admin check function
    - Simplify policies
    
  2. Security
    - Maintain proper access control
    - Fix infinite recursion issues
    - Keep existing functionality intact
*/

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM app_users
    WHERE id = user_id
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "View own record" ON app_users;
DROP POLICY IF EXISTS "Admin view all" ON app_users;
DROP POLICY IF EXISTS "Admin create" ON app_users;
DROP POLICY IF EXISTS "Admin update" ON app_users;
DROP POLICY IF EXISTS "Admin delete" ON app_users;

-- Create new simplified policies
CREATE POLICY "View own record"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admin access"
  ON app_users
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

-- Ensure first user is admin
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
