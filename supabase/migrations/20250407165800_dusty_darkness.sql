/*
  # Fix client deletion policies
  
  1. Changes
    - Update RLS policies to properly handle soft deletion
    - Simplify policy structure
    - Add proper checks for user ownership
    
  2. Security
    - Maintain proper access control
    - Only allow users to soft delete their own clients
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own active clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;

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
USING (created_by = auth.uid());

-- Create index for soft deleted clients if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at 
ON clients(deleted_at) 
WHERE deleted_at IS NULL;

-- Ensure created_by is set correctly for existing clients
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT id INTO admin_id FROM auth.users ORDER BY created_at LIMIT 1;
  UPDATE clients 
  SET created_by = admin_id
  WHERE created_by IS NULL;
END $$;
