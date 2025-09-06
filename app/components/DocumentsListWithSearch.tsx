'use client'

import { useState, useCallback } from 'react'
import { 
  EyeIcon, 
  TrashIcon, 
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { 
  getDocumentWithUrl, 
  deleteDocumentComplete,
  updateDocumentStatus,
  DocumentWithPilot,
  DocumentStatus
} from '../../lib/documents'
import DocumentsSearchFilter from './DocumentsSearchFilter'

interface DocumentsListWithSearchProps {
  userId: string
  userRole: 'pilot' | 'admin' | 'inspector'
  refreshTrigger?: number
}

export default function DocumentsListWithSearch({ 
  userId, 
  userRole, 
  refreshTrigger 
}: DocumentsListWithSearchProps) {
  const [documents, setDocuments] = useState<DocumentWithPilot[]>([])
  const [loading, setLoading] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const handleDocumentsChange = useCallback((filteredDocuments: DocumentWithPilot[]) => {
    setDocuments(filteredDocuments)
  }, [])

  const handleViewDocument = async (document: DocumentWithPilot) => {
    try {
      setViewingDocument(document.id)
      
      // Try to get the document URL directly from storage first
      const { getDocumentUrl } = await import('../../lib/storage')
      const urlResult = await getDocumentUrl(document.file_url)
      
      if (urlResult.success && urlResult.url) {
        window.open(urlResult.url, '_blank')
      } else {
        throw new Error(`Storage error: ${urlResult.error || 'Could not get document URL'}`)
      }
    } catch (error) {
      console.error('View error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to open document'
      toast.error(`Failed to open document: ${errorMessage}`)
      
      // Log the document info for debugging
      console.log('Document info:', {
        id: document.id,
        file_url: document.file_url,
        title: document.title,
        document_type: document.document_type
      })
    } finally {
      setViewingDocument(null)
    }
  }

  const handleDeleteDocument = async (document: DocumentWithPilot) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      await deleteDocumentComplete(document.id, document.file_url)
      toast.success('Document deleted successfully')
      
      // Remove from current filtered list
      setDocuments(prev => prev.filter(doc => doc.id !== document.id))
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleStatusUpdate = async (documentId: string, newStatus: DocumentStatus) => {
    try {
      setUpdatingStatus(documentId)
      await updateDocumentStatus(documentId, newStatus)
      
      toast.success(`Document ${newStatus === 'approved' ? 'approved' : 'rejected'}`)
      
      // Update status in current list
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: newStatus }
            : doc
        )
      )
    } catch (error) {
      console.error('Status update error:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatus(null)
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
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search and Filter Component */}
      <DocumentsSearchFilter
        userId={userId}
        userRole={userRole}
        onDocumentsChange={handleDocumentsChange}
      />
      
      {/* Documents Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
          {userRole === 'pilot' ? 'My Documents' : 'All Documents'}
        </h3>
        
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="hidden sm:inline">Loading...</span>
          </div>
        )}
      </div>
        
      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100">
          <DocumentIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No documents found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {documents.map((document) => (
            <div
              key={document.id}
              className={`mobile-card relative overflow-hidden ${
                isExpired(document) ? 'border-red-200 bg-red-50' :
                isExpiringSoon(document) ? 'border-orange-200 bg-orange-50' :
                'border-gray-100 bg-white hover:shadow-lg'
              }`}
            >
              {/* Document Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                    <DocumentIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate mb-1">
                      {document.title}
                    </h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {formatDocumentType(document.document_type)}
                    </span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}>
                  {getStatusIcon(document.status)}
                  <span className="ml-1 capitalize hidden sm:inline">{document.status}</span>
                </div>
              </div>

              {/* Pilot Info (for admin/inspector) */}
              {userRole !== 'pilot' && (
                <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded-lg">
                  <UserIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.pilots.first_name} {document.pilots.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{document.pilots.email}</p>
                  </div>
                </div>
              )}

              {/* Document Metadata */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-3 w-3" />
                    <span>Uploaded {format(new Date(document.upload_date), 'MMM d')}</span>
                  </div>
                  {document.file_size && (
                    <span>{(document.file_size / 1024 / 1024).toFixed(1)} MB</span>
                  )}
                </div>
                
                {document.expiry_date && (
                  <div className={`flex items-center space-x-1 text-xs ${
                    isExpired(document) ? 'text-red-600 font-medium' : 
                    isExpiringSoon(document) ? 'text-orange-600 font-medium' : 'text-gray-500'
                  }`}>
                    <CalendarIcon className="h-3 w-3" />
                    <span>
                      {isExpired(document) ? 'Expired' : 'Expires'} {format(new Date(document.expiry_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>

              {/* Expiry Warning */}
              {(isExpired(document) || isExpiringSoon(document)) && (
                <div className={`p-2 rounded-lg text-xs mb-3 ${
                  isExpired(document) ? 'bg-red-100 text-red-700 border border-red-200' :
                  'bg-orange-100 text-orange-700 border border-orange-200'
                }`}>
                  <div className="flex items-center space-x-1">
                    <ExclamationTriangleIcon className="h-3 w-3" />
                    <span className="font-medium">
                      {isExpired(document) ? 'Document expired' : 'Expires soon'}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleViewDocument(document)}
                  disabled={viewingDocument === document.id}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors duration-200 min-h-[44px] touch-manipulation"
                >
                  {viewingDocument === document.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                  <span>View</span>
                </button>
                
                <div className="flex items-center space-x-1">
                  {/* Admin Status Controls */}
                  {userRole === 'admin' && document.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(document.id, 'approved')}
                        disabled={updatingStatus === document.id}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50 transition-colors duration-200 min-h-[44px] touch-manipulation"
                      >
                        {updatingStatus === document.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Approve</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(document.id, 'rejected')}
                        disabled={updatingStatus === document.id}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 transition-colors duration-200 min-h-[44px] touch-manipulation"
                      >
                        {updatingStatus === document.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Reject</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                  
                  {(userRole === 'pilot' || userRole === 'admin') && (
                    <button
                      onClick={() => handleDeleteDocument(document)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] touch-manipulation"
                      title="Delete Document"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            ))}
          </div>
        )}

      {/* Results Summary */}
      {documents.length > 0 && (
        <div className="mt-4 sm:mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <span className="text-sm text-gray-600 font-medium">
              {documents.length} document{documents.length !== 1 ? 's' : ''} found
            </span>
            
            {userRole === 'admin' && (
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>{documents.filter(d => d.status === 'pending').length} pending</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>{documents.filter(d => d.status === 'approved').length} approved</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span>{documents.filter(d => d.status === 'rejected').length} rejected</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}