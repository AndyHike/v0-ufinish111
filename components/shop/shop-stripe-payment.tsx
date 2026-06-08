"use client"

import { useCallback, useMemo, useState } from "react"
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe, type StripeElementLocale } from "@stripe/stripe-js"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ShopLocale } from "@/lib/shop/types"

export interface StripePaymentCopy {
  payNow: string
  genericError: string
}

// loadStripe must be called once per publishable key (it injects a script tag);
// cache the promise so re-renders/remounts reuse the same Stripe instance.
const stripePromiseCache = new Map<string, Promise<Stripe | null>>()
function getStripe(publishableKey: string): Promise<Stripe | null> {
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
  returnUrl,
  onConfirmed,
  copy,
}: {
  returnUrl: string
  onConfirmed: () => void
  copy: StripePaymentCopy
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Shared confirm path for both the card "Pay" button and the Apple/Google Pay
  // express button. `redirect: "if_required"` keeps cards (no 3DS) and wallets on
  // this page; methods that must redirect (3DS / PayPal) go to `return_url`.
  const confirm = useCallback(async () => {
    if (!stripe || !elements) {
      return
    }
    setSubmitting(true)
    setError(null)
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    })
    if (confirmError) {
      setError(confirmError.message ?? copy.genericError)
      setSubmitting(false)
      return
    }
    // No redirect was required: hand off to the parent to verify PAID via polling.
    // (`processing` covers async methods that settle shortly after.)
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      onConfirmed()
      return
    }
    setSubmitting(false)
  }, [stripe, elements, returnUrl, onConfirmed, copy.genericError])

  return (
    <div className="space-y-4">
      {/* Apple / Google Pay (only renders when an eligible wallet is available). */}
      <ExpressCheckoutElement onConfirm={confirm} />
      <PaymentElement options={{ layout: "tabs" }} />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button type="button" className="w-full" size="lg" disabled={!stripe || submitting} onClick={confirm}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {copy.payNow}
      </Button>
    </div>
  )
}

export function ShopStripePayment({
  clientSecret,
  publishableKey,
  locale,
  returnUrl,
  onConfirmed,
  copy,
}: {
  clientSecret: string
  publishableKey: string
  locale: ShopLocale
  returnUrl: string
  onConfirmed: () => void
  copy: StripePaymentCopy
}) {
  const stripePromise = useMemo(() => getStripe(publishableKey), [publishableKey])
  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, locale: toStripeLocale(locale), appearance: { theme: "stripe" } }}
    >
      <PaymentInner returnUrl={returnUrl} onConfirmed={onConfirmed} copy={copy} />
    </Elements>
  )
}
