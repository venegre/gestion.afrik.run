/*
  # Configuration de l'administrateur initial

  1. Modifications
    - Met à jour l'utilisateur existant pour lui donner les droits administrateur
    - Active le compte s'il était désactivé
    - Débloque le compte s'il était bloqué

  2. Sécurité
    - Utilise l'email de l'utilisateur pour l'identifier
*/

UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';
