/*
  # Fix transaction policies and permissions
  
  1. Changes
    - Update transaction policies to allow proper creation
    - Add missing indexes for performance
    - Fix policy checks
*/

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

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_client_date_paid 
ON transactions(client_id, date, amount_paid);

-- Add trigger to refresh materialized view
CREATE OR REPLACE FUNCTION trigger_refresh_client_balances()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_balances;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION trigger_refresh_client_balances IS 'Triggers refresh of client balances on changes';

-- Add trigger to transactions table
DROP TRIGGER IF EXISTS refresh_client_balances_trigger ON transactions;
CREATE TRIGGER refresh_client_balances_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_client_balances();
