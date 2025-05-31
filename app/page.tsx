import { redirect } from "next/navigation"

export default function Home() {
  // Hardcode the default locale to avoid importing from i18n.js
  redirect("/uk")
}
