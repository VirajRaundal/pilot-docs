'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { 
  fetchUserDocuments, 
  fetchAllDocuments,
  DocumentWithPilot,
  DocumentStatus,
  DocumentType
} from '../../lib/documents'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface DocumentsSearchFilterProps {
  userId: string
  userRole: 'pilot' | 'admin' | 'inspector'
  onDocumentsChange: (documents: DocumentWithPilot[]) => void
}

interface FilterState {
  searchTerm: string
  documentType: DocumentType | 'all'
  status: DocumentStatus | 'all'
  dateFrom: string
  dateTo: string
  pilotName: string
}

const DOCUMENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'noc', label: 'No Objection Certificate' },
  { value: 'medical_certificate', label: 'Medical Certificate' },
  { value: 'alcohol_test', label: 'Alcohol Test' },
  { value: 'license_certification', label: 'License Certification' },
  { value: 'training_records', label: 'Training Records' }
] as const

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' }
] as const

export default function DocumentsSearchFilter({ 
  userId, 
  userRole, 
  onDocumentsChange 
}: DocumentsSearchFilterProps) {
  const [allDocuments, setAllDocuments] = useState<DocumentWithPilot[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    documentType: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    pilotName: ''
  })

  // Load initial documents
  useEffect(() => {
    loadDocuments()
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
      
      setAllDocuments(docs)
      onDocumentsChange(docs)
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  // Filter documents based on current filters
  const filteredDocuments = useMemo(() => {
    let filtered = [...allDocuments]

    // Search term filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim()
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchLower) ||
        doc.document_type.toLowerCase().includes(searchLower) ||
        doc.status.toLowerCase().includes(searchLower) ||
        (userRole !== 'pilot' && 
          (`${doc.pilots.first_name} ${doc.pilots.last_name}`.toLowerCase().includes(searchLower) ||
           doc.pilots.email.toLowerCase().includes(searchLower) ||
           doc.pilots.pilot_license.toLowerCase().includes(searchLower))
        )
      )
    }

    // Document type filter
    if (filters.documentType !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === filters.documentType)
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(doc => doc.status === filters.status)
    }

    // Pilot name filter (for admin/inspector)
    if (userRole !== 'pilot' && filters.pilotName.trim()) {
      const pilotNameLower = filters.pilotName.toLowerCase().trim()
      filtered = filtered.filter(doc =>
        `${doc.pilots.first_name} ${doc.pilots.last_name}`.toLowerCase().includes(pilotNameLower)
      )
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.upload_date)
        const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null
        const toDate = filters.dateTo ? new Date(filters.dateTo) : null

        if (fromDate && docDate < fromDate) return false
        if (toDate && docDate > toDate) return false
        return true
      })
    }

    return filtered
  }, [allDocuments, filters, userRole])

  // Update parent component with filtered documents
  useEffect(() => {
    onDocumentsChange(filteredDocuments)
  }, [filteredDocuments, onDocumentsChange])

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }))
  }, [])

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setFilters({
      searchTerm: '',
      documentType: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      pilotName: ''
    })
  }

  const hasActiveFilters = filters.searchTerm || 
    filters.documentType !== 'all' || 
    filters.status !== 'all' || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.pilotName

  const getStatusBadgeColor = (status: DocumentStatus | 'all') => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-orange-100 text-orange-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Search & Filter</h3>
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            )}
          </div>
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={`Search documents${userRole !== 'pilot' ? ', pilots, licenses...' : '...'}`}
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {/* Document Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type
            </label>
            <Listbox 
              value={filters.documentType} 
              onChange={(value) => updateFilter('documentType', value)}
            >
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <span className="block truncate text-sm">
                    {DOCUMENT_TYPES.find(t => t.value === filters.documentType)?.label}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {DOCUMENT_TYPES.map((type) => (
                      <Listbox.Option
                        key={type.value}
                        value={type.value}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate text-sm ${selected ? 'font-medium' : 'font-normal'}`}>
                              {type.label}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                <CheckIcon className="h-4 w-4" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Listbox 
              value={filters.status} 
              onChange={(value) => updateFilter('status', value)}
            >
              <div className="relative">
                <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusBadgeColor(filters.status)}`}>
                      {STATUS_OPTIONS.find(s => s.value === filters.status)?.label}
                    </span>
                  </div>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <ChevronUpDownIcon className="h-4 w-4 text-gray-400" />
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {STATUS_OPTIONS.map((status) => (
                      <Listbox.Option
                        key={status.value}
                        value={status.value}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${getStatusBadgeColor(status.value as DocumentStatus)}`}>
                                {status.label}
                              </span>
                            </div>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                <CheckIcon className="h-4 w-4" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          {/* Pilot Name Filter (for admin/inspector) */}
          {userRole !== 'pilot' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilot Name
              </label>
              <input
                type="text"
                placeholder="Search pilot name..."
                value={filters.pilotName}
                onChange={(e) => updateFilter('pilotName', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="block w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border">
              <span className="font-medium text-gray-900">{filteredDocuments.length}</span>
              <span className="ml-1">of {allDocuments.length} documents</span>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            
            {filters.searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{filters.searchTerm}"
                <button
                  onClick={() => updateFilter('searchTerm', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:bg-blue-200 hover:text-blue-600 rounded-full"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.documentType !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Type: {DOCUMENT_TYPES.find(t => t.value === filters.documentType)?.label}
                <button
                  onClick={() => updateFilter('documentType', 'all')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-purple-400 hover:bg-purple-200 hover:text-purple-600 rounded-full"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {STATUS_OPTIONS.find(s => s.value === filters.status)?.label}
                <button
                  onClick={() => updateFilter('status', 'all')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-green-400 hover:bg-green-200 hover:text-green-600 rounded-full"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.pilotName && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Pilot: "{filters.pilotName}"
                <button
                  onClick={() => updateFilter('pilotName', '')}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-orange-400 hover:bg-orange-200 hover:text-orange-600 rounded-full"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {(filters.dateFrom || filters.dateTo) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Date: {filters.dateFrom && format(new Date(filters.dateFrom), 'MMM d')}
                {filters.dateFrom && filters.dateTo && ' - '}
                {filters.dateTo && format(new Date(filters.dateTo), 'MMM d')}
                <button
                  onClick={() => {
                    updateFilter('dateFrom', '')
                    updateFilter('dateTo', '')
                  }}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 rounded-full"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}