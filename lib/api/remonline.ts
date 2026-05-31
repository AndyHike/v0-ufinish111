import rateLimitModule from "@/lib/api/remonline-rate-limit"

const { createRemonlineRateLimiter } = rateLimitModule

const LEGACY_BASE_URL = "https://api.remonline.app"
const RO_APP_BASE_URL = "https://api.roapp.io/v2"

// Environment variables
const REMONLINE_API_KEY = process.env.REMONLINE_API_KEY || process.env.REMONLINE_API_TOKEN

if (!REMONLINE_API_KEY) {
  console.error("❌ RemOnline API key not found in environment variables")
  console.error("Expected: REMONLINE_API_KEY or REMONLINE_API_TOKEN")
}

// Types
interface RemOnlineResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

interface AuthResponse {
  success: boolean
  message?: string
}

interface ClientResponse {
  success: boolean
  client?: any
  message?: string
}

interface OrderResponse {
  success: boolean
  order?: any
  message?: string
}

interface InvoiceResponse {
  success: boolean
  invoice?: any
  message?: string
}

interface OrdersResponse {
  success: boolean
  orders?: any[]
  message?: string
  total?: number
}

interface StatusesResponse {
  success: boolean
  statuses?: any[]
  message?: string
}

interface ServicesResponse {
  success: boolean
  services?: any[]
  message?: string
  total?: number
  page?: number
}

interface RemOnlineService {
  id: number
  title: string
  is_labor: boolean
  uom: {
    id: number
    description: string
    title: string
  }
  category: {
    id: number
    title: string
    parent_id?: number
  }
  cost: number
  duration_hours: number
  barcodes: Array<{
    id: number
    code: string
    type: string
  }>
  description: string
  warranty: number
  warranty_period: number
  prices: Record<string, number>
}

interface RemonlineRateLimiter {
  waitForSlot(): Promise<void>
}

type RemonlineContactType = "person" | "organization"

type RemonlineContactResult = {
  success: boolean
  contactType?: RemonlineContactType
  id?: number
  data?: any
  message?: string
  details?: any
}

class RemonlineClient {
  private apiKey: string
  private baseUrl: string
  private roAppBaseUrl: string
  private limiter: RemonlineRateLimiter
  private requestCount = 0
  private lastRequestTime = 0
  private readonly RATE_LIMIT = 3 // 3 requests per second
  private readonly RATE_LIMIT_WINDOW = 1000 // 1 second in milliseconds

  constructor() {
    this.apiKey = process.env.REMONLINE_API_KEY || process.env.REMONLINE_API_TOKEN || ""
    this.baseUrl = LEGACY_BASE_URL
    this.roAppBaseUrl = RO_APP_BASE_URL
    this.limiter = createRemonlineRateLimiter()

    if (!this.apiKey) {
      console.error("❌ RemOnline API key not found in environment variables")
      console.error("Expected: REMONLINE_API_KEY or REMONLINE_API_TOKEN")
    } else {
      console.log("RemOnline API client initialized")
    }
  }

