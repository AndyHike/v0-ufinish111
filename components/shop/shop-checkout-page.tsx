"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, Loader2, MapPin, ShieldCheck } from "lucide-react"

import { useShopCart } from "@/components/shop/shop-cart-provider"
import { ShopStripePayment } from "@/components/shop/shop-stripe-payment"
import { Button } from "@/components/ui/button"
import { formatShopPrice } from "@/lib/shop/catalog"
import type {
  ShopCreatedOrder,
  ShopLocale,
  ShopOrderPayment,
  ShopOrderStatus,
  ShopPacketaConfig,
  ShopStripeConfig,
} from "@/lib/shop/types"

const PACKETA_LIBRARY_URL = "https://widget.packeta.com/v6/www/js/library.js"
// Safety net: if the widget library never loads/initialises, stop blocking the
// UI and surface an error rather than spinning forever.
const PACKETA_LOAD_TIMEOUT_MS = 20000

// Payment confirmation is async (admin Stripe webhook sets paymentStatus=PAID),
// so after confirming on the client we poll the order until it flips to PAID.
const POLL_INTERVAL_MS = 2500
const MAX_POLL_ATTEMPTS = 48 // ~2 minutes

// Per-order capability token, stashed so a Stripe redirect (3DS/PayPal) can
// resume polling after the browser returns to ?order=<id>.
const orderTokenKey = (orderId: string) => `devicehelp.shop.order.${orderId}`

// Minimal shape of the point object returned by the Packeta widget callback.
interface PacketaWidgetPoint {
  id?: string | number
  name?: string
  place?: string
  city?: string
  street?: string
  country?: string
}

interface PacketaWidgetApi {
  pick: (
    apiKey: string,
    callback: (point: PacketaWidgetPoint | null) => void,
    options?: Record<string, unknown>,
  ) => void
}

declare global {
  interface Window {
    Packeta?: { Widget?: PacketaWidgetApi }
  }
}

