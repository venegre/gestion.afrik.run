/*
  # Fix app_users RLS policies
  
  1. Changes
    - Drop existing policies
    - Create new policies that allow proper user management
    - Fix admin access for user creation
    
  2. Security
    - Maintain proper access control
    - Allow admin to create users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_read_access" ON app_users;
DROP POLICY IF EXISTS "admin_insert" ON app_users;
DROP POLICY IF EXISTS "admin_update" ON app_users;
DROP POLICY IF EXISTS "admin_delete" ON app_users;

-- Create new policies
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

-- Ensure admin has proper permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';
