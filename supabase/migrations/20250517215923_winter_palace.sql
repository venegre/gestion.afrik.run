/*
  # Add unique index to mv_client_balances

  1. Changes
    - Add a unique index on client_id to mv_client_balances
    - This enables concurrent refresh of the materialized view
    
  2. Why this change?
    - Required for concurrent refresh operations
    - Prevents conflicts during view updates
    - Improves performance of view refreshes
*/

-- Add unique index to materialized view
CREATE UNIQUE INDEX IF NOT EXISTS mv_client_balances_client_id_idx 
ON mv_client_balances (client_id)
WHERE client_id IS NOT NULL;
