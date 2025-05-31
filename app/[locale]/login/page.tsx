import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import LoginClient from "./login-client"

export default async function LoginPage() {
  const t = await getTranslations("Login")

  return (
    <div className="container flex h-screen w-full flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginClient />
        </Suspense>
      </div>
    </div>
  )
}
