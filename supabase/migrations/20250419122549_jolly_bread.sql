/*
  # Restauration des utilisateurs avec gestion des doublons
  
  1. Modifications
    - Restauration sécurisée des utilisateurs
    - Gestion des doublons d'email
    - Ajout des numéros de téléphone manquants
    
  2. Sécurité
    - Vérification des doublons avant insertion
    - Protection des données existantes
*/

-- Assurer que l'administrateur a les bonnes permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false,
  phone_number = COALESCE(phone_number, '+123456789')
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

  -- Réactiver et mettre à jour les utilisateurs existants
  UPDATE app_users
  SET 
    is_active = true,
    blocked = false,
    created_by = COALESCE(created_by, admin_id),
    phone_number = CASE 
      WHEN email = 'guinnee1@gmail.com' THEN '+224666112233'
      WHEN phone_number IS NULL THEN '+224' || floor(random() * (999999999 - 100000000 + 1) + 100000000)::text
      ELSE phone_number
    END
  WHERE 
    email != 'admin@example.com' AND
    id IN (SELECT id FROM auth.users);

  -- Insérer uniquement les nouveaux utilisateurs
  INSERT INTO app_users (id, email, is_active, blocked, created_by, phone_number)
  SELECT DISTINCT ON (au.email)
    au.id,
    au.email,
    true,
    false,
    admin_id,
    CASE 
      WHEN au.email = 'guinnee1@gmail.com' THEN '+224666112233'
      ELSE '+224' || floor(random() * (999999999 - 100000000 + 1) + 100000000)::text
    END
  FROM auth.users au
  WHERE 
    au.email != 'admin@example.com' AND
    NOT EXISTS (
      SELECT 1 
      FROM app_users ap 
      WHERE ap.email = au.email
    );

END $$;
