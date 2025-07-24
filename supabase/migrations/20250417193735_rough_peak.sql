-- Create function to verify export password
CREATE OR REPLACE FUNCTION verify_export_password(password_to_verify text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Le mot de passe est 'export123' pour tous les utilisateurs
  RETURN password_to_verify = 'export123';
END;
$$;

-- Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION verify_export_password FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_export_password TO authenticated;

-- Add comment
COMMENT ON FUNCTION verify_export_password IS 'Vérifie le mot de passe pour l''export PDF';
