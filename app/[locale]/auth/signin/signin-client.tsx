"use client"
import { useTranslations } from "next-intl"
import SignInForm from "./signin-form"

export default function SignInClient() {
  const t = useTranslations("Auth")

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t("signIn")}</h1>
        <p className="text-sm text-muted-foreground">{t("enterEmail")}</p>
      </div>
      <SignInForm />
    </>
  )
}
