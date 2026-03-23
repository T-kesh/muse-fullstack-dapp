import { useQuery } from '@tanstack/react-query'
import { ErrorHandler } from '@/utils/errorHandler'

interface MetadataResponse {
  success: boolean
  data: {
    title: string
    description: string
    image: string
    url: string
    type: string
    siteName: string
    twitterCard: string
    twitterSite: string
    additionalTags: Record<string, string>
  }
}

export const useArtworkMetadata = (artworkId: string) => {
  return useQuery<MetadataResponse>({
    queryKey: ['metadata', artworkId],
    queryFn: async () => {
      const response = await fetch(`/api/metadata/artwork/${artworkId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData?.error?.message || `Failed to fetch artwork metadata (Status: ${response.status})`
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result?.error?.message || 'Failed to fetch artwork metadata')
      }
      
      return result
    },
    enabled: !!artworkId,
    retry: (failureCount: number, error: Error) => {
      const appError = ErrorHandler.handle(error)
      return ErrorHandler.isRecoverable(appError) && failureCount < 3
    },
    retryDelay: (attemptIndex: number) => ErrorHandler.getRetryDelay(attemptIndex),
    onError: (error: Error) => {
      const appError = ErrorHandler.handle(error)
      console.error('Failed to fetch metadata:', appError.userMessage)
    },
  })
}
