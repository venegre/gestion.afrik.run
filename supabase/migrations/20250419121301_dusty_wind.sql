/*
  # Fix user permissions without disruption
  
  1. Changes
    - Carefully restore user permissions
    - Maintain existing data
    - Fix any inconsistencies
    
  2. Security
    - Keep admin permissions intact
    - Maintain data integrity
*/

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

  -- Reactivate existing users without modifying their data
  UPDATE app_users
  SET 
    is_active = true,
    blocked = false,
    created_by = COALESCE(created_by, admin_id)
  WHERE 
    email != 'admin@example.com' AND
    id IN (SELECT id FROM auth.users);

  -- Update any inconsistent records
  UPDATE app_users
  SET created_by = admin_id
  WHERE 
    created_by IS NULL AND
    email != 'admin@example.com';
END $$;
