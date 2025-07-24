-- Drop existing policies
DROP POLICY IF EXISTS "Users can view transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for their clients" ON transactions;

-- Create new simplified policies
CREATE POLICY "Users can view transactions for their clients"
ON transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = transactions.client_id
    AND c.created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = auth.uid()
    AND au.is_admin = true
  )
);

CREATE POLICY "Users can create transactions for their clients"
ON transactions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = client_id
    AND c.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update transactions for their clients"
ON transactions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = transactions.client_id
    AND c.created_by = auth.uid()
  )
);

-- Ensure proper client ownership
DO $$
DECLARE
  haroun_id uuid;
BEGIN
  -- Get haroun's user ID
  SELECT id INTO haroun_id 
  FROM auth.users 
  WHERE email = 'haroun@gmail.com';

  -- Update clients ownership
  UPDATE clients
  SET created_by = haroun_id
  WHERE id IN (
    SELECT DISTINCT client_id
    FROM transactions
    WHERE client_id IN (
      SELECT id FROM clients
      WHERE created_by = haroun_id
      OR created_by IS NULL
    )
  );

  -- Ensure user is active
  UPDATE app_users
  SET 
    is_active = true,
    blocked = false
  WHERE id = haroun_id;
END $$;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW mv_client_balances;
