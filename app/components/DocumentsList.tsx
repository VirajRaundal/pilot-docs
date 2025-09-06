'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getDocumentUrl, deleteDocument } from '../../lib/storage'
import { 
  EyeIcon, 
  TrashIcon, 
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Document {
  id: string
  document_type: string
  title: string
  file_url: string
  file_size: number | null
  file_type: string | null
  upload_date: string
  expiry_date: string | null
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  created_at: string
}

interface DocumentsListProps {
  userId: string
  userRole: 'pilot' | 'admin' | 'inspector'
  refreshTrigger?: number
}

export default function DocumentsList({ userId, userRole, refreshTrigger }: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)

  useEffect(() => {
    loadDocuments()
  }, [userId, refreshTrigger])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('documents')
        .select(`
          *,
          pilots!inner (
            id,
            user_id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // If user is a pilot, only show their documents
      if (userRole === 'pilot') {
        query = query.eq('pilots.user_id', userId)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDocument = async (fileUrl: string) => {
    try {
      setViewingDocument(fileUrl)
      const result = await getDocumentUrl(fileUrl)
      
      if (result.success && result.url) {
        window.open(result.url, '_blank')
      } else {
        toast.error('Failed to load document')
      }
    } catch (error) {
      toast.error('Failed to open document')
    } finally {
      setViewingDocument(null)
    }
  }

  const handleDeleteDocument = async (documentId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      // Delete from storage
      const storageResult = await deleteDocument(fileUrl)
      if (!storageResult.success) {
        throw new Error('Failed to delete file from storage')
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        throw error
      }

      toast.success('Document deleted successfully')
      loadDocuments() // Refresh the list
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete document')
    }
  }

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'expired':
        return <XCircleIcon className="h-5 w-5 text-orange-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: Document['status']) => {
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
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {userRole === 'pilot' ? 'My Documents' : 'All Documents'}
      </h3>
      
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((document) => (
            <div
              key={document.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
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
                        <span>•</span>
                        <span>
                          Uploaded {format(new Date(document.upload_date), 'MMM d, yyyy')}
                        </span>
                        {document.expiry_date && (
                          <>
                            <span>•</span>
                            <span>
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
                      onClick={() => handleViewDocument(document.file_url)}
                      disabled={viewingDocument === document.file_url}
                      className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      title="View Document"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {(userRole === 'pilot' || userRole === 'admin') && (
                      <button
                        onClick={() => handleDeleteDocument(document.id, document.file_url)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete Document"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}