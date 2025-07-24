/*
  # Fix daily totals calculation
  
  1. Changes
    - Drop and recreate materialized view with correct daily totals
    - Add proper indexes for performance
    - Fix refresh trigger
    
  2. Purpose
    - Ensure daily totals are calculated correctly
    - Fix transaction summaries
*/

-- Drop existing view and related objects
DROP MATERIALIZED VIEW IF EXISTS mv_client_balances;
DROP TRIGGER IF EXISTS refresh_client_balances_trigger ON transactions;
DROP FUNCTION IF EXISTS trigger_refresh_client_balances;

-- Create materialized view with correct daily calculations
CREATE MATERIALIZED VIEW mv_client_balances AS
WITH daily_totals AS (
  SELECT 
    client_id,
    SUM(CASE WHEN date = CURRENT_DATE THEN amount_sent ELSE 0 END) as today_sent,
    SUM(CASE WHEN date = CURRENT_DATE THEN amount_paid ELSE 0 END) as today_paid,
    SUM(CASE 
      WHEN date < CURRENT_DATE THEN amount_to_pay - amount_paid 
      ELSE 0 
    END) as previous_debt
  FROM transactions
  GROUP BY client_id
)
SELECT 
  c.id as client_id,
  c.name as client_name,
  COALESCE(dt.today_sent, 0) as today_sent,
  COALESCE(dt.today_paid, 0) as today_paid,
  COALESCE(dt.previous_debt, 0) as previous_debt
FROM clients c
LEFT JOIN daily_totals dt ON c.id = dt.client_id
WHERE c.deleted_at IS NULL;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX mv_client_balances_client_id_idx ON mv_client_balances (client_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION trigger_refresh_client_balances()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_client_balances;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to refresh view on transaction changes
CREATE TRIGGER refresh_client_balances_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_client_balances();

-- Initial refresh of materialized view
REFRESH MATERIALIZED VIEW mv_client_balances;
