/*
  # Add user management tables and policies

  1. New Tables
    - `app_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
      - `is_active` (boolean)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create app_users table
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all app_users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert app_users"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update app_users"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete app_users"
  ON app_users
  FOR DELETE
  TO authenticated
  USING (true);
