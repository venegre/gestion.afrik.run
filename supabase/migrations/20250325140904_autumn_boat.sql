/*
  # Revert user management changes

  1. Changes
    - Remove user management related policies
    - Keep only essential admin functionality
    - Clean up triggers and functions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own record" ON app_users;
DROP POLICY IF EXISTS "Admins can view all records" ON app_users;
DROP POLICY IF EXISTS "Admins can create users" ON app_users;
DROP POLICY IF EXISTS "Admins can update users" ON app_users;
DROP POLICY IF EXISTS "Admins can delete users" ON app_users;

-- Drop trigger and function
DROP TRIGGER IF EXISTS handle_user_deletion_trigger ON app_users;
DROP FUNCTION IF EXISTS handle_user_deletion();

-- Create simplified policies
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