// Loads the Packeta widget library once and resolves its Widget API.
function loadPacketaWidget(): Promise<PacketaWidgetApi> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Packeta widget is only available in the browser"))
      return
    }
    if (window.Packeta?.Widget) {
      resolve(window.Packeta.Widget)
      return
    }
    const existing = document.getElementById("packeta-widget-lib") as HTMLScriptElement | null
    const onReady = () => {
      if (window.Packeta?.Widget) {
        resolve(window.Packeta.Widget)
      } else {
        reject(new Error("Packeta widget failed to initialise"))
      }
    }
    if (existing) {
      existing.addEventListener("load", onReady, { once: true })
      existing.addEventListener("error", () => reject(new Error("Packeta widget failed to load")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.id = "packeta-widget-lib"
    script.src = PACKETA_LIBRARY_URL
    script.async = true
    script.addEventListener("load", onReady, { once: true })
    script.addEventListener("error", () => reject(new Error("Packeta widget failed to load")), { once: true })
    document.body.appendChild(script)
  })
}

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
    packetaDisabled: "Doprava Packeta je momentalne nedostupna.",
    packetaError: "Widget se nepodarilo otevrit. Zkuste to znovu.",
    packetaLoading: "Nacitam vydejni mista Packeta…",
    cancel: "Zrusit",
    payment: "Platba",
    paymentUnavailable: "Online platba je momentalne nedostupna.",
    paymentFillForm: "Vyplnte kontakt a vyberte vydejni misto, pak pokracujte k platbe.",
    paymentInitializing: "Pripravujeme zabezpecenou platbu…",
    payNow: "Zaplatit",
    genericPayError: "Platba se nezdarila. Zkuste jiny zpusob platby.",
    verifying: "Overujeme platbu…",
    paidTitle: "Platba probehla uspesne",
    paidText: "Dekujeme! Objednavka je potvrzena a zbozi je pro vas rezervovano.",
    orderError: "Objednavku se nepodarilo vytvorit. Zkuste to prosim znovu.",
    payInitError: "Platbu se nepodarilo spustit. Zkuste to prosim znovu.",
    pollTimeout: "Platba trva dele, nez je obvykle. Jakmile ji potvrdime, dame vam vedet e-mailem.",
    retry: "Zkusit znovu",
    summary: "Souhrn objednavky",
    subtotal: "Mezisoucet",
    deliveryFee: "Doprava",
    deliveryFree: "Zdarma",
    total: "Celkem",
    continueToPayment: "Pokracovat k platbe",
    secureNote: "Zabezpecena platba. Sklad rezervujeme na dobu platby.",
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
    packetaDisabled: "Доставка Packeta зараз недоступна.",
    packetaError: "Не вдалося відкрити віджет. Спробуйте ще раз.",
    packetaLoading: "Завантажуємо пункти видачі Packeta…",
    cancel: "Скасувати",
    payment: "Оплата",
    paymentUnavailable: "Онлайн-оплата зараз недоступна.",
    paymentFillForm: "Заповніть контакти та виберіть пункт видачі, потім перейдіть до оплати.",
    paymentInitializing: "Готуємо безпечну оплату…",
    payNow: "Сплатити",
    genericPayError: "Оплата не пройшла. Спробуйте інший спосіб оплати.",
    verifying: "Підтверджуємо оплату…",
    paidTitle: "Оплату виконано успішно",
    paidText: "Дякуємо! Замовлення підтверджено, товар зарезервовано для вас.",
    orderError: "Не вдалося створити замовлення. Будь ласка, спробуйте ще раз.",
    payInitError: "Не вдалося запустити оплату. Будь ласка, спробуйте ще раз.",
    pollTimeout: "Оплата триває довше, ніж зазвичай. Щойно підтвердимо — повідомимо вам на e-mail.",
    retry: "Спробувати ще раз",
    summary: "Підсумок замовлення",
    subtotal: "Проміжна сума",
    deliveryFee: "Доставка",
    deliveryFree: "Безкоштовно",
    total: "Разом",
    continueToPayment: "Перейти до оплати",
    secureNote: "Безпечна оплата. Склад резервуємо на час оплати.",
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
    packetaDisabled: "Packeta delivery is currently unavailable.",
    packetaError: "Could not open the widget. Please try again.",
    packetaLoading: "Loading Packeta pickup points…",
    cancel: "Cancel",
    payment: "Payment",
    paymentUnavailable: "Online payment is currently unavailable.",
    paymentFillForm: "Fill in your contact and pick a delivery point, then continue to payment.",
    paymentInitializing: "Preparing secure payment…",
    payNow: "Pay now",
    genericPayError: "Payment failed. Please try another payment method.",
    verifying: "Confirming your payment…",
    paidTitle: "Payment successful",
    paidText: "Thank you! Your order is confirmed and your items are reserved.",
    orderError: "We couldn't create your order. Please try again.",
    payInitError: "We couldn't start the payment. Please try again.",
    pollTimeout: "Payment is taking longer than usual. We'll email you once it's confirmed.",
    retry: "Try again",
    summary: "Order summary",
    subtotal: "Subtotal",
    deliveryFee: "Delivery",
    deliveryFree: "Free",
    total: "Total",
    continueToPayment: "Continue to payment",
    secureNote: "Secure payment. Stock is reserved during payment.",
  },
} as const

interface PacketaPoint {
  id: string | null
  name: string
  city?: string
  country?: string
}

type CheckoutPhase = "form" | "creating" | "paying" | "polling" | "paid" | "error"

