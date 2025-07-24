-- Drop existing transaction policies
DROP POLICY IF EXISTS "Users can view transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for their clients" ON transactions;

-- Create new simplified transaction policies
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

-- Ensure haroun's user data is correct
DO $$
DECLARE
  haroun_id uuid;
BEGIN
  -- Get haroun's user ID
  SELECT id INTO haroun_id FROM auth.users WHERE email = 'haroun@gmail.com';
  
  -- Update app_users record
  INSERT INTO app_users (id, email, is_active, blocked, created_at)
  VALUES (haroun_id, 'haroun@gmail.com', true, false, NOW())
  ON CONFLICT (id) DO UPDATE
  SET 
    is_active = true,
    blocked = false;

  -- Ensure clients are properly linked
  UPDATE clients
  SET created_by = haroun_id
  WHERE id IN (
    SELECT client_id 
    FROM transactions t
    JOIN clients c ON c.id = t.client_id
    WHERE c.created_by = haroun_id
  );
END $$;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_client_balances;
