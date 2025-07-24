/*
  # Restauration des utilisateurs
  
  1. Modifications
    - Restauration des utilisateurs précédents
    - Mise à jour des permissions
    - Correction des relations
    
  2. Sécurité
    - Maintien des droits d'administration
    - Protection des données existantes
*/

-- Assurer que l'administrateur a les bonnes permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
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

  -- Créer les utilisateurs manquants depuis auth.users
  INSERT INTO app_users (id, email, is_active, blocked, created_by)
  SELECT 
    au.id,
    au.email,
    true,
    false,
    admin_id
  FROM auth.users au
  LEFT JOIN app_users ap ON au.id = ap.id
  WHERE 
    ap.id IS NULL AND
    au.email != 'admin@example.com' AND
    au.email NOT IN (
      SELECT email FROM app_users
    );

  -- Réactiver tous les utilisateurs existants
  UPDATE app_users
  SET 
    is_active = true,
    blocked = false,
    created_by = COALESCE(created_by, admin_id)
  WHERE 
    email != 'admin@example.com' AND
    id IN (SELECT id FROM auth.users);
END $$;
