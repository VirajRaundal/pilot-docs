'use client'

import { useState } from 'react'
import { assignUserRole, updateUserRole, getUserRole, UserRole } from '../../lib/roles'
import { UserPlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function RoleAssignment() {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<'pilot' | 'admin' | 'inspector'>('pilot')
  const [loading, setLoading] = useState(false)

  const assignRole = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userId.trim()) {
      toast.error('Please enter a user ID')
      return
    }

    try {
      setLoading(true)
      
      // Check if user already has a role
      const existingRole = await getUserRole(userId.trim())

      if (existingRole) {
        // Update existing role
        const success = await updateUserRole(userId.trim(), role as UserRole)
        if (!success) {
          throw new Error('Failed to update user role')
        }
        toast.success(`Role updated to ${role}`)
      } else {
        // Insert new role
        const success = await assignUserRole(userId.trim(), role as UserRole)
        if (!success) {
          throw new Error('Failed to assign user role')
        }
        toast.success(`Role assigned: ${role}`)
      }

      // Clear form
      setUserId('')
      setRole('pilot')
    } catch (error) {
      console.error('Error assigning role:', error)
      toast.error('Failed to assign role. Make sure the User ID is correct.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <UserPlusIcon className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">
          Assign User Role
        </h3>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-700">
          <strong>How to find User ID:</strong>
          <br />
          1. Go to Supabase Dashboard → Authentication → Users
          <br />
          2. Find the user and copy their UUID
          <br />
          3. Paste it below and select a role
        </p>
      </div>

      <form onSubmit={assignRole} className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
            User ID (UUID)
          </label>
          <input
            type="text"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'pilot' | 'admin' | 'inspector')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pilot">Pilot</option>
            <option value="admin">Admin</option>
            <option value="inspector">Inspector</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Assigning...
              </div>
            ) : (
              'Assign Role'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}