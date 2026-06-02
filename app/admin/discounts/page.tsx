import { redirect } from "next/navigation"

const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "uk"

export default function DiscountsPage() {
  redirect(`/${DEFAULT_LOCALE}/admin/discounts`)
}
