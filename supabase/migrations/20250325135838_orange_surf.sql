/*
  # Fix RLS policies and admin function

  1. Changes
    - Drop policies first to remove dependencies
    - Drop and recreate admin check function
    - Create new simplified policies
    - Ensure first user is admin
    
  2. Security
    - Maintain proper access control
    - Fix infinite recursion issues
*/

-- Drop existing policies first to remove dependencies
DROP POLICY IF EXISTS "View own record" ON app_users;
DROP POLICY IF EXISTS "Admin access" ON app_users;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Create a more efficient admin check function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
  USING (
    EXISTS (
      SELECT 1
      FROM app_users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

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
