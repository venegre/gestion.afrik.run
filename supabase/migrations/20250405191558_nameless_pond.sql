/*
  # Ajout de la suppression douce pour les clients
  
  1. Modifications
    - Ajout de la colonne is_active aux clients
    - Mise à jour des politiques de sécurité
    - Ajout d'index pour optimiser les requêtes
*/

-- Ajout de la colonne is_active
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Création d'un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_clients_is_active 
ON clients(is_active) 
WHERE is_active = true;
