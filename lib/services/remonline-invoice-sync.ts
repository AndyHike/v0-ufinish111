import remonline from "@/lib/api/remonline"
import { createClient } from "@/lib/supabase"
import { InvoiceService } from "@/app/api/webhooks/remonline/services/invoice-service"

type SyncInvoiceResult = {
  success: boolean
  message?: string
  invoice?: any
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error || "Failed to sync invoice")
}

export async function syncInvoiceFromRemonline(remonlineInvoiceId: number): Promise<SyncInvoiceResult> {
  try {
    const result = await remonline.getInvoiceById(remonlineInvoiceId)

    if (!result.success || !result.invoice) {
      return {
        success: false,
        message: result.message || "Failed to fetch invoice from RemOnline",
      }
    }

    const supabase = createClient()
    const invoiceService = new InvoiceService(supabase)
    const invoice = await invoiceService.upsertInvoiceFromPayload({ invoice: result.invoice }, { source: "manual" })

    return {
      success: true,
      invoice,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
}
