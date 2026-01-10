import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { getTranslations } from "next-intl/server"

export default async function LoginPage() {
  const t = await getTranslations("Auth")

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t("loginTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("loginDescription")}</p>
        </div>
        <Suspense fallback={<div className="animate-pulse h-[300px] bg-muted rounded-lg" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
