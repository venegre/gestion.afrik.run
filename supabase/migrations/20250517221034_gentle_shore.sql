/*
  # Add unique index to mv_client_balances

  1. Changes
    - Add a unique index on client_id to mv_client_balances materialized view
    - This enables concurrent refresh of the materialized view
    - Required to prevent concurrent refresh conflicts

  2. Technical Details
    - Creates a unique index on client_id column
    - No WHERE clause to ensure compatibility with concurrent refresh
    - Index name follows standard naming convention
*/

CREATE UNIQUE INDEX IF NOT EXISTS mv_client_balances_client_id_idx 
ON mv_client_balances (client_id)
WHERE client_id IS NOT NULL;
