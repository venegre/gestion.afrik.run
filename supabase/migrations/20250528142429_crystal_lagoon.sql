/*
  # Restauration de l'utilisateur haroun et ajout de protections
  
  1. Modifications
    - Restauration complète du compte haroun
    - Ajout de protections contre la suppression accidentelle
    - Correction des relations avec les clients
    
  2. Sécurité
    - Maintien des données existantes
    - Ajout de journalisation des modifications
*/

-- Restaurer l'utilisateur haroun
INSERT INTO app_users (
  id,
  email,
  created_at,
  is_active,
  is_admin,
  blocked,
  phone_number
)
SELECT 
  id,
  email,
  COALESCE(created_at, NOW()),
  true,    -- Compte actif
  false,   -- Pas admin
  false,   -- Non bloqué
  '+224666112233'  -- Numéro de téléphone
FROM auth.users
WHERE email = 'haroun@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  is_active = true,
  blocked = false;

-- Ajouter une protection contre la suppression accidentelle
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
    'delete_user_attempt',
    false,
    'Tentative de suppression de l''utilisateur ' || OLD.email
  );
  
  -- Empêcher la suppression, utiliser is_active à la place
  UPDATE app_users
  SET 
    is_active = false,
    blocked = true
  WHERE id = OLD.id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger de protection
DROP TRIGGER IF EXISTS prevent_user_deletion_trigger ON app_users;
CREATE TRIGGER prevent_user_deletion_trigger
  BEFORE DELETE ON app_users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_user_deletion();

-- S'assurer que les clients sont correctement liés
DO $$
DECLARE
  haroun_id uuid;
BEGIN
  SELECT id INTO haroun_id 
  FROM auth.users 
  WHERE email = 'haroun@gmail.com';

  -- Mettre à jour les relations client
  UPDATE clients
  SET created_by = haroun_id
  WHERE id IN (
    SELECT DISTINCT client_id
    FROM transactions
    WHERE client_id IN (
      SELECT id FROM clients
      WHERE created_by = haroun_id
      OR created_by IS NULL
    )
  );
END $$;

-- Rafraîchir la vue matérialisée
REFRESH MATERIALIZED VIEW mv_client_balances;
