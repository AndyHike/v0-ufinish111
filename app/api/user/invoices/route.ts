import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { getSession } from "@/lib/auth/session"

function toAmount(value: unknown): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function mapLinkedOrder(order: any, remonlineOrderId: number) {
  if (!order) {
    return {
      id: null,
      remonlineOrderId,
      documentId: null,
      creationDate: null,
      deviceName: null,
      deviceBrand: null,
      deviceModel: null,
      totalAmount: 0,
      overallStatus: null,
      overallStatusName: null,
      overallStatusColor: null,
    }
  }

  return {
    id: order.id,
    remonlineOrderId: order.remonline_order_id,
    documentId: order.document_id,
    creationDate: order.creation_date,
    deviceName: order.device_name,
    deviceBrand: order.device_brand,
    deviceModel: order.device_model,
    totalAmount: toAmount(order.total_amount),
    overallStatus: order.overall_status,
    overallStatusName: order.overall_status_name,
    overallStatusColor: order.overall_status_color,
  }
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

    const invoiceIds = (invoices || []).map((invoice) => invoice.id)
    const ordersByInvoiceId = new Map<string, any[]>()

    if (invoiceIds.length > 0) {
      const { data: invoiceOrderLinks, error: invoiceOrderLinksError } = await supabase
        .from("user_invoice_orders")
        .select("invoice_id, order_id, remonline_order_id")
        .eq("user_id", userId)
        .in("invoice_id", invoiceIds)

      if (invoiceOrderLinksError) {
        return NextResponse.json({ success: false, error: "Failed to fetch invoice order links" }, { status: 500 })
      }

      const orderIds = Array.from(
        new Set((invoiceOrderLinks || []).map((link) => link.order_id).filter(Boolean)),
      )
      const ordersById = new Map<string, any>()

      if (orderIds.length > 0) {
        const { data: linkedOrders, error: linkedOrdersError } = await supabase
          .from("user_repair_orders")
          .select(
            `
            id,
            remonline_order_id,
            document_id,
            creation_date,
            device_name,
            device_brand,
            device_model,
            total_amount,
            overall_status,
            overall_status_name,
            overall_status_color
          `,
          )
          .eq("user_id", userId)
          .in("id", orderIds)

        if (linkedOrdersError) {
          return NextResponse.json({ success: false, error: "Failed to fetch linked orders" }, { status: 500 })
        }

        for (const order of linkedOrders || []) {
          ordersById.set(order.id, order)
        }
      }

      for (const link of invoiceOrderLinks || []) {
        const invoiceOrders = ordersByInvoiceId.get(link.invoice_id) || []
        invoiceOrders.push(mapLinkedOrder(ordersById.get(link.order_id), Number(link.remonline_order_id)))
        ordersByInvoiceId.set(link.invoice_id, invoiceOrders)
      }
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
        orders: ordersByInvoiceId.get(invoice.id) || [],
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
