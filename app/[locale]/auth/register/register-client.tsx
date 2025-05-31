"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { z } from "zod"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { isValidPhoneNumber } from "libphonenumber-js"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DevEmailNotification } from "@/components/dev-email-notification"
import { CustomPhoneInput } from "@/components/phone-input/custom-phone-input"

import { checkUserExists, sendVerificationCode, verifyCode, createUser } from "@/app/actions/auth-api"

const initialSchema = z.object({
  email: z.string().email(),
  phone: z
    .string()
    .min(1, { message: "Phone number is required" })
    .refine((val) => isValidPhoneNumber(val), {
      message: "Invalid phone number",
    }),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
})

const verificationSchema = z.object({
  code: z.string().length(6),
})

const registrationSchema = z.object({
  address: z.string().optional(),
})

export default function RegisterClient() {
  const t = useTranslations("Auth")
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [step, setStep] = useState<"initial" | "verification" | "registration" | "success">("initial")
  const [identifier, setIdentifier] = useState({ email: "", phone: "", firstName: "", lastName: "" })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const initialForm = useForm({
    resolver: zodResolver(initialSchema),
    defaultValues: {
      email: "",
      phone: "+420", // Czech Republic code by default
      firstName: "",
      lastName: "",
    },
  })

  const verificationForm = useForm({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  })

  const registrationForm = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      address: "",
    },
  })

  const handleInitialSubmit = async (data: { email: string; phone: string; firstName: string; lastName: string }) => {
    setError(null)
    setIsLoading(true)

    try {
      console.log("Registration initial data:", data)
      setIdentifier(data)

      // Check if user already exists
      const userExists = await checkUserExists(data.email)
      console.log("User exists check result:", userExists)

      if (userExists.success) {
        setError(t("userAlreadyExists"))
        setIsLoading(false)
        return
      }

      // Send verification code
      const result = await sendVerificationCode(data.email, "registration")
      console.log("Send verification code result:", result)

      if (!result.success) {
        setError(result.message || t("somethingWentWrong"))
        setIsLoading(false)
        return
      }

      // Move to verification step
      setStep("verification")
    } catch (error) {
      console.error("Registration error:", error)
      setError(t("unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationSubmit = async (data: { code: string }) => {
    setError(null)
    setIsLoading(true)

    try {
      console.log(`Verifying code for ${identifier.email}: ${data.code}`)

      const result = await verifyCode(identifier.email, data.code, "registration")
      console.log("Verification result:", result)

      if (!result.success) {
        setError(result.message || t("invalidVerificationCode"))
        setIsLoading(false)
        return
      }

      // Automatically create user after verification
      console.log("Creating user with data:", { ...identifier })

      const createResult = await createUser({
        first_name: identifier.firstName,
        last_name: identifier.lastName,
        email: identifier.email,
        phone: [identifier.phone],
        address: "",
      })

      console.log("Create user result:", createResult)

      if (!createResult.success) {
        setError(createResult.message || t("registrationFailed"))
        setIsLoading(false)
        return
      }

      // Move to success step
      setStep("success")
    } catch (error) {
      console.error("Verification error:", error)
      setError(t("unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistrationSubmit = async (data: { address?: string }) => {
    setError(null)
    setIsLoading(true)

    try {
      console.log("Creating user with data:", { ...identifier, address: data.address })

      const result = await createUser({
        first_name: identifier.firstName,
        last_name: identifier.lastName,
        email: identifier.email,
        phone: [identifier.phone],
        address: data.address || "",
      })

      console.log("Create user result:", result)

      if (!result.success) {
        setError(result.message || t("registrationFailed"))
        setIsLoading(false)
        return
      }

      // Redirect to home page or login page
      router.push(`/${locale}`)
    } catch (error) {
      console.error("Registration error:", error)
      setError(t("unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError(null)
    setIsLoading(true)

    try {
      console.log(`Resending verification code to ${identifier.email}`)

      const result = await sendVerificationCode(identifier.email, "registration")
      console.log("Resend verification code result:", result)

      if (!result.success) {
        setError(result.message || t("somethingWentWrong"))
      }
    } catch (error) {
      console.error("Resend code error:", error)
      setError(t("unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t("createAccount")}</CardTitle>
        <CardDescription>
          {t("alreadyHaveAccount")}{" "}
          <Link href={`/${locale}/auth/login`} className="text-primary underline">
            {t("signIn")}
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "initial" && (
          <form onSubmit={initialForm.handleSubmit(handleInitialSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input
                id="firstName"
                type="text"
                placeholder={t("firstNamePlaceholder")}
                {...initialForm.register("firstName")}
                disabled={isLoading}
              />
              {initialForm.formState.errors.firstName && (
                <p className="text-sm text-destructive">{initialForm.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input
                id="lastName"
                type="text"
                placeholder={t("lastNamePlaceholder")}
                {...initialForm.register("lastName")}
                disabled={isLoading}
              />
              {initialForm.formState.errors.lastName && (
                <p className="text-sm text-destructive">{initialForm.formState.errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                {...initialForm.register("email")}
                disabled={isLoading}
              />
              {initialForm.formState.errors.email && (
                <p className="text-sm text-destructive">{initialForm.formState.errors.email.message}</p>
              )}
            </div>
            <Controller
              name="phone"
              control={initialForm.control}
              render={({ field }) => (
                <CustomPhoneInput
                  id="phone"
                  label={t("phone")}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("phonePlaceholder")}
                  disabled={isLoading}
                  error={initialForm.formState.errors.phone?.message}
                  required
                />
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("processing") : t("continueRegistration")}
            </Button>
          </form>
        )}

        {step === "verification" && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p>{t("verificationCodeSent")}</p>
            </div>
            <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("enterVerificationCode")}</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  {...verificationForm.register("code")}
                  disabled={isLoading}
                  maxLength={6}
                />
                {verificationForm.formState.errors.code && (
                  <p className="text-sm text-destructive">{verificationForm.formState.errors.code.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("processing") : t("verifyCode")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                {t("resendCode")}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setStep("initial")}
                disabled={isLoading}
              >
                {t("backToSignIn")}
              </Button>
            </form>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-green-600">{t("registrationSuccessful")}</h3>
              <p className="mt-2">{t("accountCreatedSuccessfully")}</p>
            </div>
            <Button type="button" className="w-full" onClick={() => router.push(`/${locale}`)}>
              {t("goToHomePage")}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <DevEmailNotification />
      </CardFooter>
    </Card>
  )
}
