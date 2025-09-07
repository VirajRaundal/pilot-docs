'use client'

// Does this work??

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'
import { getUserRole, assignUserRole, UserWithRole } from '../lib/roles'
import { getCachedUserRole, setCachedUserRole, getCachedSession, setCachedSession, clearUserCache, clearCachedSession } from '../lib/authCache'
import { prefetchUserData, prefetchCriticalRoutes, preloadCriticalAssets, shouldPrefetch } from '../lib/prefetch'
import { useQueryClient } from '@tanstack/react-query'

export default function Home() {
  const [user, setUser] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    setMounted(true)
    
    // Preload critical assets on app load
    preloadCriticalAssets()
    
    // Prefetch critical routes if network conditions are good
    if (shouldPrefetch()) {
      prefetchCriticalRoutes()
    }

    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setError('Authentication took too long. Please try logging in manually.')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    // Get initial session
    const getSession = async () => {
      try {
        // First check cached session
        const cachedSession = getCachedSession()
        if (cachedSession?.user) {
          const cachedRole = getCachedUserRole(cachedSession.user.id)
          if (cachedRole) {
            // Use cached data immediately for faster loading
            const userWithRole: UserWithRole = {
              ...cachedSession.user,
              role: cachedRole
            }
            setUser(userWithRole)
            setLoading(false)
            return
          }
        }

        // Fall back to Supabase session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setError(`Authentication error: ${error.message}`)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          setCachedSession(session)
          await loadUserWithRole(session.user)
        } else {
          setLoading(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize session')
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          clearUserCache()
          clearCachedSession()
        }
        
        if (session?.user) {
          setCachedSession(session)
          await loadUserWithRole(session.user)
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [loading])

  // Prevent hydration mismatch by not rendering anything until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const loadUserWithRole = async (authUser: User) => {
    try {      
      // First check cache for role
      let role = getCachedUserRole(authUser.id)
      
      // If not in cache, fetch from database
      if (!role) {
        role = await getUserRole(authUser.id)
        
        // If user doesn't have a role yet, assign them as 'pilot' by default
        if (!role) {
          const assigned = await assignUserRole(authUser.id, 'pilot')
          if (assigned) {
            role = 'pilot'
          }
        }
        
        // Cache the role if we got one
        if (role) {
          setCachedUserRole(authUser.id, role)
        }
      }

      // Create user object with role
      const userWithRole: UserWithRole = {
        ...authUser,
        role: role || undefined
      }

      setUser(userWithRole)
      
      // Prefetch user-specific data after successful authentication
      if (role && shouldPrefetch()) {
        prefetchUserData(queryClient, authUser.id, role)
          .catch(() => {}) // Silent fail for prefetch
      }
    } catch (error) {
      setError(`Failed to load user role: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUser({ ...authUser, role: undefined })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md w-full px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">Authentication Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  setLoading(false)
                }}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Continue to Login
              </button>
            </div>
          )}
          
          <div className="mt-8 text-xs text-gray-500">
            <p>If this takes too long, check your internet connection</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-blue-600 hover:text-blue-800 underline"
            >
              Refresh page
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <Dashboard user={user} />
}