  // Rate limiting helper
  private async enforceRateLimit() {
    const now = Date.now()

    // Reset counter if more than 1 second has passed
    if (now - this.lastRequestTime >= this.RATE_LIMIT_WINDOW) {
      this.requestCount = 0
      this.lastRequestTime = now
    }

    // If we've hit the rate limit, wait
    if (this.requestCount >= this.RATE_LIMIT) {
      const waitTime = this.RATE_LIMIT_WINDOW - (now - this.lastRequestTime)
      if (waitTime > 0) {
        console.log(`⏳ Rate limit reached, waiting ${waitTime}ms...`)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
        this.requestCount = 0
        this.lastRequestTime = Date.now()
      }
    }

    this.requestCount++
    console.log(`📊 Request count: ${this.requestCount}/${this.RATE_LIMIT}`)
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    await this.enforceRateLimit()

    const url = `${this.baseUrl}${endpoint}`

    const defaultHeaders = {
      accept: "application/json",
      authorization: `Bearer ${this.apiKey}`,
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    console.log(`🌐 Making request to: ${url}`)
    console.log(`📋 Request method: ${config.method || "GET"}`)

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      console.log(`📨 Response status: ${response.status}`)

      if (!response.ok) {
        console.error(`❌ Request failed:`, data)
        return {
          success: false,
          message: `Request failed with status ${response.status}`,
          details: data,
        }
      }

      console.log(`✅ Request successful, data keys:`, Object.keys(data))
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error(`❌ Request failed:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async parseRoAppResponse(response: Response): Promise<any> {
    const text = await response.text()

    if (!text) {
      return null
    }

    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  }

  private getRetryDelay(response: Response, retryNumber: number): number {
    const retryAfter = response.headers.get("retry-after")

    if (retryAfter) {
      const retryAfterSeconds = Number(retryAfter)

      if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
        return retryAfterSeconds * 1000
      }

      const retryAfterDate = Date.parse(retryAfter)

      if (Number.isFinite(retryAfterDate)) {
        return Math.max(retryAfterDate - Date.now(), 0)
      }
    }

    return 1000 * retryNumber
  }

  private getRoAppErrorMessage(details: any, fallback: string): string {
    if (details && typeof details === "object") {
      if (typeof details.message === "string") return details.message
      if (typeof details.error === "string") return details.error
      if (typeof details.detail === "string") return details.detail
    }

    if (typeof details === "string") {
      return details
    }

    return fallback
  }

  private getFirstListItem(data: any): any | null {
    if (Array.isArray(data)) return data[0] ?? null
    if (Array.isArray(data?.data)) return data.data[0] ?? null
    if (Array.isArray(data?.items)) return data.items[0] ?? null
    if (Array.isArray(data?.results)) return data.results[0] ?? null

    return null
  }

  private async makeRoAppRequest(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
  ): Promise<{ success: boolean; data?: any; message?: string; details?: any }> {
    await this.limiter.waitForSlot()

    const headers = new Headers({
      accept: "application/json",
      authorization: `Bearer ${this.apiKey}`,
    })

    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => headers.set(key, value))
    }

    if (options.body != null && !headers.has("content-type")) {
      headers.set("content-type", "application/json")
    }

    const response = await fetch(`${this.roAppBaseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 429 && retryCount < 2) {
      const delay = this.getRetryDelay(response, retryCount + 1)

      if (delay > 0) {
        await this.sleep(delay)
      }

      return this.makeRoAppRequest(endpoint, options, retryCount + 1)
    }

    const details = await this.parseRoAppResponse(response)

    if (!response.ok) {
      const fallbackMessage = `RO App request failed with status ${response.status}`

      return {
        success: false,
        message: this.getRoAppErrorMessage(details, fallbackMessage),
        details,
      }
    }

    return {
      success: true,
      data: details,
    }
  }

  private getContactId(data: any, fallbackId?: number): number | undefined {
    const rawId = data?.id ?? data?.data?.id ?? fallbackId

    if (typeof rawId === "number") {
      return rawId
    }

    if (typeof rawId === "string") {
      const parsedId = Number(rawId)
      return Number.isFinite(parsedId) ? parsedId : undefined
    }

    return undefined
  }

  private buildContactResult(
    contactType: RemonlineContactType,
    result: { success: boolean; data?: any; message?: string; details?: any },
    fallbackId?: number,
  ): RemonlineContactResult {
    if (!result.success) {
      return {
        success: false,
        message: result.message,
        details: result.details,
      }
    }

    return {
      success: true,
      contactType,
      id: this.getContactId(result.data, fallbackId),
      data: result.data,
    }
  }

  private async sendContactRequest(
    contactType: RemonlineContactType,
    endpoint: string,
    method: "POST" | "PATCH",
    body: any,
    fallbackId?: number,
  ): Promise<RemonlineContactResult> {
    const result = await this.makeRoAppRequest(endpoint, {
      method,
      body: JSON.stringify(body ?? {}),
    })

    return this.buildContactResult(contactType, result, fallbackId)
  }

  async createPerson(body: any): Promise<RemonlineContactResult> {
    return this.sendContactRequest("person", "/contacts/people", "POST", body)
  }

  async createOrganization(body: any): Promise<RemonlineContactResult> {
    return this.sendContactRequest("organization", "/contacts/organizations", "POST", body)
  }

  async updatePerson(id: number, body: any): Promise<RemonlineContactResult> {
    return this.sendContactRequest("person", `/contacts/people/${encodeURIComponent(String(id))}`, "PATCH", body, id)
  }

  async updateOrganization(id: number, body: any): Promise<RemonlineContactResult> {
    return this.sendContactRequest(
      "organization",
      `/contacts/organizations/${encodeURIComponent(String(id))}`,
      "PATCH",
      body,
      id,
    )
  }

  async auth(): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.makeRequest("/orders")

      if (result.success) {
        return {
          success: true,
          message: "Authentication successful",
        }
      }

      return {
        success: false,
        message: result.message || "Authentication failed",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Authentication failed",
      }
    }
  }

