/*
  # Fix user deletion and cleanup
  
  1. Changes
    - Add proper user deletion handling
    - Clean up orphaned app_users records
    - Add audit logging for user deletions
    
  2. Security
    - Ensure proper deletion of user data
    - Maintain audit trail
*/

-- Supprimer les enregistrements app_users orphelins
DELETE FROM app_users
WHERE id NOT IN (
  SELECT id FROM auth.users
)
AND email != 'admin@example.com';

-- Mettre à jour la fonction de prévention de suppression
CREATE OR REPLACE FUNCTION prevent_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Journaliser la tentative de suppression
  INSERT INTO audit_logs (
    user_id,
    action,
    success,
    description
  ) VALUES (
    auth.uid(),
    'delete_user',
    true,
    'Suppression de l''utilisateur ' || OLD.email
  );
  
  -- Marquer l'utilisateur comme inactif
  UPDATE app_users
  SET 
    is_active = false,
    blocked = true,
    deleted_at = NOW()
  WHERE id = OLD.id;
  
  -- Nettoyer les données associées
  UPDATE clients
  SET deleted_at = NOW()
  WHERE created_by = OLD.id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter la colonne deleted_at si elle n'existe pas
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Créer un index pour les utilisateurs supprimés
CREATE INDEX IF NOT EXISTS idx_app_users_deleted_at 
ON app_users(deleted_at) 
WHERE deleted_at IS NULL;

-- Supprimer spécifiquement l'utilisateur diallo@gmail.com
UPDATE app_users
SET 
  is_active = false,
  blocked = true,
  deleted_at = NOW()
WHERE email = 'diallo@gmail.com';

-- Nettoyer les données associées
UPDATE clients
SET deleted_at = NOW()
WHERE created_by = (
  SELECT id FROM app_users WHERE email = 'diallo@gmail.com'
);
