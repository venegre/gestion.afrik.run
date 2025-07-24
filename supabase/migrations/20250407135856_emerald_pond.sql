/*
  # Ajout de la suppression douce des clients
  
  1. Modifications
    - Ajout de la colonne deleted_at pour la suppression douce
    - Mise à jour des politiques pour exclure les clients supprimés
    - Ajout d'une fonction pour calculer la dette totale d'un client
*/

-- Ajout de la colonne deleted_at
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Fonction pour calculer la dette totale d'un client
CREATE OR REPLACE FUNCTION get_client_total_debt(client_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_debt numeric;
BEGIN
  SELECT COALESCE(SUM(amount_to_pay - amount_paid), 0)
  INTO total_debt
  FROM transactions
  WHERE client_id = client_uuid;
  
  RETURN total_debt;
END;
$$ LANGUAGE plpgsql;

-- Index pour optimiser les requêtes sur deleted_at
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at 
ON clients(deleted_at) 
WHERE deleted_at IS NULL;

-- Mise à jour des politiques existantes pour exclure les clients supprimés
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
CREATE POLICY "Users can view their own clients"
ON clients
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() AND
  deleted_at IS NULL
);
