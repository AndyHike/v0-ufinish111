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
    <div className="container relative flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          DeviceHelp
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Fast and reliable phone repair service. I highly recommend DeviceHelp for all your device repair
              needs.&rdquo;
            </p>
            <footer className="text-sm">Sofia Novak</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Suspense fallback={<SignInSkeleton />}>
            <SignInClient />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
