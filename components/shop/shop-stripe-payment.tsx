"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe, type StripeElementLocale } from "@stripe/stripe-js"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ShopLocale } from "@/lib/shop/types"

export interface StripePaymentCopy {
  payNow: string
  genericError: string
}

export interface PreparedPayment {
  clientSecret: string
  returnUrl: string
}

// loadStripe must run once per publishable key (it injects a script tag); cache
// the promise so re-renders/remounts reuse the same Stripe instance. Exported so
// the checkout page can reuse it for retrievePaymentIntent on redirect return.
const stripePromiseCache = new Map<string, Promise<Stripe | null>>()
export function getStripe(publishableKey: string): Promise<Stripe | null> {
  let promise = stripePromiseCache.get(publishableKey)
  if (!promise) {
    promise = loadStripe(publishableKey)
    stripePromiseCache.set(publishableKey, promise)
  }
  return promise
}

// Stripe Elements ships a fixed locale set; fall back to browser auto-detect for
// locales it doesn't support (e.g. Ukrainian).
function toStripeLocale(locale: ShopLocale): StripeElementLocale {
  if (locale === "cs") return "cs"
  if (locale === "en") return "en"
  return "auto"
}

function PaymentInner({
  amount,
  canPay,
  onValidateFail,
  prepareClientSecret,
  onConfirmed,
  copy,
}: {
  amount: number
  canPay: boolean
  onValidateFail: () => void
  prepareClientSecret: () => Promise<PreparedPayment | null>
  onConfirmed: () => void
  copy: StripePaymentCopy
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep the deferred Elements amount in sync with the cart total without
  // remounting (cart edits / quantity changes before paying).
  useEffect(() => {
    if (elements) {
      elements.update({ amount })
    }
  }, [elements, amount])

  // Shared confirm path for the card "Pay" button and the wallet (Apple/Google
  // Pay) express button. Deferred flow: submit() → create order+PI on the server
  // → confirmPayment. `redirect: "if_required"` keeps cards (no 3DS) and wallets
  // on-page; 3DS/PayPal redirect to return_url.
  const confirm = useCallback(async () => {
    if (!stripe || !elements) {
      return
    }
    if (!canPay) {
      onValidateFail()
      return
    }
    setSubmitting(true)
    setError(null)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? copy.genericError)
      setSubmitting(false)
      return
    }

    const prepared = await prepareClientSecret()
    if (!prepared) {
      setError(copy.genericError)
      setSubmitting(false)
      return
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret: prepared.clientSecret,
      confirmParams: { return_url: prepared.returnUrl },
      redirect: "if_required",
    })
    if (confirmError) {
      setError(confirmError.message ?? copy.genericError)
      setSubmitting(false)
      return
    }
    // No redirect needed — payment authorized. Server truth (PAID/confirm) is
    // handled by the admin webhook; the client signal is enough for UX.
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      onConfirmed()
      return
    }
    setSubmitting(false)
  }, [stripe, elements, canPay, onValidateFail, prepareClientSecret, onConfirmed, copy.genericError])

  return (
    <div className="space-y-4">
      {/* Accordion: each method (card / Klarna / …) is a collapsed row; clicking
          one expands its fields. A single "Pay" button confirms the selection. */}
      <PaymentElement options={{ layout: "accordion" }} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button type="button" className="w-full" size="lg" disabled={!stripe || submitting || !canPay} onClick={confirm}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {copy.payNow}
      </Button>
    </div>
  )
}

export function ShopStripePayment({
  publishableKey,
  amount,
  currency,
  locale,
  canPay,
  onValidateFail,
  prepareClientSecret,
  onConfirmed,
  copy,
}: {
  publishableKey: string
  /** Amount in the smallest currency unit (e.g. CZK haléř = subtotal * 100). */
  amount: number
  /** Lowercase ISO currency, e.g. "czk". */
  currency: string
  locale: ShopLocale
  canPay: boolean
  onValidateFail: () => void
  prepareClientSecret: () => Promise<PreparedPayment | null>
  onConfirmed: () => void
  copy: StripePaymentCopy
}) {
  const stripePromise = useMemo(() => getStripe(publishableKey), [publishableKey])
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount,
        currency,
        locale: toStripeLocale(locale),
        appearance: { theme: "stripe" },
      }}
    >
      <PaymentInner
        amount={amount}
        canPay={canPay}
        onValidateFail={onValidateFail}
        prepareClientSecret={prepareClientSecret}
        onConfirmed={onConfirmed}
        copy={copy}
      />
    </Elements>
  )
}
