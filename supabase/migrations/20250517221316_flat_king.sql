/*
  # Fix transaction policies and materialized view refresh
  
  1. Changes
    - Drop and recreate materialized view with proper indexing
    - Update transaction policies
    - Fix trigger function
    
  2. Security
    - Maintain proper access control
    - Ensure data integrity
*/

-- First drop the existing materialized view and related objects
DROP MATERIALIZED VIEW IF EXISTS mv_client_balances;
DROP TRIGGER IF EXISTS refresh_client_balances_trigger ON transactions;
DROP FUNCTION IF EXISTS trigger_refresh_client_balances;

-- Recreate the materialized view
CREATE MATERIALIZED VIEW mv_client_balances AS
SELECT 
  t.client_id,
  c.name as client_name,
  COALESCE(SUM(CASE WHEN t.date = CURRENT_DATE THEN t.amount_sent ELSE 0 END), 0) as today_sent,
  COALESCE(SUM(CASE WHEN t.date = CURRENT_DATE THEN t.amount_paid ELSE 0 END), 0) as today_paid,
  COALESCE(SUM(CASE WHEN t.date < CURRENT_DATE THEN t.amount_to_pay - t.amount_paid ELSE 0 END), 0) as previous_debt
FROM clients c
LEFT JOIN transactions t ON c.id = t.client_id
WHERE c.deleted_at IS NULL
GROUP BY t.client_id, c.name;

-- Create unique index on client_id
CREATE UNIQUE INDEX mv_client_balances_client_id_idx ON mv_client_balances (client_id);

-- Drop existing transaction policies
DROP POLICY IF EXISTS "Users can view transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for their clients" ON transactions;

-- Create new transaction policies
CREATE POLICY "Users can view transactions for their clients"
ON transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = transactions.client_id
    AND clients.created_by = auth.uid()
    AND (clients.deleted_at IS NULL OR clients.deleted_at > now())
  )
);

CREATE POLICY "Users can create transactions for their clients"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_id
    AND clients.created_by = auth.uid()
    AND (clients.deleted_at IS NULL OR clients.deleted_at > now())
  )
);

CREATE POLICY "Users can update transactions for their clients"
ON transactions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = transactions.client_id
    AND clients.created_by = auth.uid()
    AND (clients.deleted_at IS NULL OR clients.deleted_at > now())
  )
);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION trigger_refresh_client_balances()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_client_balances;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_refresh_client_balances IS 'Triggers refresh of client balances on changes';

-- Create trigger for materialized view refresh
CREATE TRIGGER refresh_client_balances_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_client_balances();

-- Initial refresh of materialized view
REFRESH MATERIALIZED VIEW mv_client_balances;
