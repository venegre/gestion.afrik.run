/*
  # Fix user restoration and permissions
  
  1. Changes
    - Drop existing policies
    - Restore original policies
    - Reactivate existing users
    - Fix admin permissions
    - Handle duplicate users properly
    
  2. Security
    - Maintain proper access control
    - Keep existing user data intact
*/

-- Drop existing policies
DROP POLICY IF EXISTS "View own record" ON app_users;
DROP POLICY IF EXISTS "Admin access" ON app_users;
DROP POLICY IF EXISTS "users_read_access" ON app_users;
DROP POLICY IF EXISTS "admin_insert" ON app_users;
DROP POLICY IF EXISTS "admin_update" ON app_users;
DROP POLICY IF EXISTS "admin_delete" ON app_users;

-- Restore original policies
CREATE POLICY "users_read_access"
ON app_users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  email = 'admin@example.com'
);

CREATE POLICY "admin_insert"
ON app_users
FOR INSERT
TO authenticated
WITH CHECK (
  email = 'admin@example.com'
);

CREATE POLICY "admin_update"
ON app_users
FOR UPDATE
TO authenticated
USING (
  email = 'admin@example.com'
);

CREATE POLICY "admin_delete"
ON app_users
FOR DELETE
TO authenticated
USING (
  email = 'admin@example.com'
);

-- First ensure admin has proper permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';

-- Get admin ID for reference
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get admin user id
  SELECT id INTO admin_id 
  FROM app_users 
  WHERE email = 'admin@example.com';

  -- Reactivate all existing users
  UPDATE app_users
  SET 
    is_active = true,
    blocked = false,
    created_by = COALESCE(created_by, admin_id)
  WHERE 
    email != 'admin@example.com' AND
    id IN (SELECT id FROM auth.users);

  -- For any auth users without an app_user record, try to create one
  -- but skip if the email already exists
  INSERT INTO app_users (id, email, is_active, blocked, created_by)
  SELECT 
    au.id,
    au.email,
    true,
    false,
    admin_id
  FROM auth.users au
  WHERE 
    au.email != 'admin@example.com'
    AND NOT EXISTS (
      SELECT 1 FROM app_users 
      WHERE app_users.id = au.id 
      OR app_users.email = au.email
    );
END $$;
