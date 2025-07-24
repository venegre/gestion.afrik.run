/*
  # Fix RLS policies for client soft deletion
  
  1. Changes
    - Drop existing policies to start fresh
    - Create new policies with proper permissions
    - Ensure soft delete works correctly
    
  2. Security
    - Maintain proper access control
    - Allow users to manage their own clients
    - Use soft deletes instead of hard deletes
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
