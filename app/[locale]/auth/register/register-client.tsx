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
import { Checkbox } from "@/components/ui/checkbox"
import { UserPlus, CheckCircle, ArrowLeft, Shield, Clock } from "lucide-react"

import { checkUserExists, sendVerificationCode, verifyCode, createUser } from "@/app/actions/auth-api"

const initialSchema = z
  .object({
    email: z.string().email(),
    phone: z
      .string()
      .min(1, { message: "Phone number is required" })
      .refine((val) => isValidPhoneNumber(val), {
        message: "Invalid phone number",
      }),
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    isB2B: z.boolean().default(false),
    ico: z.string().optional(),
    dic: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.isB2B) {
        return !!data.ico && data.ico.length >= 2
      }
      return true
    },
    { message: "IČO je povinné pro B2B", path: ["ico"] },
  )
  .refine(
    (data) => {
      if (data.isB2B) {
        return !!data.dic && data.dic.length >= 2
      }
      return true
    },
    { message: "DIČ je povinné pro B2B", path: ["dic"] },
  )

const verificationSchema = z.object({
  code: z.string().length(6),
})

export default function RegisterClient() {
  const t = useTranslations("Auth")
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [step, setStep] = useState<"initial" | "verification" | "success" | "pending_approval">("initial")
  const [identifier, setIdentifier] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    isB2B: false,
    ico: "",
    dic: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const initialForm = useForm({
    resolver: zodResolver(initialSchema),
    defaultValues: {
      email: "",
      phone: "+420",
      firstName: "",
      lastName: "",
      isB2B: false,
      ico: "",
      dic: "",
    },
  })

  const verificationForm = useForm({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  })

  const watchIsB2B = initialForm.watch("isB2B")

  const handleInitialSubmit = async (data: {
    email: string
    phone: string
    firstName: string
    lastName: string
    isB2B: boolean
    ico?: string
    dic?: string
  }) => {
    setError(null)
    setIsLoading(true)

    try {
      setIdentifier({
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        isB2B: data.isB2B,
        ico: data.ico || "",
        dic: data.dic || "",
      })

      const userExists = await checkUserExists(data.email)
      if (userExists.success) {
        setError(t("userAlreadyExists"))
        setIsLoading(false)
        return
      }

      const result = await sendVerificationCode(data.email, "registration", locale)
      if (!result.success) {
        setError(result.message || t("somethingWentWrong"))
        setIsLoading(false)
        return
      }

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
      const result = await verifyCode(identifier.email, data.code, "registration")

      if (!result.success) {
        setError(result.message || t("invalidVerificationCode"))
        setIsLoading(false)
        return
      }

      const createResult = await createUser({
        first_name: identifier.firstName,
        last_name: identifier.lastName,
        email: identifier.email,
        phone: [identifier.phone],
        address: "",
        is_b2b: identifier.isB2B,
        ico: identifier.ico || undefined,
        dic: identifier.dic || undefined,
      })

      if (!createResult.success) {
        setError(createResult.message || t("registrationFailed"))
        setIsLoading(false)
        return
      }

      if (createResult.needsApproval) {
        setStep("pending_approval")
      } else {
        setStep("success")
      }
    } catch (error) {
      console.error("Verification error:", error)
      setError(t("unexpectedError"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await sendVerificationCode(identifier.email, "registration", locale)
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
    <Card className="w-full max-w-md shadow-xl border-0 bg-white">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            {step === "success" ? (
              <CheckCircle className="h-6 w-6 text-white" />
            ) : step === "pending_approval" ? (
              <Clock className="h-6 w-6 text-white" />
            ) : (
              <UserPlus className="h-6 w-6 text-white" />
            )}
          </div>
          <div className="text-center space-y-1">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {step === "success"
                ? t("registrationSuccessful")
                : step === "pending_approval"
                  ? t("registrationPendingTitle") || "Registrace odeslána"
                  : t("createAccount")}
            </CardTitle>
            {step !== "success" && step !== "pending_approval" && (
              <CardDescription className="text-xs text-gray-600">
                {t("alreadyHaveAccount")}{" "}
                <Link
                  href={`/${locale}/auth/login`}
                  className="text-green-600 hover:text-green-700 font-medium hover:underline"
                >
                  {t("signIn")}
                </Link>
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {step === "initial" && (
          <form onSubmit={initialForm.handleSubmit(handleInitialSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  {t("firstName")}
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder={t("firstNamePlaceholder")}
                  {...initialForm.register("firstName")}
                  disabled={isLoading}
                  className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                />
                {initialForm.formState.errors.firstName && (
                  <p className="text-sm text-red-600">{initialForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  {t("lastName")}
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder={t("lastNamePlaceholder")}
                  {...initialForm.register("lastName")}
                  disabled={isLoading}
                  className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                />
                {initialForm.formState.errors.lastName && (
                  <p className="text-sm text-red-600">{initialForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                {t("email")}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                {...initialForm.register("email")}
                disabled={isLoading}
                className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
              />
              {initialForm.formState.errors.email && (
                <p className="text-sm text-red-600">{initialForm.formState.errors.email.message}</p>
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

            {/* B2B Checkbox */}
            <div className="flex items-center space-x-2 rounded-lg border border-gray-200 p-3 bg-gray-50">
              <Controller
                name="isB2B"
                control={initialForm.control}
                render={({ field }) => (
                  <Checkbox
                    id="isB2B"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                )}
              />
              <Label htmlFor="isB2B" className="text-sm font-medium text-gray-700 cursor-pointer">
                {t("b2bClient") || "B2B Klient"}
              </Label>
            </div>

            {/* B2B Fields - IČO & DIČ */}
            {watchIsB2B && (
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-blue-200 p-3 bg-blue-50">
                <div className="space-y-2">
                  <Label htmlFor="ico" className="text-sm font-medium text-gray-700">
                    IČO *
                  </Label>
                  <Input
                    id="ico"
                    type="text"
                    placeholder="12345678"
                    {...initialForm.register("ico")}
                    disabled={isLoading}
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white"
                  />
                  {initialForm.formState.errors.ico && (
                    <p className="text-sm text-red-600">{initialForm.formState.errors.ico.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dic" className="text-sm font-medium text-gray-700">
                    DIČ *
                  </Label>
                  <Input
                    id="dic"
                    type="text"
                    placeholder="CZ12345678"
                    {...initialForm.register("dic")}
                    disabled={isLoading}
                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg bg-white"
                  />
                  {initialForm.formState.errors.dic && (
                    <p className="text-sm text-red-600">{initialForm.formState.errors.dic.message}</p>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t("processing")}</span>
                </div>
              ) : (
                t("continueRegistration")
              )}
            </Button>
          </form>
        )}

        {step === "verification" && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 flex items-center text-gray-600 hover:text-gray-800"
              onClick={() => setStep("initial")}
              disabled={isLoading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToSignIn")}
            </Button>

            <div className="text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mx-auto">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t("verificationCodeSent")}</h3>
                <p className="text-sm text-gray-600 mt-1">{identifier.email}</p>
              </div>
            </div>

            <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                  {t("enterVerificationCode")}
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  {...verificationForm.register("code")}
                  disabled={isLoading}
                  maxLength={6}
                  className="h-10 text-center text-lg tracking-widest border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                />
                {verificationForm.formState.errors.code && (
                  <p className="text-sm text-red-600">{verificationForm.formState.errors.code.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t("processing")}</span>
                  </div>
                ) : (
                  t("verifyCode")
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                {t("resendCode")}
              </Button>
            </form>
          </div>
        )}

        {step === "pending_approval" && (
          <div className="space-y-4 text-center">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mx-auto">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-amber-600">
                  {t("registrationPendingTitle") || "Registrace odeslána"}
                </h3>
                <p className="mt-2 text-gray-600">
                  {t("registrationPendingDescription") ||
                    "Vaše registrace B2B účtu byla odeslána. Váš účet bude aktivován po schválení administrátorem. O aktivaci budete informováni e-mailem."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => window.location.href = `/${locale}`}
            >
              {t("goToHomePage")}
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-600">{t("registrationSuccessful")}</h3>
                <p className="mt-2 text-gray-600">{t("accountCreatedSuccessfully")}</p>
              </div>
            </div>
            <Button
              type="button"
              className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => window.location.href = `/${locale}`}
            >
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
