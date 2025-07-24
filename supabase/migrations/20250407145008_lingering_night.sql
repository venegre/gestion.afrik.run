/*
  # Fix client creation and RLS policies
  
  1. Changes
    - Drop existing client policies
    - Create new policies that properly handle client creation
    - Add proper checks for created_by
    - Ensure created_by is set automatically
    
  2. Security
    - Maintain data isolation between users
    - Allow users to create clients
    - Prevent unauthorized access
*/

-- Drop all existing client policies first
DROP POLICY IF EXISTS "Users can view their own active clients" ON clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;

-- Create function to handle client creation
CREATE OR REPLACE FUNCTION handle_client_creation()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for client creation
DROP TRIGGER IF EXISTS set_client_created_by ON clients;
CREATE TRIGGER set_client_created_by
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION handle_client_creation();

-- Create new comprehensive policies
CREATE POLICY "Users can view their own active clients"
ON clients
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() AND
  (deleted_at IS NULL OR deleted_at > now())
);

CREATE POLICY "Users can create clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own clients"
ON clients
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND
  (deleted_at IS NULL OR deleted_at > now())
)
WITH CHECK (
  created_by = auth.uid()
);

-- Create index for soft deleted clients if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at 
ON clients(deleted_at) 
WHERE deleted_at IS NULL;
