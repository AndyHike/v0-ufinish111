import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import SignInClient from "./signin-client"
import SignInSkeleton from "./signin-skeleton"

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Auth" })
  return {
    title: t("signIn"),
    description: t("signInDescription"),
  }
}

export default async function SignInPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Suspense fallback={<SignInSkeleton />}>
          <SignInClient />
        </Suspense>
      </div>
    </div>
  )
}
