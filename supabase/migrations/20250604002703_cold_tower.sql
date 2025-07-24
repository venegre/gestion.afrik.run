/*
  # Fix app_users table constraints

  1. Changes
    - Make created_by column nullable in app_users table
    - Add default values for required fields
    - Update RLS policies to handle null created_by

  2. Security
    - Maintain existing RLS policies
    - Add policy for system-level user creation
*/

-- Make created_by nullable and add default values for required fields
ALTER TABLE app_users 
  ALTER COLUMN created_by DROP NOT NULL;

-- Add policy to allow system to create users during signup
CREATE POLICY "Allow system to create users during signup"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 
      FROM app_users au 
      WHERE au.id = auth.uid() AND au.is_admin = true
    )
  );

-- Ensure default values are set for critical fields
DO $$ 
BEGIN
  -- Add default for is_active if not exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'app_users' 
    AND column_name = 'is_active' 
    AND column_default = 'true'
  ) THEN
    ALTER TABLE app_users ALTER COLUMN is_active SET DEFAULT true;
  END IF;

  -- Add default for blocked if not exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'app_users' 
    AND column_name = 'blocked' 
    AND column_default = 'false'
  ) THEN
    ALTER TABLE app_users ALTER COLUMN blocked SET DEFAULT false;
  END IF;

  -- Add default for is_admin if not exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'app_users' 
    AND column_name = 'is_admin' 
    AND column_default = 'false'
  ) THEN
    ALTER TABLE app_users ALTER COLUMN is_admin SET DEFAULT false;
  END IF;
END $$;
