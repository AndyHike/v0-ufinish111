"use client"

import { useState } from "react"

export function useFormState<T>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateFormData = (newData: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...newData }))
  }

  const resetForm = () => {
    setFormData(initialState)
    setError(null)
  }

  const handleSubmit = async (submitFn: () => Promise<void>) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await submitFn()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    isSubmitting,
    error,
    updateFormData,
    resetForm,
    handleSubmit,
    setFormData,
  }
}
