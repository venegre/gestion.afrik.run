-- Restaurer l'utilisateur dans app_users
INSERT INTO app_users (
  id,
  email,
  created_at,
  is_active,
  is_admin,
  blocked,
  phone_number
)
VALUES (
  'a836a8ba-2542-4667-a03b-32eb8c08572a',  -- ID existant
  'haroun@gmail.com',
  NOW(),
  true,    -- Activer le compte
  false,   -- Pas admin
  false,   -- Pas bloqué
  '+224600000000'  -- Numéro de téléphone par défaut
)
ON CONFLICT (id) DO UPDATE
SET 
  is_active = true,
  blocked = false;

-- Vérifier que les clients sont bien liés
UPDATE clients
SET created_by = 'a836a8ba-2542-4667-a03b-32eb8c08572a'
WHERE created_by IS NULL
AND id IN (
  SELECT client_id 
  FROM transactions t
  JOIN clients c ON c.id = t.client_id
  WHERE c.created_by = 'a836a8ba-2542-4667-a03b-32eb8c08572a'
);
