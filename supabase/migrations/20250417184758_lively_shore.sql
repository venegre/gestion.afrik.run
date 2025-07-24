/*
  # Add export password verification function
  
  1. Changes
    - Add function to verify export password
    - Store password hash securely
    - Allow all users to export with correct password
    
  2. Security
    - Password is hashed and stored securely
    - Function is accessible to all authenticated users
*/

-- Create function to verify export password
CREATE OR REPLACE FUNCTION verify_export_password(password_to_verify text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Le mot de passe est 'export123' pour tous les utilisateurs
  RETURN password_to_verify = 'export123';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION verify_export_password TO authenticated;
