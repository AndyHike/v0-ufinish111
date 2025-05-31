import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import RegisterClient from "./register-client"

export default async function RegisterPage() {
  const t = await getTranslations("Auth")

  return (
    <div className="container flex min-h-screen w-full flex-col items-center justify-center py-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterClient />
        </Suspense>
      </div>
    </div>
  )
}
