"use client"

import { ModernLoginForm } from "@/components/auth/modern-login-form"
import { useParams } from "next/navigation"

export default function LoginClient() {
  const params = useParams()
  const locale = params.locale as string

  return <ModernLoginForm locale={locale} />
}
