/*
  # Fix app_users RLS policies

  1. Changes
    - Drop existing restrictive policies
    - Add new policies for:
      - Admin users can manage all users
      - Users can only view their own data
      - Only admin can create new users
  
  2. Security
    - Enable RLS on app_users table
    - Add policies for:
      - INSERT: Only admin can create users
      - SELECT: Users can view their own data, admin can view all
      - UPDATE: Users can update their own data, admin can update all
      - DELETE: Only admin can delete users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "admin_delete" ON app_users;
DROP POLICY IF EXISTS "admin_insert" ON app_users;
DROP POLICY IF EXISTS "admin_update" ON app_users;
DROP POLICY IF EXISTS "users_read_access" ON app_users;

-- Create new policies
CREATE POLICY "admin_manage_users"
ON app_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.id = auth.uid() 
    AND au.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.id = auth.uid() 
    AND au.is_admin = true
  )
);

CREATE POLICY "users_read_own_data"
ON app_users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.id = auth.uid() 
    AND au.is_admin = true
  )
);

CREATE POLICY "users_update_own_data"
ON app_users
FOR UPDATE
TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.id = auth.uid() 
    AND au.is_admin = true
  )
)
WITH CHECK (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM app_users au 
    WHERE au.id = auth.uid() 
    AND au.is_admin = true
  )
);
