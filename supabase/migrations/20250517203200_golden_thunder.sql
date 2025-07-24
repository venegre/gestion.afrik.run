/*
  # Fix admin user and materialized view
  
  1. Changes
    - Recreate materialized view with proper permissions
    - Reset admin user password using auth.users
    - Ensure admin app_user exists with correct permissions
*/

-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS mv_client_balances;

-- Recreate materialized view with proper permissions
CREATE MATERIALIZED VIEW mv_client_balances AS
SELECT 
  t.client_id,
  c.name as client_name,
  COALESCE(SUM(CASE WHEN t.date = CURRENT_DATE THEN t.amount_sent ELSE 0 END), 0) as today_sent,
  COALESCE(SUM(CASE WHEN t.date = CURRENT_DATE THEN t.amount_paid ELSE 0 END), 0) as today_paid,
  COALESCE(SUM(CASE WHEN t.date < CURRENT_DATE THEN t.amount_to_pay - t.amount_paid ELSE 0 END), 0) as previous_debt
FROM clients c
LEFT JOIN transactions t ON c.id = t.client_id
WHERE c.deleted_at IS NULL
GROUP BY t.client_id, c.name;

-- Grant permissions on materialized view
GRANT SELECT ON mv_client_balances TO authenticated;

-- Reset admin user password
UPDATE auth.users
SET 
  encrypted_password = crypt('admin123456', gen_salt('bf')),
  updated_at = NOW(),
  email_confirmed_at = NOW()
WHERE email = 'admin@example.com';

-- Ensure admin app_user exists with correct permissions
INSERT INTO app_users (
  id,
  email,
  created_at,
  is_active,
  is_admin,
  blocked,
  phone_number
)
SELECT
  id,
  email,
  NOW(),
  true,
  true,
  false,
  '+123456789'
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (email) DO UPDATE
SET
  is_active = true,
  is_admin = true,
  blocked = false;
