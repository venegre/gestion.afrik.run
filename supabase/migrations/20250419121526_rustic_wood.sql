/*
  # Restauration des utilisateurs
  
  1. Modifications
    - Réactivation des utilisateurs existants
    - Correction des permissions
    - Préservation des données
    
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

-- Réactiver les utilisateurs spécifiques
UPDATE app_users
SET 
  is_active = true,
  blocked = false
WHERE email IN (
  'guinnee1@gmail.com',
  'user2@example.com'
);

-- Obtenir l'ID admin et mettre à jour les relations
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Obtenir l'ID admin
  SELECT id INTO admin_id 
  FROM app_users 
  WHERE email = 'admin@example.com';

  -- Mettre à jour les relations created_by manquantes
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
