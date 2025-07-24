/*
  # Mise à jour du suivi des modifications de paiement
  
  1. Modifications
    - Mise à jour de la fonction trigger pour suivre les modifications de amount_paid
    - Ajout d'un index sur last_modified_at pour optimiser les requêtes
*/

-- Mise à jour de la fonction trigger pour inclure amount_paid
CREATE OR REPLACE FUNCTION update_transaction_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Met à jour last_modified_at si les données importantes sont modifiées
  IF (
    NEW.amount_sent != OLD.amount_sent OR
    NEW.amount_paid != OLD.amount_paid OR
    NEW.amount_to_pay != OLD.amount_to_pay OR
    NEW.description IS DISTINCT FROM OLD.description
  ) THEN
    NEW.last_modified_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ajout d'un index sur last_modified_at
CREATE INDEX IF NOT EXISTS idx_transactions_last_modified 
ON transactions(last_modified_at);
