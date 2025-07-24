/*
  # Add daily balances table
  
  1. New Tables
    - `daily_balances`
      - `id` (uuid, primary key)
      - `date` (date)
      - `name` (text)
      - `amount` (numeric)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own balances" ON daily_balances;
DROP POLICY IF EXISTS "Users can create balances" ON daily_balances;
DROP POLICY IF EXISTS "Users can update their own balances" ON daily_balances;

-- Create daily_balances table if it doesn't exist
CREATE TABLE IF NOT EXISTS daily_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date DEFAULT CURRENT_DATE,
  name text NOT NULL,
  amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE daily_balances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own balances"
  ON daily_balances
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create balances"
  ON daily_balances
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own balances"
  ON daily_balances
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_balances_date 
ON daily_balances(date);

CREATE INDEX IF NOT EXISTS idx_daily_balances_created_by 
ON daily_balances(created_by);

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS set_balance_created_by ON daily_balances;
DROP FUNCTION IF EXISTS handle_balance_creation();

-- Create function to handle balance creation
CREATE OR REPLACE FUNCTION handle_balance_creation()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for balance creation
CREATE TRIGGER set_balance_created_by
  BEFORE INSERT ON daily_balances
  FOR EACH ROW
  EXECUTE FUNCTION handle_balance_creation();

-- Add comment
COMMENT ON TABLE daily_balances IS 'Table pour suivre les soldes journaliers';
