import { getLocale } from "next-intl/server"
import { ResetPasswordClient } from "./reset-password-client"
import { resetPassword } from "@/lib/auth/actions"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; error?: string; mismatch?: string }
}) {
  const locale = await getLocale()
  const token = searchParams.token || ""
  const showError = searchParams.error === "true"
  const showMismatchError = searchParams.mismatch === "true"

  async function resetPasswordAction(formData: FormData) {
    "use server"
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      return { redirect: `/${locale}/auth/reset-password?token=${token}&mismatch=true` }
    }

    const result = await resetPassword(token, password)

    if (!result.success) {
      return { redirect: `/${locale}/auth/reset-password?token=${token}&error=true` }
    }

    return { redirect: `/${locale}/auth/signin?reset=true` }
  }

  return (
    <ResetPasswordClient
      token={token}
      locale={locale}
      showError={showError}
      showMismatchError={showMismatchError}
      resetPasswordAction={resetPasswordAction}
    />
  )
}
