/*
  # Ajout du suivi des modifications de transactions
  
  1. Modifications
    - Ajout de la colonne last_modified_at pour suivre les modifications
    - Ajout d'un trigger pour mettre à jour automatiquement last_modified_at
    
  2. Notes
    - La colonne last_modified_at est NULL pour les transactions non modifiées
    - Le trigger met à jour la date uniquement lors des modifications
*/

-- Ajout de la colonne last_modified_at
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS last_modified_at timestamptz;

-- Création de la fonction trigger
CREATE OR REPLACE FUNCTION update_transaction_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne met à jour last_modified_at que si les données importantes sont modifiées
  IF (
    NEW.amount_sent != OLD.amount_sent OR
    NEW.amount_to_pay != OLD.amount_to_pay OR
    NEW.description IS DISTINCT FROM OLD.description
  ) THEN
    NEW.last_modified_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
DROP TRIGGER IF EXISTS set_transaction_modified_timestamp ON transactions;
CREATE TRIGGER set_transaction_modified_timestamp
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_modified_timestamp();
