-- Add extension for text search if not exists
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Function to search transactions by date range
CREATE OR REPLACE FUNCTION search_transactions(
  p_start_date date,
  p_end_date date,
  p_client_name text DEFAULT NULL,
  p_payment_method text DEFAULT NULL
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
    t.date BETWEEN p_start_date AND p_end_date
    AND (p_client_name IS NULL OR c.name ILIKE '%' || p_client_name || '%')
    AND (p_payment_method IS NULL OR t.payment_method = p_payment_method)
    AND c.created_by = auth.uid()
    AND (c.deleted_at IS NULL OR c.deleted_at > now())
  ORDER BY t.date DESC, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search clients
CREATE OR REPLACE FUNCTION search_clients(
  p_search_term text DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS TABLE (
  client_id uuid,
  client_name text,
  created_at timestamptz,
  total_debt numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as client_id,
    c.name as client_name,
    c.created_at,
    COALESCE(SUM(t.amount_to_pay - t.amount_paid), 0) as total_debt
  FROM clients c
  LEFT JOIN transactions t ON t.client_id = c.id
  WHERE 
    c.created_by = auth.uid()
    AND (c.deleted_at IS NULL OR c.deleted_at > now())
    AND (p_search_term IS NULL OR c.name ILIKE '%' || p_search_term || '%')
    AND (NOT p_is_active OR c.is_active = true)
  GROUP BY c.id, c.name, c.created_at
  ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_clients_name_search 
ON clients USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_transactions_date_range 
ON transactions(date, client_id, payment_method);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION search_clients TO authenticated;
