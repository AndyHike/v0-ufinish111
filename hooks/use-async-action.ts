"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

interface UseAsyncActionOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useAsyncAction(options: UseAsyncActionOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function execute<T>(asyncFn: () => Promise<T>): Promise<T | null> {
    setIsLoading(true)

    try {
      const result = await asyncFn()

      if (options.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        })
      }

      if (options.onSuccess) {
        options.onSuccess(result)
      }

      return result
    } catch (error) {
      console.error("Error executing async action:", error)

      const errorMessage = options.errorMessage || (error instanceof Error ? error.message : "An error occurred")

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      if (options.onError && error instanceof Error) {
        options.onError(error)
      }

      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { execute, isLoading }
}
