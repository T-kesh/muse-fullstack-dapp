import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { ErrorHandler } from '@/utils/errorHandler'

export interface Artwork {
  id: string
  title: string
  description: string
  imageUrl: string
  price: string
  currency: string
  creator: string
  createdAt: string
  category: string
  prompt?: string
  aiModel?: string
}

export interface ArtworksResponse {
  success: boolean
  data: Artwork[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface ArtworksFilters {
  category?: string
  priceRange?: string
  sortBy?: string
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function fetchArtworks({
  pageParam = 1,
  filters = {},
}: {
  pageParam?: number
  filters?: ArtworksFilters
}): Promise<ArtworksResponse> {
  const params = new URLSearchParams({
    page: pageParam.toString(),
    limit: '20',
    ...filters,
  })

  const response = await fetch(`${API_BASE_URL}/api/artworks?${params}`)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData?.error?.message || `Failed to fetch artworks (Status: ${response.status})`
    throw new Error(errorMessage)
  }
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data?.error?.message || 'Failed to fetch artworks')
  }
  
  return data
}

export function useArtworks(
  filters: ArtworksFilters = {},
  options?: Omit<UseInfiniteQueryOptions<ArtworksResponse, Error>, 'queryKey' | 'queryFn' | 'getNextPageParam'>
) {
  return useInfiniteQuery({
    queryKey: ['artworks', filters],
    queryFn: ({ pageParam = 1 }) => fetchArtworks({ pageParam, filters }),
    getNextPageParam: (lastPage, allPages) => {
      const { pagination, data } = lastPage
      const hasMore = allPages.flat().length < pagination.total
      return hasMore ? pagination.page + 1 : undefined
    },
    retry: (failureCount: number, error: Error) => {
      const appError = ErrorHandler.handle(error)
      return ErrorHandler.isRecoverable(appError) && failureCount < 3
    },
    retryDelay: (attemptIndex: number) => ErrorHandler.getRetryDelay(attemptIndex),
    onError: (error: Error) => {
      const appError = ErrorHandler.handle(error)
      console.error('Failed to fetch artworks:', appError.userMessage)
    },
    ...options,
  })
}

export async function getArtworkById(id: string): Promise<Artwork> {
  const response = await fetch(`${API_BASE_URL}/api/artworks/${id}`)
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData?.error?.message || `Failed to fetch artwork (Status: ${response.status})`
    throw new Error(errorMessage)
  }
  
  const result = await response.json()
  
  if (!result.success) {
    throw new Error(result?.error?.message || 'Failed to fetch artwork')
  }
  
  return result.data
}
