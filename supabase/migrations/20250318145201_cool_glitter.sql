/*
  # Remove Row Level Security

  This migration removes RLS from tables to allow public access without authentication.

  1. Changes
    - Disable RLS on clients table
    - Disable RLS on transactions table
    - Drop existing policies
*/

-- Disable RLS on clients table
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Disable RLS on transactions table
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to insert clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to read clients" ON clients;
DROP POLICY IF EXISTS "Allow authenticated users to insert transactions" ON transactions;
DROP POLICY IF EXISTS "Allow authenticated users to read transactions" ON transactions;
