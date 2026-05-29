"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
import { UserPlus, CheckCircle, ArrowLeft, Shield, Clock, Search, Loader2 } from "lucide-react"

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
    companyName: z.string().optional(),
    billingStreet: z.string().min(2, { message: "Billing street is required" }),
    billingCity: z.string().min(2, { message: "Billing city is required" }),
    billingPostalCode: z.string().min(3, { message: "Billing postal code is required" }),
    billingCountry: z.string().default("CZ"),
  })
  .superRefine((data, ctx) => {
    if (!data.isB2B) return

    if (!/^\d{8}$/.test((data.ico || "").replace(/\D/g, ""))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ICO musi mit 8 cislic",
        path: ["ico"],
      })
    }

    if (!data.companyName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nazev spolecnosti je povinny",
        path: ["companyName"],
      })
    }
  })

type InitialFormValues = z.infer<typeof initialSchema>

type AresCompany = {
  ico: string
  companyName: string
  dic: string
  address: string
  billingStreet: string
  billingCity: string
  billingPostalCode: string
  billingCountry: string
}

const verificationSchema = z.object({
  code: z.string().length(6),
})

export default function RegisterClient() {
  const t = useTranslations("Auth")
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const isBusinessRegistration = searchParams.get("b2b") === "1"

  const [step, setStep] = useState<"initial" | "verification" | "success" | "pending_approval">("initial")
  const [identifier, setIdentifier] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    isB2B: false,
    ico: "",
    dic: "",
    companyName: "",
    billingStreet: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "CZ",
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAresLoading, setIsAresLoading] = useState(false)
  const [aresMessage, setAresMessage] = useState<string | null>(null)

  const initialForm = useForm({
    resolver: zodResolver(initialSchema),
    defaultValues: {
      email: "",
      phone: "+420",
      firstName: "",
      lastName: "",
      isB2B: isBusinessRegistration,
      ico: "",
      dic: "",
      companyName: "",
      billingStreet: "",
      billingCity: "",
      billingPostalCode: "",
      billingCountry: "CZ",
    },
  })

  const verificationForm = useForm({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  })

  const watchIsB2B = initialForm.watch("isB2B")

  useEffect(() => {
    if (isBusinessRegistration) {
      initialForm.setValue("isB2B", true, { shouldDirty: false, shouldValidate: false })
    }
  }, [initialForm, isBusinessRegistration])

  const handleAresLookup = async () => {
    const ico = (initialForm.getValues("ico") || "").replace(/\D/g, "")
    initialForm.setValue("ico", ico, { shouldDirty: true, shouldValidate: true })
    setAresMessage(null)
    setError(null)

    if (!/^\d{8}$/.test(ico)) {
      initialForm.setError("ico", {
        type: "manual",
        message: "ICO musi mit 8 cislic",
      })
      return
    }

    setIsAresLoading(true)

    try {
      const response = await fetch(`/api/ares/company?ico=${encodeURIComponent(ico)}`)
      const result = (await response.json()) as { success: boolean; message?: string; company?: AresCompany }

      if (!response.ok || !result.success || !result.company) {
        setAresMessage(result.message || "Firmu se nepodarilo najit v ARES.")
        return
      }

      const company = result.company
      initialForm.setValue("companyName", company.companyName, { shouldDirty: true, shouldValidate: true })
      initialForm.setValue("dic", company.dic || "", { shouldDirty: true, shouldValidate: false })
      initialForm.setValue("billingStreet", company.billingStreet, { shouldDirty: true, shouldValidate: true })
      initialForm.setValue("billingCity", company.billingCity, { shouldDirty: true, shouldValidate: true })
      initialForm.setValue("billingPostalCode", company.billingPostalCode, {
        shouldDirty: true,
        shouldValidate: true,
      })
      initialForm.setValue("billingCountry", company.billingCountry || "CZ", {
        shouldDirty: true,
        shouldValidate: true,
      })
      initialForm.clearErrors(["ico", "companyName", "billingStreet", "billingCity", "billingPostalCode"])
      setAresMessage(company.companyName ? `Nalezeno: ${company.companyName}` : "Udaje byly nacteny z ARES.")
    } catch (error) {
      console.error("ARES lookup error:", error)
      setAresMessage("ARES je docasne nedostupny. Udaje muzete vyplnit rucne.")
    } finally {
      setIsAresLoading(false)
    }
  }

  const handleInitialSubmit = async (data: InitialFormValues) => {
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
        companyName: data.companyName || "",
        billingStreet: data.billingStreet,
        billingCity: data.billingCity,
        billingPostalCode: data.billingPostalCode,
        billingCountry: data.billingCountry || "CZ",
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
        is_b2b: identifier.isB2B,
        ico: identifier.ico || undefined,
        dic: identifier.dic || undefined,
        companyName: identifier.companyName || undefined,
        billingStreet: identifier.billingStreet,
        billingCity: identifier.billingCity,
        billingPostalCode: identifier.billingPostalCode,
        billingCountry: identifier.billingCountry,
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
    <Card className="w-full max-w-xl shadow-xl border-0 bg-white">
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
          <form onSubmit={initialForm.handleSubmit(handleInitialSubmit)} className="space-y-5">
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <Controller
                  name="isB2B"
                  control={initialForm.control}
                  render={({ field }) => (
                    <Checkbox
                      id="isB2B"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="mt-0.5"
                    />
                  )}
                />
                <div className="space-y-1">
                  <Label htmlFor="isB2B" className="cursor-pointer text-sm font-semibold text-gray-900">
                    {t("businessClient") || t("b2bClient") || "Firemní účet / podnikatel"}
                  </Label>
                  <p className="text-xs leading-relaxed text-gray-600">
                    Pro firmy a podnikatele lze IČO dohledat v ARES a fakturační údaje doplnit automaticky.
                  </p>
                </div>
              </div>

              {watchIsB2B && (
                <div className="grid gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ico" className="text-sm font-medium text-gray-700">
                      IČO *
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="ico"
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="12345678"
                        {...initialForm.register("ico")}
                        disabled={isLoading || isAresLoading}
                        className="h-10 border-gray-200 bg-white focus:border-green-500 focus:ring-green-500 rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAresLookup}
                        disabled={isLoading || isAresLoading}
                        className="h-10 w-10 shrink-0"
                        aria-label="Vyhledat v ARES"
                      >
                        {isAresLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                    {initialForm.formState.errors.ico && (
                      <p className="text-sm text-red-600">{initialForm.formState.errors.ico.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dic" className="text-sm font-medium text-gray-700">
                      DIČ <span className="font-normal text-gray-500">(pouze plátci DPH)</span>
                    </Label>
                    <Input
                      id="dic"
                      type="text"
                      placeholder="CZ12345678"
                      {...initialForm.register("dic")}
                      disabled={isLoading || isAresLoading}
                      className="h-10 border-gray-200 bg-white focus:border-green-500 focus:ring-green-500 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                      Název společnosti *
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Název firmy"
                      {...initialForm.register("companyName")}
                      disabled={isLoading || isAresLoading}
                      className="h-10 border-gray-200 bg-white focus:border-green-500 focus:ring-green-500 rounded-lg"
                    />
                    {initialForm.formState.errors.companyName && (
                      <p className="text-sm text-red-600">{initialForm.formState.errors.companyName.message}</p>
                    )}
                  </div>
                  {aresMessage && <p className="text-xs text-gray-600 sm:col-span-2">{aresMessage}</p>}
                </div>
              )}
            </div>
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

            <div className="space-y-4 rounded-lg border border-gray-200 p-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Fakturační adresa</h3>
                <p className="mt-1 text-xs text-gray-600">Údaje použijeme pro faktury a servisní dokumenty.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billingStreet" className="text-sm font-medium text-gray-700">
                  Ulice a číslo domu *
                </Label>
                <Input
                  id="billingStreet"
                  type="text"
                  placeholder="Např. Vodičkova 12"
                  {...initialForm.register("billingStreet")}
                  disabled={isLoading}
                  className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                />
                {initialForm.formState.errors.billingStreet && (
                  <p className="text-sm text-red-600">{initialForm.formState.errors.billingStreet.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div className="space-y-2">
                  <Label htmlFor="billingCity" className="text-sm font-medium text-gray-700">
                    Město *
                  </Label>
                  <Input
                    id="billingCity"
                    type="text"
                    placeholder="Praha"
                    {...initialForm.register("billingCity")}
                    disabled={isLoading}
                    className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                  />
                  {initialForm.formState.errors.billingCity && (
                    <p className="text-sm text-red-600">{initialForm.formState.errors.billingCity.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingPostalCode" className="text-sm font-medium text-gray-700">
                    PSČ *
                  </Label>
                  <Input
                    id="billingPostalCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="11000"
                    {...initialForm.register("billingPostalCode")}
                    disabled={isLoading}
                    className="h-10 border-gray-200 focus:border-green-500 focus:ring-green-500 rounded-lg"
                  />
                  {initialForm.formState.errors.billingPostalCode && (
                    <p className="text-sm text-red-600">{initialForm.formState.errors.billingPostalCode.message}</p>
                  )}
                </div>
              </div>
              <input type="hidden" {...initialForm.register("billingCountry")} />
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
                    "Vaše registrace firemního účtu byla odeslána. Váš účet bude aktivován po schválení administrátorem. O aktivaci budete informováni e-mailem."}
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
