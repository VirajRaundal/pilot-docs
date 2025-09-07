// Resource prefetching utilities for improved performance

import { QueryClient } from '@tanstack/react-query'
import { fetchUserDocuments, getDocumentStats, fetchAllDocuments, getUserDashboardData, getAdminOverview } from './documents'
import { getUserRole } from './roles'

// Prefetch user data when they first land on the app
export async function prefetchUserData(queryClient: QueryClient, userId: string, userRole: string) {
  const prefetchPromises: Promise<unknown>[] = []

  // Always prefetch user role if not already cached
  const cachedRole = queryClient.getQueryData(['userRole', userId])
  if (!cachedRole) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: ['userRole', userId],
        queryFn: () => getUserRole(userId),
        staleTime: 1000 * 60 * 15, // 15 minutes
      })
    )
  }

  // Prefetch based on user role
  if (userRole === 'pilot') {
    // Prefetch pilot dashboard data
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: ['userDashboardData', userId],
        queryFn: () => getUserDashboardData(userId),
        staleTime: 1000 * 60 * 5, // 5 minutes
      })
    )
  } else if (userRole === 'admin' || userRole === 'inspector') {
    // Prefetch admin overview data
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: ['adminOverview'],
        queryFn: () => getAdminOverview(),
        staleTime: 1000 * 60 * 2, // 2 minutes
      })
    )

    // Prefetch all documents for admin/inspector
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: ['allDocuments'],
        queryFn: () => fetchAllDocuments(),
        staleTime: 1000 * 60 * 3, // 3 minutes
      })
    )
  }

  // Execute all prefetches in parallel
  await Promise.allSettled(prefetchPromises)
}

// Prefetch critical routes and components
export function prefetchCriticalRoutes() {
  const prefetchPromises: Promise<unknown>[] = []

  // Prefetch critical route components
  if (typeof window !== 'undefined') {
    // Prefetch the document upload component
    prefetchPromises.push(
      import('../app/components/DocumentUpload').catch(() => {
        console.log('Failed to prefetch DocumentUpload')
      })
    )

    // Prefetch admin dashboard for admins
    prefetchPromises.push(
      import('../app/components/AdminDashboard').catch(() => {
        console.log('Failed to prefetch AdminDashboard')
      })
    )

    // Prefetch approval queue for inspectors/admins
    prefetchPromises.push(
      import('../app/components/ApprovalQueue').catch(() => {
        console.log('Failed to prefetch ApprovalQueue')
      })
    )
  }

  return Promise.allSettled(prefetchPromises)
}

// Intelligent prefetching based on user behavior
export class SmartPrefetcher {
  private queryClient: QueryClient
  private userId: string
  private userRole: string
  private prefetchedRoutes: Set<string> = new Set()

  constructor(queryClient: QueryClient, userId: string, userRole: string) {
    this.queryClient = queryClient
    this.userId = userId
    this.userRole = userRole
  }

  // Prefetch based on user's current activity
  async prefetchForActivity(activity: 'viewing_documents' | 'uploading' | 'admin_panel') {
    switch (activity) {
      case 'viewing_documents':
        await this.prefetchDocumentViewingData()
        break
      case 'uploading':
        await this.prefetchUploadingData()
        break
      case 'admin_panel':
        await this.prefetchAdminData()
        break
    }
  }

  private async prefetchDocumentViewingData() {
    if (this.prefetchedRoutes.has('document_viewing')) return
    
    // Prefetch document stats
    this.queryClient.prefetchQuery({
      queryKey: ['documentStats', this.userId],
      queryFn: () => getDocumentStats(this.userId),
      staleTime: 1000 * 60 * 2,
    })

    // Prefetch user documents if not admin
    if (this.userRole === 'pilot') {
      this.queryClient.prefetchQuery({
        queryKey: ['userDocuments', this.userId],
        queryFn: () => fetchUserDocuments(this.userId),
        staleTime: 1000 * 60 * 3,
      })
    }

    this.prefetchedRoutes.add('document_viewing')
  }

  private async prefetchUploadingData() {
    if (this.prefetchedRoutes.has('uploading')) return

    // Prefetch document upload component
    try {
      await import('../app/components/DocumentUpload')
    } catch (error) {
      console.log('Failed to prefetch upload component:', error)
    }

    this.prefetchedRoutes.add('uploading')
  }

  private async prefetchAdminData() {
    if (this.prefetchedRoutes.has('admin_panel')) return

    if (this.userRole === 'admin' || this.userRole === 'inspector') {
      // Prefetch admin components
      try {
        await Promise.all([
          import('../app/components/AdminDashboard'),
          import('../app/components/ApprovalQueue'),
          import('../app/components/RoleAssignment'),
        ])
      } catch (error) {
        console.log('Failed to prefetch admin components:', error)
      }

      // Prefetch admin data
      this.queryClient.prefetchQuery({
        queryKey: ['adminOverview'],
        queryFn: () => getAdminOverview(),
        staleTime: 1000 * 60 * 2,
      })
    }

    this.prefetchedRoutes.add('admin_panel')
  }

  // Prefetch on hover or focus (for interactive elements)
  prefetchOnInteraction(element: HTMLElement, activity: Parameters<SmartPrefetcher['prefetchForActivity']>[0]) {
    let timeoutId: NodeJS.Timeout

    const handleInteraction = () => {
      // Debounce to avoid excessive prefetching
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        this.prefetchForActivity(activity)
      }, 100)
    }

    element.addEventListener('mouseenter', handleInteraction)
    element.addEventListener('focus', handleInteraction)

    // Return cleanup function
    return () => {
      clearTimeout(timeoutId)
      element.removeEventListener('mouseenter', handleInteraction)
      element.removeEventListener('focus', handleInteraction)
    }
  }
}

// Preload critical images and assets
export function preloadCriticalAssets() {
  if (typeof window === 'undefined') return

  const criticalImages = [
    '/favicon.ico',
  ]

  criticalImages.forEach(src => {
    const img = new Image()
    img.src = src
  })
}

// Network-aware prefetching
export function shouldPrefetch(): boolean {
  if (typeof navigator === 'undefined') return true

  // Don't prefetch on slow connections
  const connection = (navigator as unknown as { connection?: { effectiveType: string; saveData: boolean } }).connection
  if (connection) {
    const { effectiveType, saveData } = connection
    
    // Don't prefetch if user has data saving enabled
    if (saveData) return false
    
    // Only prefetch on fast connections
    return effectiveType === '4g' || effectiveType === '3g'
  }

  return true
}