'use client'

import { supabase } from '../../lib/supabase'
import { 
  ArrowLeftEndOnRectangleIcon, 
  UserIcon, 
  DocumentTextIcon, 
  CogIcon 
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error signing out')
    } else {
      toast.success('Signed out successfully')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Pilot Document Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.user_metadata?.first_name && user.user_metadata?.last_name 
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` 
                  : user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
              >
                <ArrowLeftEndOnRectangleIcon className="h-4 w-4 mr-1 cursor-pointer" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isPilot(user) ? 'My Documents' : isAdmin(user) ? 'Admin Dashboard' : 'Inspector Dashboard'}
            </h2>
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role?.toUpperCase() || 'NO ROLE'}
              </div>
            </div>
          </div>
          
          {/* Role-specific content */}
          {isPilot(user) && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  Welcome, Pilot! 
                </h3>
                <p className="text-blue-700">
                  Here you can upload and manage your flight documents, check approval status, 
                  and ensure you're compliant with all requirements.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <DocumentTextIcon className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Upload Documents</h4>
                  <p className="text-sm text-gray-600 mt-1">Add new certificates and licenses</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <UserIcon className="h-8 w-8 text-green-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Check Status</h4>
                  <p className="text-sm text-gray-600 mt-1">View approval status of documents</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <CogIcon className="h-8 w-8 text-purple-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Profile Settings</h4>
                  <p className="text-sm text-gray-600 mt-1">Update your pilot information</p>
                </div>
              </div>
            </div>
          )}

          {isAdmin(user) && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-green-800 mb-2">
                  Admin Dashboard
                </h3>
                <p className="text-green-700">
                  Manage pilot documents, review submissions, approve or reject documents, 
                  and oversee the entire system.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <DocumentTextIcon className="h-8 w-8 text-orange-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Pending Reviews</h4>
                  <p className="text-sm text-gray-600 mt-1">Documents awaiting approval</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <UserIcon className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Manage Pilots</h4>
                  <p className="text-sm text-gray-600 mt-1">View and manage pilot accounts</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <CogIcon className="h-8 w-8 text-red-600 mb-2" />
                  <h4 className="font-medium text-gray-900">System Settings</h4>
                  <p className="text-sm text-gray-600 mt-1">Configure system preferences</p>
                </div>
              </div>
            </div>
          )}

          {isInspector(user) && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-purple-800 mb-2">
                  Inspector Portal
                </h3>
                <p className="text-purple-700">
                  Review pilot documents, conduct compliance checks, and generate inspection reports.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <DocumentTextIcon className="h-8 w-8 text-purple-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Document Review</h4>
                  <p className="text-sm text-gray-600 mt-1">Review submitted documents</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <UserIcon className="h-8 w-8 text-indigo-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Compliance Check</h4>
                  <p className="text-sm text-gray-600 mt-1">Verify pilot compliance status</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <CogIcon className="h-8 w-8 text-gray-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Reports</h4>
                  <p className="text-sm text-gray-600 mt-1">Generate inspection reports</p>
                </div>
              </div>
            </div>
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
    </div>
  )
}