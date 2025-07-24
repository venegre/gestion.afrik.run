/*
  # Restore all database policies
  
  1. Changes
    - Reset policies for all tables (clients, transactions, app_users)
    - Ensure proper data access for authenticated users
    - Fix admin permissions
    
  2. Security
    - Maintain proper access control
    - Allow users to manage their own data
    - Give admin full access where needed
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "View own record" ON app_users;
DROP POLICY IF EXISTS "Admin access" ON app_users;
DROP POLICY IF EXISTS "Users can view their own active clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can view transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for their clients" ON transactions;

-- App Users Policies
CREATE POLICY "users_read_access"
ON app_users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  auth.email() = 'admin@example.com'
);

CREATE POLICY "admin_insert"
ON app_users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.email() = 'admin@example.com'
);

CREATE POLICY "admin_update"
ON app_users
FOR UPDATE
TO authenticated
USING (
  auth.email() = 'admin@example.com'
);

CREATE POLICY "admin_delete"
ON app_users
FOR DELETE
TO authenticated
USING (
  auth.email() = 'admin@example.com'
);

-- Clients Policies
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

-- Transactions Policies
CREATE POLICY "Users can view transactions for their clients"
ON transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = transactions.client_id
    AND clients.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create transactions for their clients"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = client_id
    AND clients.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update transactions for their clients"
ON transactions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = transactions.client_id
    AND clients.created_by = auth.uid()
  )
);

-- Reset admin permissions
UPDATE app_users
SET 
  is_admin = true,
  is_active = true,
  blocked = false
WHERE email = 'admin@example.com';

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
