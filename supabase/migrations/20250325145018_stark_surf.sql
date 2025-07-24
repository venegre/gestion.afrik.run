/*
  # Correction des privilèges administrateur

  1. Modifications
    - Force la mise à jour des privilèges administrateur pour admin@example.com
    - Assure que le compte est actif et non bloqué
    - Réinitialise les politiques de sécurité pour les administrateurs
*/

-- Réinitialiser les politiques existantes
DROP POLICY IF EXISTS "Enable read access for users" ON app_users;
DROP POLICY IF EXISTS "Enable insert for admins only" ON app_users;
DROP POLICY IF EXISTS "Enable update for admins only" ON app_users;
DROP POLICY IF EXISTS "Enable delete for admins only" ON app_users;

-- Créer des politiques plus permissives pour les administrateurs
CREATE POLICY "Admin full access"
  ON app_users
  FOR ALL
  TO authenticated
  USING (
    (SELECT is_admin FROM app_users WHERE id = auth.uid())
    OR
    id = auth.uid()
  )
  WITH CHECK (
    (SELECT is_admin FROM app_users WHERE id = auth.uid())
  );

-- Forcer la mise à jour du compte administrateur
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';

-- S'assurer que l'utilisateur existe dans la table app_users
INSERT INTO app_users (id, email, is_admin, is_active, blocked)
SELECT 
  id,
  email,
  true,
  true,
  false
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (email) DO UPDATE
SET 
  is_admin = true,
  is_active = true,
  blocked = false;
