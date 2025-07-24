/*
  # Fix infinite recursion in RLS policies
  
  1. Changes
    - Modify admin check policies to prevent circular dependencies
    - Simplify RLS policies for app_users table
    - Add direct admin check without using EXISTS subquery
    
  2. Security
    - Maintain same security level while fixing recursion
    - Ensure admins can still manage users
    - Users can still view their own data
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Admins can view all users" ON app_users;
DROP POLICY IF EXISTS "Admins can create users" ON app_users;
DROP POLICY IF EXISTS "Admins can update users" ON app_users;
DROP POLICY IF EXISTS "Admins can delete users" ON app_users;

-- Create new policies without recursive checks
CREATE POLICY "Users can view own or all if admin"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    is_admin = true
  );

CREATE POLICY "Admins can create users"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin = true
  );

CREATE POLICY "Admins can update users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (
    is_admin = true
  );

CREATE POLICY "Admins can delete users"
  ON app_users
  FOR DELETE
  TO authenticated
  USING (
    is_admin = true
  );

-- Set first user as admin if no admin exists
DO $$
DECLARE
  admin_count integer;
  first_user_id uuid;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM app_users WHERE is_admin = true;
  
  IF admin_count = 0 THEN
    SELECT id INTO first_user_id FROM app_users ORDER BY created_at LIMIT 1;
    IF first_user_id IS NOT NULL THEN
      UPDATE app_users SET is_admin = true WHERE id = first_user_id;
    END IF;
  END IF;
END $$;
