import { redirect } from "next/navigation"

export default function AuthLoginPage({ params }: { params: { locale: string } }) {
  // Redirect to the main login page
  redirect(`/${params.locale}/login`)
}
