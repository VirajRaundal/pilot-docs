import { supabase } from './supabase'
import { uploadPilotDocument, getDocumentUrl, deleteDocument } from './storage'

// Document types
export type DocumentType = 'noc' | 'medical_certificate' | 'alcohol_test' | 'license_certification' | 'training_records'
export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired'

// Document interface
export interface Document {
  id: string
  pilot_id: string
  document_type: DocumentType
  title: string
  file_url: string
  file_size: number | null
  file_type: string | null
  upload_date: string
  expiry_date: string | null
  status: DocumentStatus
  created_at: string
  updated_at: string
}

// Extended document with pilot info
export interface DocumentWithPilot extends Document {
  pilots: {
    id: string
    user_id: string
    first_name: string
    last_name: string
    email: string
    pilot_license: string
  }
}

// Document upload data
export interface DocumentUploadData {
  title: string
  document_type: DocumentType
  expiry_date?: string
  file: File
}

/**
 * Get or create pilot record for a user
 */
export async function getOrCreatePilotRecord(userId: string): Promise<string> {
  try {
    // Check if pilot record exists
    const { data: existingPilot, error: pilotCheckError } = await supabase
      .from('pilots')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (pilotCheckError && pilotCheckError.code !== 'PGRST116') {
      throw new Error('Error checking pilot record: ' + pilotCheckError.message)
    }

    if (existingPilot) {
      return (existingPilot as { id: string }).id
    }

    // Get user info from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError

    // Create pilot record if it doesn't exist
    const { data: newPilot, error: createPilotError } = await (supabase
      .from('pilots')
      .insert({
        user_id: userId,
        pilot_license: 'TEMP-' + Date.now(),
        first_name: user?.user_metadata?.first_name || 'User',
        last_name: user?.user_metadata?.last_name || 'Pilot',
        email: user?.email || 'user@example.com',
        status: 'active' as const
      } as any)
      .select('id')
      .single() as unknown as Promise<{ data: { id: string } | null; error: Error | null }>)

    if (createPilotError) {
      throw new Error('Error creating pilot record: ' + createPilotError.message)
    }

    return newPilot?.id || ''
  } catch (error) {
    console.error('Error in getOrCreatePilotRecord:', error)
    throw error
  }
}

/**
 * Save document metadata to database
 */
export async function saveDocumentMetadata(
  pilotId: string,
  documentData: {
    document_type: DocumentType
    title: string
    file_url: string
    file_size: number
    file_type: string
    expiry_date?: string
    status?: DocumentStatus
  }
): Promise<Document> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        pilot_id: pilotId,
        document_type: documentData.document_type,
        title: documentData.title,
        file_url: documentData.file_url,
        file_size: documentData.file_size,
        file_type: documentData.file_type,
        upload_date: new Date().toISOString(),
        expiry_date: documentData.expiry_date || null,
        status: documentData.status || 'pending'
      })
      .select()
      .single()

    if (error) {
      throw new Error('Error saving document metadata: ' + error.message)
    }

    return data as Document
  } catch (error) {
    console.error('Error in saveDocumentMetadata:', error)
    throw error
  }
}

/**
 * Complete document upload (file + metadata)
 */
export async function uploadDocumentComplete(
  userId: string,
  uploadData: DocumentUploadData
): Promise<{ document: Document; fileUrl: string }> {
  try {
    // 1. Get or create pilot record
    const pilotId = await getOrCreatePilotRecord(userId)

    // 2. Upload file to storage
    const uploadResult = await uploadPilotDocument(
      uploadData.file,
      userId,
      uploadData.document_type,
      `${uploadData.document_type}_${Date.now()}.${uploadData.file.name.split('.').pop()}`
    )

    if (!uploadResult.success) {
      throw new Error(uploadResult.error)
    }

    // 3. Save metadata to database
    const document = await saveDocumentMetadata(pilotId, {
      document_type: uploadData.document_type,
      title: uploadData.title,
      file_url: uploadResult.fullPath!,
      file_size: uploadData.file.size,
      file_type: uploadData.file.type,
      expiry_date: uploadData.expiry_date
    })

    // 4. Get file viewing URL
    const urlResult = await getDocumentUrl(uploadResult.fullPath!)
    const fileUrl = urlResult.success ? urlResult.url! : ''

    return {
      document,
      fileUrl
    }
  } catch (error) {
    console.error('Error in uploadDocumentComplete:', error)
    throw error
  }
}

