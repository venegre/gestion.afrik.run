/*
  # Restauration des utilisateurs spécifiques
  
  1. Modifications
    - Suppression des utilisateurs existants
    - Recréation des utilisateurs spécifiques
    - Mise à jour des politiques de sécurité
    
  2. Sécurité
    - Maintien des permissions admin
    - Protection des données utilisateur
*/

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "users_read_access" ON app_users;
DROP POLICY IF EXISTS "admin_insert" ON app_users;
DROP POLICY IF EXISTS "admin_update" ON app_users;
DROP POLICY IF EXISTS "admin_delete" ON app_users;

-- Créer les nouvelles politiques
CREATE POLICY "users_read_access"
ON app_users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admin_insert"
ON app_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE email = 'admin@example.com'
    AND id = auth.uid()
  )
);

CREATE POLICY "admin_update"
ON app_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE email = 'admin@example.com'
    AND id = auth.uid()
  )
);

CREATE POLICY "admin_delete"
ON app_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE email = 'admin@example.com'
    AND id = auth.uid()
  )
);

-- Supprimer tous les utilisateurs existants sauf admin
DELETE FROM app_users
WHERE email != 'admin@example.com';

-- Assurer que l'administrateur a les bonnes permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false,
  phone_number = '+123456789'
WHERE email = 'admin@example.com';

-- Obtenir l'ID admin pour référence
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Obtenir l'ID admin
  SELECT id INTO admin_id 
  FROM app_users 
  WHERE email = 'admin@example.com';

  -- Insérer les utilisateurs spécifiques
  INSERT INTO app_users (id, email, is_active, blocked, created_by, phone_number, is_admin)
  VALUES
    ((SELECT id FROM auth.users WHERE email = 'guinnee1@gmail.com'),
     'guinnee1@gmail.com', true, false, admin_id, '+224666112233', false),
    ((SELECT id FROM auth.users WHERE email = 'ramadan@gmail.com'),
     'ramadan@gmail.com', true, false, admin_id, '+224612345678', false),
    ((SELECT id FROM auth.users WHERE email = 'cire@gmail.com'),
     'cire@gmail.com', true, false, admin_id, '+224687654321', false)
  ON CONFLICT (email) DO UPDATE
  SET 
    is_active = true,
    blocked = false,
    created_by = admin_id;

END $$;
