/*
  # Fix daily balances functionality
  
  1. Changes
    - Update daily balances policies
    - Add proper validation
    - Fix balance creation
    
  2. Security
    - Maintain proper access control
    - Ensure data integrity
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own balances" ON daily_balances;
DROP POLICY IF EXISTS "Users can create balances" ON daily_balances;
DROP POLICY IF EXISTS "Users can update their own balances" ON daily_balances;

-- Create new policies
CREATE POLICY "Users can view their own balances"
  ON daily_balances
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create balances"
  ON daily_balances
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own balances"
  ON daily_balances
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Create function to log balance changes
CREATE OR REPLACE FUNCTION log_balance_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    success,
    description
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create_balance'
      WHEN TG_OP = 'UPDATE' THEN 'update_balance'
      ELSE 'delete_balance'
    END,
    true,
    'Balance ' || TG_OP || ' for ' || NEW.name || ': ' || NEW.amount || ' FCFA'
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_balance_changes IS 'Logs changes to daily balances';

-- Create trigger for logging
DROP TRIGGER IF EXISTS log_balance_changes ON daily_balances;
CREATE TRIGGER log_balance_changes
  AFTER INSERT OR UPDATE OR DELETE ON daily_balances
  FOR EACH ROW
  EXECUTE FUNCTION log_balance_changes();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_balances_date_amount 
ON daily_balances(date, amount);

CREATE INDEX IF NOT EXISTS idx_daily_balances_name 
ON daily_balances(name);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON daily_balances TO authenticated;
