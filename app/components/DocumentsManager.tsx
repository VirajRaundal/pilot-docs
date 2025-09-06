'use client'

import { useState, useEffect } from 'react'
import { 
  fetchUserDocuments, 
  fetchAllDocuments, 
  uploadDocumentComplete, 
  deleteDocumentComplete,
  updateDocumentStatus,
  getDocumentWithUrl,
  getDocumentStats,
  DocumentWithPilot,
  DocumentUploadData,
  DocumentStatus 
} from '../../lib/documents'
import { 
  DocumentIcon, 
  EyeIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface DocumentsManagerProps {
  userId: string
  userRole: 'pilot' | 'admin' | 'inspector'
}

export default function DocumentsManager({ userId, userRole }: DocumentsManagerProps) {
  const [documents, setDocuments] = useState<DocumentWithPilot[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    expiringSoon: 0
  })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)

  useEffect(() => {
    loadDocuments()
    if (userRole === 'pilot') {
      loadStats()
    }
  }, [userId, userRole])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      let docs: DocumentWithPilot[]
      
      if (userRole === 'pilot') {
        docs = await fetchUserDocuments(userId)
      } else {
        docs = await fetchAllDocuments()
      }
      
      setDocuments(docs)
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const documentStats = await getDocumentStats(userId)
      setStats(documentStats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleUpload = async (uploadData: DocumentUploadData) => {
    try {
      setUploading(true)
      
      const result = await uploadDocumentComplete(userId, uploadData)
      
      toast.success('Document uploaded successfully!')
      loadDocuments()
      if (userRole === 'pilot') loadStats()
      
      return result
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleView = async (document: DocumentWithPilot) => {
    try {
      setViewingDocument(document.id)
      
      const { viewUrl } = await getDocumentWithUrl(document.id)
      window.open(viewUrl, '_blank')
    } catch (error) {
      console.error('View error:', error)
      toast.error('Failed to open document')
    } finally {
      setViewingDocument(null)
    }
  }

  const handleDelete = async (document: DocumentWithPilot) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      await deleteDocumentComplete(document.id, document.file_url)
      toast.success('Document deleted successfully')
      loadDocuments()
      if (userRole === 'pilot') loadStats()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleStatusUpdate = async (documentId: string, newStatus: DocumentStatus) => {
    try {
      await updateDocumentStatus(documentId, newStatus)
      toast.success(`Document status updated to ${newStatus}`)
      loadDocuments()
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update status')
    }
  }

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'expired':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const formatDocumentType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'noc': 'No Objection Certificate',
      'medical_certificate': 'Medical Certificate', 
      'alcohol_test': 'Alcohol Test',
      'license_certification': 'License Certification',
      'training_records': 'Training Records'
    }
    
    return typeMap[type] || type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const isExpired = (document: DocumentWithPilot) => {
    if (!document.expiry_date) return false
    return new Date(document.expiry_date) < new Date()
  }

  const isExpiringSoon = (document: DocumentWithPilot) => {
    if (!document.expiry_date) return false
    const expiryDate = new Date(document.expiry_date)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading documents...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Dashboard (for pilots) */}
      {userRole === 'pilot' && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.expiringSoon}</div>
            <div className="text-sm text-gray-600">Expiring Soon</div>
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          {userRole === 'pilot' ? 'My Documents' : 'All Documents'}
        </h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No documents found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className={`border rounded-lg p-4 hover:bg-gray-50 ${
                  isExpired(document) ? 'border-red-200 bg-red-50' :
                  isExpiringSoon(document) ? 'border-orange-200 bg-orange-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {document.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>{formatDocumentType(document.document_type)}</span>
                          {userRole !== 'pilot' && (
                            <>
                              <span>•</span>
                              <span>
                                {document.pilots.first_name} {document.pilots.last_name}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            Uploaded {format(new Date(document.upload_date), 'MMM d, yyyy')}
                          </span>
                          {document.expiry_date && (
                            <>
                              <span>•</span>
                              <span className={isExpired(document) ? 'text-red-600 font-medium' : 
                                             isExpiringSoon(document) ? 'text-orange-600 font-medium' : ''}>
                                Expires {format(new Date(document.expiry_date), 'MMM d, yyyy')}
                              </span>
                            </>
                          )}
                          {document.file_size && (
                            <>
                              <span>•</span>
                              <span>
                                {(document.file_size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Status Badge */}
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                      {getStatusIcon(document.status)}
                      <span className="ml-1 capitalize">{document.status}</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleView(document)}
                        disabled={viewingDocument === document.id}
                        className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        title="View Document"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      {(userRole === 'pilot' || userRole === 'admin') && (
                        <button
                          onClick={() => handleDelete(document)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete Document"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Admin Status Controls */}
                      {userRole === 'admin' && document.status === 'pending' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleStatusUpdate(document.id, 'approved')}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                            title="Approve"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(document.id, 'rejected')}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            title="Reject"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}