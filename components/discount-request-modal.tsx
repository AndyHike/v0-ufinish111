"use client"

import { useState, type FormEvent } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle } from "lucide-react"

interface DiscountRequestModalProps {
  isOpen: boolean
  onClose: () => void
  locale: string
  promotionText: string
}

export function DiscountRequestModal({ isOpen, onClose, locale, promotionText }: DiscountRequestModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [device, setDevice] = useState("")
  const [service, setService] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const translations = {
    cs: {
      title: "Získat slevu",
      description: "Vyplňte formulář a my vás budeme kontaktovat s informacemi o slevě",
      nameLabel: "Jméno",
      namePlaceholder: "Vaše jméno",
      emailLabel: "E-mail",
      emailPlaceholder: "vas@email.cz",
      phoneLabel: "Telefon",
      phonePlaceholder: "+420...",
      deviceLabel: "Zařízení",
      devicePlaceholder: "Např. iPhone 13",
      serviceLabel: "Služba",
      servicePlaceholder: "Např. Výměna displeje",
      messageLabel: "Zpráva (volitelně)",
      messagePlaceholder: "Další informace...",
      submitButton: "Odeslat žádost",
      sending: "Odesílání...",
      successTitle: "Žádost odeslána!",
      successMessage: "Brzy vás budeme kontaktovat s informacemi o slevě.",
      close: "Zavřít",
    },
    en: {
      title: "Get Discount",
      description: "Fill out the form and we will contact you with discount information",
      nameLabel: "Name",
      namePlaceholder: "Your name",
      emailLabel: "Email",
      emailPlaceholder: "your@email.com",
      phoneLabel: "Phone",
      phonePlaceholder: "+420...",
      deviceLabel: "Device",
      devicePlaceholder: "e.g. iPhone 13",
      serviceLabel: "Service",
      servicePlaceholder: "e.g. Display Replacement",
      messageLabel: "Message (optional)",
      messagePlaceholder: "Additional information...",
      submitButton: "Submit Request",
      sending: "Sending...",
      successTitle: "Request Sent!",
      successMessage: "We will contact you soon with discount information.",
      close: "Close",
    },
    uk: {
      title: "Отримати знижку",
      description: "Заповніть форму і ми зв'яжемося з вами з інформацією про знижку",
      nameLabel: "Ім'я",
      namePlaceholder: "Ваше ім'я",
      emailLabel: "Email",
      emailPlaceholder: "your@email.com",
      phoneLabel: "Телефон",
      phonePlaceholder: "+420...",
      deviceLabel: "Пристрій",
      devicePlaceholder: "напр. iPhone 13",
      serviceLabel: "Послуга",
      servicePlaceholder: "напр. Заміна дисплея",
      messageLabel: "Повідомлення (необов'язково)",
      messagePlaceholder: "Додаткова інформація...",
      submitButton: "Надіслати заявку",
      sending: "Надсилання...",
      successTitle: "Заявку надіслано!",
      successMessage: "Ми скоро зв'яжемося з вами з інформацією про знижку.",
      close: "Закрити",
    },
  }

  const t = translations[locale as keyof typeof translations] || translations.cs

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/discount-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          device,
          service,
          message,
          promotion: promotionText,
          locale,
        }),
      })

      if (response.ok) {
        setIsSuccess(true)

        // Facebook Pixel tracking
        if (typeof window !== "undefined" && window.fbq) {
          window.fbq("track", "Lead", {
            content_name: "Discount Request",
            value: 150,
            currency: "CZK",
            custom_parameters: {
              form_type: "promotional_banner",
              has_device: !!device,
              has_service: !!service,
              promotion: promotionText,
            },
          })
        }

        // Reset form after 3 seconds
        setTimeout(() => {
          setName("")
          setEmail("")
          setPhone("")
          setDevice("")
          setService("")
          setMessage("")
          setIsSuccess(false)
          onClose()
        }, 3000)
      }
    } catch (err) {
      console.error("Error submitting form:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{t.successTitle}</h3>
            <p className="text-gray-500">{t.successMessage}</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t.title}</DialogTitle>
              <DialogDescription>{t.description}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discount-name">{t.nameLabel}</Label>
                <Input
                  id="discount-name"
                  placeholder={t.namePlaceholder}
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-email">{t.emailLabel}</Label>
                  <Input
                    id="discount-email"
                    type="email"
                    placeholder={t.emailPlaceholder}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-phone">{t.phoneLabel}</Label>
                  <Input
                    id="discount-phone"
                    type="tel"
                    placeholder={t.phonePlaceholder}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount-device">{t.deviceLabel}</Label>
                  <Input
                    id="discount-device"
                    placeholder={t.devicePlaceholder}
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount-service">{t.serviceLabel}</Label>
                  <Input
                    id="discount-service"
                    placeholder={t.servicePlaceholder}
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount-message">{t.messageLabel}</Label>
                <Textarea
                  id="discount-message"
                  placeholder={t.messagePlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  t.submitButton
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
