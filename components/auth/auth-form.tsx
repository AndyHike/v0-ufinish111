"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"

interface AuthFormProps {
  children: React.ReactNode
  action: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string; blocked?: boolean; remainingAttempts?: number }>
  successRedirect?: string
  submitText?: string
}

export function AuthForm({ children, action, successRedirect, submitText }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const t = useTranslations("Auth")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      try {
        const result = await action(formData)

        if (!result.success) {
          setError(result.message || t("somethingWentWrong"))
          return result
        }

        return result
      } catch (error) {
        console.error("Authentication error:", error)
        setError(t("unexpectedError"))
        return { success: false, message: t("unexpectedError") }
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <div className="space-y-4">{children}</div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
      >
        {isPending ? t("processing") : submitText || t("submit")}
      </button>
    </form>
  )
}
