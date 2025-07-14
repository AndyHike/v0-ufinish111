"use client"

import type React from "react"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react"

export default function ContactPageClient() {
  const t = useTranslations("Contact")
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setIsSuccess(false)

    try {
      // Отримуємо дані форми
      const formData = new FormData(e.currentTarget)
      const formValues = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        message: formData.get("message") as string,
        locale: "uk", // Додаємо поточну локаль
      }

      // Відправляємо дані на API
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formValues),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      // Показуємо повідомлення про успіх
      toast({
        title: t("successTitle"),
        description: t("successMessage"),
      })

      // Після toast success додай відстеження ліда
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Lead", {
          content_name: "Contact Page Form",
          content_category: "Contact",
          value: 100,
          currency: "CZK",
        })
        console.log("📊 Tracking contact page lead")
      }

      // Встановлюємо стан успіху
      setIsSuccess(true)

      // Очищаємо форму
      e.currentTarget.reset()
    } catch (error) {
      console.error("Contact form error:", error)
      toast({
        title: t("errorTitle") || "Error",
        description: t("errorMessage") || "Failed to send your message. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-4 text-xl text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Ліва колонка з інформацією та картою */}
        <div className="flex flex-col h-full">
          <div className="space-y-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Phone className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{t("phone")}</h3>
                    <a href="tel:+420775848259" className="text-sm text-muted-foreground hover:text-primary">
                      +420 775 848 259
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Mail className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{t("email")}</h3>
                    <a href="mailto:info@devicehelp.cz" className="text-sm text-muted-foreground hover:text-primary">
                      info@devicehelp.cz
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{t("address")}</h3>
                    <a
                      href="https://maps.google.com/?q=Bělohorská+209/133,+169+00+Praha+6-Břevnov"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {t("addressDetails")}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Clock className="mt-1 h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{t("workingHours")}</h3>
                    <p className="text-sm text-muted-foreground">{t("workingHoursWeekdays")}</p>
                    <p className="text-sm text-muted-foreground">{t("workingHoursSaturday")}</p>
                    <p className="text-sm text-muted-foreground">{t("workingHoursSunday")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Карта Google */}
          <Card className="flex-grow">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">{t("ourLocation")}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="w-full h-[300px] rounded-lg overflow-hidden">
                <iframe
                  title={t("mapTitle")}
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2561.9473756468813!2d14.3718826!3d50.0828941!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470b94f21a6bc55f%3A0x4d61fc29d0c4b1ea!2sB%C4%9Blohorsk%C3%A1%20209%2F133%2C%20169%2000%20Praha%206-B%C5%99evnov!5e0!3m2!1sen!2scz!4v1717177177171!5m2!1sen!2scz"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Права колонка з формою */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t("contactUs")}</CardTitle>
              <CardDescription>{t("contactUsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center h-full">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{t("successTitle")}</h3>
                  <p className="text-muted-foreground mb-6">{t("successMessage")}</p>
                  <Button onClick={() => setIsSuccess(false)}>{t("sendAnother")}</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      {t("nameLabel")}
                    </label>
                    <Input id="name" name="name" required placeholder={t("namePlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      {t("emailLabel")}
                    </label>
                    <Input id="email" name="email" type="email" required placeholder={t("emailPlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      {t("phoneLabel")}
                    </label>
                    <Input id="phone" name="phone" type="tel" placeholder={t("phonePlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      {t("messageLabel")}
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      placeholder={t("messagePlaceholder")}
                      rows={8}
                      className="min-h-[180px]"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? t("sending") : t("send")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
