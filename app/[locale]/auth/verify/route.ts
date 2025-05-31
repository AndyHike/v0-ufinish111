import { type NextRequest, NextResponse } from "next/server"
import { verifyEmailToken } from "@/lib/auth/token"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get("token")
  const locale = request.nextUrl.pathname.split("/")[1] || "en"

  if (!token) {
    return NextResponse.redirect(new URL(`/${locale}/auth/verification-error?error=missing_token`, request.url))
  }

  const verified = await verifyEmailToken(token)

  if (!verified) {
    return NextResponse.redirect(new URL(`/${locale}/auth/verification-error?error=invalid_token`, request.url))
  }

  return NextResponse.redirect(new URL(`/${locale}/auth/signin?verified=true`, request.url))
}
