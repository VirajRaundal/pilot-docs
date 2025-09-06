-- RLS Policies for documents table
-- Run these in your Supabase SQL Editor

-- 1. Enable RLS on documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Pilots can insert their own documents
CREATE POLICY "pilots_can_insert_own_documents" ON documents
FOR INSERT 
TO authenticated
WITH CHECK (
  pilot_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 3. Policy: Pilots can view their own documents
CREATE POLICY "pilots_can_view_own_documents" ON documents
FOR SELECT 
TO authenticated
USING (
  pilot_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 4. Policy: Pilots can update their own documents
CREATE POLICY "pilots_can_update_own_documents" ON documents
FOR UPDATE 
TO authenticated
USING (
  pilot_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
)
WITH CHECK (
  pilot_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 5. Policy: Pilots can delete their own documents
CREATE POLICY "pilots_can_delete_own_documents" ON documents
FOR DELETE 
TO authenticated
USING (
  pilot_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 6. Policy: Admins can view all documents
CREATE POLICY "admins_can_view_all_documents" ON documents
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 7. Policy: Admins can insert documents for any pilot
CREATE POLICY "admins_can_insert_documents" ON documents
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 8. Policy: Admins can update all documents
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

-- 9. Policy: Admins can delete all documents
CREATE POLICY "admins_can_delete_all_documents" ON documents
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 10. Policy: Inspectors can view all documents
CREATE POLICY "inspectors_can_view_all_documents" ON documents
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'inspector'
  )
);