/*
  # Restauration de la page utilisateur
  
  1. Modifications
    - Restauration des politiques de sécurité
    - Réactivation des utilisateurs
    - Correction des permissions
    
  2. Sécurité
    - Maintien des droits d'administration
    - Protection des données existantes
*/

-- Drop existing policies
DROP POLICY IF EXISTS "View own record" ON app_users;
DROP POLICY IF EXISTS "Admin access" ON app_users;
DROP POLICY IF EXISTS "users_read_access" ON app_users;
DROP POLICY IF EXISTS "admin_insert" ON app_users;
DROP POLICY IF EXISTS "admin_update" ON app_users;
DROP POLICY IF EXISTS "admin_delete" ON app_users;

-- Create comprehensive policies
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

-- Ensure admin has proper permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';

-- Reactivate specific users
UPDATE app_users
SET 
  is_active = true,
  blocked = false
WHERE email IN (
  'guinnee1@gmail.com',
  'user2@example.com'
);

-- Fix user relationships
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get admin ID
  SELECT id INTO admin_id 
  FROM app_users 
  WHERE email = 'admin@example.com';

  -- Update created_by for existing users
  UPDATE app_users
  SET created_by = admin_id
  WHERE 
    created_by IS NULL AND
    email != 'admin@example.com' AND
    email IN (
      'guinnee1@gmail.com',
      'user2@example.com'
    );
END $$;
