"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CreditCard, MapPin, ShieldCheck, Wallet } from "lucide-react"

import { useShopCart } from "@/components/shop/shop-cart-provider"
import { Button } from "@/components/ui/button"
import { formatShopPrice } from "@/lib/shop/catalog"
import type { ShopLocale } from "@/lib/shop/types"

const CHECKOUT_COPY = {
  cs: {
    title: "Objednavka",
    emptyTitle: "Kosik je prazdny",
    emptyText: "Pridejte produkty, abyste mohli dokoncit objednavku.",
    backToShop: "Zpet do obchodu",
    contact: "Kontaktni udaje",
    firstName: "Jmeno",
    lastName: "Prijmeni",
    email: "E-mail",
    phone: "Telefon",
    contactHint: "Vyplnte alespon e-mail nebo telefon.",
    delivery: "Doprava",
    packetaPoint: "Packeta — vydejni misto / Z-BOX",
    choosePoint: "Vybrat vydejni misto",
    changePoint: "Zmenit misto",
    pointNotChosen: "Vydejni misto zatim nevybrano.",
    payment: "Platba",
    paymentMethodHint: "Vyberte zpusob platby.",
    payCard: "Platebni karta",
    payGooglePay: "Google Pay",
    payApplePay: "Apple Pay",
    walletHint: "Platebni tlacitko se zobrazi po nacteni Stripe.",
    cardOnline: "Platebni karta online (Stripe)",
    cardHint: "Platba probehne bezpecne primo na teto strance.",
    summary: "Souhrn objednavky",
    subtotal: "Mezisoucet",
    deliveryFee: "Doprava",
    deliveryFree: "Zdarma",
    total: "Celkem",
    placeOrder: "Zavazne objednat",
    secureNote: "Zabezpecena platba. Sklad rezervujeme na dobu platby.",
    integrationNote: "Platebni formular Stripe a Packeta widget se napoji po pripojeni API.",
    readyNote: "Objednavka je pripravena k vytvoreni rezervace.",
  },
  uk: {
    title: "Оформлення замовлення",
    emptyTitle: "Кошик порожній",
    emptyText: "Додайте товари, щоб оформити замовлення.",
    backToShop: "Повернутися до магазину",
    contact: "Контактні дані",
    firstName: "Ім'я",
    lastName: "Прізвище",
    email: "E-mail",
    phone: "Телефон",
    contactHint: "Вкажіть хоча б e-mail або телефон.",
    delivery: "Доставка",
    packetaPoint: "Packeta — пункт видачі / Z-BOX",
    choosePoint: "Вибрати пункт видачі",
    changePoint: "Змінити пункт",
    pointNotChosen: "Пункт видачі ще не вибрано.",
    payment: "Оплата",
    paymentMethodHint: "Оберіть спосіб оплати.",
    payCard: "Картка",
    payGooglePay: "Google Pay",
    payApplePay: "Apple Pay",
    walletHint: "Кнопка оплати зʼявиться після завантаження Stripe.",
    cardOnline: "Картка онлайн (Stripe)",
    cardHint: "Оплата відбувається безпечно прямо на цій сторінці.",
    summary: "Підсумок замовлення",
    subtotal: "Проміжна сума",
    deliveryFee: "Доставка",
    deliveryFree: "Безкоштовно",
    total: "Разом",
    placeOrder: "Замовити",
    secureNote: "Безпечна оплата. Склад резервуємо на час оплати.",
    integrationNote: "Форму оплати Stripe та віджет Packeta буде підключено після інтеграції API.",
    readyNote: "Замовлення готове до створення резервації.",
  },
  en: {
    title: "Checkout",
    emptyTitle: "Your cart is empty",
    emptyText: "Add products to place an order.",
    backToShop: "Back to shop",
    contact: "Contact details",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    contactHint: "Provide at least an email or a phone.",
    delivery: "Delivery",
    packetaPoint: "Packeta — pickup point / Z-BOX",
    choosePoint: "Choose pickup point",
    changePoint: "Change point",
    pointNotChosen: "No pickup point selected yet.",
    payment: "Payment",
    paymentMethodHint: "Choose a payment method.",
    payCard: "Card",
    payGooglePay: "Google Pay",
    payApplePay: "Apple Pay",
    walletHint: "The wallet button appears once Stripe loads.",
    cardOnline: "Card online (Stripe)",
    cardHint: "Payment happens securely right on this page.",
    summary: "Order summary",
    subtotal: "Subtotal",
    deliveryFee: "Delivery",
    deliveryFree: "Free",
    total: "Total",
    placeOrder: "Place order",
    secureNote: "Secure payment. Stock is reserved during payment.",
    integrationNote: "The Stripe payment form and Packeta widget connect once the API is wired.",
    readyNote: "The order is ready to create a reservation.",
  },
} as const

interface PacketaPoint {
  name: string
  city?: string
}

type PaymentMethod = "card" | "google_pay" | "apple_pay"

