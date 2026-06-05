import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cart | DeviceHelp Shop",
  robots: "noindex,follow",
}

export default function ShopCartPage() {
  return (
    <div className="container px-4 py-12 md:px-6">
      <div className="max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">DeviceHelp Shop</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 md:text-5xl">Cart</h1>
        <p className="mt-4 text-sm leading-7 text-gray-600">
          The local cart shell is prepared for product variant lines. Production checkout will connect to backend order
          reservations after the storefront pages are stable.
        </p>
      </div>
    </div>
  )
}
