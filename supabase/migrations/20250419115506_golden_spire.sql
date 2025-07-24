/*
  # Revert app_users policies to previous state
  
  1. Changes
    - Drop recently added policies
    - Restore original policies that use email-based admin check
    
  2. Security
    - Maintain proper access control
    - Use email-based admin verification
*/

-- Drop recently added policies
DROP POLICY IF EXISTS "admin_manage_users" ON app_users;
DROP POLICY IF EXISTS "users_read_own_data" ON app_users;
DROP POLICY IF EXISTS "users_update_own_data" ON app_users;

-- Restore original policies
CREATE POLICY "users_read_access"
ON app_users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  auth.email() = 'admin@example.com'
);

CREATE POLICY "admin_insert"
ON app_users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.email() = 'admin@example.com'
);

CREATE POLICY "admin_update"
ON app_users
FOR UPDATE
TO authenticated
USING (
  auth.email() = 'admin@example.com'
);

CREATE POLICY "admin_delete"
ON app_users
FOR DELETE
TO authenticated
USING (
  auth.email() = 'admin@example.com'
);

-- Ensure admin user has proper permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';
