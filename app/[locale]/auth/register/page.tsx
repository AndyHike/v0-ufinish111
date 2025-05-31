import { Suspense } from "react"
import { getAppSetting } from "@/lib/app-settings"
import RegisterClient from "./register-client"
import RegistrationDisabled from "./registration-disabled"

export default async function RegisterPage() {
  // Check if registration is enabled
  const registrationEnabled = await getAppSetting("registration_enabled")

  if (!registrationEnabled) {
    return <RegistrationDisabled />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <RegisterClient />
      </Suspense>
    </div>
  )
}
