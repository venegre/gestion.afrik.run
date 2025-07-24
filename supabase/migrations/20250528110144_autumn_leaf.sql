-- Fonction pour vérifier les données d'un utilisateur
CREATE OR REPLACE FUNCTION check_user_data(user_email text)
RETURNS TABLE (
  user_exists boolean,
  user_id uuid,
  user_active boolean,
  user_blocked boolean,
  client_count bigint,
  transaction_count bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH user_info AS (
    SELECT 
      u.id,
      au.is_active,
      au.blocked,
      COUNT(DISTINCT c.id) as clients,
      COUNT(DISTINCT t.id) as transactions
    FROM auth.users u
    LEFT JOIN app_users au ON au.id = u.id
    LEFT JOIN clients c ON c.created_by = u.id
    LEFT JOIN transactions t ON t.client_id = c.id
    WHERE u.email = user_email
    GROUP BY u.id, au.is_active, au.blocked
  )
  SELECT 
    EXISTS (SELECT 1 FROM auth.users WHERE email = user_email),
    ui.id,
    ui.is_active,
    ui.blocked,
    ui.clients,
    ui.transactions
  FROM user_info ui;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier les données de l'utilisateur
SELECT * FROM check_user_data('haroun@gmail.com');

-- Vérifier les transactions de l'utilisateur
SELECT 
  c.name as client_name,
  t.date,
  t.amount_sent,
  t.amount_paid,
  t.amount_to_pay,
  t.payment_method,
  t.description
FROM auth.users u
JOIN clients c ON c.created_by = u.id
JOIN transactions t ON t.client_id = c.id
WHERE u.email = 'haroun@gmail.com'
ORDER BY t.date DESC;
