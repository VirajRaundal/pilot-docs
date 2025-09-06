'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'
import { getUserRole, assignUserRole, UserWithRole } from '../lib/roles'

export default function Home() {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await loadUserWithRole(session.user)
      } else {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserWithRole(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserWithRole = async (authUser: User) => {
    try {
      // Get user's role
      let role = await getUserRole(authUser.id)
      
      // If user doesn't have a role yet, assign them as 'pilot' by default
      if (!role) {
        const assigned = await assignUserRole(authUser.id, 'pilot')
        if (assigned) {
          role = 'pilot'
        }
      }

      // Create user object with role
      const userWithRole: UserWithRole = {
        ...authUser,
        role: role || undefined
      }

      setUser(userWithRole)
    } catch (error) {
      console.error('Error loading user role:', error)
      setUser({ ...authUser, role: undefined })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <Dashboard user={user} />
}