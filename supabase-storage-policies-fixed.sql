-- Supabase Storage Policies for Pilot Documents
-- Run these in Supabase SQL Editor with proper permissions

-- 1. Create helper function first (this should work)
CREATE OR REPLACE FUNCTION get_user_folder(file_path text)
RETURNS text 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN split_part(file_path, '/', 1);
END;
$$;

-- 2. Policy: Pilots can upload their own documents
CREATE POLICY "pilots_upload_own" ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'pilot-documents' 
  AND get_user_folder(name) = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 3. Policy: Pilots can view their own documents
CREATE POLICY "pilots_view_own" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'pilot-documents' 
  AND get_user_folder(name) = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 4. Policy: Pilots can update their own documents
CREATE POLICY "pilots_update_own" ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'pilot-documents' 
  AND get_user_folder(name) = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 5. Policy: Pilots can delete their own documents
CREATE POLICY "pilots_delete_own" ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'pilot-documents' 
  AND get_user_folder(name) = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'pilot'
  )
);

-- 6. Policy: Admins can view all documents
CREATE POLICY "admins_view_all" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'pilot-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 7. Policy: Admins can manage all documents  
CREATE POLICY "admins_manage_all" ON storage.objects
FOR ALL 
TO authenticated
USING (
  bucket_id = 'pilot-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'pilot-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 8. Policy: Inspectors can view all documents
CREATE POLICY "inspectors_view_all" ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'pilot-documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'inspector'
  )
);