/*
  # Correction de la fonction d'export PDF
  
  1. Modifications
    - Ajout de logs détaillés
    - Amélioration de la gestion des erreurs
    - Simplification de la vérification
    
  2. Sécurité
    - Maintien du mot de passe unique
    - Protection contre les injections SQL
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS verify_export_password;

-- Créer la nouvelle fonction simplifiée
CREATE OR REPLACE FUNCTION verify_export_password(password_to_verify text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_valid boolean;
  user_email text;
BEGIN
  -- Récupérer l'email de l'utilisateur pour le log
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  
  -- Vérification simple du mot de passe
  is_valid := password_to_verify = 'export123';
  
  -- Log détaillé de la tentative
  INSERT INTO audit_logs (
    user_id,
    action,
    success,
    description
  ) VALUES (
    auth.uid(),
    'export_pdf',
    is_valid,
    CASE 
      WHEN is_valid THEN 'Export PDF réussi pour ' || user_email
      ELSE 'Tentative échouée pour ' || user_email
    END
  );
  
  RETURN is_valid;
EXCEPTION WHEN OTHERS THEN
  -- Log de l'erreur
  INSERT INTO audit_logs (
    user_id,
    action,
    success,
    description
  ) VALUES (
    auth.uid(),
    'export_pdf_error',
    false,
    'Erreur: ' || SQLERRM
  );
  
  RETURN false;
END;
$$;

-- Mettre à jour la table d'audit
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS description text;

-- Révoquer et réaccorder les permissions
REVOKE ALL ON FUNCTION verify_export_password FROM PUBLIC;
REVOKE ALL ON audit_logs FROM PUBLIC;

GRANT EXECUTE ON FUNCTION verify_export_password TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;

-- Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
