"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

type FormSubmitFunction<T> = () => Promise<T>

export function useFormSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  async function submitForm<T>(
    fn: FormSubmitFunction<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
      successMessage?: string
      errorMessage?: string
    },
  ): Promise<T | null> {
    setIsSubmitting(true)

    try {
      const result = await fn()

      if (options?.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
        })
      }

      if (options?.onSuccess) {
        options.onSuccess(result)
      }

      return result
    } catch (error) {
      console.error("Form submission error:", error)

      const errorMessage = options?.errorMessage || (error instanceof Error ? error.message : "An error occurred")

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })

      if (options?.onError && error instanceof Error) {
        options.onError(error)
      }

      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  return { submitForm, isSubmitting }
}
