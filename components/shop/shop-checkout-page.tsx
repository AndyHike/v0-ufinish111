"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, Loader2, MapPin, ShieldCheck } from "lucide-react"

import { useShopCart } from "@/components/shop/shop-cart-provider"
import { ShopStripePayment, getStripe, type PreparePaymentResult } from "@/components/shop/shop-stripe-payment"
import { Button } from "@/components/ui/button"
import { formatShopPrice } from "@/lib/shop/catalog"
import type { ShopCreatedOrder, ShopLocale, ShopOrderPayment, ShopPacketaConfig, ShopStripeConfig } from "@/lib/shop/types"

const PACKETA_LIBRARY_URL = "https://widget.packeta.com/v6/www/js/library.js"
// Safety net: if the widget library never loads/initialises, stop blocking the
// UI and surface an error rather than spinning forever.
const PACKETA_LOAD_TIMEOUT_MS = 20000

// In-flight order context, persisted so a Stripe redirect (3DS/PayPal) and page
// reloads reuse the same idempotencyKey + order instead of creating duplicates.
const ORDER_STORAGE_KEY = "devicehelp.shop.checkout.order"

// The admin gives the order a ~10min payment window (15min stock reservation),
// after which it cancels both the order and its Stripe PaymentIntent. Once a
// cached order is older than this its clientSecret is dead, so we drop it and
// create a fresh order rather than calling /pay on a doomed one.
const PAYMENT_WINDOW_MS = 10 * 60 * 1000

// Machine-readable /pay failures we branch on (forwarded from the admin via the
// same-origin proxy). Anything else is treated as a transient/generic error.
const ERR_ALREADY_PAID = "ORDER_ALREADY_PAID"
const ERR_NOT_PAYABLE = "ORDER_NOT_PAYABLE"

// A /pay rejection we can classify by the admin's error code (falling back to a
// substring match on the human message for backends that omit `code`).
class PayError extends Error {
  constructor(readonly kind: "already_paid" | "not_payable" | "other") {
    super(`pay:${kind}`)
    this.name = "PayError"
  }
}

function classifyPayFailure(code: string | undefined, message: string | undefined): PayError {
  const text = (message ?? "").toLowerCase()
  if (code === ERR_ALREADY_PAID || text.includes("already been paid")) {
    return new PayError("already_paid")
  }
  if (code === ERR_NOT_PAYABLE || text.includes("not payable") || text.includes("no longer")) {
    return new PayError("not_payable")
  }
  return new PayError("other")
}

interface OrderContext {
  signature: string
  idempotencyKey: string
  orderId: string | null
  publicToken: string | null
  // Epoch ms when the order was created — used to detect a stale (likely
  // expired) cached order so we can rotate to a fresh one before paying.
  createdAt: number | null
  // Captured at create time so the success screen can show the order details —
  // persisted to sessionStorage so they survive a Stripe redirect (3DS/PayPal).
  orderNumber: string | null
  total: number | null
  currency: string | null
  email: string | null
  pointName: string | null
}

interface PaidSummary {
  orderNumber: string | null
  total: number | null
  currency: string | null
  email: string | null
  pointName: string | null
}

function summaryOf(ctx: OrderContext): PaidSummary {
  return {
    orderNumber: ctx.orderNumber,
    total: ctx.total,
    currency: ctx.currency,
    email: ctx.email,
    pointName: ctx.pointName,
  }
}

