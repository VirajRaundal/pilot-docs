import { supabase } from './supabase'

// File upload utility for pilot documents
export async function uploadPilotDocument(
  file: File, 
  userId: string, 
  documentType: 'noc' | 'medical_certificate' | 'alcohol_test' | 'license_certification' | 'training_records',
  fileName?: string
) {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const finalFileName = fileName || `${documentType}_${timestamp}.${fileExt}`
    
    // Create folder structure: userId/documentType/filename
    const filePath = `${userId}/${documentType}/${finalFileName}`

    // Upload file
    const { data, error } = await supabase.storage
      .from('pilot-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        metadata: {
          userId,
          documentType,
          originalName: file.name
        }
      })

    if (error) {
      throw error
    }

    return {
      success: true,
      path: data.path,
      fullPath: filePath
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

// Get signed URL for viewing documents
export async function getDocumentUrl(filePath: string) {
  try {
    console.log('Getting signed URL for file path:', filePath)
    
    const { data, error } = await supabase.storage
      .from('pilot-documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
      console.error('Supabase storage error:', error)
      throw error
    }

    if (!data || !data.signedUrl) {
      console.error('No signed URL returned from Supabase')
      throw new Error('No signed URL returned')
    }

    console.log('Successfully generated signed URL')
    return {
      success: true,
      url: data.signedUrl
    }
  } catch (error) {
    console.error('Error in getDocumentUrl:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get URL'
    }
  }
}

// List user's documents
export async function listUserDocuments(userId: string, documentType?: string) {
  try {
    const folderPath = documentType ? `${userId}/${documentType}` : `${userId}/`
    
    const { data, error } = await supabase.storage
      .from('pilot-documents')
      .list(folderPath, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      throw error
    }

    return {
      success: true,
      files: data || []
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files'
    }
  }
}

// Delete document
export async function deleteDocument(filePath: string) {
  try {
    const { error } = await supabase.storage
      .from('pilot-documents')
      .remove([filePath])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete file'
    }
  }
}

// Get all documents for admin/inspector view
export async function getAllDocuments() {
  try {
    const { data, error } = await supabase.storage
      .from('pilot-documents')
      .list('', {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      throw error
    }

    return {
      success: true,
      files: data || []
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list all files'
    }
  }
}

// Validate file type and size
export function validateFile(file: File) {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png'
  ]
  
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PDF and image files are allowed.'
    }
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.'
    }
  }
  
  return { valid: true }
}