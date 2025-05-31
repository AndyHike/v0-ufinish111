"use client"

import { useState, type FormEvent } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Send, Loader2, Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ContactSection() {
  const t = useTranslations("Contact")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("form")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          message,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)
        setName("")
        setEmail("")
        setPhone("")
        setMessage("")
      }
    } catch (err) {
      console.error("Error submitting form:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="relative py-12 md:py-20 bg-white">
      <div className="container relative z-10 px-4 md:px-6 pb-16 md:pb-0">
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter md:text-4xl mb-3">{t("title")}</h2>
          <p className="text-gray-500 md:text-lg">{t("subtitle")}</p>
        </div>

        {/* Контактна інформація - компактна версія для мобільних */}
        <div className="md:hidden mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">+420775848259</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">info@devicehelp.cz</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Bělohorská 209/13, Praha 6-Břevnov</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">9:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Мобільні вкладки для форми та карти */}
        <div className="md:hidden mb-6">
          <Tabs defaultValue="form" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">{t("contactForm")}</TabsTrigger>
              <TabsTrigger value="map">{t("location")}</TabsTrigger>
            </TabsList>
            <TabsContent value="form" className="mt-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                      <CheckCircle className="h-7 w-7 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{t("successTitle")}</h3>
                    <p className="text-gray-500 max-w-md mb-4">{t("successMessage")}</p>
                    <Button onClick={() => setIsSuccess(false)} variant="outline" size="lg">
                      {t("sendAnother")}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name-mobile" className="text-gray-700">
                        {t("nameLabel")}
                      </Label>
                      <Input
                        id="name-mobile"
                        placeholder={t("namePlaceholder")}
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-mobile" className="text-gray-700">
                        {t("emailLabel")}
                      </Label>
                      <Input
                        id="email-mobile"
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone-mobile" className="text-gray-700">
                        {t("phoneLabel")}
                      </Label>
                      <Input
                        id="phone-mobile"
                        type="tel"
                        placeholder={t("phonePlaceholder")}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message-mobile" className="text-gray-700">
                        {t("messageLabel")}
                      </Label>
                      <Textarea
                        id="message-mobile"
                        placeholder={t("messagePlaceholder")}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[120px] bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("sending")}
                        </>
                      ) : (
                        <>
                          {t("send")}
                          <Send className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </TabsContent>
            <TabsContent value="map" className="mt-4">
              <div className="overflow-hidden rounded-xl shadow-sm border border-gray-100 h-[300px] bg-white">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2559.8234567890123!2d14.3456789!3d50.0876543!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470b94ea69e1a1a1%3A0x7c93c7eb4ba09925!2sB%C4%9Blohorsk%C3%A1%20209%2F13%2C%20169%2000%20Praha%206-B%C5%99evnov!5e0!3m2!1scs!2scz!4v1652345678901!5m2!1scs!2scz"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps"
                ></iframe>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Десктопна версія */}
        <div className="hidden md:grid lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Форма */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-8">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-green-50 flex items-center justify-center mb-4 md:mb-6">
                    <CheckCircle className="h-7 w-7 md:h-8 md:w-8 text-green-500" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{t("successTitle")}</h3>
                  <p className="text-gray-500 max-w-md mb-4 md:mb-6">{t("successMessage")}</p>
                  <Button onClick={() => setIsSuccess(false)} variant="outline" size="lg">
                    {t("sendAnother")}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mb-5 md:mb-6">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">{t("contactUs")}</h3>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">{t("formDescription")}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-700">
                        {t("nameLabel")}
                      </Label>
                      <Input
                        id="name"
                        placeholder={t("namePlaceholder")}
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">
                          {t("emailLabel")}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("emailPlaceholder")}
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-gray-50 border-gray-200 focus:bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700">
                          {t("phoneLabel")}
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={t("phonePlaceholder")}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="bg-gray-50 border-gray-200 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-700">
                        {t("messageLabel")}
                      </Label>
                      <Textarea
                        id="message"
                        placeholder={t("messagePlaceholder")}
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-[120px] md:min-h-[150px] bg-gray-50 border-gray-200 focus:bg-white"
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("sending")}
                        </>
                      ) : (
                        <>
                          {t("send")}
                          <Send className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Контактна інформація - повна версія для десктопу */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6 mb-5 md:mb-6">
              <div className="space-y-4 md:space-y-5">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm md:text-base">{t("phone")}</h3>
                    <p className="text-gray-600 text-sm md:text-base">+420775848259</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm md:text-base">{t("email")}</h3>
                    <p className="text-gray-600 text-sm md:text-base">info@devicehelp.cz</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm md:text-base">{t("address")}</h3>
                    <p className="text-gray-600 text-sm md:text-base">Bělohorská 209/13, Praha 6-Břevnov</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex h-9 w-9 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm md:text-base">{t("workingHours")}</h3>
                    <p className="text-gray-600 text-sm md:text-base">{t("workingHoursWeekdays")}</p>
                    <p className="text-gray-600 text-sm md:text-base">{t("workingHoursSaturday")}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl shadow-sm border border-gray-100 h-[180px] md:h-[220px] bg-white">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2559.8234567890123!2d14.3456789!3d50.0876543!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470b94ea69e1a1a1%3A0x7c93c7eb4ba09925!2sB%C4%9Blohorsk%C3%A1%20209%2F13%2C%20169%2000%20Praha%206-B%C5%99evnov!5e0!3m2!1scs!2scz!4v1652345678901!5m2!1scs!2scz"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
