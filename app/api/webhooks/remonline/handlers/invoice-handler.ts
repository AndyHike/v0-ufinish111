import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { InvoiceService } from "../services/invoice-service"

function invoiceWebhookIgnoredResponse(error: string, details?: string) {
  return NextResponse.json(
    {
      success: false,
      ignored: true,
      error,
      details,
    },
    { status: 200 },
  )
}

function getRemonlineInvoiceId(webhookData: any): number | null {
  const rawId = webhookData?.metadata?.invoice?.id ?? webhookData?.context?.object_id
  const id = Number(rawId)
  return Number.isFinite(id) ? id : null
}

export async function handleInvoiceEvents(webhookData: any) {
  try {
    const eventType = webhookData.event_name
    const supabase = createClient()
    const invoiceService = new InvoiceService(supabase)

    switch (eventType) {
      case "Invoice.Created":
      case "Invoice.Updated": {
        const invoice = await invoiceService.upsertInvoiceFromPayload(webhookData, { source: "webhook" })
        return NextResponse.json({ success: true, message: "Invoice synced from webhook payload", invoice })
      }

      case "Invoice.Deleted": {
        const invoiceId = getRemonlineInvoiceId(webhookData)

        if (!invoiceId) {
          return invoiceWebhookIgnoredResponse("No invoice ID found")
        }

        const invoice = await invoiceService.markInvoiceDeleted(invoiceId)
        return NextResponse.json({ success: true, message: "Invoice marked as deleted", invoice })
      }

      default:
        return NextResponse.json({ success: true, message: "Invoice event received but no action taken" })
    }
  } catch (error) {
    return invoiceWebhookIgnoredResponse(
      "Failed to process invoice event",
      error instanceof Error ? error.message : String(error),
    )
  }
}
