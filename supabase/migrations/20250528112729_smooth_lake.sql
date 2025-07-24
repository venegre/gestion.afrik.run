/*
  # Vérifier les transactions pour une période spécifique
  
  1. Vérification
    - Transactions entre 06/05/2025 et 16/05/2025
    - Pour l'utilisateur haroun@gmail.com
    - Inclut tous les détails des transactions
*/

-- Vérifier les transactions pour la période spécifique
SELECT 
  c.name as client_name,
  t.date,
  t.amount_sent,
  t.amount_paid,
  t.amount_to_pay,
  t.payment_method,
  t.description
FROM transactions t
JOIN clients c ON c.id = t.client_id
WHERE 
  c.created_by = (SELECT id FROM auth.users WHERE email = 'haroun@gmail.com')
  AND t.date BETWEEN '2025-05-06' AND '2025-05-16'
  AND (c.deleted_at IS NULL OR c.deleted_at > now())
ORDER BY t.date, c.name;

-- Vérifier les totaux pour la période
SELECT 
  SUM(t.amount_sent) as total_sent,
  SUM(t.amount_paid) as total_paid,
  SUM(t.amount_to_pay) as total_to_pay
FROM transactions t
JOIN clients c ON c.id = t.client_id
WHERE 
  c.created_by = (SELECT id FROM auth.users WHERE email = 'haroun@gmail.com')
  AND t.date BETWEEN '2025-05-06' AND '2025-05-16'
  AND (c.deleted_at IS NULL OR c.deleted_at > now());
