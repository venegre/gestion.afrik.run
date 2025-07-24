/*
  # Schema Update for Client Management System

  1. Changes
    - Add IF NOT EXISTS checks for policies
    - Ensure idempotent policy creation
*/

-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) NOT NULL,
  amount_sent numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' 
    AND policyname = 'Allow authenticated users to read clients'
  ) THEN
    CREATE POLICY "Allow authenticated users to read clients"
      ON clients
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'clients' 
    AND policyname = 'Allow authenticated users to insert clients'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert clients"
      ON clients
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Create policies for transactions table with existence checks
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' 
    AND policyname = 'Allow authenticated users to read transactions'
  ) THEN
    CREATE POLICY "Allow authenticated users to read transactions"
      ON transactions
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'transactions' 
    AND policyname = 'Allow authenticated users to insert transactions'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert transactions"
      ON transactions
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
