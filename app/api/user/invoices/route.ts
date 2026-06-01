import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

function toAmount(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const supabase = createClient()

    const { data: invoices, error } = await supabase
      .from("user_invoices")
      .select(
        `
        id,
        remonline_invoice_id,
        invoice_number,
        status_id,
        status_name,
        status_group,
        issue_date,
        due_date,
        payment_method,
        client_name,
        payer_name,
        manager_name,
        total_amount,
        paid_amount,
        balance_amount,
        currency,
        updated_at
      `,
      )
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("issue_date", { ascending: false, nullsFirst: false })

    if (error) {
      return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoices: (invoices || []).map((invoice) => ({
        id: invoice.id,
        remonlineInvoiceId: invoice.remonline_invoice_id,
        number: invoice.invoice_number,
        statusId: invoice.status_id,
        statusName: invoice.status_name,
        statusGroup: invoice.status_group,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        paymentMethod: invoice.payment_method,
        clientName: invoice.client_name,
        payerName: invoice.payer_name,
        managerName: invoice.manager_name,
        totalAmount: toAmount(invoice.total_amount),
        paidAmount: toAmount(invoice.paid_amount),
        balanceAmount: toAmount(invoice.balance_amount),
        currency: invoice.currency,
        updatedAt: invoice.updated_at,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
