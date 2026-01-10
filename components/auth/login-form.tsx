"use client"

import { useParams } from "next/navigation"
import { ModernLoginForm } from "./modern-login-form"

export function LoginForm() {
  const params = useParams()
  const locale = params.locale as string

  return <ModernLoginForm locale={locale} />
}
