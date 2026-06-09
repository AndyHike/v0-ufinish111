"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Elements, ExpressCheckoutElement, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe, type StripeElementLocale, type StripeError } from "@stripe/stripe-js"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ShopLocale } from "@/lib/shop/types"

export interface StripePaymentCopy {
  payNow: string
  genericError: string
  orPayByCard: string
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

// Shared tail of the deferred confirm flow used by BOTH the card "Pay" button and
// the Apple/Google Pay express button: create the order + PaymentIntent on the
// server (short-lived clientSecret), then confirmPayment. `redirect: "if_required"`
// keeps cards (no 3DS) and wallets on-page; 3DS/PayPal redirect to return_url.
// Returns whether the caller should keep showing a busy/submitting state (a
// terminal success/redirect keeps it; a recoverable error releases it).
async function confirmDeferredPayment({
  stripe,
  elements,
  prepareClientSecret,
  onConfirmed,
  onExpired,
  setError,
  copy,
}: {
  stripe: Stripe
  elements: ReturnType<typeof useElements>
  prepareClientSecret: () => Promise<PreparePaymentResult>
  onConfirmed: () => void
  onExpired: () => void
  setError: (message: string | null) => void
  copy: StripePaymentCopy
}): Promise<{ busy: boolean }> {
  if (!elements) {
    return { busy: false }
  }
  // Fetch a fresh PaymentIntent immediately before confirming — the clientSecret
  // is short-lived, so we never reuse a cached/overnight one.
  const prepared = await prepareClientSecret()
  if (prepared.status === "confirmed") {
    onConfirmed() // free order or already paid: nothing to charge
    return { busy: true }
  }
  if (prepared.status === "expired") {
    onExpired() // no longer payable — don't retry, route to "start a new order"
    return { busy: true }
  }
  if (prepared.status === "error") {
    setError(copy.genericError)
    return { busy: false }
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
      return { busy: true }
    }
    setError(confirmError.message ?? copy.genericError)
    return { busy: false }
  }
  // No redirect needed — payment authorized. Server truth (PAID/confirm) is
  // handled by the admin webhook; the client signal is enough for UX.
  if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
    onConfirmed()
    return { busy: true }
  }
  return { busy: false }
}

// Apple Pay / Google Pay express buttons, rendered prominently above the card
// form. Lives in its OWN Elements group so elements.submit() only validates the
// wallet (a co-mounted, incomplete card Payment Element would otherwise block it).
// Auto-hides on devices/browsers with no available wallet (onReady reports none).
function ExpressCheckoutWallets({
  amount,
  canPay,
  onValidateFail,
  prepareClientSecret,
  onConfirmed,
  onExpired,
  onAvailability,
  copy,
}: {
  amount: number
  canPay: boolean
  onValidateFail: () => void
  prepareClientSecret: () => Promise<PreparePaymentResult>
  onConfirmed: () => void
  onExpired: () => void
  onAvailability: (available: boolean) => void
  copy: StripePaymentCopy
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (elements) {
      elements.update({ amount })
    }
  }, [elements, amount])

  return (
    <div className="space-y-2">
      <ExpressCheckoutElement
        // Force the wallets on whenever the device supports them, instead of
        // letting Stripe auto-suppress them. Link is kept out of the top row so
        // it doesn't duplicate the Link option inside the card accordion.
        options={{ paymentMethods: { applePay: "always", googlePay: "always", link: "never" } }}
        onReady={(event) => {
          const methods = event.availablePaymentMethods
          onAvailability(Boolean(methods && (methods.applePay || methods.googlePay)))
        }}
        // Gate the wallet sheet on a valid order form (name/contact/pickup point):
        // the server still builds the order from our form, not the wallet. Not
        // resolving the click keeps the sheet closed and surfaces the hint.
        onClick={({ resolve }) => {
          if (!canPay) {
            onValidateFail()
            return
          }
          resolve()
        }}
        onConfirm={async () => {
          if (!stripe || !elements) {
            return
          }
          setError(null)
          const { error: submitError } = await elements.submit()
          if (submitError) {
            setError(submitError.message ?? copy.genericError)
            return
          }
          await confirmDeferredPayment({ stripe, elements, prepareClientSecret, onConfirmed, onExpired, setError, copy })
        }}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
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

    const { busy } = await confirmDeferredPayment({ stripe, elements, prepareClientSecret, onConfirmed, onExpired, setError, copy })
    if (!busy) {
      setSubmitting(false)
    }
  }, [stripe, elements, canPay, onValidateFail, prepareClientSecret, onConfirmed, onExpired, copy])

  return (
    <div className="space-y-4">
      {/* Card (+ any redirect methods) only. Apple/Google Pay are shown as the
          prominent express buttons above, so hide their duplicate rows here.
          Collapsed radios keep the card form from being force-expanded. */}
      <PaymentElement
        options={{
          wallets: { applePay: "never", googlePay: "never" },
          layout: { type: "accordion", defaultCollapsed: true, radios: "always" },
        }}
      />
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
  const [walletsAvailable, setWalletsAvailable] = useState(false)
  const elementsOptions = {
    mode: "payment" as const,
    amount,
    currency,
    locale: toStripeLocale(locale),
    appearance: { theme: "stripe" as const },
  }

  return (
    <div className="space-y-4">
      {/* Express wallets (Apple/Google Pay) in their own Elements group, shown
          on top. The whole block (incl. divider) collapses when no wallet is
          available on this device. */}
      <Elements stripe={stripePromise} options={elementsOptions}>
        <ExpressCheckoutWallets
          amount={amount}
          canPay={canPay}
          onValidateFail={onValidateFail}
          prepareClientSecret={prepareClientSecret}
          onConfirmed={onConfirmed}
          onExpired={onExpired}
          onAvailability={setWalletsAvailable}
          copy={copy}
        />
      </Elements>
      {walletsAvailable ? (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {copy.orPayByCard}
          <span className="h-px flex-1 bg-border" />
        </div>
      ) : null}
      <Elements stripe={stripePromise} options={elementsOptions}>
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
    </div>
  )
}
