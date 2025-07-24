-- Ajout d'une table pour la journalisation des modifications
CREATE TABLE IF NOT EXISTS data_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  operation text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  modified_by uuid REFERENCES auth.users(id),
  modified_at timestamptz DEFAULT now()
);

-- Création d'index pour la table d'audit
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record 
ON data_audit_log(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_modified 
ON data_audit_log(modified_at);

-- Fonction pour la journalisation des modifications
CREATE OR REPLACE FUNCTION log_data_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO data_audit_log (
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    modified_by
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    auth.uid()
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajout des triggers pour la journalisation
CREATE TRIGGER log_transactions_changes
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION log_data_changes();

CREATE TRIGGER log_clients_changes
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION log_data_changes();

-- Optimisation des index existants
CREATE INDEX IF NOT EXISTS idx_transactions_client_date_amount 
ON transactions(client_id, date, amount_to_pay);

CREATE INDEX IF NOT EXISTS idx_clients_name_active 
ON clients(name)
WHERE is_active = true;

-- Ajout de contraintes de validation supplémentaires
ALTER TABLE transactions
ADD CONSTRAINT positive_amounts 
CHECK (
  amount_sent >= 0 AND 
  amount_paid >= 0 AND 
  amount_to_pay >= 0
);

-- Fonction pour archiver les anciennes données
CREATE OR REPLACE FUNCTION archive_old_data(months_old integer)
RETURNS void AS $$
DECLARE
  cutoff_date date;
BEGIN
  cutoff_date := current_date - (months_old || ' months')::interval;
  
  -- Archive des transactions
  WITH archived_transactions AS (
    SELECT *
    FROM transactions
    WHERE date < cutoff_date
  )
  INSERT INTO data_audit_log (
    table_name,
    record_id,
    operation,
    old_data,
    modified_by
  )
  SELECT 
    'transactions',
    id,
    'ARCHIVE',
    row_to_json(archived_transactions)::jsonb,
    auth.uid()
  FROM archived_transactions;

  -- Suppression des anciennes transactions
  DELETE FROM transactions
  WHERE date < cutoff_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajout de commentaires pour la documentation
COMMENT ON TABLE data_audit_log IS 'Journal des modifications de données';
COMMENT ON FUNCTION archive_old_data IS 'Archive les données plus anciennes qu''un certain nombre de mois';
COMMENT ON FUNCTION log_data_changes IS 'Enregistre les modifications de données dans le journal d''audit';
