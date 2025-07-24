/*
  # Fix admin access policies

  1. Changes
    - Simplify admin access check to use email directly
    - Remove recursive policies
    - Update admin status
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_read_access" ON app_users;
DROP POLICY IF EXISTS "admin_insert" ON app_users;
DROP POLICY IF EXISTS "admin_update" ON app_users;
DROP POLICY IF EXISTS "admin_delete" ON app_users;

-- Create new simplified policies
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
)
WITH CHECK (
  auth.email() = 'admin@example.com'
);

CREATE POLICY "admin_delete"
ON app_users
FOR DELETE
TO authenticated
USING (
  auth.email() = 'admin@example.com'
);

-- Update admin status
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';
