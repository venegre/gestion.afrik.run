/*
  # Add unique index to mv_client_balances

  1. Changes
    - Add a unique index on client_id to mv_client_balances materialized view
    - This enables concurrent refreshes of the materialized view

  2. Purpose
    - Fixes the error "cannot refresh materialized view concurrently"
    - Improves performance of materialized view refreshes
    - Prevents concurrent refresh conflicts
*/

-- Create unique index on mv_client_balances
CREATE UNIQUE INDEX IF NOT EXISTS mv_client_balances_client_id_idx 
ON mv_client_balances (client_id)
WHERE client_id IS NOT NULL;
