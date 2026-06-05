import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout | DeviceHelp Shop",
  robots: "noindex,follow",
}

export default function ShopCheckoutPage() {
  return (
    <div className="container px-4 py-12 md:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">DeviceHelp Shop</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 md:text-5xl">Checkout</h1>
        <p className="mt-4 text-sm leading-7 text-gray-600">
          Checkout is reserved for the future order reservation, Packeta, and payment flow. This route stays noindex.
        </p>
      </div>
    </div>
  )
}
