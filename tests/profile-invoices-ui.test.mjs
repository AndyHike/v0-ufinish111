import { readFile } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

test("profile hides the invoices tab while invoice work stays in development", async () => {
  const content = await read("../app/[locale]/profile/profile-content.tsx")

  assert.doesNotMatch(content, /UserInvoices/)
  assert.doesNotMatch(content, /TabsTrigger value=["']invoices["']/)
  assert.doesNotMatch(content, /TabsContent value=["']invoices["']/)
  assert.doesNotMatch(content, /<UserInvoices \/>/)
  assert.match(content, /sm:grid-cols-3/)
})

test("user repair orders endpoint returns repair orders and services without invoice joins", async () => {
  const route = await read("../app/api/user/repair-orders/route.ts")

  assert.match(route, /\.from\(["']user_repair_orders["']\)/)
  assert.match(route, /\.from\(["']user_repair_order_services["']\)/)
  assert.doesNotMatch(route, /\.from\(["']user_invoice_orders["']\)/)
  assert.doesNotMatch(route, /\.from\(["']user_invoices["']\)/)
  assert.doesNotMatch(route, /mapLinkedInvoice/)
  assert.doesNotMatch(route, /invoicesByOrderId/)
  assert.doesNotMatch(route, /invoices:\s*/)
  assert.doesNotMatch(route, /getInvoiceById|getOrderById|getOrderItems/)
})

test("user orders component is compact, mobile-first, and renders repair details without invoices", async () => {
  const component = await read("../components/profile/user-orders.tsx")

  assert.doesNotMatch(component, /interface OrderInvoice/)
  assert.doesNotMatch(component, /invoices: OrderInvoice\[\]/)
  assert.doesNotMatch(component, /LinkedOrderInvoices/)
  assert.doesNotMatch(component, /invoiceCount/)
  assert.doesNotMatch(component, /linkedInvoices/)
  assert.doesNotMatch(component, /noLinkedInvoices/)
  assert.doesNotMatch(component, /ReceiptText/)
  assert.doesNotMatch(component, /order\.invoices/)
  assert.match(component, /rounded-lg border bg-background/)
  assert.match(component, /sm:grid-cols-\[minmax\(0,1fr\)_auto\]/)
  assert.match(component, /OrderServices/)
  assert.match(component, /deviceSerialNumber/)
})

test("repair order profile UI has complete translations for all supported locales", async () => {
  for (const locale of ["uk", "cs", "en"]) {
    const messages = JSON.parse(await read(`../messages/${locale}.json`))
    const orders = messages.orders

    for (const key of [
      "loading",
      "fetchError",
      "errorTitle",
      "tryAgain",
      "filterByStatus",
      "dateNotSpecified",
      "noWarranty",
      "notSpecified",
      "unknownDevice",
      "unknownService",
      "services",
      "warranty",
      "price",
      "totalAmount",
      "searchPlaceholder",
      "allStatuses",
      "totalOrders",
      "serialNumber",
    ]) {
      assert.equal(typeof orders?.[key], "string", `${locale}.orders.${key} is missing`)
    }
  }
})
