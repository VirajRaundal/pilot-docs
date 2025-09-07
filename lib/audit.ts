import { supabase } from './supabase'
import { Database } from './database.types'

export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'UPLOAD' | 'DOWNLOAD' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'EXPORT'

export interface AuditFilters {
  tableName?: string
  actionType?: ActionType
  userId?: string
  userEmail?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

export interface AuditStats {
  totalActions: number
  actionsByType: Record<string, number>
  actionsByUser: Record<string, number>
  actionsByTable: Record<string, number>
  dailyActivity: Record<string, number>
}

// Log custom actions (approvals, uploads, etc.)
export async function logAuditAction(
  tableName: string,
  recordId: string,
  actionType: ActionType,
  metadata: Record<string, unknown> = {}
): Promise<string | null> {
  try {
    const { data, error } = await (supabase as any).rpc('log_custom_action', { // eslint-disable-line @typescript-eslint/no-explicit-any
      p_table_name: tableName,
      p_record_id: recordId,
      p_action_type: actionType,
      p_metadata: metadata
    })

    if (error) {
      console.error('Error logging audit action:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error logging audit action:', error)
    return null
  }
}

// Get audit logs with filtering
export async function getAuditLogs(filters: AuditFilters = {}): Promise<{
  data: AuditLog[]
  error: string | null
  count: number | null
}> {
  try {
    const {
      tableName,
      actionType,
      userId,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters

    const { data, error, count } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .rpc('get_audit_logs', {
        p_table_name: tableName || null,
        p_action_type: actionType || null,
        p_user_id: userId || null,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_limit: limit,
        p_offset: offset
      })
      .select('*', { count: 'exact' })

    if (error) {
      console.error('Error fetching audit logs:', error)
      return { data: [], error: error.message, count: null }
    }

    return { data: data || [], error: null, count }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error', count: null }
  }
}

// Get audit logs with user details (using the view)
export async function getAuditLogsWithDetails(filters: AuditFilters = {}): Promise<{
  data: (AuditLog & {
    first_name?: string
    last_name?: string
    pilot_license?: string
    record_description?: string
  })[]
  error: string | null
  count: number | null
}> {
  try {
    const {
      tableName,
      actionType,
      userId,
      userEmail,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filters

    let query = supabase
      .from('audit_logs_with_details')
      .select('*', { count: 'exact' })

    // Apply filters
    if (tableName) {
      query = query.eq('table_name', tableName)
    }
    if (actionType) {
      query = query.eq('action_type', actionType)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (userEmail) {
      query = query.ilike('user_email', `%${userEmail}%`)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching audit logs with details:', error)
      return { data: [], error: error.message, count: null }
    }

    return { data: data || [], error: null, count }
  } catch (error) {
    console.error('Error fetching audit logs with details:', error)
    return { data: [], error: error instanceof Error ? error.message : 'Unknown error', count: null }
  }
}

// Get audit statistics
export async function getAuditStatistics(
  startDate?: string,
  endDate?: string
): Promise<{ data: AuditStats | null; error: string | null }> {
  try {
    const { data, error } = await (supabase as any).rpc('get_audit_statistics', { // eslint-disable-line @typescript-eslint/no-explicit-any
      p_start_date: startDate || null,
      p_end_date: endDate || null
    })

    if (error) {
      console.error('Error fetching audit statistics:', error)
      return { data: null, error: error.message }
    }

    const stats = data?.[0]
    if (!stats) {
      return { data: null, error: 'No statistics available' }
    }

    return {
      data: {
        totalActions: stats.total_actions || 0,
        actionsByType: stats.actions_by_type || {},
        actionsByUser: stats.actions_by_user || {},
        actionsByTable: stats.actions_by_table || {},
        dailyActivity: stats.daily_activity || {}
      },
      error: null
    }
  } catch (error) {
    console.error('Error fetching audit statistics:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Export audit logs to CSV
export async function exportAuditLogsToCSV(filters: AuditFilters = {}): Promise<string> {
  const { data } = await getAuditLogsWithDetails({ ...filters, limit: 10000 })
  
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // Create CSV headers
  const headers = [
    'Timestamp',
    'Table',
    'Record ID',
    'Action',
    'User Email',
    'User Role',
    'User Name',
    'Description',
    'Changed Fields',
    'IP Address',
    'User Agent'
  ]

  // Create CSV rows
  const rows = data.map(log => [
    new Date(log.created_at).toISOString(),
    log.table_name,
    log.record_id || '',
    log.action_type,
    log.user_email || '',
    log.user_role || '',
    log.first_name && log.last_name ? `${log.first_name} ${log.last_name}` : '',
    log.record_description || '',
    log.changed_fields?.join(', ') || '',
    log.ip_address || '',
    log.user_agent || ''
  ])

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csvContent
}

// Export audit logs to JSON
export async function exportAuditLogsToJSON(filters: AuditFilters = {}): Promise<string> {
  const { data } = await getAuditLogsWithDetails({ ...filters, limit: 10000 })
  
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  return JSON.stringify(data, null, 2)
}

// Utility functions for common audit actions
export const auditHelpers = {
  // Document actions
  async logDocumentUpload(documentId: string, documentTitle: string) {
    return logAuditAction('documents', documentId, 'UPLOAD', {
      document_title: documentTitle,
      action_description: 'Document uploaded'
    })
  },

  async logDocumentApproval(documentId: string, documentTitle: string, previousStatus: string) {
    return logAuditAction('documents', documentId, 'APPROVE', {
      document_title: documentTitle,
      previous_status: previousStatus,
      action_description: 'Document approved'
    })
  },

  async logDocumentRejection(documentId: string, documentTitle: string, reason?: string) {
    return logAuditAction('documents', documentId, 'REJECT', {
      document_title: documentTitle,
      rejection_reason: reason,
      action_description: 'Document rejected'
    })
  },

  async logDocumentDownload(documentId: string, documentTitle: string) {
    return logAuditAction('documents', documentId, 'DOWNLOAD', {
      document_title: documentTitle,
      action_description: 'Document downloaded'
    })
  },

  async logDocumentView(documentId: string, documentTitle: string) {
    return logAuditAction('documents', documentId, 'VIEW', {
      document_title: documentTitle,
      action_description: 'Document viewed'
    })
  },

  // User actions
  async logUserLogin(userId: string, userEmail: string) {
    return logAuditAction('auth', userId, 'LOGIN', {
      user_email: userEmail,
      action_description: 'User logged in'
    })
  },

  async logUserLogout(userId: string, userEmail: string) {
    return logAuditAction('auth', userId, 'LOGOUT', {
      user_email: userEmail,
      action_description: 'User logged out'
    })
  },

  // Export actions
  async logDataExport(userId: string, exportType: string, filters: Record<string, unknown>) {
    return logAuditAction('system', userId, 'EXPORT', {
      export_type: exportType,
      filters,
      action_description: `Data exported: ${exportType}`
    })
  }
}

// Format functions for display
export const formatters = {
  actionType: (action: ActionType): string => {
    const actionMap: Record<ActionType, string> = {
      CREATE: 'Created',
      UPDATE: 'Updated', 
      DELETE: 'Deleted',
      APPROVE: 'Approved',
      REJECT: 'Rejected',
      UPLOAD: 'Uploaded',
      DOWNLOAD: 'Downloaded',
      LOGIN: 'Logged In',
      LOGOUT: 'Logged Out',
      VIEW: 'Viewed',
      EXPORT: 'Exported'
    }
    return actionMap[action] || action
  },

  tableName: (table: string): string => {
    const tableMap: Record<string, string> = {
      documents: 'Documents',
      pilots: 'Pilots',
      user_roles: 'User Roles',
      auth: 'Authentication',
      system: 'System'
    }
    return tableMap[table] || table
  },

  timestamp: (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  },

  userRole: (role: string | null): string => {
    if (!role) return 'Unknown'
    return role.charAt(0).toUpperCase() + role.slice(1)
  }
}