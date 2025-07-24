/*
  # Add phone number to app_users table

  1. Changes
    - Add phone_number column to app_users table
    - Make phone_number unique
    - Add phone_number validation check

  2. Security
    - Maintain existing RLS policies
*/

-- Add phone number column with validation
ALTER TABLE app_users 
ADD COLUMN IF NOT EXISTS phone_number text UNIQUE,
ADD COLUMN IF NOT EXISTS blocked boolean DEFAULT false;

-- Add check constraint for phone number format
ALTER TABLE app_users
ADD CONSTRAINT phone_number_format 
CHECK (
  phone_number IS NULL OR 
  phone_number ~ '^\+?[0-9]{8,15}$'
);
