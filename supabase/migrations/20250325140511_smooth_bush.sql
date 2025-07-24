/*
  # Delete Users and Update Policies
  
  1. Changes
    - Add function to safely delete users
    - Update delete policy to use soft delete
    - Clean up existing users
    
  2. Security
    - Maintain proper access control
    - Ensure safe user deletion
*/

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is a soft delete (is_active being set to false)
  IF OLD.is_active = true AND NEW.is_active = false THEN
    -- Update related records or perform other cleanup here
    -- For example, you might want to update client records, etc.
    
    -- You can add more cleanup operations here as needed
    NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS handle_user_deletion_trigger ON app_users;
CREATE TRIGGER handle_user_deletion_trigger
  BEFORE UPDATE OF is_active ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Update existing policies
DROP POLICY IF EXISTS "Admins can delete users" ON app_users;

CREATE POLICY "Admins can delete users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM app_users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM app_users
      WHERE id = auth.uid()
      AND is_admin = true
    )
  );

-- Soft delete all non-admin users
UPDATE app_users
SET is_active = false
WHERE is_admin = false;
