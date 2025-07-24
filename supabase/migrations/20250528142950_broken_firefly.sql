-- Améliorer la gestion des utilisateurs supprimés
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Journaliser la suppression
  INSERT INTO audit_logs (
    user_id,
    action,
    success,
    description
  ) VALUES (
    auth.uid(),
    'delete_user',
    true,
    'Suppression définitive de l''utilisateur ' || OLD.email
  );
  
  -- Nettoyer les données associées
  UPDATE clients
  SET 
    deleted_at = NOW(),
    is_active = false
  WHERE created_by = OLD.id;
  
  -- Marquer l'utilisateur comme définitivement supprimé
  UPDATE app_users
  SET 
    is_active = false,
    blocked = true,
    deleted_at = NOW(),
    phone_number = NULL -- Supprimer les données personnelles
  WHERE id = OLD.id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Empêcher la réactivation des comptes supprimés
CREATE OR REPLACE FUNCTION prevent_deleted_user_reactivation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
    RAISE EXCEPTION 'Impossible de réactiver un utilisateur supprimé';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger de protection
DROP TRIGGER IF EXISTS prevent_reactivation_trigger ON app_users;
CREATE TRIGGER prevent_reactivation_trigger
  BEFORE UPDATE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_deleted_user_reactivation();

-- Nettoyer les données de l'utilisateur diallo@gmail.com
UPDATE app_users
SET
  phone_number = NULL,
  is_active = false,
  blocked = true,
  deleted_at = NOW()
WHERE email = 'diallo@gmail.com';

-- Nettoyer ses clients
UPDATE clients 
SET
  deleted_at = NOW(),
  is_active = false
WHERE created_by = (
  SELECT id FROM app_users WHERE email = 'diallo@gmail.com'
);
