"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe, type StripeElementLocale, type StripeError } from "@stripe/stripe-js"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ShopLocale } from "@/lib/shop/types"

export interface StripePaymentCopy {
  payNow: string
  genericError: string
}

// Result of fetching a fresh PaymentIntent right before confirming. The
// clientSecret is short-lived: the admin cancels both the order and the Stripe
// PaymentIntent once the ~10min payment window / 15min reservation lapse, so we
// always re-request `/pay` at confirm time and branch on the outcome instead of
// treating every non-"ready" case as a failed charge.
export type PreparePaymentResult =
  // PaymentIntent ready to confirm with Stripe.
  | { status: "ready"; clientSecret: string; returnUrl: string }
  // Nothing to charge — free order (total 0) or already paid: treat as success.
  | { status: "confirmed" }
  // Order is no longer payable (cancelled/completed/expired): start a new order.
  | { status: "expired" }
  // Transient/unknown failure: let the user retry (a retry re-runs `/pay`).
  | { status: "error" }

// A confirm error from a PaymentIntent that the admin already cancelled (expired
// checkout). Stripe reports this as `payment_intent_unexpected_state`, or the
// attached intent shows status "canceled". Either way the old clientSecret is
// dead — start a new order rather than retrying with it.
function isExpiredIntentError(error: StripeError): boolean {
  if (error.code === "payment_intent_unexpected_state") {
    return true
  }
  const intent = error.payment_intent
  return intent != null && intent.status === "canceled"
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
  onExpired,
  copy,
}: {
  amount: number
  canPay: boolean
  onValidateFail: () => void
  prepareClientSecret: () => Promise<PreparePaymentResult>
  onConfirmed: () => void
  onExpired: () => void
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

    // Fetch a fresh PaymentIntent immediately before confirming — the
    // clientSecret is short-lived, so we never reuse a cached/overnight one.
    const prepared = await prepareClientSecret()
    if (prepared.status === "confirmed") {
      // Free order or already paid: nothing to charge.
      onConfirmed()
      return
    }
    if (prepared.status === "expired") {
      // Order no longer payable — don't retry, route to "start a new order".
      onExpired()
      return
    }
    if (prepared.status === "error") {
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
      // Expired checkout (admin already cancelled the intent): start over rather
      // than showing a generic "payment failed" and retrying the dead secret.
      if (isExpiredIntentError(confirmError)) {
        onExpired()
        return
      }
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
  }, [stripe, elements, canPay, onValidateFail, prepareClientSecret, onConfirmed, onExpired, copy.genericError])

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
  onExpired,
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
  prepareClientSecret: () => Promise<PreparePaymentResult>
  onConfirmed: () => void
  onExpired: () => void
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
        onExpired={onExpired}
        copy={copy}
      />
    </Elements>
  )
}
