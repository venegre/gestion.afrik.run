/*
  # Update RLS policies for data isolation
  
  1. Changes
    - Add created_by column to clients table to track ownership
    - Enable RLS on clients and transactions tables
    - Create policies to restrict access to user's own data
    
  2. Security
    - Users can only access clients they created
    - Users can only access transactions for their clients
    - Maintains data isolation between users
*/

-- Add created_by column to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Update existing clients to be owned by the first admin user
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users ORDER BY created_at LIMIT 1;
  UPDATE clients SET created_by = admin_id WHERE created_by IS NULL;
END $$;

-- Make created_by NOT NULL after updating existing records
ALTER TABLE clients
ALTER COLUMN created_by SET NOT NULL;

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to read transactions" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert transactions" ON transactions;

-- Create new policies for clients table
CREATE POLICY "Users can view their own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Create new policies for transactions table
CREATE POLICY "Users can view transactions for their clients"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = transactions.client_id
      AND clients.created_by = auth.uid()
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
    )
  );
