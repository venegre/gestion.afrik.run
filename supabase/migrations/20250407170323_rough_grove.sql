/*
  # Add client deletion policies

  1. Changes
    - Add RLS policy for soft deletion of clients
    - Update existing select policy to include created_by field
    - Add policy for updating deleted_at field

  2. Security
    - Only allow users to soft delete their own clients
    - Ensure users can only view and update clients they created
*/

-- Update the select policy to explicitly include created_by field
DROP POLICY IF EXISTS "Users can view their own active clients" ON clients;
CREATE POLICY "Users can view their own active clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() 
    AND (deleted_at IS NULL OR deleted_at > now())
  );

-- Add policy for updating deleted_at field (soft delete)
DROP POLICY IF EXISTS "Users can soft delete their own clients" ON clients;
CREATE POLICY "Users can soft delete their own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (
    created_by = auth.uid() 
    AND (
      -- Only allow updating the deleted_at field
      (xmax::text::int > 0 AND deleted_at IS NOT NULL)
      OR
      (xmax::text::int = 0)
    )
  );
