/*
  # Fix user restoration and prevent duplicates
  
  1. Changes
    - Reactivate existing users
    - Fix admin permissions
    - Handle duplicate emails properly
    
  2. Security
    - Maintain existing policies
    - Ensure data integrity
*/

-- First, ensure admin exists and has correct permissions
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

  -- Reactivate all existing users and link them to admin
  UPDATE app_users
  SET 
    is_active = true,
    blocked = false,
    created_by = COALESCE(created_by, admin_id)
  WHERE email != 'admin@example.com';

  -- Insert new app_users records only for auth users that don't have one
  -- using ON CONFLICT to handle duplicates
  INSERT INTO app_users (id, email, is_active, blocked, created_by)
  SELECT 
    auth.users.id,
    auth.users.email,
    true,
    false,
    admin_id
  FROM auth.users
  WHERE 
    auth.users.email != 'admin@example.com'
    AND NOT EXISTS (
      SELECT 1 
      FROM app_users 
      WHERE app_users.id = auth.users.id
      OR app_users.email = auth.users.email
    );
END $$;
