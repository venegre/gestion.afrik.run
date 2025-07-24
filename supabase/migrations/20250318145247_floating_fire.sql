/*
  # Remove unique constraint on client names

  1. Changes
    - Remove the unique constraint on the name column in clients table
    - This allows multiple clients with the same name
*/

-- Drop the unique constraint and index on the name column
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_name_key;
DROP INDEX IF EXISTS clients_name_key;
