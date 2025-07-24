/*
  # Fix RLS policies for transactions
  
  1. Changes
    - Update transaction policies to ensure proper access
    - Add user_id to materialized view
    - Fix client access checks
*/

-- Update transaction policies
DROP POLICY IF EXISTS "Users can view transactions for their clients" ON transactions;
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

-- Update materialized view
DROP MATERIALIZED VIEW IF EXISTS mv_client_balances;
CREATE MATERIALIZED VIEW mv_client_balances AS
WITH daily_totals AS (
  SELECT 
    t.client_id,
    c.name as client_name,
    c.created_by as user_id,
    SUM(CASE 
      WHEN t.date::date = CURRENT_DATE::date THEN COALESCE(t.amount_sent, 0)
      ELSE 0 
    END) as today_sent,
    SUM(CASE 
      WHEN t.date::date = CURRENT_DATE::date THEN COALESCE(t.amount_paid, 0)
      ELSE 0 
    END) as today_paid,
    SUM(CASE 
      WHEN t.date::date < CURRENT_DATE::date THEN COALESCE(t.amount_to_pay, 0) - COALESCE(t.amount_paid, 0)
      ELSE 0 
    END) as previous_debt
  FROM transactions t
  JOIN clients c ON c.id = t.client_id
  WHERE c.deleted_at IS NULL
  GROUP BY t.client_id, c.name, c.created_by
)
SELECT 
  c.id as client_id,
  c.name as client_name,
  c.created_by as user_id,
  COALESCE(dt.today_sent, 0) as today_sent,
  COALESCE(dt.today_paid, 0) as today_paid,
  COALESCE(dt.previous_debt, 0) as previous_debt
FROM clients c
LEFT JOIN daily_totals dt ON c.id = dt.client_id
WHERE c.deleted_at IS NULL;

-- Create unique index
CREATE UNIQUE INDEX mv_client_balances_client_id_idx ON mv_client_balances (client_id);

-- Refresh view
REFRESH MATERIALIZED VIEW mv_client_balances;