function newIdempotencyKey(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`
  }
}

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
    fillFormFirst: "Nejprve vyplnte kontakt a vyberte vydejni misto.",
    payNow: "Zaplatit",
    genericPayError: "Platba se nezdarila. Zkuste jiny zpusob platby.",
    verifying: "Overujeme platbu…",
    paidTitle: "Platba probehla uspesne",
    paidText: "Dekujeme! Objednavka je potvrzena a zbozi je pro vas rezervovano.",
    orderNumberLabel: "Cislo objednavky",
    paidTotalLabel: "Zaplaceno",
    paidPickupLabel: "Vydejni misto",
    paidContactLabel: "Kontakt",
    orderError: "Objednavku se nepodarilo vytvorit. Zkuste to prosim znovu.",
    expiredTitle: "Platnost objednavky vyprsela",
    expiredText: "Rezervace a casovy limit pro platbu vyprsely. Zalozte prosim novou objednavku — kosik zustava zachovany.",
    startAgain: "Zalozit novou objednavku",
    summary: "Souhrn objednavky",
    subtotal: "Mezisoucet",
    deliveryFee: "Doprava",
    deliveryFree: "Zdarma",
    total: "Celkem",
    placeFreeOrder: "Zavazne objednat",
    retry: "Zkusit znovu",
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
    fillFormFirst: "Спершу заповніть контакти та виберіть пункт видачі.",
    payNow: "Сплатити",
    genericPayError: "Оплата не пройшла. Спробуйте інший спосіб оплати.",
    verifying: "Підтверджуємо оплату…",
    paidTitle: "Оплату виконано успішно",
    paidText: "Дякуємо! Замовлення підтверджено, товар зарезервовано для вас.",
    orderNumberLabel: "Номер замовлення",
    paidTotalLabel: "Сплачено",
    paidPickupLabel: "Пункт видачі",
    paidContactLabel: "Контакт",
    orderError: "Не вдалося створити замовлення. Будь ласка, спробуйте ще раз.",
    expiredTitle: "Час оплати вийшов",
    expiredText: "Резерв і вікно оплати цього замовлення завершилися. Будь ласка, оформіть нове замовлення — кошик збережено.",
    startAgain: "Оформити нове замовлення",
    summary: "Підсумок замовлення",
    subtotal: "Проміжна сума",
    deliveryFee: "Доставка",
    deliveryFree: "Безкоштовно",
    total: "Разом",
    placeFreeOrder: "Замовити",
    retry: "Спробувати ще раз",
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
    fillFormFirst: "First fill in your contact and pick a delivery point.",
    payNow: "Pay now",
    genericPayError: "Payment failed. Please try another payment method.",
    verifying: "Confirming your payment…",
    paidTitle: "Payment successful",
    paidText: "Thank you! Your order is confirmed and your items are reserved.",
    orderNumberLabel: "Order number",
    paidTotalLabel: "Paid",
    paidPickupLabel: "Pickup point",
    paidContactLabel: "Contact",
    orderError: "We couldn't create your order. Please try again.",
    expiredTitle: "Order expired",
    expiredText: "The reservation and payment window for this order have expired. Please start a new order — your cart is kept.",
    startAgain: "Start a new order",
    summary: "Order summary",
    subtotal: "Subtotal",
    deliveryFee: "Delivery",
    deliveryFree: "Free",
    total: "Total",
    placeFreeOrder: "Place order",
    retry: "Try again",
    secureNote: "Secure payment. Stock is reserved during payment.",
  },
} as const

interface PacketaPoint {
  id: string | null
  name: string
  city?: string
  country?: string
}

type CheckoutPhase = "form" | "confirming" | "paid" | "error" | "expired"

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
  const stripePk = stripe.enabled ? stripe.publishableKey : null
  // Delivery price from the store's Packeta config (free above the threshold).
  // The admin recomputes this server-side on the order; we mirror the formula for
  // display + the Stripe amount so the shown total matches what is charged.
  const shipping =
    packeta.shippingPrice == null
      ? 0
      : packeta.freeShippingThreshold != null && subtotal >= packeta.freeShippingThreshold
        ? 0
        : packeta.shippingPrice
  const total = subtotal + shipping
  // Stripe charges in the smallest unit; CZK is not zero-decimal, so * 100.
  const amountMinor = Math.round(total * 100)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [point, setPoint] = useState<PacketaPoint | null>(null)
  const [packetaError, setPacketaError] = useState(false)
  const [packetaLoading, setPacketaLoading] = useState(false)

  const [phase, setPhase] = useState<CheckoutPhase>("form")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [validateHint, setValidateHint] = useState(false)

  // Persisted order context (idempotency + created order) so retries reuse the
  // same RESERVED order rather than creating duplicates.
  const orderRef = useRef<OrderContext>({
    signature: "",
    idempotencyKey: "",
    orderId: null,
    publicToken: null,
    createdAt: null,
    orderNumber: null,
    total: null,
    currency: null,
    email: null,
    pointName: null,
  })
  const [paidSummary, setPaidSummary] = useState<PaidSummary | null>(null)

  const cancelRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const raw = window.sessionStorage.getItem(ORDER_STORAGE_KEY)
      if (raw) {
        orderRef.current = JSON.parse(raw) as OrderContext
      }
    } catch {
      // ignore corrupt/unavailable storage
    }

    // Resume after a Stripe redirect (3DS/PayPal): the return_url carries
    // payment_intent_client_secret. Read the real status client-side — no server
    // polling. Server truth (PAID/confirm) is handled by the admin webhook.
    try {
      const piSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret")
      if (piSecret && stripePk) {
        setPhase("confirming")
        getStripe(stripePk)
          .then(async (s) => {
            if (!s) {
              return
            }
            const { paymentIntent } = await s.retrievePaymentIntent(piSecret)
            if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
              setPaidSummary(summaryOf(orderRef.current))
              clear()
              setPhase("paid")
            } else if (paymentIntent && paymentIntent.status === "canceled") {
              // The admin cancelled this checkout while we were away — the old
              // clientSecret is dead. Prompt a new order rather than "failed".
              resetOrderContext()
              setPhase("expired")
            } else {
              setErrorMessage(copy.genericPayError)
              setPhase("error")
            }
          })
          .catch(() => {
            setErrorMessage(copy.genericPayError)
            setPhase("error")
          })
      }
    } catch {
      // ignore
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Don't leave a hanging payment tab: when the page comes back from the
  // background after the payment window has lapsed, the cached order's
  // PaymentIntent is likely already cancelled. Drop it so the next Pay click
  // requests a fresh order/clientSecret instead of confirming a dead one.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") {
        return
      }
      const ctx = orderRef.current
      if (ctx.createdAt != null && Date.now() - ctx.createdAt > PAYMENT_WINDOW_MS) {
        orderRef.current = {
          signature: "",
          idempotencyKey: "",
          orderId: null,
          publicToken: null,
          createdAt: null,
          orderNumber: null,
          total: null,
          currency: null,
          email: null,
          pointName: null,
        }
        try {
          window.sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderRef.current))
        } catch {
          // ignore
        }
      }
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  const hasContact = email.trim().length > 0 || phone.trim().length > 0
  const hasName = firstName.trim().length > 0 && lastName.trim().length > 0
  const formValid = hasName && hasContact && point !== null && lines.length > 0
  const canPayWithStripe = formValid && Boolean(stripePk) && total > 0
  const canPlaceFree = formValid && total === 0

  const stopPacketaLoading = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setPacketaLoading(false)
  }

  const cancelPacketa = () => {
    cancelRef.current = true
    stopPacketaLoading()
  }

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
      stopPacketaLoading()
    } catch {
      if (!cancelRef.current) {
        setPacketaError(true)
      }
      stopPacketaLoading()
    }
  }

  // Signature of the order-defining inputs. When it changes we rotate the
  // idempotencyKey + drop the cached order, so editing details creates a fresh
  // order while pure retries reuse the existing one.
  const currentSignature = useCallback(
    () =>
      JSON.stringify({
        p: point?.id ?? null,
        n: `${firstName} ${lastName}`.trim(),
        e: email.trim(),
        ph: phone.trim(),
        l: lines.map((line) => [line.variantId, line.quantity]),
      }),
    [point, firstName, lastName, email, phone, lines],
  )

  const persistOrderCtx = () => {
    try {
      window.sessionStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orderRef.current))
    } catch {
      // ignore
    }
  }

  // Create (or reuse) the RESERVED order, then open/reuse its Stripe PaymentIntent.
  const createOrderAndPay = useCallback(async (): Promise<ShopOrderPayment> => {
    if (point === null) {
      throw new Error("no-point")
    }
    const signature = currentSignature()
    // Drop a cached order that is stale (likely past the admin's payment window,
    // so its PaymentIntent is gone) — start fresh rather than calling /pay on a
    // doomed order. Editing the form (signature change) also rotates.
    const isStale =
      orderRef.current.createdAt != null && Date.now() - orderRef.current.createdAt > PAYMENT_WINDOW_MS
    if (orderRef.current.signature !== signature || !orderRef.current.idempotencyKey || isStale) {
      orderRef.current = {
        signature,
        idempotencyKey: newIdempotencyKey(),
        orderId: null,
        publicToken: null,
        createdAt: null,
        orderNumber: null,
        total: null,
        currency: null,
        email: null,
        pointName: null,
      }
      persistOrderCtx()
    }

    if (!orderRef.current.orderId || !orderRef.current.publicToken) {
      const createRes = await fetch("/api/shop/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: orderRef.current.idempotencyKey,
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
      orderRef.current.orderId = created.orderId
      orderRef.current.publicToken = created.publicToken
      orderRef.current.createdAt = Date.now()
      orderRef.current.orderNumber = created.orderNumber
      orderRef.current.total = created.totalAmount
      orderRef.current.currency = created.currency
      orderRef.current.email = email.trim() || null
      orderRef.current.pointName = point.name || null
      persistOrderCtx()
    }

    const payRes = await fetch(`/api/shop/orders/${encodeURIComponent(orderRef.current.orderId)}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicToken: orderRef.current.publicToken }),
    })
    if (!payRes.ok) {
      // Read the forwarded { error, code } so the caller can distinguish
      // already-paid / not-payable from a generic failure.
      let code: string | undefined
      let message: string | undefined
      try {
        const body = (await payRes.json()) as { error?: string; code?: string }
        code = body.code
        message = body.error
      } catch {
        // non-JSON error body — fall through to generic classification
      }
      throw classifyPayFailure(code, message)
    }
    return (await payRes.json()) as ShopOrderPayment
  }, [point, currentSignature, firstName, lastName, email, phone, lines, locale])

  const buildReturnUrl = useCallback(
    () => (mounted ? `${window.location.origin}/${locale}/checkout` : ""),
    [mounted, locale],
  )

  // Passed to the Stripe component: runs inside confirm() to get a *fresh*
  // clientSecret. Branches on the /pay outcome so the UI never shows a generic
  // "payment failed" for an already-paid / no-longer-payable / free order.
  const prepareClientSecret = useCallback(async (): Promise<PreparePaymentResult> => {
    try {
      const payment = await createOrderAndPay()
      // Free order (total 0): the admin settled it without a Stripe charge.
      if (payment.free) {
        return { status: "confirmed" }
      }
      if (!payment.clientSecret) {
        return { status: "error" }
      }
      return { status: "ready", clientSecret: payment.clientSecret, returnUrl: buildReturnUrl() }
    } catch (error) {
      if (error instanceof PayError) {
        // Already paid → show success; not payable → start a new order.
        if (error.kind === "already_paid") {
          return { status: "confirmed" }
        }
        if (error.kind === "not_payable") {
          return { status: "expired" }
        }
      }
      return { status: "error" }
    }
  }, [createOrderAndPay, buildReturnUrl])

  // Forget the dead order so a "start again" / next pay click builds a fresh one
  // (new idempotencyKey). The cart is kept — only the order context is dropped.
  const resetOrderContext = useCallback(() => {
    orderRef.current = {
      signature: "",
      idempotencyKey: "",
      orderId: null,
      publicToken: null,
      createdAt: null,
      orderNumber: null,
      total: null,
      currency: null,
      email: null,
      pointName: null,
    }
    persistOrderCtx()
  }, [])

  const onConfirmed = useCallback(() => {
    setPaidSummary(summaryOf(orderRef.current))
    clear()
    setPhase("paid")
  }, [clear])

  // Order is no longer payable (cancelled/expired) or its PaymentIntent was
  // cancelled: drop it and prompt the buyer to start a new order.
  const onExpired = useCallback(() => {
    resetOrderContext()
    setPhase("expired")
  }, [resetOrderContext])

  const startAgain = useCallback(() => {
    resetOrderContext()
    setErrorMessage(null)
    setPhase("form")
  }, [resetOrderContext])

  const onValidateFail = useCallback(() => setValidateHint(true), [])

  // Free order (total 0): no Stripe charge — create + settle server-side, succeed.
  const placeFreeOrder = async () => {
    if (!canPlaceFree) {
      return
    }
    setPhase("confirming")
    setErrorMessage(null)
    try {
      await createOrderAndPay()
      setPaidSummary(summaryOf(orderRef.current))
      clear()
      setPhase("paid")
    } catch (error) {
      // An already-settled free order is still a success; a no-longer-payable
      // one routes to "start a new order" like the Stripe path.
      if (error instanceof PayError && error.kind === "already_paid") {
        setPaidSummary(summaryOf(orderRef.current))
        clear()
        setPhase("paid")
        return
      }
      if (error instanceof PayError && error.kind === "not_payable") {
        onExpired()
        return
      }
      setErrorMessage(copy.orderError)
      setPhase("error")
    }
  }

  // --- Render -----------------------------------------------------------------

  if (phase === "confirming") {
    return (
      <div className="container px-4 py-10 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h1>
        <div className="mt-8 flex items-center justify-center gap-3 rounded-xl border border-gray-200 px-6 py-12 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-700" />
          <p className="text-sm font-medium text-gray-700">{copy.verifying}</p>
        </div>
      </div>
    )
  }

  if (phase === "paid") {
    return (
      <div className="container px-4 py-10 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h1>
        <div className="mx-auto mt-8 max-w-lg overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
          {/* Header band — the "paid" confirmation, visually set apart in green. */}
          <div className="bg-emerald-50/70 px-6 py-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </span>
            <p className="mt-4 text-lg font-semibold text-gray-950">{copy.paidTitle}</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">{copy.paidText}</p>
          </div>

          {/* Order number — its own emphasized row. */}
          {paidSummary?.orderNumber ? (
            <div className="border-t border-emerald-100 px-6 py-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{copy.orderNumberLabel}</p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-gray-950">{paidSummary.orderNumber}</p>
            </div>
          ) : null}

          {/* Details — each on its own divided row so they don't run together. */}
          {paidSummary ? (
            <dl className="divide-y divide-gray-100 border-t border-gray-100 px-6 text-sm">
              {paidSummary.total != null ? (
                <div className="flex items-start justify-between gap-6 py-3.5">
                  <dt className="text-gray-500">{copy.paidTotalLabel}</dt>
                  <dd className="text-right font-semibold text-gray-950">{formatShopPrice(paidSummary.total, locale)}</dd>
                </div>
              ) : null}
              {paidSummary.pointName ? (
                <div className="flex items-start justify-between gap-6 py-3.5">
                  <dt className="shrink-0 text-gray-500">{copy.paidPickupLabel}</dt>
                  <dd className="text-right text-gray-800">{paidSummary.pointName}</dd>
                </div>
              ) : null}
              {paidSummary.email ? (
                <div className="flex items-start justify-between gap-6 py-3.5">
                  <dt className="shrink-0 text-gray-500">{copy.paidContactLabel}</dt>
                  <dd className="break-all text-right text-gray-800">{paidSummary.email}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          {/* Action — separated footer. */}
          <div className="border-t border-gray-100 px-6 py-5 text-center">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href={`/${locale}`}>{copy.backToShop}</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "expired") {
    return (
      <div className="container px-4 py-10 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{copy.title}</h1>
        <div className="mx-auto mt-8 max-w-lg rounded-xl border border-amber-200 bg-amber-50/50 px-6 py-10 text-center">
          <p className="text-base font-semibold text-gray-950">{copy.expiredTitle}</p>
          <p className="mt-2 text-sm text-gray-600">{copy.expiredText}</p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {lines.length > 0 ? (
              <Button onClick={startAgain}>{copy.startAgain}</Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/${locale}`}>{copy.backToShop}</Link>
            </Button>
          </div>
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
          {/* Contact */}
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
                    disabled={!packeta.enabled || packetaLoading}
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

          {/* Payment — Stripe Elements are mounted eagerly (warm-up): card fields
              and wallets are ready while the user is still filling the form, so
              there's no loading after they click. */}
          <section className="rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold">{copy.payment}</h2>

            {!stripePk ? (
              <p className="mt-3 text-sm text-amber-700">{copy.paymentUnavailable}</p>
            ) : total === 0 ? null : (
              <div className="mt-4">
                <ShopStripePayment
                  publishableKey={stripePk}
                  amount={amountMinor}
                  currency="czk"
                  locale={locale}
                  canPay={canPayWithStripe}
                  onValidateFail={onValidateFail}
                  prepareClientSecret={prepareClientSecret}
                  onConfirmed={onConfirmed}
                  onExpired={onExpired}
                  copy={{ payNow: copy.payNow, genericError: copy.genericPayError }}
                />
                {validateHint && !formValid ? (
                  <p className="mt-2 text-xs text-amber-700">{copy.fillFormFirst}</p>
                ) : null}
                {phase === "error" ? <p className="mt-2 text-xs text-red-600">{errorMessage ?? copy.genericPayError}</p> : null}
              </div>
            )}
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
              <span className="font-medium text-gray-950">
                {shipping > 0 ? formatShopPrice(shipping, locale) : copy.deliveryFree}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <span className="text-sm font-semibold">{copy.total}</span>
            <span className="text-lg font-semibold text-gray-950">{formatShopPrice(total, locale)}</span>
          </div>

          {/* Free orders (total 0) have no Stripe step — confirm here. Paid orders
              use the Stripe "Pay" button in the Payment section above. */}
          {total === 0 ? (
            <Button className="mt-5 w-full" size="lg" disabled={!canPlaceFree} onClick={placeFreeOrder}>
              {copy.placeFreeOrder}
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