export function ShopCheckoutPage({ locale }: { locale: ShopLocale }) {
  const copy = CHECKOUT_COPY[locale]
  const { lines } = useShopCart()
  const subtotal = lines.reduce((sum, line) => sum + line.priceSnapshot * line.quantity, 0)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [point, setPoint] = useState<PacketaPoint | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [submitted, setSubmitted] = useState(false)

  const hasContact = email.trim().length > 0 || phone.trim().length > 0
  const hasName = firstName.trim().length > 0 && lastName.trim().length > 0
  const canSubmit = hasName && hasContact && point !== null && lines.length > 0

  const paymentMethods: { id: PaymentMethod; label: string }[] = [
    { id: "card", label: copy.payCard },
    { id: "google_pay", label: copy.payGooglePay },
    { id: "apple_pay", label: copy.payApplePay },
  ]

  // INTEGRATION POINT: replace with the real Packeta widget. Load
  // https://widget.packeta.com/v6/www/js/library.js and call
  // Packeta.Widget.pick(widgetApiKey, (selected) => setPoint(...)) using the
  // widgetApiKey from GET /api/public/v1/integrations.
  const openPacketaWidget = () => {
    setPoint({ name: "Praha 4, Nusle", city: "Praha" })
  }

  // INTEGRATION POINT: on submit, POST /api/public/v1/orders to create a
  // RESERVED order with customer { firstName, lastName, email, phone } and the
  // chosen delivery point, then mount the Stripe Payment Element with the
  // returned PaymentIntent clientSecret and confirm the order after payment.
  // The `paymentMethod` selected here maps to Stripe's wallet/card flow; with
  // the Payment Element, Stripe also auto-renders eligible wallets itself.
  const placeOrder = () => {
    if (!canSubmit) {
      return
    }
    setSubmitted(true)
  }

  if (lines.length === 0) {
    return (
      <div className="container px-4 py-10 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h1>
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center">
          <p className="text-base font-semibold text-gray-950">{copy.emptyTitle}</p>
          <p className="mt-2 text-sm text-gray-600">{copy.emptyText}</p>
          <Button asChild className="mt-5" variant="outline">
            <Link href={`/${locale}`}>{copy.backToShop}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-10 md:px-6">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h1>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Contact — autoComplete tokens let the browser / Google offer to
              autofill saved name, email and phone. */}
          <section className="rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold">{copy.contact}</h2>
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
              <label>
                <span className="text-sm font-medium text-gray-700">{copy.firstName}</span>
                <input
                  name="given-name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700">{copy.lastName}</span>
                <input
                  name="family-name"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700">{copy.email}</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700">{copy.phone}</span>
                <input
                  type="tel"
                  name="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950"
                />
              </label>
            </form>
            <p className="mt-2 text-xs text-gray-500">{copy.contactHint}</p>
          </section>

          {/* Delivery */}
          <section className="rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold">{copy.delivery}</h2>
            <div className="mt-4 rounded-lg border border-gray-950 bg-gray-50/60 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-gray-900">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-950">{copy.packetaPoint}</p>
                  <p className="mt-1 text-sm text-gray-600">
                    {point ? `${point.name}${point.city ? `, ${point.city}` : ""}` : copy.pointNotChosen}
                  </p>
                  <button
                    type="button"
                    onClick={openPacketaWidget}
                    className="mt-3 inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-900 transition hover:bg-white"
                  >
                    {point ? copy.changePoint : copy.choosePoint}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold">{copy.payment}</h2>
            <p className="mt-1 text-xs text-gray-500">{copy.paymentMethodHint}</p>

            {/* Method choice. With the Stripe Payment Element, Stripe also
                auto-renders eligible wallets (Apple Pay / Google Pay) on
                supported devices; this selector mirrors that choice in the UI. */}
            <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={copy.payment}>
              {paymentMethods.map((method) => {
                const isActive = paymentMethod === method.id
                return (
                  <button
                    key={method.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "border-gray-950 bg-gray-50 text-gray-950"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {method.id === "card" ? (
                      <CreditCard className="h-4 w-4 shrink-0" />
                    ) : (
                      <Wallet className="h-4 w-4 shrink-0" />
                    )}
                    <span className="truncate">{method.label}</span>
                  </button>
                )
              })}
            </div>

            {/* INTEGRATION POINT: Stripe Payment Element / Express Checkout mounts
                here. For "card" → Payment Element; for wallets → the wallet
                button rendered by Stripe once the PaymentIntent clientSecret is
                available. */}
            <div className="mt-4 rounded-lg border border-gray-200 p-4">
              {paymentMethod === "card" ? (
                <p className="text-xs text-gray-500">{copy.cardHint}</p>
              ) : (
                <p className="text-xs text-gray-500">{copy.walletHint}</p>
              )}
              <div className="mt-3 flex min-h-[96px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 text-center text-xs text-gray-500">
                {copy.integrationNote}
              </div>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="rounded-xl border border-gray-200 p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-semibold">{copy.summary}</h2>

          <div className="mt-4 space-y-3">
            {lines.map((line) => (
              <div key={line.variantId} className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                  <Image
                    src={line.imageSnapshot ?? "/tech-fix-storefront.png"}
                    alt={line.titleSnapshot}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-medium text-gray-900">{line.titleSnapshot}</p>
                  <p className="text-xs text-gray-500">{line.quantity} ×</p>
                </div>
                <span className="text-xs font-semibold text-gray-950">
                  {formatShopPrice(line.priceSnapshot * line.quantity, locale)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{copy.subtotal}</span>
              <span className="font-medium text-gray-950">{formatShopPrice(subtotal, locale)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{copy.deliveryFee}</span>
              <span className="font-medium text-gray-950">{copy.deliveryFree}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <span className="text-sm font-semibold">{copy.total}</span>
            <span className="text-lg font-semibold text-gray-950">{formatShopPrice(subtotal, locale)}</span>
          </div>

          <Button className="mt-5 w-full" size="lg" disabled={!canSubmit} onClick={placeOrder}>
            {copy.placeOrder}
          </Button>

          {submitted ? <p className="mt-3 text-center text-xs font-medium text-emerald-700">{copy.readyNote}</p> : null}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            {copy.secureNote}
          </p>
        </aside>
      </div>
    </div>
  )
}
