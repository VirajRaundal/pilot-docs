'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircleIcon,
  XCircleIcon,
  DocumentIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  PhotoIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { 
  fetchDocumentsByStatus,
  updateDocumentStatus,
  getDocumentWithUrl,
  DocumentWithPilot
} from '../../lib/documents'
import { ApprovalQueueSkeleton } from './SkeletonLoaders'
import toast from 'react-hot-toast'

interface ApprovalQueueProps {
  onDocumentUpdate?: () => void
}

export default function ApprovalQueue({ onDocumentUpdate }: ApprovalQueueProps) {
  const [pendingDocuments, setPendingDocuments] = useState<DocumentWithPilot[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)

  useEffect(() => {
    loadPendingDocuments()
  }, [])

  const loadPendingDocuments = async () => {
    try {
      setLoading(true)
      const documents = await fetchDocumentsByStatus('pending')
      setPendingDocuments(documents)
      setSelectedDocuments(new Set()) // Clear selections when refreshing
    } catch (error) {
      console.error('Error loading pending documents:', error)
      toast.error('Failed to load pending documents')
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentSelection = (documentId: string, checked: boolean) => {
    const newSelected = new Set(selectedDocuments)
    if (checked) {
      newSelected.add(documentId)
    } else {
      newSelected.delete(documentId)
    }
    setSelectedDocuments(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(pendingDocuments.map(doc => doc.id)))
    } else {
      setSelectedDocuments(new Set())
    }
  }

  const handleSingleAction = async (documentId: string, action: 'approved' | 'rejected') => {
    try {
      setProcessingIds(prev => new Set(prev).add(documentId))
      
      await updateDocumentStatus(documentId, action)
      
      toast.success(`Document ${action === 'approved' ? 'approved' : 'rejected'} successfully`)
      
      // Remove from pending list
      setPendingDocuments(prev => prev.filter(doc => doc.id !== documentId))
      
      // Remove from selected if it was selected
      setSelectedDocuments(prev => {
        const newSelected = new Set(prev)
        newSelected.delete(documentId)
        return newSelected
      })
      
      onDocumentUpdate?.()
    } catch (error) {
      console.error(`Error ${action === 'approved' ? 'approving' : 'rejecting'} document:`, error)
      toast.error(`Failed to ${action === 'approved' ? 'approve' : 'reject'} document`)
    } finally {
      setProcessingIds(prev => {
        const newProcessing = new Set(prev)
        newProcessing.delete(documentId)
        return newProcessing
      })
    }
  }

  const handleBulkAction = async (action: 'approved' | 'rejected') => {
    if (selectedDocuments.size === 0) {
      toast.error('Please select documents to process')
      return
    }

    if (!confirm(`Are you sure you want to ${action === 'approved' ? 'approve' : 'reject'} ${selectedDocuments.size} document(s)?`)) {
      return
    }

    try {
      setBulkProcessing(true)
      const selectedIds = Array.from(selectedDocuments)
      
      // Process all selected documents
      await Promise.all(
        selectedIds.map(id => updateDocumentStatus(id, action))
      )
      
      toast.success(`${selectedIds.length} document(s) ${action === 'approved' ? 'approved' : 'rejected'} successfully`)
      
      // Remove processed documents from the list
      setPendingDocuments(prev => 
        prev.filter(doc => !selectedDocuments.has(doc.id))
      )
      
      // Clear selections
      setSelectedDocuments(new Set())
      
      onDocumentUpdate?.()
    } catch (error) {
      console.error(`Error processing bulk ${action}:`, error)
      toast.error(`Failed to process bulk ${action}`)
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleViewDocument = async (document: DocumentWithPilot) => {
    try {
      setViewingDocument(document.id)
      
      const { viewUrl } = await getDocumentWithUrl(document.id)
      window.open(viewUrl, '_blank')
    } catch (error) {
      console.error('Error viewing document:', error)
      toast.error('Failed to open document')
    } finally {
      setViewingDocument(null)
    }
  }

  const getFileTypeIcon = (fileType: string | null) => {
    if (!fileType) return <DocumentIcon className="h-6 w-6 text-gray-400" />
    
    if (fileType === 'application/pdf') {
      return <DocumentTextIcon className="h-6 w-6 text-red-500" />
    }
    if (fileType.startsWith('image/')) {
      return <PhotoIcon className="h-6 w-6 text-blue-500" />
    }
    return <DocumentIcon className="h-6 w-6 text-gray-400" />
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
  }

  const getFileThumbnail = (document: DocumentWithPilot) => {
    return (
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg border">
        {getFileTypeIcon(document.file_type)}
      </div>
    )
  }

  if (loading) {
    return <ApprovalQueueSkeleton />
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Approval Queue</h2>
            <p className="text-sm text-gray-600">
              {pendingDocuments.length} document{pendingDocuments.length !== 1 ? 's' : ''} pending review
            </p>
          </div>
          
          {/* Bulk Actions */}
          {selectedDocuments.size > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedDocuments.size} selected
              </span>
              <button
                onClick={() => handleBulkAction('approved')}
                disabled={bulkProcessing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bulkProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                ) : (
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                )}
                Approve All
              </button>
              <button
                onClick={() => handleBulkAction('rejected')}
                disabled={bulkProcessing}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {bulkProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                ) : (
                  <XCircleIcon className="h-4 w-4 mr-2" />
                )}
                Reject All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {pendingDocuments.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending documents</h3>
            <p className="text-gray-500">All documents have been reviewed</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.size === pendingDocuments.length && pendingDocuments.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pilot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingDocuments.map((document) => (
                <tr 
                  key={document.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedDocuments.has(document.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.has(document.id)}
                      onChange={(e) => handleDocumentSelection(document.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>

                  {/* File Preview */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleViewDocument(document)}
                        disabled={viewingDocument === document.id}
                        className="cursor-pointer hover:opacity-75 transition-opacity"
                        title="Click to view document"
                      >
                        {viewingDocument === document.id ? (
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg border">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                        ) : (
                          getFileThumbnail(document)
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Document Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <button
                          onClick={() => handleViewDocument(document)}
                          disabled={viewingDocument === document.id}
                          className="text-left cursor-pointer hover:text-blue-600 transition-colors"
                          title="Click to view document"
                        >
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate hover:text-blue-600">
                            {document.title}
                          </div>
                        </button>
                        <div className="text-sm text-gray-500">
                          {document.file_size && (
                            <span>{(document.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          )}
                          {document.expiry_date && (
                            <>
                              <span className="mx-1">•</span>
                              <span>Expires {format(new Date(document.expiry_date), 'MMM d, yyyy')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Pilot Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {document.pilots.first_name} {document.pilots.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {document.pilots.pilot_license}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Document Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatDocumentType(document.document_type)}
                    </span>
                  </td>

                  {/* Upload Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                      {format(new Date(document.upload_date), 'MMM d, yyyy')}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      Pending
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Approve Button */}
                      <button
                        onClick={() => handleSingleAction(document.id, 'approved')}
                        disabled={processingIds.has(document.id)}
                        className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px] touch-manipulation"
                      >
                        {processingIds.has(document.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Approve</span>
                            <span className="sm:hidden">✓</span>
                          </>
                        )}
                      </button>

                      {/* Reject Button */}
                      <button
                        onClick={() => handleSingleAction(document.id, 'rejected')}
                        disabled={processingIds.has(document.id)}
                        className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-h-[44px] touch-manipulation"
                      >
                        {processingIds.has(document.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Reject</span>
                            <span className="sm:hidden">✗</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Summary */}
      {pendingDocuments.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {pendingDocuments.length} pending document{pendingDocuments.length !== 1 ? 's' : ''}
            </span>
            {selectedDocuments.size > 0 && (
              <span className="text-blue-600 font-medium">
                {selectedDocuments.size} document{selectedDocuments.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}