/**
 * Fetch user's documents
 */
export async function fetchUserDocuments(userId: string): Promise<DocumentWithPilot[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        pilots!inner (
          id,
          user_id,
          first_name,
          last_name,
          email,
          pilot_license
        )
      `)
      .eq('pilots.user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Error fetching documents: ' + error.message)
    }

    return (data as DocumentWithPilot[]) || []
  } catch (error) {
    console.error('Error in fetchUserDocuments:', error)
    throw error
  }
}

/**
 * Fetch all documents (admin/inspector view)
 */
export async function fetchAllDocuments(): Promise<DocumentWithPilot[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        pilots!inner (
          id,
          user_id,
          first_name,
          last_name,
          email,
          pilot_license
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Error fetching all documents: ' + error.message)
    }

    return (data as DocumentWithPilot[]) || []
  } catch (error) {
    console.error('Error in fetchAllDocuments:', error)
    throw error
  }
}

/**
 * Fetch documents by status
 */
export async function fetchDocumentsByStatus(status: DocumentStatus): Promise<DocumentWithPilot[]> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        pilots!inner (
          id,
          user_id,
          first_name,
          last_name,
          email,
          pilot_license
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Error fetching documents by status: ' + error.message)
    }

    return (data as DocumentWithPilot[]) || []
  } catch (error) {
    console.error('Error in fetchDocumentsByStatus:', error)
    throw error
  }
}

/**
 * Update document status
 */
export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus
): Promise<Document> {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) {
      throw new Error('Error updating document status: ' + error.message)
    }

    return data as Document
  } catch (error) {
    console.error('Error in updateDocumentStatus:', error)
    throw error
  }
}

/**
 * Delete document (file + metadata)
 */
export async function deleteDocumentComplete(documentId: string, fileUrl: string): Promise<void> {
  try {
    // 1. Delete file from storage
    const storageResult = await deleteDocument(fileUrl)
    if (!storageResult.success) {
      throw new Error('Failed to delete file from storage')
    }

    // 2. Delete metadata from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      throw new Error('Error deleting document metadata: ' + error.message)
    }
  } catch (error) {
    console.error('Error in deleteDocumentComplete:', error)
    throw error
  }
}

/**
 * Get document with signed URL for viewing
 */
export async function getDocumentWithUrl(documentId: string): Promise<{
  document: DocumentWithPilot
  viewUrl: string
}> {
  try {
    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        pilots!inner (
          id,
          user_id,
          first_name,
          last_name,
          email,
          pilot_license
        )
      `)
      .eq('id', documentId)
      .single()

    if (docError) {
      throw new Error('Error fetching document: ' + docError.message)
    }

    // Get signed URL
    const typedDoc = document as Document
    const urlResult = await getDocumentUrl(typedDoc.file_url)
    if (!urlResult.success) {
      throw new Error(`Error getting document URL: ${urlResult.error || 'Unknown error'}`)
    }

    if (!urlResult.url) {
      throw new Error('Document URL is empty')
    }

    return {
      document: document as DocumentWithPilot,
      viewUrl: urlResult.url
    }
  } catch (error) {
    console.error('Error in getDocumentWithUrl:', error)
    throw error
  }
}

/**
 * Check if document is expired
 */
export function isDocumentExpired(document: Document): boolean {
  if (!document.expiry_date) return false
  return new Date(document.expiry_date) < new Date()
}

/**
 * Get documents expiring soon (within specified days)
 */
