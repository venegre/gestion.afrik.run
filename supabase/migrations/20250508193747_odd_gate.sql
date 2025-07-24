/*
  # Fix function search paths and security settings
  
  1. Changes
    - Add search_path settings to all functions
    - Add SECURITY DEFINER to functions
    - Fix function permissions
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS handle_balance_creation CASCADE;
DROP FUNCTION IF EXISTS handle_client_creation CASCADE;
DROP FUNCTION IF EXISTS update_transaction_modified_timestamp CASCADE;

-- Create function to handle new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.app_users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  RETURN NEW;
END;
$$;

-- Create function to handle balance creation
CREATE OR REPLACE FUNCTION handle_balance_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

-- Create function to handle client creation
CREATE OR REPLACE FUNCTION handle_client_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$;

-- Create function to update transaction modified timestamp
CREATE OR REPLACE FUNCTION update_transaction_modified_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  IF (
    NEW.amount_sent != OLD.amount_sent OR
    NEW.amount_paid != OLD.amount_paid OR
    NEW.amount_to_pay != OLD.amount_to_pay OR
    NEW.description IS DISTINCT FROM OLD.description
  ) THEN
    NEW.last_modified_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER set_balance_created_by
  BEFORE INSERT ON daily_balances
  FOR EACH ROW
  EXECUTE FUNCTION handle_balance_creation();

CREATE TRIGGER set_client_created_by
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION handle_client_creation();

CREATE TRIGGER set_transaction_modified_timestamp
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transaction_modified_timestamp();
