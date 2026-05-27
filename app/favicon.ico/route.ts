import { NextResponse } from "next/server"

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/icon-light-32x32.png", request.url), 307)
}
