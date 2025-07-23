"use client"

import { useTranslations } from "next-intl"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function AuthDisabledNotice() {
  const t = useTranslations("Auth")

  return (
    <Alert className="mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription>Авторизація тимчасово відключена. Будь ласка, спробуйте пізніше.</AlertDescription>
    </Alert>
  )
}
