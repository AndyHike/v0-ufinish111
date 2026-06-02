import { readFile, stat } from "node:fs/promises"
import assert from "node:assert/strict"
import test from "node:test"

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
}

async function pathExists(path) {
  try {
    await stat(new URL(path, import.meta.url))
    return true
  } catch (error) {
    if (error?.code === "ENOENT") return false
    throw error
  }
}

test("profile exposes a dedicated invoices tab", async () => {
  const content = await read("../app/[locale]/profile/profile-content.tsx")

  assert.match(content, /UserInvoices/)
  assert.match(content, /TabsTrigger value=["']invoices["']/)
  assert.match(content, /TabsContent value=["']invoices["']/)
  assert.match(content, /<UserInvoices \/>/)
  assert.match(content, /sm:grid-cols-4/)
})

test("user invoices component is mobile-first and reads the local invoice API", async () => {
  const componentPath = "../components/profile/user-invoices.tsx"
  assert.equal(await pathExists(componentPath), true)

  const component = await read(componentPath)

  assert.match(component, /useTranslations\(["']invoices["']\)/)
  assert.match(component, /fetch\(["']\/api\/user\/invoices["']\)/)
  assert.match(component, /interface Invoice/)
  assert.match(component, /interface InvoiceOrder/)
  assert.match(component, /expandedInvoices/)
  assert.match(component, /InvoiceStatusBadge/)
  assert.match(component, /InvoiceAmountSummary/)
  assert.match(component, /LinkedRepairOrders/)
  assert.match(component, /noInvoices/)
  assert.match(component, /loading/)
  assert.match(component, /tryAgain/)
  assert.match(component, /sm:/)
  assert.doesNotMatch(component, /h-screen/)
  assert.doesNotMatch(component, /overflow-hidden[^"\n]*fixed/)
})

test("invoice profile UI has translations for all supported locales", async () => {
  for (const locale of ["uk", "cs", "en"]) {
    const messages = JSON.parse(await read(`../messages/${locale}.json`))
    const invoices = messages.invoices

    assert.ok(invoices, `${locale} invoices namespace is missing`)
    assert.equal(typeof invoices.title, "string")
    assert.equal(typeof invoices.description, "string")
    assert.equal(typeof invoices.noInvoices, "string")
    assert.equal(typeof invoices.noInvoicesDescription, "string")
    assert.equal(typeof invoices.linkedOrders, "string")
    assert.equal(typeof invoices.total, "string")
    assert.equal(typeof invoices.paid, "string")
    assert.equal(typeof invoices.balance, "string")
    assert.equal(typeof invoices.viewDetails, "string")
    assert.equal(typeof invoices.hideDetails, "string")
  }
})

test("user repair orders endpoint returns locally linked invoices without RO App calls", async () => {
  const route = await read("../app/api/user/repair-orders/route.ts")

  assert.match(route, /\.from\(["']user_repair_orders["']\)/)
  assert.match(route, /\.from\(["']user_repair_order_services["']\)/)
  assert.match(route, /\.from\(["']user_invoice_orders["']\)/)
  assert.match(route, /\.from\(["']user_invoices["']\)/)
  assert.match(route, /invoicesByOrderId/)
  assert.match(route, /invoices:\s*invoicesByOrderId\.get\(order\.id\) \|\| \[\]/)
  assert.doesNotMatch(route, /getInvoiceById|getOrderById|getOrderItems/)
})

test("user orders component is compact, mobile-first, and renders linked invoices", async () => {
  const component = await read("../components/profile/user-orders.tsx")

  assert.match(component, /interface OrderInvoice/)
  assert.match(component, /invoices: OrderInvoice\[\]/)
  assert.match(component, /LinkedOrderInvoices/)
  assert.match(component, /invoiceCount/)
  assert.match(component, /rounded-lg border bg-background/)
  assert.match(component, /sm:grid-cols-\[minmax\(0,1fr\)_auto\]/)
})

test("order profile UI has complete translations for all supported locales", async () => {
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
      "price",
      "invoiceCount",
      "linkedInvoices",
      "noLinkedInvoices",
      "paid",
      "balance",
      "updated",
    ]) {
      assert.equal(typeof orders?.[key], "string", `${locale}.orders.${key} is missing`)
    }
  }
})
