/*
  # Fix client deletion policies
  
  1. Changes
    - Drop existing client policies
    - Create new policies that properly handle soft deletion
    - Add policy for updating deleted_at
    
  2. Security
    - Maintain data isolation between users
    - Allow users to soft delete their own clients
    - Prevent unauthorized access to deleted clients
*/

-- Drop all existing client policies first
DROP POLICY IF EXISTS "Users can view their own active clients" ON clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON clients;
DROP POLICY IF EXISTS "Users can soft delete their own clients" ON clients;

-- Create new comprehensive policies
CREATE POLICY "Users can view their own active clients"
ON clients
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() AND
  (deleted_at IS NULL OR deleted_at > now())
);

CREATE POLICY "Users can create their own clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

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

-- Create index for soft deleted clients
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at 
ON clients(deleted_at) 
WHERE deleted_at IS NULL;
