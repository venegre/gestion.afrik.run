-- First ensure the admin exists in auth.users
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Try to get existing admin id
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com';
  
  -- If admin doesn't exist, create it
  IF admin_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('admin123456', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false
    ) RETURNING id INTO admin_id;
  ELSE
    -- Update existing admin password
    UPDATE auth.users 
    SET 
      encrypted_password = crypt('admin123456', gen_salt('bf')),
      email_confirmed_at = NOW(),
      updated_at = NOW(),
      raw_app_meta_data = '{"provider":"email","providers":["email"]}'
    WHERE id = admin_id;
  END IF;

  -- Ensure admin exists in app_users with correct permissions
  INSERT INTO app_users (
    id,
    email,
    created_at,
    is_active,
    is_admin,
    blocked,
    phone_number
  ) VALUES (
    admin_id,
    'admin@example.com',
    NOW(),
    true,
    true,
    false,
    '+123456789'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = 'admin@example.com',
    is_active = true,
    is_admin = true,
    blocked = false,
    phone_number = EXCLUDED.phone_number;

  -- Update any existing records that reference the admin
  UPDATE app_users
  SET created_by = admin_id
  WHERE created_by IS NULL;
  
  UPDATE clients
  SET created_by = admin_id
  WHERE created_by IS NULL;
END $$;

-- Drop and recreate RLS policies for app_users
DROP POLICY IF EXISTS "users_read_access" ON app_users;
DROP POLICY IF EXISTS "admin_insert" ON app_users;
DROP POLICY IF EXISTS "admin_update" ON app_users;
DROP POLICY IF EXISTS "admin_delete" ON app_users;

-- Create new policies
CREATE POLICY "users_read_access"
ON app_users
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "admin_insert"
ON app_users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "admin_update"
ON app_users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "admin_delete"
ON app_users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users
    WHERE id = auth.uid()
    AND is_admin = true
  )
);
