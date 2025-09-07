'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadPilotDocument, validateFile } from '../../lib/storage'
import { getOrCreatePilotRecord, saveDocumentMetadata } from '../../lib/documents'
import { supabase } from '../../lib/supabase'
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface DocumentUploadProps {
  userId: string
  onUploadSuccess?: () => void
}

const DOCUMENT_TYPES = [
  { value: 'noc', label: 'No Objection Certificate' },
  { value: 'medical_certificate', label: 'Medical Certificate' },
  { value: 'alcohol_test', label: 'Alcohol Test' },
  { value: 'license_certification', label: 'License Certification' },
  { value: 'training_records', label: 'Training Records' }
] as const

type DocumentType = typeof DOCUMENT_TYPES[number]['value']

export default function DocumentUpload({ userId, onUploadSuccess }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState<DocumentType>('medical_certificate')
  const [title, setTitle] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      const validation = validateFile(file)
      
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file')
        return
      }
      
      setSelectedFile(file)
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      toast.error('Please select a file and enter a title')
      return
    }

    setUploading(true)

    try {
      // Upload to storage
      const uploadResult = await uploadPilotDocument(
        selectedFile,
        userId,
        documentType,
        `${documentType}_${Date.now()}.${selectedFile.name.split('.').pop()}`
      )

      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      // Get or create pilot record first
      let pilotId = userId;
      
      // Check if pilot record exists
      const { data: existingPilot, error: pilotCheckError } = await (supabase
        .from('pilots')
        .select('id') as unknown as { eq: (field: string, value: unknown) => { maybeSingle: () => Promise<{ data: unknown; error: unknown }> } })
        .eq('user_id', userId)
        .maybeSingle()

      if (pilotCheckError && (pilotCheckError as { code?: string; message?: string }).code !== 'PGRST116') {
        throw new Error('Error checking pilot record: ' + (pilotCheckError as { message?: string }).message)
      }

      if (!existingPilot) {
        // Use the helper function from documents.ts to create pilot record
        pilotId = await getOrCreatePilotRecord(userId)
      } else {
        pilotId = (existingPilot as { id: string }).id
      }

      // Save document metadata to database using helper function
      await saveDocumentMetadata(pilotId, {
        document_type: documentType,
        title: title.trim(),
        file_url: uploadResult.fullPath || uploadResult.path || '',
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        expiry_date: expiryDate || undefined,
        status: 'pending'
      })

      toast.success('Document uploaded successfully!')
      
      // Reset form
      setSelectedFile(null)
      setTitle('')
      setExpiryDate('')
      setDocumentType('medical_certificate')
      
      onUploadSuccess?.()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Upload Document
      </h3>
      
      <div className="space-y-4">
        {/* Document Type Selection */}
        <div>
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
            Document Type
          </label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title Input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Document Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter document title"
            required
          />
        </div>

        {/* Expiry Date (Optional) */}
        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            id="expiryDate"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* File Drop Zone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload File
          </label>
          
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              {isDragActive ? (
                <p className="text-blue-600">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-gray-600">
                    Drag and drop a file here, or click to select
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PDF, JPEG, PNG files up to 10MB
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DocumentIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}