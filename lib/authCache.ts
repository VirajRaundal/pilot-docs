// Authentication caching to reduce database hits
import { UserRole } from './roles'

const CACHE_KEY = 'pilot_management_user_cache'
const CACHE_EXPIRY = 1000 * 60 * 15 // 15 minutes

interface CachedUser {
  userId: string
  role: UserRole
  timestamp: number
}

export function getCachedUserRole(userId: string): UserRole | null {
  // Return null on server-side to prevent hydration mismatch
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const data: CachedUser = JSON.parse(cached)
    
    // Check if cache is expired
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    
    // Check if user matches
    if (data.userId !== userId) {
      return null
    }
    
    return data.role
  } catch (error) {
    console.error('Error reading user cache:', error)
    return null
  }
}

export function setCachedUserRole(userId: string, role: UserRole): void {
  // Don't cache on server-side
  if (typeof window === 'undefined') return
  
  try {
    const data: CachedUser = {
      userId,
      role,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error setting user cache:', error)
  }
}

export function clearUserCache(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('Error clearing user cache:', error)
  }
}

// Session storage for faster auth state
const SESSION_KEY = 'pilot_management_session'

export function getCachedSession() {
  // Return null on server-side to prevent hydration mismatch
  if (typeof window === 'undefined') return null
  
  try {
    const cached = sessionStorage.getItem(SESSION_KEY)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    return null
  }
}

export function setCachedSession(session: unknown) {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('Error caching session:', error)
  }
}

export function clearCachedSession() {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch (error) {
    console.error('Error clearing session cache:', error)
  }
}