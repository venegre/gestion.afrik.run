-- Drop existing transaction policies
DROP POLICY IF EXISTS "Users can view transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for their clients" ON transactions;

-- Create new transaction policies with proper date handling
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

-- Add indexes for better date filtering performance
CREATE INDEX IF NOT EXISTS idx_transactions_date_range 
ON transactions(date, client_id);

CREATE INDEX IF NOT EXISTS idx_transactions_date_client 
ON transactions(client_id, date);

-- Create function to get transactions by date range
CREATE OR REPLACE FUNCTION get_transactions_by_date_range(
  start_date date,
  end_date date
)
RETURNS TABLE (
  transaction_id uuid,
  client_id uuid,
  client_name text,
  transaction_date date,
  amount_sent numeric,
  amount_paid numeric,
  amount_to_pay numeric,
  payment_method text,
  description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as transaction_id,
    c.id as client_id,
    c.name as client_name,
    t.date as transaction_date,
    t.amount_sent,
    t.amount_paid,
    t.amount_to_pay,
    t.payment_method,
    t.description
  FROM transactions t
  JOIN clients c ON c.id = t.client_id
  WHERE 
    t.date BETWEEN start_date AND end_date
    AND c.created_by = auth.uid()
    AND (c.deleted_at IS NULL OR c.deleted_at > now())
  ORDER BY t.date DESC, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_transactions_by_date_range TO authenticated;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_client_balances;
