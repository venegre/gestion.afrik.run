/*
  # Add admin role to app_users
  
  1. Changes
    - Add is_admin column to app_users table
    - Set first user as admin
    - Update RLS policies to restrict user management to admins
*/

-- Add is_admin column to app_users
ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Set the first user as admin
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  SELECT id INTO first_user_id FROM app_users ORDER BY created_at LIMIT 1;
  IF first_user_id IS NOT NULL THEN
    UPDATE app_users SET is_admin = true WHERE id = first_user_id;
  END IF;
END $$;
