-- Supabase Storage Policies for Pilot Documents
-- Run these commands in your Supabase SQL Editor

-- 1. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Pilots can upload their own documents
CREATE POLICY "Pilots can upload their own documents" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'pilot-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 3. Policy: Pilots can view their own documents
CREATE POLICY "Pilots can view their own documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'pilot-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 4. Policy: Pilots can update their own documents
CREATE POLICY "Pilots can update their own documents" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'pilot-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 5. Policy: Pilots can delete their own documents
CREATE POLICY "Pilots can delete their own documents" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'pilot-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1] AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 6. Policy: Admins can view all documents
CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'pilot-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 7. Policy: Admins can manage all documents
CREATE POLICY "Admins can manage all documents" ON storage.objects
FOR ALL 
TO authenticated
USING (
  bucket_id = 'pilot-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 8. Policy: Inspectors can view all documents
CREATE POLICY "Inspectors can view all documents" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'pilot-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'inspector'
  )
);

-- 9. Create helper function for folder naming
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN string_to_array(name, '/');
END;
$$;

-- 10. File size and type restrictions (optional)
CREATE POLICY "Restrict file size and type" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'pilot-documents' AND
  (metadata->>'size')::int < 10485760 AND -- 10MB limit
  (metadata->>'mimetype') IN (
    'application/pdf',
    'image/jpeg', 
    'image/png',
    'image/jpg'
  )
);