/*
  # Vérification des transactions de haroun@gmail.com
  
  1. Requête pour vérifier :
    - Les transactions entre le 14/05/2025 et le 17/05/2025
    - Pour les clients de haroun@gmail.com
*/

-- Créer une fonction pour vérifier les transactions
CREATE OR REPLACE FUNCTION check_user_transactions(user_email text, start_date date, end_date date)
RETURNS TABLE (
  client_name text,
  transaction_date date,
  amount_sent numeric,
  amount_paid numeric,
  amount_to_pay numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name,
    t.date,
    t.amount_sent,
    t.amount_paid,
    t.amount_to_pay
  FROM transactions t
  JOIN clients c ON c.id = t.client_id
  JOIN auth.users u ON u.id = c.created_by
  WHERE 
    u.email = user_email AND
    t.date BETWEEN start_date AND end_date
  ORDER BY t.date, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter la vérification
SELECT * FROM check_user_transactions('haroun@gmail.com', '2025-05-14', '2025-05-17');
