import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getDocumentStats, 
  fetchUserDocuments, 
  fetchAllDocuments,
  fetchDocumentsByStatus,
  updateDocumentStatus,
  DocumentWithPilot,
  DocumentStatus 
} from '../../lib/documents'

// Query keys
const QUERY_KEYS = {
  documentStats: (userId: string) => ['documentStats', userId],
  userDocuments: (userId: string) => ['userDocuments', userId],
  allDocuments: () => ['allDocuments'],
  pendingDocuments: () => ['pendingDocuments'],
} as const

// Custom hooks for document operations

export function useDocumentStats(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.documentStats(userId),
    queryFn: () => getDocumentStats(userId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useUserDocuments(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.userDocuments(userId),
    queryFn: () => fetchUserDocuments(userId),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useAllDocuments() {
  return useQuery({
    queryKey: QUERY_KEYS.allDocuments(),
    queryFn: () => fetchAllDocuments(),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function usePendingDocuments() {
  return useQuery({
    queryKey: QUERY_KEYS.pendingDocuments(),
    queryFn: () => fetchDocumentsByStatus('pending'),
    staleTime: 1000 * 15, // 15 seconds for real-time updates
    gcTime: 1000 * 60, // 1 minute
  })
}

export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DocumentStatus }) =>
      updateDocumentStatus(id, status),
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['documentStats'] })
      queryClient.invalidateQueries({ queryKey: ['userDocuments'] })
      queryClient.invalidateQueries({ queryKey: ['allDocuments'] })
      queryClient.invalidateQueries({ queryKey: ['pendingDocuments'] })
    },
  })
}

// Utility to prefetch documents
export function usePrefetchDocuments() {
  const queryClient = useQueryClient()
  
  const prefetchUserDocuments = (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.userDocuments(userId),
      queryFn: () => fetchUserDocuments(userId),
      staleTime: 1000 * 60 * 2,
    })
  }
  
  const prefetchAllDocuments = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.allDocuments(),
      queryFn: () => fetchAllDocuments(),
      staleTime: 1000 * 60 * 2,
    })
  }
  
  return { prefetchUserDocuments, prefetchAllDocuments }
}