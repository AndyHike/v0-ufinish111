import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import LoginClient from "./login-client"

export default async function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Auth" })

  return (
    <div className="container flex min-h-screen w-full flex-col items-center justify-center py-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t("signIn")}</h1>
          <p className="text-sm text-muted-foreground">{t("enterEmailToSignIn")}</p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginClient />
        </Suspense>
      </div>
    </div>
  )
}
