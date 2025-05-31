import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { getLocale } from "next-intl/server"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { resendVerificationEmail } from "@/lib/auth/actions"

export default async function ResendVerificationPage({
  searchParams,
}: {
  searchParams: { userId?: string; sent?: string }
}) {
  const locale = await getLocale()
  const t = await getTranslations("Auth")
  const userId = searchParams.userId
  const showSentMessage = searchParams.sent === "true"

  if (!userId) {
    return (
      <div className="container flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">{t("invalidRequest")}</CardTitle>
            <CardDescription className="text-center">{t("missingUserId")}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href={`/${locale}/auth/signin`}>
              <Button>{t("backToSignIn")}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{t("verifyYourEmail")}</CardTitle>
          <CardDescription className="text-center">{t("verificationRequired")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSentMessage && (
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle className="text-green-800">{t("emailSent")}</AlertTitle>
              <AlertDescription className="text-green-700">{t("checkYourInbox")}</AlertDescription>
            </Alert>
          )}
          <p className="text-center text-sm text-muted-foreground">{t("didntReceiveEmail")}</p>
          <form
            action={async () => {
              "use server"
              await resendVerificationEmail(userId, locale)
              return { redirect: `/${locale}/auth/resend-verification?userId=${userId}&sent=true` }
            }}
            className="flex justify-center"
          >
            <Button type="submit">{t("resendVerificationEmail")}</Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href={`/${locale}/auth/signin`} className="text-sm text-muted-foreground hover:text-foreground">
            {t("backToSignIn")}
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
