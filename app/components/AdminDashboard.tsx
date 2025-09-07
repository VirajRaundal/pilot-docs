'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  BellIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns/format'
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow'
import { 
  fetchAllDocuments,
  DocumentWithPilot
} from '../../lib/documents'
import { supabase } from '../../lib/supabase'
import { AdminDashboardSkeleton } from './SkeletonLoaders'
import toast from 'react-hot-toast'

interface AdminDashboardProps {
  userId: string
}

interface PilotStats {
  total: number
  active: number
  inactive: number
}

interface DocumentStats {
  total: number
  pending: number
  approved: number
  rejected: number
  expired: number
}

interface ActivityItem {
  id: string
  type: 'upload' | 'approval' | 'rejection'
  pilotName: string
  documentTitle: string
  documentType: string
  timestamp: string
}

export default function AdminDashboard({ userId: _userId }: AdminDashboardProps) {
  const [documentStats, setDocumentStats] = useState<DocumentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0
  })
  const [pilotStats, setPilotStats] = useState<PilotStats>({
    total: 0,
    active: 0,
    inactive: 0
  })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [expiringDocuments, setExpiringDocuments] = useState<DocumentWithPilot[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      await Promise.all([
        loadDocumentStats(),
        loadPilotStats(),
        loadRecentActivity(),
        loadExpiringDocuments()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const loadDocumentStats = async () => {
    try {
      const documents = await fetchAllDocuments()
      
      const stats: DocumentStats = {
        total: documents.length,
        pending: documents.filter(d => d.status === 'pending').length,
        approved: documents.filter(d => d.status === 'approved').length,
        rejected: documents.filter(d => d.status === 'rejected').length,
        expired: documents.filter(d => {
          if (!d.expiry_date) return false
          return new Date(d.expiry_date) < new Date()
        }).length
      }
      
      setDocumentStats(stats)
    } catch (error) {
      console.error('Error loading document stats:', error)
    }
  }

  const loadPilotStats = async () => {
    try {
      const { data: pilots, error } = await supabase
        .from('pilots')
        .select('status')

      if (error) throw error

      const stats: PilotStats = {
        total: pilots?.length || 0,
        active: pilots?.filter(p => p && 'status' in p && p.status === 'active').length || 0,
        inactive: pilots?.filter(p => p && 'status' in p && p.status !== 'active').length || 0
      }
      
      setPilotStats(stats)
    } catch (error) {
      console.error('Error loading pilot stats:', error)
    }
  }

  const loadRecentActivity = async () => {
    try {
      const documents = await fetchAllDocuments()
      
      // Sort by most recent and take top 10
      const recentDocs = documents
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)

      const activity: ActivityItem[] = recentDocs.map(doc => ({
        id: doc.id,
        type: doc.status === 'approved' ? 'approval' : 
              doc.status === 'rejected' ? 'rejection' : 'upload',
        pilotName: `${doc.pilots.first_name} ${doc.pilots.last_name}`,
        documentTitle: doc.title,
        documentType: doc.document_type,
        timestamp: doc.updated_at || doc.created_at
      }))
      
      setRecentActivity(activity)
    } catch (error) {
      console.error('Error loading recent activity:', error)
    }
  }

  const loadExpiringDocuments = async () => {
    try {
      const allDocs = await fetchAllDocuments()
      
      // Filter documents expiring in next 30 days
      const expiring = allDocs.filter(doc => {
        if (!doc.expiry_date) return false
        const expiryDate = new Date(doc.expiry_date)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        return expiryDate <= thirtyDaysFromNow && expiryDate > new Date()
      }).sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
      
      setExpiringDocuments(expiring.slice(0, 5)) // Show top 5
    } catch (error) {
      console.error('Error loading expiring documents:', error)
    }
  }

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'approval':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'rejection':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-blue-500" />
    }
  }

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'approval':
        return `approved ${activity.documentTitle}`
      case 'rejection':
        return `rejected ${activity.documentTitle}`
      default:
        return `uploaded ${activity.documentTitle}`
    }
  }

  const formatDocumentType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'noc': 'NOC',
      'medical_certificate': 'Medical',
      'alcohol_test': 'Alcohol Test',
      'license_certification': 'License',
      'training_records': 'Training'
    }
    return typeMap[type] || type
  }

  if (loading) {
    return <AdminDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-blue-100">
          Overview of pilot documents and system activity
        </p>
      </div>

      {/* Alert Banners */}
      {expiringDocuments.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Documents Expiring Soon
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p className="mb-2">
                  {expiringDocuments.length} document{expiringDocuments.length !== 1 ? 's' : ''} expiring in the next 30 days:
                </p>
                <div className="space-y-1">
                  {expiringDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between bg-orange-100 rounded px-3 py-2">
                      <div>
                        <span className="font-medium">{doc.title}</span>
                        <span className="text-orange-600 ml-2">
                          ({doc.pilots.first_name} {doc.pilots.last_name})
                        </span>
                      </div>
                      <span className="text-orange-600 text-xs">
                        Expires {format(new Date(doc.expiry_date!), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pilots */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-500 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Pilots</p>
              <p className="text-2xl font-bold text-blue-900">{pilotStats.total}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium">{pilotStats.active} active</span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-orange-600">{pilotStats.inactive} inactive</span>
          </div>
        </div>

        {/* Pending Documents */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-900">{documentStats.pending}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <ArrowTrendingUpIcon className="h-4 w-4 text-yellow-600 mr-1" />
              <span className="text-yellow-700">Requires attention</span>
            </div>
          </div>
        </div>

        {/* Approved Documents */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Approved</p>
              <p className="text-2xl font-bold text-green-900">{documentStats.approved}</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-green-700">
                {Math.round((documentStats.approved / documentStats.total) * 100) || 0}% of total
              </span>
            </div>
          </div>
        </div>

        {/* Rejected/Expired Documents */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-500 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Issues</p>
              <p className="text-2xl font-bold text-red-900">
                {documentStats.rejected + documentStats.expired}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600">{documentStats.rejected} rejected</span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-orange-600">{documentStats.expired} expired</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <BellIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{activity.pilotName}</span>
                        <span className="text-gray-600 ml-1">{getActivityText(activity)}</span>
                      </div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                          {formatDocumentType(activity.documentType)}
                        </span>
                        <span className="ml-2">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              <ChartBarIcon className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Documents</span>
                <span className="text-lg font-semibold text-gray-900">{documentStats.total}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${documentStats.total ? (documentStats.approved / documentStats.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                {Math.round((documentStats.approved / documentStats.total) * 100) || 0}% approval rate
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-900">Document Trends</h3>
              <ArrowTrendingUpIcon className="h-5 w-5 text-purple-600" />
            </div>
            
            <div className="text-center py-8">
              <ChartBarIcon className="h-12 w-12 text-purple-400 mx-auto mb-3" />
              <p className="text-purple-700 font-medium mb-1">Charts Coming Soon</p>
              <p className="text-purple-600 text-sm">
                Document approval trends and analytics will be displayed here
              </p>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Document Processing</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Storage Usage</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-sm text-blue-600">Normal</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">User Activity</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}