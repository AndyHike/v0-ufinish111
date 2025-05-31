"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smartphone } from "lucide-react"
import SignInForm from "./signin-form"

export default function SignInClient() {
  const t = useTranslations("Auth")

  return (
    <Card className="border border-border shadow-md">
      <CardHeader>
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>{t("signIn")}</CardTitle>
          <p className="text-sm text-muted-foreground text-center">{t("enterEmail")}</p>
        </div>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
    </Card>
  )
}
