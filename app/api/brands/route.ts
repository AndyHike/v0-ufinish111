/**
 * DEPRECATED: This API route is no longer used.
 * Data is now rendered server-side on /[locale]/brands page with ISR caching.
 * 
 * Remove this file if no other parts of the app depend on it.
 */

import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    error: "This API route is deprecated. Use server-side rendering instead.",
  }, { status: 410 })
}