  async getServices(
    page = 1,
    categoryIds?: number[],
  ): Promise<{
    success: boolean
    services?: RemOnlineService[]
    message?: string
    total?: number
    page?: number
  }> {
    try {
      let endpoint = `/services/?page=${page}`

      // Add category filter if provided
      if (categoryIds && categoryIds.length > 0) {
        const categoryParams = categoryIds.map((id) => `categories[]=${id}`).join("&")
        endpoint += `&${categoryParams}`
      }

      console.log(`📋 Fetching services from: ${endpoint}`)
      const result = await this.makeRequest(endpoint)

      if (result.success) {
        const { data, page: currentPage, count, success } = result.data

        console.log(`📋 Found ${data?.length || 0} services on page ${currentPage}`)
        console.log(`📋 Total services: ${count}`)

        return {
          success: true,
          services: data || [],
          total: count || 0,
          page: currentPage || 1,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to fetch services",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch services",
      }
    }
  }

  async getAllServices(categoryIds?: number[]): Promise<{
    success: boolean
    services?: RemOnlineService[]
    message?: string
    total?: number
  }> {
    try {
      console.log(`🔄 Starting to fetch all services...`)

      // Get first page to determine total count
      const firstPageResult = await this.getServices(1, categoryIds)

      if (!firstPageResult.success) {
        return {
          success: false,
          message: firstPageResult.message || "Failed to fetch first page",
        }
      }

      const totalServices = firstPageResult.total || 0
      const totalPages = Math.ceil(totalServices / 50)
      let allServices: RemOnlineService[] = firstPageResult.services || []

      console.log(`📊 Total services: ${totalServices}, Total pages: ${totalPages}`)

      // Fetch remaining pages
      for (let page = 2; page <= totalPages; page++) {
        console.log(`📄 Fetching page ${page}/${totalPages}...`)

        const pageResult = await this.getServices(page, categoryIds)

        if (pageResult.success && pageResult.services) {
          allServices = [...allServices, ...pageResult.services]
        } else {
          console.warn(`⚠️ Failed to fetch page ${page}: ${pageResult.message}`)
        }
      }

      console.log(`✅ Successfully fetched ${allServices.length} services`)

      return {
        success: true,
        services: allServices,
        total: allServices.length,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch all services",
      }
    }
  }

  async getOrders(
    page = 1,
    limit = 50,
  ): Promise<{
    success: boolean
    orders?: any[]
    message?: string
    total?: number
  }> {
    try {
      const result = await this.makeRequest(`/orders?page=${page}&limit=${limit}`)

      if (result.success) {
        return {
          success: true,
          orders: result.data.data || result.data,
          total: result.data.total || result.data.length,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to fetch orders",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch orders",
      }
    }
  }

  async getOrdersByClientId(
    clientId: number,
    page = 1,
    limit = 50,
  ): Promise<{
    success: boolean
    orders?: any[]
    message?: string
    total?: number
  }> {
    try {
      console.log(`📋 Fetching orders for client ID: ${clientId}`)
      const result = await this.makeRequest(`/orders?client_id=${clientId}&page=${page}&limit=${limit}`)

      if (result.success) {
        const orders = result.data.data || result.data
        console.log(`📋 Found ${orders.length} orders for client ${clientId}`)

        // Log first order structure for debugging
        if (orders.length > 0) {
          console.log("📋 Sample order structure:", JSON.stringify(orders[0], null, 2))
        }

        return {
          success: true,
          orders: orders,
          total: result.data.total || orders.length,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to fetch orders",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch orders",
      }
    }
  }

  async getOrderById(orderId: number): Promise<{
    success: boolean
    order?: any
    message?: string
  }> {
    try {
      console.log(`📋 Fetching order details for ID: ${orderId}`)
      const result = await this.makeRequest(`/orders/${orderId}`)

      if (result.success) {
        console.log("📋 Order details:", JSON.stringify(result.data, null, 2))
        return {
          success: true,
          order: result.data,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to fetch order",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch order",
      }
    }
  }

  async getOrderItems(orderId: number): Promise<{
    success: boolean
    items?: any[]
    message?: string
  }> {
    try {
      console.log(`📋 Fetching order items for order ID: ${orderId}`)
      const result = await this.makeRequest(`/orders/${orderId}/items`)

      if (result.success) {
        const items = Array.isArray(result.data) ? result.data : result.data.items || []
        console.log(`📋 Found ${items.length} items for order ${orderId}`)
        console.log("📋 Sample item structure:", JSON.stringify(items[0] || {}, null, 2))

        return {
          success: true,
          items: items,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to fetch order items",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch order items",
      }
    }
  }

  async getInvoiceById(invoiceId: number): Promise<InvoiceResponse> {
    try {
      const searchParams = new URLSearchParams({
        ids: String(invoiceId),
      })
      const result = await this.makeRoAppRequest(`/invoices?${searchParams.toString()}`)

      if (result.success) {
        const invoice = this.getFirstListItem(result.data)

        if (!invoice) {
          return {
            success: false,
            message: "Invoice not found",
          }
        }

        return {
          success: true,
          invoice,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to fetch invoice",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch invoice",
      }
    }
  }

  async getClients(
    pageOrParams: number | { page?: number; limit?: number; query?: string; email?: string; phone?: string } = 1,
    limit = 50,
  ): Promise<{
    success: boolean
    clients?: any[]
    message?: string
    total?: number
  }> {
    try {
      const params =
        typeof pageOrParams === "number"
          ? { page: pageOrParams, limit }
          : {
              page: pageOrParams.page ?? 1,
              limit: pageOrParams.limit ?? limit,
              query: pageOrParams.query,
              email: pageOrParams.email,
              phone: pageOrParams.phone,
            }

      const searchParams = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
      })

      if (params.query) searchParams.set("query", params.query)
      if (params.email) searchParams.set("email", params.email)
      if (params.phone) searchParams.set("phone", params.phone)

      const result = await this.makeRequest(`/clients/?${searchParams.toString()}`)

      if (result.success) {
        return {
          success: true,
          clients: result.data.data || result.data,
          total: result.data.total || result.data.length,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to fetch clients",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch clients",
      }
    }
  }

  async getClientById(clientId: number): Promise<{
    success: boolean
    client?: any
    message?: string
  }> {
    try {
      const result = await this.makeRequest(`/clients/${clientId}`)

      if (result.success) {
        return {
          success: true,
          client: result.data,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to fetch client",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch client",
      }
    }
  }

  async getClientByEmail(email: string): Promise<{
    success: boolean
    exists: boolean
    client?: any
    message?: string
  }> {
    try {
      const result = await this.makeRequest(`/clients/?email=${encodeURIComponent(email)}`)

      if (result.success) {
        const clients = result.data.data || result.data
        const client = Array.isArray(clients) ? clients.find((c: any) => c.email === email) : null

        return {
          success: true,
          exists: !!client,
          client: client || null,
        }
      }

      return {
        success: false,
        exists: false,
        message: result.message || "Failed to search client",
      }
    } catch (error) {
      return {
        success: false,
        exists: false,
        message: error instanceof Error ? error.message : "Failed to search client",
      }
    }
  }

  async getClientByPhone(phone: string): Promise<{
    success: boolean
    exists: boolean
    client?: any
    message?: string
  }> {
    try {
      const result = await this.makeRequest(`/clients/?phone=${encodeURIComponent(phone)}`)

      if (result.success) {
        const clients = result.data.data || result.data
        const client = Array.isArray(clients)
          ? clients.find((c: any) => Array.isArray(c.phone) ? c.phone.includes(phone) : c.phone === phone)
          : null

        return {
          success: true,
          exists: !!client,
          client: client || null,
        }
      }

      return {
        success: false,
        exists: false,
        message: result.message || "Failed to search client",
      }
    } catch (error) {
      return {
        success: false,
        exists: false,
        message: error instanceof Error ? error.message : "Failed to search client",
      }
    }
  }

  async createClient(clientData: {
    first_name: string
    last_name: string
    email: string
    phone?: string[]
    address?: string
  }): Promise<{
    success: boolean
    client?: any
    message?: string
  }> {
    try {
      const body: {
        first_name: string
        last_name: string
        email: string
        address: string
        phone?: string
      } = {
        first_name: clientData.first_name,
        last_name: clientData.last_name,
        email: clientData.email,
        address: clientData.address || "",
      }

      // Add phone if provided
      if (clientData.phone && clientData.phone.length > 0) {
        body.phone = clientData.phone[0]
      }

      const result = await this.makeRequest("/clients/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      })

      if (result.success) {
        return {
          success: true,
          client: result.data,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to create client",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create client",
      }
    }
  }

  async getOrderStatuses(): Promise<{
    success: boolean
    statuses?: any[]
    message?: string
  }> {
    try {
      const result = await this.makeRequest("/statuses/orders")

      if (result.success) {
        const statuses = result.data.data || result.data
        console.log("📋 Order statuses:", JSON.stringify(statuses, null, 2))

        return {
          success: true,
          statuses: statuses,
        }
      }

      return {
        success: false,
        message: result.message || "Failed to fetch order statuses",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch order statuses",
      }
    }
  }

  async testConnection(): Promise<{
    success: boolean
    message?: string
    workingEndpoint?: string
  }> {
    const endpoints = ["/orders", "/clients/", "/statuses/orders", "/services/"]

    for (const endpoint of endpoints) {
      try {
        const result = await this.makeRequest(endpoint)
        if (result.success) {
          return {
            success: true,
            message: `API connection successful via ${endpoint} endpoint`,
            workingEndpoint: endpoint,
          }
        }
      } catch (error) {
        continue
      }
    }

    return {
      success: false,
      message: "Failed to connect to RemOnline API",
    }
  }
}

// Create a singleton instance
console.log("🚀 Initializing RemOnline client with Bearer token authentication")
const remonline = new RemonlineClient()

export default remonline
