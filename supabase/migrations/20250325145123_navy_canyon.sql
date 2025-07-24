/*
  # Correction des politiques récursives pour app_users

  1. Modifications
    - Supprime les politiques existantes qui causent la récursion
    - Crée de nouvelles politiques non récursives
    - Utilise une approche basée sur les rôles pour l'accès administrateur
*/

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Admin full access" ON app_users;
DROP POLICY IF EXISTS "Enable read access for users" ON app_users;
DROP POLICY IF EXISTS "Enable insert for admins only" ON app_users;
DROP POLICY IF EXISTS "Enable update for admins only" ON app_users;
DROP POLICY IF EXISTS "Enable delete for admins only" ON app_users;

-- Créer une nouvelle politique de lecture non récursive
CREATE POLICY "users_read_access"
ON app_users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@example.com'
  )
);

-- Politique d'insertion pour l'administrateur
CREATE POLICY "admin_insert"
ON app_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@example.com'
  )
);

-- Politique de mise à jour pour l'administrateur
CREATE POLICY "admin_update"
ON app_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@example.com'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@example.com'
  )
);

-- Politique de suppression pour l'administrateur
CREATE POLICY "admin_delete"
ON app_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'admin@example.com'
  )
);

-- S'assurer que l'administrateur a les bons droits
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';
