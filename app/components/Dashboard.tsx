'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  ArrowLeftEndOnRectangleIcon, 
  DocumentTextIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlusIcon,
  ChartPieIcon,
  DocumentPlusIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
const DocumentUpload = lazy(() => import('./DocumentUpload'))
import { DashboardStatsSkeleton, DocumentListSkeleton } from './SkeletonLoaders'
import { DocumentType } from '../../lib/documents'
import { useDocumentStats } from '../hooks/useDocuments'
import { lazy, Suspense } from 'react'

// Dynamic imports for code splitting
const DocumentsListWithSearch = lazy(() => import('./DocumentsListWithSearch'))
const RoleAssignment = lazy(() => import('./RoleAssignment'))
const AdminDashboard = lazy(() => import('./AdminDashboard'))
const ApprovalQueue = lazy(() => import('./ApprovalQueue'))

// Define types locally to avoid import issues
interface UserWithRole {
  id: string
  email?: string
  user_metadata?: {
    first_name?: string
    last_name?: string
  }
  role?: 'pilot' | 'admin' | 'inspector'
  email_confirmed_at?: string
}

interface DashboardProps {
  user: UserWithRole
}

// Helper functions defined locally
function isPilot(user: UserWithRole): boolean {
  return user.role === 'pilot'
}

function isAdmin(user: UserWithRole): boolean {
  return user.role === 'admin'
}

function isInspector(user: UserWithRole): boolean {
  return user.role === 'inspector'
}

