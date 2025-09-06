/**
 * Document Management Usage Examples
 * 
 * This file demonstrates how to use the document functions for:
 * - Saving document metadata to Supabase
 * - Fetching and displaying documents
 * - Managing document status
 * - Handling file uploads with metadata
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  // Core document functions
  uploadDocumentComplete,
  fetchUserDocuments,
  fetchAllDocuments,
  fetchDocumentsByStatus,
  saveDocumentMetadata,
  updateDocumentStatus,
  deleteDocumentComplete,
  getDocumentWithUrl,
  getDocumentStats,
  getExpiringDocuments,
  
  // Types
  DocumentWithPilot,
  DocumentUploadData,
  DocumentStatus,
  DocumentType
} from '../lib/documents'
import toast from 'react-hot-toast'

export default function DocumentUsageExample() {
  const [documents, setDocuments] = useState<DocumentWithPilot[]>([])
  const [stats, setStats] = useState<any>({})
  
  // Example: Upload a document with metadata
  const handleDocumentUpload = async (file: File, userId: string) => {
    try {
      const uploadData: DocumentUploadData = {
        title: 'Medical Certificate 2024',
        document_type: 'medical_certificate',
        expiry_date: '2024-12-31',
        file: file
      }

      // This function handles both file upload AND metadata saving
      const { document, fileUrl } = await uploadDocumentComplete(userId, uploadData)
      
      console.log('Document uploaded:', document)
      console.log('File URL:', fileUrl)
      
      toast.success('Document uploaded successfully!')
      
      // Refresh document list
      loadUserDocuments(userId)
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Upload failed')
    }
  }

  // Example: Fetch user's documents
  const loadUserDocuments = async (userId: string) => {
    try {
      const userDocs = await fetchUserDocuments(userId)
      setDocuments(userDocs)
      
      console.log('User documents:', userDocs)
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }

  // Example: Fetch all documents (admin view)
  const loadAllDocuments = async () => {
    try {
      const allDocs = await fetchAllDocuments()
      setDocuments(allDocs)
      
      console.log('All documents:', allDocs)
    } catch (error) {
      console.error('Failed to load all documents:', error)
    }
  }

  // Example: Get documents by status
  const loadPendingDocuments = async () => {
    try {
      const pendingDocs = await fetchDocumentsByStatus('pending')
      setDocuments(pendingDocs)
      
      console.log('Pending documents:', pendingDocs)
    } catch (error) {
      console.error('Failed to load pending documents:', error)
    }
  }

  // Example: Update document status (admin function)
  const approveDocument = async (documentId: string) => {
    try {
      const updatedDoc = await updateDocumentStatus(documentId, 'approved')
      
      console.log('Document approved:', updatedDoc)
      toast.success('Document approved!')
      
      // Refresh list
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'approved' as DocumentStatus }
            : doc
        )
      )
    } catch (error) {
      console.error('Failed to approve document:', error)
      toast.error('Failed to approve document')
    }
  }

  // Example: Delete document
  const deleteDocument = async (documentId: string, fileUrl: string) => {
    try {
      await deleteDocumentComplete(documentId, fileUrl)
      
      console.log('Document deleted')
      toast.success('Document deleted!')
      
      // Remove from list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    } catch (error) {
      console.error('Failed to delete document:', error)
      toast.error('Failed to delete document')
    }
  }

  // Example: Get document with viewing URL
  const viewDocument = async (documentId: string) => {
    try {
      const { document, viewUrl } = await getDocumentWithUrl(documentId)
      
      console.log('Document:', document)
      console.log('View URL:', viewUrl)
      
      // Open in new tab
      window.open(viewUrl, '_blank')
    } catch (error) {
      console.error('Failed to get document URL:', error)
      toast.error('Failed to open document')
    }
  }

  // Example: Get document statistics
  const loadDocumentStats = async (userId: string) => {
    try {
      const documentStats = await getDocumentStats(userId)
      setStats(documentStats)
      
      console.log('Document stats:', documentStats)
      /*
      Returns:
      {
        total: 5,
        pending: 2,
        approved: 2,
        rejected: 1,
        expired: 0,
        expiringSoon: 1
      }
      */
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  // Example: Get expiring documents
  const loadExpiringDocuments = async (userId: string) => {
    try {
      const expiringDocs = await getExpiringDocuments(userId, 30) // Next 30 days
      
      console.log('Documents expiring soon:', expiringDocs)
      
      if (expiringDocs.length > 0) {
        toast.warning(`${expiringDocs.length} documents expiring soon!`)
      }
    } catch (error) {
      console.error('Failed to load expiring documents:', error)
    }
  }

  // Example: Save metadata only (if file already uploaded)
  const saveMetadataOnly = async (pilotId: string, fileUrl: string) => {
    try {
      const document = await saveDocumentMetadata(pilotId, {
        document_type: 'noc',
        title: 'No Objection Certificate',
        file_url: fileUrl,
        file_size: 1024000, // 1MB
        file_type: 'application/pdf',
        expiry_date: '2024-12-31',
        status: 'pending'
      })
      
      console.log('Metadata saved:', document)
      toast.success('Document metadata saved!')
    } catch (error) {
      console.error('Failed to save metadata:', error)
      toast.error('Failed to save metadata')
    }
  }

  // Example component render showing document list
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Document Management Examples</h2>
      
      {/* Stats Display */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-2xl font-bold text-purple-600">{stats.expiringSoon}</div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </div>
        </div>
      )}

      {/* Document List */}
      <div className="bg-white rounded shadow p-6">
        <h3 className="text-lg font-medium mb-4">Documents</h3>
        
        {documents.length === 0 ? (
          <p className="text-gray-500">No documents found</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{doc.title}</h4>
                  <p className="text-sm text-gray-600">
                    Type: {doc.document_type} | Status: {doc.status}
                  </p>
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
                    {doc.expiry_date && ` | Expires: ${new Date(doc.expiry_date).toLocaleDateString()}`}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewDocument(doc.id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    View
                  </button>
                  
                  {doc.status === 'pending' && (
                    <button
                      onClick={() => approveDocument(doc.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Approve
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteDocument(doc.id, doc.file_url)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Example buttons to trigger functions */}
      <div className="bg-gray-100 p-4 rounded">
        <h4 className="font-medium mb-2">Example Actions:</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadUserDocuments('user-id-here')}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Load User Documents
          </button>
          
          <button
            onClick={() => loadAllDocuments()}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm"
          >
            Load All Documents
          </button>
          
          <button
            onClick={() => loadPendingDocuments()}
            className="px-3 py-1 bg-yellow-600 text-white rounded text-sm"
          >
            Load Pending Documents
          </button>
          
          <button
            onClick={() => loadDocumentStats('user-id-here')}
            className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
          >
            Load Stats
          </button>
          
          <button
            onClick={() => loadExpiringDocuments('user-id-here')}
            className="px-3 py-1 bg-orange-600 text-white rounded text-sm"
          >
            Check Expiring Documents
          </button>
        </div>
      </div>
    </div>
  )
}

/*
USAGE PATTERNS:

1. COMPLETE UPLOAD (File + Metadata):
   const result = await uploadDocumentComplete(userId, {
     title: 'Medical Certificate',
     document_type: 'medical_certificate',
     file: fileObject,
     expiry_date: '2024-12-31'
   })

2. SAVE METADATA ONLY:
   const doc = await saveDocumentMetadata(pilotId, {
     document_type: 'noc',
     title: 'NOC Certificate',
     file_url: 'storage/path/file.pdf',
     file_size: 1024000,
     file_type: 'application/pdf'
   })

3. FETCH DOCUMENTS:
   const userDocs = await fetchUserDocuments(userId)
   const allDocs = await fetchAllDocuments()
   const pending = await fetchDocumentsByStatus('pending')

4. MANAGE STATUS:
   await updateDocumentStatus(docId, 'approved')

5. DELETE DOCUMENTS:
   await deleteDocumentComplete(docId, fileUrl)

6. VIEW DOCUMENTS:
   const { document, viewUrl } = await getDocumentWithUrl(docId)
   window.open(viewUrl, '_blank')

7. GET STATISTICS:
   const stats = await getDocumentStats(userId)

8. CHECK EXPIRING:
   const expiring = await getExpiringDocuments(userId, 30)
*/