export function ShopCheckoutPage({
  locale,
  packeta,
  stripe,
}: {
  locale: ShopLocale
  packeta: ShopPacketaConfig
  stripe: ShopStripeConfig
}) {
  const copy = CHECKOUT_COPY[locale]
  const { lines, clear } = useShopCart()
  const subtotal = lines.reduce((sum, line) => sum + line.priceSnapshot * line.quantity, 0)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [point, setPoint] = useState<PacketaPoint | null>(null)
  const [packetaError, setPacketaError] = useState(false)
  const [packetaLoading, setPacketaLoading] = useState(false)

  // Order/payment state machine.
  const [phase, setPhase] = useState<CheckoutPhase>("form")
  const [order, setOrder] = useState<{ orderId: string; publicToken: string } | null>(null)
  const [payment, setPayment] = useState<ShopOrderPayment | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Guards the async widget load: cancelRef short-circuits a resolved load that
  // the user (or the timeout) already abandoned; timeoutRef enforces a hard cap.
  const cancelRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    // Resume after a Stripe redirect (3DS/PayPal): the return_url carries
    // ?order=<id>; the per-order token was stashed in sessionStorage.
    try {
      const orderId = new URLSearchParams(window.location.search).get("order")
      if (orderId) {
        const token = window.sessionStorage.getItem(orderTokenKey(orderId))
        if (token) {
          setOrder({ orderId, publicToken: token })
          setPhase("polling")
        }
      }
    } catch {
      // Ignore unavailable storage / URL parsing issues.
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const hasContact = email.trim().length > 0 || phone.trim().length > 0
  const hasName = firstName.trim().length > 0 && lastName.trim().length > 0
  const canSubmit = hasName && hasContact && point !== null && lines.length > 0 && stripe.enabled

  const stopPacketaLoading = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setPacketaLoading(false)
  }

  // Lets the user abort a slow/stuck load: ignore the pending promise and
  // unblock the UI without surfacing an error (cancellation is intentional).
  const cancelPacketa = () => {
    cancelRef.current = true
    stopPacketaLoading()
  }

  // Opens the real Packeta pickup-point widget using the widgetApiKey from
  // GET /api/public/v1/integrations and stores the chosen point for the order.
  const openPacketaWidget = async () => {
    if (!packeta.enabled || !packeta.widgetApiKey) {
      setPacketaError(true)
      return
    }
    setPacketaError(false)
    cancelRef.current = false
    setPacketaLoading(true)
    timeoutRef.current = setTimeout(() => {
      cancelRef.current = true
      setPacketaError(true)
      stopPacketaLoading()
    }, PACKETA_LOAD_TIMEOUT_MS)

    try {
      const widget = await loadPacketaWidget()
      if (cancelRef.current) {
        return
      }
      widget.pick(
        packeta.widgetApiKey,
        (selected) => {
          if (!selected) {
            return
          }
          setPoint({
            id: selected.id != null ? String(selected.id) : null,
            name: selected.name ?? selected.place ?? "",
            city: selected.city,
            country: selected.country,
          })
        },
        { country: (packeta.countries[0] ?? "cz").toLowerCase(), language: locale },
      )
      // The Packeta widget now renders its own overlay, so release our loader.
      stopPacketaLoading()
    } catch {
      if (!cancelRef.current) {
        setPacketaError(true)
      }
      stopPacketaLoading()
    }
  }

  // Creates a RESERVED order, then opens a Stripe PaymentIntent for it. On
  // success the Stripe Payment / Express Checkout elements render in place.
  const placeOrder = async () => {
    if (!canSubmit || point === null) {
      return
    }
    setPhase("creating")
    setErrorMessage(null)
    try {
      const createRes = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: `${firstName} ${lastName}`.trim(),
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
          },
          delivery: {
            provider: "PACKETA",
            service: "PICKUP_POINT",
            addressId: point.id,
            point: { name: point.name, city: point.city, country: point.country },
          },
          lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
          currency: "CZK",
          locale,
        }),
      })
      if (!createRes.ok) {
        throw new Error("order")
      }
      const created = (await createRes.json()) as ShopCreatedOrder
      try {
        window.sessionStorage.setItem(orderTokenKey(created.orderId), created.publicToken)
      } catch {
        // Non-fatal: redirect-resume just won't work without storage.
      }
      setOrder({ orderId: created.orderId, publicToken: created.publicToken })
      setPhase("paying")

      const payRes = await fetch(`/api/shop/orders/${encodeURIComponent(created.orderId)}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicToken: created.publicToken }),
      })
      if (!payRes.ok) {
        setErrorMessage(copy.payInitError)
        setPhase("error")
        return
      }
      setPayment((await payRes.json()) as ShopOrderPayment)
    } catch {
      setErrorMessage(copy.orderError)
      setPhase("error")
    }
  }

  const onConfirmed = useCallback(() => setPhase("polling"), [])

  // Poll the order until the admin's Stripe webhook flips it to PAID.
  useEffect(() => {
    if (phase !== "polling" || !order) {
      return
    }
    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (cancelled) {
        return
      }
      attempts += 1
      try {
        const res = await fetch(`/api/shop/orders/${encodeURIComponent(order.orderId)}`, {
          headers: { "x-order-token": order.publicToken },
          cache: "no-store",
        })
        if (res.ok) {
          const status = (await res.json()) as ShopOrderStatus
          if (status.paymentStatus === "PAID") {
            if (!cancelled) {
              try {
                window.sessionStorage.removeItem(orderTokenKey(order.orderId))
              } catch {
                // ignore
              }
              clear()
              setPhase("paid")
            }
            return
          }
        }
      } catch {
        // Transient error; keep polling until the attempt cap.
      }
      if (attempts >= MAX_POLL_ATTEMPTS) {
        if (!cancelled) {
          setErrorMessage(copy.pollTimeout)
          setPhase("error")
        }
        return
      }
      timer = setTimeout(tick, POLL_INTERVAL_MS)
    }

    timer = setTimeout(tick, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [phase, order, clear, copy.pollTimeout])

  const returnUrl =
    mounted && order ? `${window.location.origin}/${locale}/checkout?order=${encodeURIComponent(order.orderId)}` : ""

  // Payment confirmed — show a success panel (the cart has been cleared).
  if (phase === "paid") {
    return (
      <div className="container px-4 py-10 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h1>
        <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/50 px-6 py-12 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="mt-4 text-base font-semibold text-gray-950">{copy.paidTitle}</p>
          <p className="mt-2 text-sm text-gray-600">{copy.paidText}</p>
          <Button asChild className="mt-5" variant="outline">
            <Link href={`/${locale}`}>{copy.backToShop}</Link>
          </Button>
        </div>
      </div>
    )
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

  const formLocked = phase !== "form"

  const packetaOverlay =
    mounted && packetaLoading
      ? createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/40 px-4 backdrop-blur-sm"
            role="alertdialog"
            aria-busy="true"
            aria-label={copy.packetaLoading}
          >
            <div className="w-full max-w-xs rounded-xl bg-white p-6 text-center shadow-xl">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-gray-900" />
              <p className="mt-4 text-sm font-medium text-gray-900">{copy.packetaLoading}</p>
              <button
                type="button"
                onClick={cancelPacketa}
                className="mt-5 inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                {copy.cancel}
              </button>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <div className="container px-4 py-10 md:px-6">
      {packetaOverlay}
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
                  disabled={formLocked}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700">{copy.lastName}</span>
                <input
                  name="family-name"
                  autoComplete="family-name"
                  value={lastName}
                  disabled={formLocked}
                  onChange={(event) => setLastName(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700">{copy.email}</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  disabled={formLocked}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </label>
              <label>
                <span className="text-sm font-medium text-gray-700">{copy.phone}</span>
                <input
                  type="tel"
                  name="tel"
                  autoComplete="tel"
                  value={phone}
                  disabled={formLocked}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-950 disabled:bg-gray-50 disabled:text-gray-500"
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
                    disabled={!packeta.enabled || packetaLoading || formLocked}
                    className="mt-3 inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {packetaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {point ? copy.changePoint : copy.choosePoint}
                  </button>
                  {!packeta.enabled ? <p className="mt-2 text-xs text-amber-700">{copy.packetaDisabled}</p> : null}
                  {packetaError ? <p className="mt-2 text-xs text-red-600">{copy.packetaError}</p> : null}
                </div>
              </div>
            </div>
          </section>

          {/* Payment — Stripe Elements (Express Checkout + Payment Element) mount
              here once the order + PaymentIntent exist. */}
          <section className="rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold">{copy.payment}</h2>

            {!stripe.enabled ? (
              <p className="mt-3 text-sm text-amber-700">{copy.paymentUnavailable}</p>
            ) : phase === "form" ? (
              <p className="mt-3 text-sm text-gray-500">{copy.paymentFillForm}</p>
            ) : phase === "creating" || (phase === "paying" && !payment) ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.paymentInitializing}
              </div>
            ) : phase === "paying" && payment ? (
              <div className="mt-4">
                <ShopStripePayment
                  clientSecret={payment.clientSecret}
                  publishableKey={payment.publishableKey}
                  locale={locale}
                  returnUrl={returnUrl}
                  onConfirmed={onConfirmed}
                  copy={{ payNow: copy.payNow, genericError: copy.genericPayError }}
                />
              </div>
            ) : phase === "polling" ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.verifying}
              </div>
            ) : phase === "error" ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-red-600">{errorMessage ?? copy.genericPayError}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setErrorMessage(null)
                    setOrder(null)
                    setPayment(null)
                    setPhase("form")
                  }}
                >
                  {copy.retry}
                </Button>
              </div>
            ) : null}
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

          {/* The primary CTA only creates the order; once payment is initialised
              the Stripe "Pay" button in the Payment section takes over. */}
          {phase === "form" || phase === "creating" ? (
            <Button
              className="mt-5 w-full"
              size="lg"
              disabled={!canSubmit || phase === "creating"}
              onClick={placeOrder}
            >
              {phase === "creating" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {copy.continueToPayment}
            </Button>
          ) : null}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gray-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            {copy.secureNote}
          </p>
        </aside>
      </div>
    </div>
  )
}
