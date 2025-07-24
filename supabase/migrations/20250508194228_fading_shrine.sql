-- Enable RLS on audit tables
ALTER TABLE public.data_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for data_audit_log
CREATE POLICY "Users can view their own audit logs"
ON public.data_audit_log
FOR SELECT
TO authenticated
USING (
  modified_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.is_admin = true
  )
);

-- Create policies for audit_logs
CREATE POLICY "Users can view their own audit entries"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM app_users
    WHERE app_users.id = auth.uid()
    AND app_users.is_admin = true
  )
);

-- Add insert policies for audit_logs
CREATE POLICY "Users can create audit entries"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
);

-- Add insert policies for data_audit_log
CREATE POLICY "System can create audit logs"
ON public.data_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add comment explaining the policies
COMMENT ON TABLE public.data_audit_log IS 'Audit log for data changes with RLS enabled - accessible by admins and owners';
COMMENT ON TABLE public.audit_logs IS 'General audit log with RLS enabled - accessible by admins and owners';
