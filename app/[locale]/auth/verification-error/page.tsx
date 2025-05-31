import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default async function VerificationErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const t = await getTranslations("Auth")
  const error = searchParams.error || "unknown_error"

  const errorTitle = t("verificationFailed")
  let errorMessage = t("verificationErrorGeneric")

  if (error === "missing_token") {
    errorMessage = t("verificationErrorMissingToken")
  } else if (error === "invalid_token") {
    errorMessage = t("verificationErrorInvalidToken")
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{errorTitle}</CardTitle>
          <CardDescription className="text-center">{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">{t("verificationErrorHelp")}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/signin">
            <Button>{t("backToSignIn")}</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
