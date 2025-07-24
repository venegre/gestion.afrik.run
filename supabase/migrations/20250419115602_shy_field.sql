/*
  # Restore original app_users policies
  
  1. Changes
    - Drop all existing policies
    - Recreate original policies with proper admin checks
    - Reset admin permissions
    
  2. Security
    - Use email-based admin verification
    - Maintain proper access control
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "admin_manage_users" ON app_users;
DROP POLICY IF EXISTS "users_read_own_data" ON app_users;
DROP POLICY IF EXISTS "users_update_own_data" ON app_users;
DROP POLICY IF EXISTS "users_read_access" ON app_users;
DROP POLICY IF EXISTS "admin_insert" ON app_users;
DROP POLICY IF EXISTS "admin_update" ON app_users;
DROP POLICY IF EXISTS "admin_delete" ON app_users;

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
      FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@example.com'
    )
  );

-- Reset admin permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';
