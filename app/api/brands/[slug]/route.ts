/**
 * DEPRECATED: This API route is no longer used.
 * Data is now rendered server-side on /[locale]/brands/[slug] page with ISR caching.
 * 
 * Data flow:
 * 1. Server Component fetches data and passes via initialData prop
 * 2. Client Component uses initialData directly (no additional fetch)
 * 3. ISR ensures page is cached for 1 hour on Vercel
 */

import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    error: "This API route is deprecated. Use server-side rendering instead.",
  }, { status: 410 })
}
