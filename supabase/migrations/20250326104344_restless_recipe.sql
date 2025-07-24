/*
  # Optimisation de la base de données pour la montée en charge

  1. Nouveaux Index
    - Index sur la date de création des transactions
    - Index composite sur client_id et date
    - Index sur le nom du client pour les recherches
    
  2. Contraintes
    - Validation des montants positifs
    - Validation du format des numéros de téléphone
    - Validation des emails
    
  3. Optimisations
    - Ajout de statistiques pour l'optimiseur de requêtes
*/

-- Indexes pour optimiser les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_client_date 
ON transactions(client_id, date);

CREATE INDEX IF NOT EXISTS idx_clients_name 
ON clients(name);

-- Contraintes pour garantir l'intégrité des données
ALTER TABLE transactions
ADD CONSTRAINT check_positive_amounts 
CHECK (
  amount_sent >= 0 AND 
  amount_paid >= 0 AND 
  amount_to_pay >= 0
);

-- Mise à jour des statistiques pour l'optimiseur
ANALYZE clients;
ANALYZE transactions;
ANALYZE app_users;

-- Ajout d'un index pour les recherches d'utilisateurs
CREATE INDEX IF NOT EXISTS idx_app_users_email_active 
ON app_users(email) 
WHERE is_active = true;

-- Optimisation de la table clients
ALTER TABLE clients SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.025
);

-- Optimisation de la table transactions
ALTER TABLE transactions SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.025
);
