/*
  # Fix client deletion and RLS policies
  
  1. Changes
    - Drop existing policies to start fresh
    - Create new policies for soft deletion
    - Update trigger function for client creation
    - Add proper RLS policies for all operations
    
  2. Security
    - Maintain proper access control
    - Use soft deletes instead of hard deletes
    - Ensure users can only manage their own clients
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own active clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON clients;

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

-- Create comprehensive policies
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
);

-- Create index for soft deleted clients if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at 
ON clients(deleted_at) 
WHERE deleted_at IS NULL;
