'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getAuditLogsWithDetails, 
  getAuditStatistics,
  exportAuditLogsToCSV,
  exportAuditLogsToJSON,
  formatters,
  type AuditFilters,
  type ActionType 
} from '../../lib/audit'
import { UserWithRole } from '../../lib/roles'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface AuditLogProps {
  user: UserWithRole
}

interface AuditLogEntry {
  id: string
  table_name: string
  record_id: string | null
  action_type: ActionType
  user_id: string | null
  user_email: string | null
  user_role: string | null
  old_values: unknown
  new_values: unknown
  changed_fields: string[] | null
  ip_address: string | null
  user_agent: string | null
  metadata: unknown
  created_at: string
  first_name?: string
  last_name?: string
  pilot_license?: string
  record_description?: string
}

export default function AuditLog({ user }: AuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AuditFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [selectedLogs, setSelectedLogs] = useState<Set<string>>(new Set())
  
  const pageSize = 25
  const totalPages = Math.ceil(totalCount / pageSize)

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error, count } = await getAuditLogsWithDetails({
        ...filters,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      })

      if (error) {
        setError(error)
      } else {
        setLogs(data)
        setTotalCount(count || 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage])

  useEffect(() => {
    loadAuditLogs()
  }, [loadAuditLogs])

  // Handle filter changes
  const handleFilterChange = (key: keyof AuditFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }))
    setCurrentPage(1)
  }

  // Handle export
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true)
    try {
      let content: string
      let filename: string
      let mimeType: string

      if (format === 'csv') {
        content = await exportAuditLogsToCSV(filters)
        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = 'text/csv'
      } else {
        content = await exportAuditLogsToJSON(filters)
        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`
        mimeType = 'application/json'
      }

      // Download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audit logs')
    } finally {
      setExporting(false)
    }
  }

  // Toggle log selection
  const toggleLogSelection = (logId: string) => {
    const newSelected = new Set(selectedLogs)
    if (newSelected.has(logId)) {
      newSelected.delete(logId)
    } else {
      newSelected.add(logId)
    }
    setSelectedLogs(newSelected)
  }

  // Select all logs on current page
  const toggleAllSelection = () => {
    if (selectedLogs.size === logs.length) {
      setSelectedLogs(new Set())
    } else {
      setSelectedLogs(new Set(logs.map(log => log.id)))
    }
  }

  // Get action type color
  const getActionTypeColor = (action: ActionType) => {
    const colors: Record<ActionType, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      APPROVE: 'bg-emerald-100 text-emerald-800',
      REJECT: 'bg-orange-100 text-orange-800',
      UPLOAD: 'bg-purple-100 text-purple-800',
      DOWNLOAD: 'bg-indigo-100 text-indigo-800',
      LOGIN: 'bg-cyan-100 text-cyan-800',
      LOGOUT: 'bg-gray-100 text-gray-800',
      VIEW: 'bg-slate-100 text-slate-800',
      EXPORT: 'bg-yellow-100 text-yellow-800'
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  // Check if user can view audit logs
  const canViewAuditLogs = user.role === 'admin' || user.role === 'inspector'

  if (!canViewAuditLogs) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            You don&apos;t have permission to view audit logs. This feature is available only to administrators and inspectors.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Log</h1>
              <p className="text-gray-600 mt-2">
                Comprehensive audit trail for all system activities
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </button>
              <div className="relative">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Audit Logs</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table
                </label>
                <select
                  value={filters.tableName || ''}
                  onChange={(e) => handleFilterChange('tableName', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Tables</option>
                  <option value="documents">Documents</option>
                  <option value="pilots">Pilots</option>
                  <option value="user_roles">User Roles</option>
                  <option value="auth">Authentication</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  value={filters.actionType || ''}
                  onChange={(e) => handleFilterChange('actionType', e.target.value as ActionType)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="APPROVE">Approve</option>
                  <option value="REJECT">Reject</option>
                  <option value="UPLOAD">Upload</option>
                  <option value="DOWNLOAD">Download</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="VIEW">View</option>
                  <option value="EXPORT">Export</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Email
                </label>
                <input
                  type="email"
                  value={filters.userEmail || ''}
                  onChange={(e) => handleFilterChange('userEmail', e.target.value)}
                  placeholder="Search by email..."
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setFilters({})
                  setCurrentPage(1)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{totalCount}</p>
                <p className="text-sm text-gray-600">Total Entries</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(logs.map(log => log.user_email).filter(Boolean)).size}
                </p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">
                  {logs.length > 0 ? formatters.timestamp(logs[0].created_at).split(',')[0] : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Latest Activity</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <InformationCircleIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{selectedLogs.size}</p>
                <p className="text-sm text-gray-600">Selected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Audit Entries {totalCount > 0 && `(${totalCount} total)`}
              </h3>
              {logs.length > 0 && (
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedLogs.size === logs.length && logs.length > 0}
                      onChange={toggleAllSelection}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Select all</span>
                  </label>
                  {selectedLogs.size > 0 && (
                    <button
                      onClick={() => handleExport('json')}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Export selected as JSON
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Changes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLogs.has(log.id)}
                          onChange={() => toggleLogSelection(log.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {formatters.timestamp(log.created_at)}
                        </div>
                        {log.ip_address && (
                          <div className="text-xs text-gray-500">
                            IP: {log.ip_address}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionTypeColor(log.action_type)}`}>
                          {formatters.actionType(log.action_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatters.tableName(log.table_name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {log.user_email || 'Unknown'}
                        </div>
                        {log.first_name && log.last_name && (
                          <div className="text-xs text-gray-500">
                            {log.first_name} {log.last_name}
                          </div>
                        )}
                        {log.user_role && (
                          <span className="inline-flex px-1 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                            {formatters.userRole(log.user_role)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.record_description || `${formatters.actionType(log.action_type)} ${formatters.tableName(log.table_name)}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.changed_fields && log.changed_fields.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {log.changed_fields.slice(0, 3).map(field => (
                              <span
                                key={field}
                                className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                              >
                                {field}
                              </span>
                            ))}
                            {log.changed_fields.length > 3 && (
                              <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                +{log.changed_fields.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, totalCount)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{totalCount}</span>
                    {' '}results
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}