# Supabase Storage Setup Guide

## Step 1: Create Bucket
1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Name: `pilot-documents`
4. Set to **Private** (not public)

## Step 2: Create Policies via Dashboard

Go to **Storage → Policies** and create these policies:

### Policy 1: Pilots Upload Own Documents
- **Policy Name:** `pilots-upload-own`
- **Allowed Operations:** INSERT
- **Target Roles:** `authenticated`
- **Policy Definition:**
```sql
bucket_id = 'pilot-documents' 
AND (storage.foldername(name))[1] = auth.uid()::text
AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'pilot'
)
```

### Policy 2: Pilots View Own Documents  
- **Policy Name:** `pilots-view-own`
- **Allowed Operations:** SELECT
- **Target Roles:** `authenticated`
- **Policy Definition:**
```sql
bucket_id = 'pilot-documents' 
AND (storage.foldername(name))[1] = auth.uid()::text
AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'pilot'
)
```

### Policy 3: Pilots Update Own Documents
- **Policy Name:** `pilots-update-own` 
- **Allowed Operations:** UPDATE
- **Target Roles:** `authenticated`
- **Policy Definition:**
```sql
bucket_id = 'pilot-documents' 
AND (storage.foldername(name))[1] = auth.uid()::text
AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'pilot'
)
```

### Policy 4: Pilots Delete Own Documents
- **Policy Name:** `pilots-delete-own`
- **Allowed Operations:** DELETE  
- **Target Roles:** `authenticated`
- **Policy Definition:**
```sql
bucket_id = 'pilot-documents' 
AND (storage.foldername(name))[1] = auth.uid()::text
AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'pilot'
)
```

### Policy 5: Admins View All Documents
- **Policy Name:** `admins-view-all`
- **Allowed Operations:** SELECT
- **Target Roles:** `authenticated` 
- **Policy Definition:**
```sql
bucket_id = 'pilot-documents'
AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
)
```

### Policy 6: Admins Manage All Documents
- **Policy Name:** `admins-manage-all`
- **Allowed Operations:** INSERT, UPDATE, DELETE
- **Target Roles:** `authenticated`
- **Policy Definition:**
```sql
bucket_id = 'pilot-documents'
AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'  
)
```

### Policy 7: Inspectors View All Documents
- **Policy Name:** `inspectors-view-all`
- **Allowed Operations:** SELECT
- **Target Roles:** `authenticated`
- **Policy Definition:**
```sql
bucket_id = 'pilot-documents'
AND EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'inspector'
)
```

## Step 3: Create Helper Function (SQL Editor)

Run this in your SQL Editor to support the folder name parsing:

```sql
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN string_to_array(name, '/');
END;
$$;
```

## Alternative: Simplified Approach

If the above doesn't work, create one basic policy and handle permissions in your app:

```sql
-- Basic authenticated access
bucket_id = 'pilot-documents' AND auth.role() = 'authenticated'
```

Then use the role checking functions in your TypeScript code to control access.