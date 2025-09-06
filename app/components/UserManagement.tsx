'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { UserIcon, PencilIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  created_at: string
  user_metadata?: {
    first_name?: string
    last_name?: string
  }
}

interface UserRole {
  id: string
  user_id: string
  role: 'pilot' | 'admin' | 'inspector'
}

interface UserWithRole extends User {
  role?: 'pilot' | 'admin' | 'inspector'
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Get user roles with basic user info from user_metadata
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          id,
          user_id,
          role,
          created_at
        `)

      if (rolesError) {
        throw rolesError
      }

      // For each role, we'll need to get user info from auth.users
      // Since we can't access admin endpoints, we'll create a simplified view
      const usersWithRoles: UserWithRole[] = []
      
      if (roles) {
        for (const userRole of roles) {
          // Get current user info if it's the current user
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          
          if (currentUser && currentUser.id === userRole.user_id) {
            usersWithRoles.push({
              id: currentUser.id,
              email: currentUser.email || '',
              created_at: currentUser.created_at,
              user_metadata: currentUser.user_metadata,
              role: userRole.role
            })
          } else {
            // For other users, we'll show minimal info
            usersWithRoles.push({
              id: userRole.user_id,
              email: `User ${userRole.user_id.substring(0, 8)}...`,
              created_at: userRole.created_at,
              role: userRole.role
            })
          }
        }
      }

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const assignRole = async (userId: string, role: 'pilot' | 'admin' | 'inspector') => {
    try {
      setUpdating(userId)
      
      // Check if user already has a role
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (checkError) {
        throw checkError
      }

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId)

        if (error) throw error
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role })

        if (error) throw error
      }

      toast.success(`Role assigned successfully`)
      loadUsers() // Refresh the list
    } catch (error) {
      console.error('Error assigning role:', error)
      toast.error('Failed to assign role')
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        User Management
      </h3>
      
      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {user.user_metadata?.first_name && user.user_metadata?.last_name 
                      ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                      : user.email}
                  </h4>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Current Role Badge */}
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role === 'inspector' ? 'bg-purple-100 text-purple-800' :
                  user.role === 'pilot' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {user.role?.toUpperCase() || 'NO ROLE'}
                </div>
                
                {/* Role Assignment Buttons */}
                <div className="flex space-x-1">
                  {(['pilot', 'admin', 'inspector'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => assignRole(user.id, role)}
                      disabled={user.role === role || updating === user.id}
                      className={`px-2 py-1 text-xs rounded ${
                        user.role === role
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50`}
                    >
                      {updating === user.id ? '...' : role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {users.length === 0 && (
        <div className="text-center py-8">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  )
}