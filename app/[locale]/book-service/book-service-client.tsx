"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Phone, User, Mail, MessageSquare, Wrench } from "lucide-react"
import { useTranslations } from "next-intl"

interface BookServiceClientProps {
  locale: string
  serviceData?: {
    serviceName: string
    modelName: string
  }
}

export default function BookServiceClient({ locale, serviceData }: BookServiceClientProps) {
  const t = useTranslations("BookService")
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    service: serviceData?.serviceName || "",
    model: serviceData?.modelName || "",
    description: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const validatePhone = (phone: string) => {
    // Дозволяємо тільки цифри, пробіли, дефіси, плюс та дужки
    const phoneRegex = /^[\d\s\-+$$$$]+$/
    return phoneRegex.test(phone.trim())
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("validation.firstNameRequired")
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("validation.lastNameRequired")
    }

    if (!formData.email.trim()) {
      newErrors.email = t("validation.emailRequired")
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t("validation.emailInvalid")
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t("validation.phoneRequired")
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = t("validation.phoneInvalid")
    }

    if (!formData.service.trim()) {
      newErrors.service = t("validation.serviceRequired")
    }

    if (!formData.model.trim()) {
      newErrors.model = t("validation.modelRequired")
    }

    if (!formData.description.trim()) {
      newErrors.description = t("validation.descriptionRequired")
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      const response = await fetch("/api/book-service", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          locale,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit booking")
      }

      // Перенаправляємо на сторінку успіху
      router.push(`/${locale}/book-service/success`)
    } catch (error) {
      console.error("Error submitting booking:", error)
      setSubmitError(t("submitError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Очищуємо помилку для цього поля
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ім'я та Прізвище */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("form.firstName")}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder={t("form.firstNamePlaceholder")}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("form.lastName")}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder={t("form.lastNamePlaceholder")}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t("form.email")}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t("form.emailPlaceholder")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Телефон */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t("form.phone")}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder={t("form.phonePlaceholder")}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            {/* Послуга */}
            <div className="space-y-2">
              <Label htmlFor="service" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                {t("form.service")}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="service"
                type="text"
                value={formData.service}
                onChange={(e) => handleInputChange("service", e.target.value)}
                placeholder={t("form.servicePlaceholder")}
                className={errors.service ? "border-red-500" : ""}
              />
              {errors.service && <p className="text-sm text-red-500">{errors.service}</p>}
            </div>

            {/* Модель */}
            <div className="space-y-2">
              <Label htmlFor="model">
                {t("form.model")}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="model"
                type="text"
                value={formData.model}
                onChange={(e) => handleInputChange("model", e.target.value)}
                placeholder={t("form.modelPlaceholder")}
                className={errors.model ? "border-red-500" : ""}
              />
              {errors.model && <p className="text-sm text-red-500">{errors.model}</p>}
            </div>

            {/* Опис проблеми */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t("form.description")}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={t("form.descriptionPlaceholder")}
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* Помилка відправки */}
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Кнопка відправки */}
            <Button type="submit" className="w-full" disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("form.submitting")}
                </>
              ) : (
                t("form.submit")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
