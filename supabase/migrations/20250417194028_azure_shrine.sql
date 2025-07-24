/*
  # Correction de la fonction de vérification du mot de passe d'export
  
  1. Modifications
    - Simplification de la fonction de vérification
    - Ajout de sécurité supplémentaire
    - Correction des permissions
    
  2. Sécurité
    - Maintien du mot de passe unique pour tous les utilisateurs
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
BEGIN
  -- Vérification simple du mot de passe
  is_valid := password_to_verify = 'export123';
  
  -- Log de la tentative (sans le mot de passe)
  INSERT INTO audit_logs (
    user_id,
    action,
    success
  ) VALUES (
    auth.uid(),
    'export_pdf',
    is_valid
  );
  
  RETURN is_valid;
END;
$$;

-- Créer la table d'audit si elle n'existe pas
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  success boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Révoquer tous les droits existants
REVOKE ALL ON FUNCTION verify_export_password FROM PUBLIC;
REVOKE ALL ON audit_logs FROM PUBLIC;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION verify_export_password TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;

-- Ajouter des commentaires
COMMENT ON FUNCTION verify_export_password IS 'Vérifie le mot de passe pour l''export PDF';
COMMENT ON TABLE audit_logs IS 'Journal des tentatives d''export PDF';

-- Créer un index sur la table d'audit
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
