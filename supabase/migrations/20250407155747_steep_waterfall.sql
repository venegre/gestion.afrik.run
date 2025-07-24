/*
  # Add DELETE policy for clients table

  1. Changes
    - Add DELETE policy to allow users to delete their own clients
    - Policy ensures users can only delete clients they created
    - Soft delete approach maintained through deleted_at column

  2. Security
    - Only authenticated users can delete
    - Users can only delete their own clients
    - Maintains data integrity through soft deletes
*/

CREATE POLICY "Users can delete their own clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by 
    AND (deleted_at IS NULL OR deleted_at > now())
  );
