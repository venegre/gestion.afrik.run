/*
  # Restore users created by admin
  
  1. Changes
    - Reactivate all users created by admin
    - Unblock any blocked users
    - Keep existing permissions intact
    
  2. Security
    - Maintain existing policies
    - Keep admin functionality working
*/

-- Reactivate and unblock all users created by admin
UPDATE app_users
SET 
  is_active = true,
  blocked = false
WHERE EXISTS (
  SELECT 1 
  FROM app_users admin
  WHERE admin.email = 'admin@example.com'
  AND admin.id = app_users.created_by
);

-- Ensure admin still has proper permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';

-- Ensure all users created by admin are properly linked
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get admin user id
  SELECT id INTO admin_id 
  FROM app_users 
  WHERE email = 'admin@example.com';

  -- Update any users without created_by to be linked to admin
  UPDATE app_users
  SET created_by = admin_id
  WHERE created_by IS NULL
  AND email != 'admin@example.com';
END $$;
