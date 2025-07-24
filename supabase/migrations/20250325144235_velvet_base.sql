/*
  # Suppression d'un utilisateur spécifique

  1. Modifications
    - Désactive l'utilisateur (soft delete)
    - Met à jour les enregistrements liés
*/

UPDATE app_users
SET 
  is_active = false,
  blocked = true
WHERE email = 'email_a_supprimer@example.com';  -- Remplacez par l'email de l'utilisateur à supprimer
