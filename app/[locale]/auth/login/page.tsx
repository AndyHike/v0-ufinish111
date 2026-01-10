import { Suspense } from "react"
import { ModernLoginForm } from "@/components/auth/modern-login-form"
import { getTranslations } from "next-intl/server"

interface LoginPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params
  const t = await getTranslations("Auth")

  return (
    <div className="container flex min-h-screen w-screen flex-col items-center justify-center py-10">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <Suspense fallback={<div className="animate-pulse h-[400px] bg-muted rounded-lg" />}>
          <ModernLoginForm locale={locale} />
        </Suspense>
      </div>
    </div>
  )
}
