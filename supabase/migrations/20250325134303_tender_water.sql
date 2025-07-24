/*
  # Fix user roles and permissions

  1. Changes
    - Add unique constraint to app_users email
    - Ensure app_users id matches auth.users id
    - Update RLS policies to properly handle user roles
    - Add trigger to automatically create app_user record when auth user is created

  2. Security
    - Only admins can manage users
    - Users can only see their own data
    - Proper separation between admin and regular users
*/

-- Add unique constraint to app_users email if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'app_users_email_unique'
  ) THEN
    ALTER TABLE app_users
    ADD CONSTRAINT app_users_email_unique UNIQUE (email);
  END IF;
END $$;

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.app_users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for handling new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update RLS policies for app_users
DROP POLICY IF EXISTS "Users can view all app_users" ON app_users;
DROP POLICY IF EXISTS "Users can insert app_users" ON app_users;
DROP POLICY IF EXISTS "Users can update app_users" ON app_users;
DROP POLICY IF EXISTS "Users can delete app_users" ON app_users;

-- Only admins can view all users
CREATE POLICY "Admins can view all users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.is_admin = true
    )
    OR id = auth.uid()
  );

-- Only admins can create new users
CREATE POLICY "Admins can create users"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.is_admin = true
    )
  );

-- Only admins can update users
CREATE POLICY "Admins can update users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.is_admin = true
    )
  );

-- Only admins can delete users
CREATE POLICY "Admins can delete users"
  ON app_users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.is_admin = true
    )
  );

-- Update RLS policies for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
DROP POLICY IF EXISTS "Users can create clients" ON clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON clients;

CREATE POLICY "Users can view their own clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create their own clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Update RLS policies for transactions
DROP POLICY IF EXISTS "Users can view transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions for their clients" ON transactions;
DROP POLICY IF EXISTS "Users can update transactions for their clients" ON transactions;

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
