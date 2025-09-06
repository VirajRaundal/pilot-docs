-- Updated RLS Policies for documents table
-- Run these in your Supabase SQL Editor

-- First, drop existing policies
DROP POLICY IF EXISTS "pilots_can_insert_own_documents" ON documents;
DROP POLICY IF EXISTS "pilots_can_view_own_documents" ON documents;
DROP POLICY IF EXISTS "pilots_can_update_own_documents" ON documents;
DROP POLICY IF EXISTS "pilots_can_delete_own_documents" ON documents;
DROP POLICY IF EXISTS "admins_can_view_all_documents" ON documents;
DROP POLICY IF EXISTS "admins_can_insert_documents" ON documents;
DROP POLICY IF EXISTS "admins_can_update_all_documents" ON documents;
DROP POLICY IF EXISTS "admins_can_delete_all_documents" ON documents;
DROP POLICY IF EXISTS "inspectors_can_view_all_documents" ON documents;

-- 1. Policy: Pilots can insert documents for their pilot record
CREATE POLICY "pilots_can_insert_own_documents" ON documents
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pilots p, user_roles ur
    WHERE p.id = pilot_id 
    AND p.user_id = auth.uid()
    AND ur.user_id = auth.uid() 
    AND ur.role = 'pilot'
  )
);

-- 2. Policy: Pilots can view their own documents
CREATE POLICY "pilots_can_view_own_documents" ON documents
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pilots p, user_roles ur
    WHERE p.id = pilot_id 
    AND p.user_id = auth.uid()
    AND ur.user_id = auth.uid() 
    AND ur.role = 'pilot'
  )
);

-- 3. Policy: Pilots can update their own documents
CREATE POLICY "pilots_can_update_own_documents" ON documents
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pilots p, user_roles ur
    WHERE p.id = pilot_id 
    AND p.user_id = auth.uid()
    AND ur.user_id = auth.uid() 
    AND ur.role = 'pilot'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pilots p, user_roles ur
    WHERE p.id = pilot_id 
    AND p.user_id = auth.uid()
    AND ur.user_id = auth.uid() 
    AND ur.role = 'pilot'
  )
);

-- 4. Policy: Pilots can delete their own documents
CREATE POLICY "pilots_can_delete_own_documents" ON documents
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pilots p, user_roles ur
    WHERE p.id = pilot_id 
    AND p.user_id = auth.uid()
    AND ur.user_id = auth.uid() 
    AND ur.role = 'pilot'
  )
);

-- 5. Policy: Admins can view all documents
CREATE POLICY "admins_can_view_all_documents" ON documents
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 6. Policy: Admins can insert documents for any pilot
CREATE POLICY "admins_can_insert_documents" ON documents
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 7. Policy: Admins can update all documents
CREATE POLICY "admins_can_update_all_documents" ON documents
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 8. Policy: Admins can delete all documents
CREATE POLICY "admins_can_delete_all_documents" ON documents
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 9. Policy: Inspectors can view all documents
CREATE POLICY "inspectors_can_view_all_documents" ON documents
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'inspector'
  )
);

-- 10. Also need RLS policies for pilots table
ALTER TABLE pilots ENABLE ROW LEVEL SECURITY;

-- Allow pilots to view their own record
CREATE POLICY "pilots_can_view_own_record" ON pilots
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Allow pilots to insert their own record
CREATE POLICY "pilots_can_insert_own_record" ON pilots
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow admins to view all pilot records
CREATE POLICY "admins_can_view_all_pilots" ON pilots
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to manage all pilot records
CREATE POLICY "admins_can_manage_all_pilots" ON pilots
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);