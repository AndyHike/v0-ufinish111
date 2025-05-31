import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default async function VerificationSuccessPage() {
  const t = await getTranslations("Auth")

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl">{t("verificationSuccess")}</CardTitle>
          <CardDescription className="text-center">{t("verificationSuccessDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">{t("verificationSuccessHelp")}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/auth/signin">
            <Button>{t("signIn")}</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
