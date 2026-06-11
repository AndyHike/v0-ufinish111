// Receiver for CSP violation reports (the `report-uri` in next.config.mjs).
// Reports land in the server logs; once they run clean, the policy can be
// switched from Report-Only to enforcing via CSP_ENFORCE=1.

export const dynamic = "force-dynamic"

const MAX_REPORT_LENGTH = 4096

export async function POST(request: Request) {
  try {
    const body = (await request.text()).slice(0, MAX_REPORT_LENGTH)
    if (body) {
      console.warn(`[csp-report] ${body}`)
    }
  } catch {
    // A malformed or aborted report is not worth a 5xx.
  }
  return new Response(null, { status: 204 })
}