export default function Dashboard({ user }: DashboardProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error signing out')
    } else {
      toast.success('Signed out successfully')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-area-inset">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="safe-top px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                <span className="hidden sm:inline">Pilot Document Management</span>
                <span className="sm:hidden">PDM</span>
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4">
              <span className="text-sm text-gray-600 truncate max-w-48">
                {user.user_metadata?.first_name && user.user_metadata?.last_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
                  : user.email}
              </span>
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role?.toUpperCase() || 'NO ROLE'}
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200 min-h-[44px]"
              >
                <ArrowLeftEndOnRectangleIcon className="h-4 w-4 mr-1" />
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors duration-200 min-h-[44px] min-w-[44px]"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 pb-4">
              <div className="pt-4 space-y-3">
                <div className="px-4 py-2">
                  <p className="text-sm text-gray-600 truncate">
                    {user.user_metadata?.first_name && user.user_metadata?.last_name 
                      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
                      : user.email}
                  </p>
                  <div className="mt-1">
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role?.toUpperCase() || 'NO ROLE'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200 min-h-[44px]"
                >
                  <ArrowLeftEndOnRectangleIcon className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-3 sm:py-6 px-3 sm:px-4 lg:px-8 pb-20 sm:pb-6">
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              <span className="hidden sm:inline">
                {isPilot(user) ? 'My Documents' : isAdmin(user) ? 'Admin Dashboard' : 'Inspector Dashboard'}
              </span>
              <span className="sm:hidden">
                {isPilot(user) ? 'Documents' : isAdmin(user) ? 'Admin' : 'Inspector'}
              </span>
            </h2>
            <div className="hidden lg:flex items-center space-x-2">
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role?.toUpperCase() || 'NO ROLE'}
              </div>
            </div>
          </div>
          
          {/* Role-specific content */}
          {isPilot(user) && (
            <PilotDashboard user={user} />
          )}

          {isAdmin(user) && (
            <AdminDashboardWrapper user={user} />
          )}

          {isInspector(user) && (
            <InspectorDashboard user={user} />
          )}

          {!user.role && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                Role Assignment Pending
              </h3>
              <p className="text-yellow-700">
                Please contact an administrator to assign your role in the system.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden safe-bottom z-40">
        <div className="grid grid-cols-3 h-16">
          {/* Home/Dashboard */}
          <button className="flex flex-col items-center justify-center py-2 text-blue-600 bg-blue-50">
            <HomeIcon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>

          {/* Documents */}
          <button 
            className="flex flex-col items-center justify-center py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
            onClick={() => {
              const documentsSection = document.querySelector('#documents-section')
              documentsSection?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <DocumentTextIcon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Documents</span>
          </button>

          {/* Upload */}
          <button 
            className="flex flex-col items-center justify-center py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
            onClick={() => {
              const uploadSection = document.querySelector('#upload-section')
              uploadSection?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <PlusIcon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Upload</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Progress Ring Component
function ProgressRing({ percentage, size = 120, strokeWidth = 8 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-out ${
            percentage >= 80 ? 'text-green-500' : 
            percentage >= 60 ? 'text-yellow-500' : 
            'text-red-500'
          }`}
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{Math.round(percentage)}%</span>
      </div>
    </div>
  )
}

// Document stats type
interface DocumentStats {
  total: number
  pending: number
  approved: number
  rejected: number
  expired: number
  expiringSoon: number
}

// Pilot Dashboard Component
function PilotDashboard({ user }: { user: UserWithRole }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Use React Query for better performance and caching
  const { data: stats, isLoading: loading, refetch } = useDocumentStats(user.id)

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1)
    // Refetch data when upload succeeds
    refetch()
  }

  // Refetch when refreshTrigger changes
  useEffect(() => {
    refetch()
  }, [refreshTrigger, refetch])

  const requiredDocumentTypes: DocumentType[] = ['noc', 'medical_certificate', 'license_certification', 'alcohol_test', 'training_records']
  
  const getCompliancePercentage = () => {
    if (!stats) return 0
    return (stats.approved / requiredDocumentTypes.length) * 100
  }

  const getMissingDocuments = () => {
    // This would need to be implemented based on your actual document tracking
    // For now, using a simple calculation based on required vs approved
    const missingCount = requiredDocumentTypes.length - (stats?.approved || 0)
    return Math.max(0, missingCount)
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Welcome Header with Gradient */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                  Welcome back, {user.user_metadata?.first_name || 'Pilot'}!
                </span>
              </h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                Track your flight documentation and maintain compliance
              </p>
            </div>
            <div className="hidden sm:block ml-4">
              <ChartPieIcon className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-blue-200 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {/* Total Documents */}
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Total Documents</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {stats?.total || 0}
                </p>
              </div>
              <DocumentTextIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-500 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Approved Documents */}
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Approved</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {stats?.approved || 0}
                </p>
              </div>
              <CheckCircleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-green-500 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Pending Documents */}
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Pending</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                  {stats?.pending || 0}
                </p>
              </div>
              <ClockIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-yellow-500 flex-shrink-0 ml-2" />
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">Expiring Soon</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                  {stats?.expiringSoon || 0}
                </p>
              </div>
              <ExclamationTriangleIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-orange-500 flex-shrink-0 ml-2" />
            </div>
          </div>
        </div>
      )}

      {/* Progress and Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Compliance Progress */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Compliance Status</h3>
          <div className="flex items-center justify-center">
            {loading ? (
              <div className="animate-pulse">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gray-200 rounded-full"></div>
              </div>
            ) : (
              <ProgressRing 
                percentage={getCompliancePercentage()} 
                size={112}
              />
            )}
          </div>
          <div className="text-center mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm text-gray-600">
              {stats?.approved || 0} of {requiredDocumentTypes.length} required documents approved
            </p>
          </div>
        </div>

        {/* Document Status Cards */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Document Status</h3>
          <div className="space-y-2 sm:space-y-3">
            {/* Approved Status */}
            <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg min-h-[44px] touch-manipulation">
              <div className="flex items-center min-w-0 flex-1">
                <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-green-900 truncate">Approved & Current</span>
              </div>
              <span className="text-sm sm:text-base font-bold text-green-600 ml-2">
                {loading ? '-' : stats?.approved || 0}
              </span>
            </div>

            {/* Pending Status */}
            <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded-lg min-h-[44px] touch-manipulation">
              <div className="flex items-center min-w-0 flex-1">
                <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-yellow-900 truncate">Under Review</span>
              </div>
              <span className="text-sm sm:text-base font-bold text-yellow-600 ml-2">
                {loading ? '-' : stats?.pending || 0}
              </span>
            </div>

            {/* Expired/Missing Status */}
            <div className="flex items-center justify-between p-2 sm:p-3 bg-red-50 rounded-lg min-h-[44px] touch-manipulation">
              <div className="flex items-center min-w-0 flex-1">
                <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-red-900 truncate">Action Required</span>
              </div>
              <span className="text-sm sm:text-base font-bold text-red-600 ml-2">
                {loading ? '-' : (stats?.expired || 0) + getMissingDocuments()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Call-to-Action Section */}
      {!loading && ((stats?.pending && stats.pending > 0) || getMissingDocuments() > 0 || (stats?.expiringSoon && stats.expiringSoon > 0)) && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 mt-1 mr-2 sm:mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-orange-900 mb-2">Action Required</h3>
              <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
                {getMissingDocuments() > 0 && (
                  <p className="text-xs sm:text-sm text-orange-800">
                    • {getMissingDocuments()} required document{getMissingDocuments() > 1 ? 's' : ''} missing
                  </p>
                )}
                {stats?.expiringSoon && stats.expiringSoon > 0 && (
                  <p className="text-xs sm:text-sm text-orange-800">
                    • {stats.expiringSoon} document{stats.expiringSoon > 1 ? 's' : ''} expiring soon
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  const uploadSection = document.querySelector('#upload-section')
                  uploadSection?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-3 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors duration-200 min-h-[44px] touch-manipulation"
              >
                <DocumentPlusIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span>Upload Documents</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Upload Section */}
      <div id="upload-section" className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Upload New Document</h3>
        <Suspense fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
        }>
          <DocumentUpload 
            userId={user.id} 
            onUploadSuccess={handleUploadSuccess}
          />
        </Suspense>
      </div>
      
      {/* Documents List with Search */}
      <div id="documents-section">
        <Suspense fallback={<DocumentListSkeleton />}>
          <DocumentsListWithSearch 
            userId={user.id}
            userRole="pilot"
            refreshTrigger={refreshTrigger}
          />
        </Suspense>
      </div>
    </div>
  )
}

// Admin Dashboard Component
function AdminDashboardWrapper({ user }: { user: UserWithRole }) {
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0)

  const handleDocumentUpdate = () => {
    setDashboardRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Main Admin Dashboard */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <AdminDashboard userId={user.id} />
      </Suspense>
      
      {/* Approval Queue */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <ApprovalQueue onDocumentUpdate={handleDocumentUpdate} />
      </Suspense>
      
      {/* Role Assignment */}
      <Suspense fallback={
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      }>
        <RoleAssignment />
      </Suspense>
      
      {/* All Documents List for Admin with Search */}
      <Suspense fallback={<DocumentListSkeleton />}>
        <DocumentsListWithSearch 
          userId={user.id}
          userRole="admin"
          refreshTrigger={dashboardRefreshTrigger}
        />
      </Suspense>
    </div>
  )
}

// Inspector Dashboard Component
function InspectorDashboard({ user }: { user: UserWithRole }) {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-purple-800 mb-2">
          Inspector Portal
        </h3>
        <p className="text-purple-700">
          Review pilot documents, conduct compliance checks, and generate inspection reports.
        </p>
      </div>
      
      {/* All Documents List for Inspector (Read-only) with Search */}
      <DocumentsListWithSearch 
        userId={user.id}
        userRole="inspector"
      />
    </div>
  )
}