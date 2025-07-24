/*
  # Fix PDF export permissions
  
  1. Changes
    - Simplify password verification function
    - Make function accessible to all authenticated users
    - Remove admin-only restrictions
    
  2. Security
    - Maintain password protection
    - Allow all authenticated users to export
*/

-- Drop existing function
DROP FUNCTION IF EXISTS verify_export_password;

-- Create new simplified function
CREATE OR REPLACE FUNCTION verify_export_password(password_to_verify text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple password check for all users
  RETURN password_to_verify = 'export123';
END;
$$;

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION verify_export_password FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_export_password TO authenticated;

-- Add comment
COMMENT ON FUNCTION verify_export_password IS 'Vérifie le mot de passe pour l''export PDF';
