/*
  # Vérification du statut de l'utilisateur
  
  1. Vérifications
    - Existence dans auth.users
    - Statut dans app_users
    - Dernière connexion
*/

-- Vérifier le statut dans auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'haroun@gmail.com';

-- Vérifier le statut dans app_users
SELECT 
  id,
  email,
  is_active,
  blocked,
  phone_number,
  created_at
FROM app_users
WHERE email = 'haroun@gmail.com';