export async function getExpiringDocuments(
  userId: string,
  daysAhead: number = 30
): Promise<DocumentWithPilot[]> {
  try {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        pilots!inner (
          id,
          user_id,
          first_name,
          last_name,
          email,
          pilot_license
        )
      `)
      .eq('pilots.user_id', userId)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureDate.toISOString())
      .gte('expiry_date', new Date().toISOString())
      .order('expiry_date', { ascending: true })

    if (error) {
      throw new Error('Error fetching expiring documents: ' + error.message)
    }

    return (data as DocumentWithPilot[]) || []
  } catch (error) {
    console.error('Error in getExpiringDocuments:', error)
    throw error
  }
}

/**
 * Get user dashboard data (combined stats and documents)
 */
export async function getUserDashboardData(userId: string): Promise<{
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
    expired: number
    expiringSoon: number
  }
  documents: DocumentWithPilot[]
  expiringDocuments: DocumentWithPilot[]
}> {
  try {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        pilots!inner (
          id,
          user_id,
          first_name,
          last_name,
          email,
          pilot_license
        )
      `)
      .eq('pilots.user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Error fetching user dashboard data: ' + error.message)
    }

    const documents = data || []
    const stats = {
      total: documents.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      expiringSoon: 0
    }

    const expiringDocuments: DocumentWithPilot[] = []
    const now = new Date()

    // Calculate stats and filter expiring docs in a single pass
    for (const doc of documents) {
      const typedDoc = doc as Document
      // Status counts
      if (typedDoc.status === 'pending') stats.pending++
      else if (typedDoc.status === 'approved') stats.approved++
      else if (typedDoc.status === 'rejected') stats.rejected++

      // Expiry calculations
      if (typedDoc.expiry_date) {
        const expiryDate = new Date(typedDoc.expiry_date)
        
        if (expiryDate < now) {
          stats.expired++
        } else if (expiryDate <= futureDate) {
          stats.expiringSoon++
          expiringDocuments.push(typedDoc)
        }
      }
    }

    // Sort expiring documents by expiry date
    expiringDocuments.sort((a, b) => 
      new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime()
    )

    return {
      stats,
      documents,
      expiringDocuments
    }
  } catch (error) {
    console.error('Error in getUserDashboardData:', error)
    throw error
  }
}

/**
 * Get admin overview data (combined stats and recent documents)
 */
export async function getAdminOverview(): Promise<{
  totalUsers: number
  totalDocuments: number
  pendingApprovals: number
  recentDocuments: DocumentWithPilot[]
}> {
  try {
    // Get all necessary data with parallel queries
    const [documentsQuery, pilotsQuery] = await Promise.all([
      supabase
        .from('documents')
        .select(`
          *,
          pilots!inner (
            id,
            user_id,
            first_name,
            last_name,
            email,
            pilot_license
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('pilots')
        .select('id', { count: 'exact', head: true })
    ])

    if (documentsQuery.error) {
      throw new Error('Error fetching documents: ' + documentsQuery.error.message)
    }

    if (pilotsQuery.error) {
      throw new Error('Error fetching pilots: ' + pilotsQuery.error.message)
    }

    const documents = documentsQuery.data || []
    const pendingCount = documents.filter(d => (d as Document).status === 'pending').length

    return {
      totalUsers: pilotsQuery.count || 0,
      totalDocuments: documents.length,
      pendingApprovals: pendingCount,
      recentDocuments: documents.slice(0, 10)
    }
  } catch (error) {
    console.error('Error in getAdminOverview:', error)
    throw error
  }
}

/**
 * Get document statistics for a user (optimized with single query)
 */
export async function getDocumentStats(userId: string): Promise<{
  total: number
  pending: number
  approved: number
  rejected: number
  expired: number
  expiringSoon: number
}> {
  try {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)

    const { data, error } = await supabase
      .from('documents')
      .select(`
        status,
        expiry_date,
        pilots!inner (user_id)
      `)
      .eq('pilots.user_id', userId)

    if (error) {
      throw new Error('Error fetching document stats: ' + error.message)
    }

    const documents = data || []
    const stats = {
      total: documents.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      expiringSoon: 0
    }

    // Calculate stats in a single pass
    for (const doc of documents) {
      // Type assertion to ensure we have the right type
      const typedDoc = doc as { status: string; expiry_date: string | null }
      
      // Status counts
      if (typedDoc.status === 'pending') stats.pending++
      else if (typedDoc.status === 'approved') stats.approved++
      else if (typedDoc.status === 'rejected') stats.rejected++

      // Expiry calculations
      if (typedDoc.expiry_date) {
        const expiryDate = new Date(typedDoc.expiry_date)
        const nowDate = new Date()
        
        if (expiryDate < nowDate) {
          stats.expired++
        } else if (expiryDate <= new Date(futureDate)) {
          stats.expiringSoon++
        }
      }
    }

    return stats
  } catch (error) {
    console.error('Error in getDocumentStats:', error)
    throw error
  }
}