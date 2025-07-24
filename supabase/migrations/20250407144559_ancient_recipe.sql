/*
  # Fix RLS policies for client deletion
  
  1. Changes
    - Drop existing policies
    - Create new policies for client management
    - Add support for soft deletion
    
  2. Security
    - Maintain data isolation between users
    - Only allow users to modify their own clients
*/

-- Drop all existing client policies first
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can create their own clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;

-- Create new comprehensive policies
CREATE POLICY "Users can view their own active clients"
ON clients
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() AND
  deleted_at IS NULL
);

CREATE POLICY "Users can create their own clients"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);

CREATE POLICY "Users can soft delete their own clients"
ON clients
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
)
WITH CHECK (
  created_by = auth.uid()
);
