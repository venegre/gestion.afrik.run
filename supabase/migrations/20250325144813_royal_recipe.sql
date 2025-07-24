/*
  # Définir les privilèges administrateur

  1. Modifications
    - Définit l'utilisateur admin@example.com comme administrateur
    - Active le compte
    - Débloque le compte si bloqué
*/

UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';
