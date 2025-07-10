// Environment variables
const REMONLINE_API_KEY = process.env.REMONLINE_API_KEY

if (!REMONLINE_API_KEY) {
  console.error("❌ RemOnline API key not found in environment variables")
  console.error("Expected: REMONLINE_API_KEY")
}

// Base URL for RemOnline API
const BASE_URL = "https://api.remonline.app"

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

class RemonlineClient {
  private apiKey: string
  private baseUrl: string
  private requestCount = 0
  private lastRequestTime = 0
  private readonly RATE_LIMIT = 3 // 3 requests per second
  private readonly RATE_LIMIT_WINDOW = 1000 // 1 second in milliseconds

  constructor() {
    this.apiKey = process.env.REMONLINE_API_KEY || ""
    this.baseUrl = "https://api.remonline.app"

    if (!this.apiKey) {
      console.error("❌ RemOnline API key not found in environment variables")
      console.error("Expected: REMONLINE_API_KEY")
    } else {
      console.log("✅ RemOnline API client initialized")
      console.log(`🔑 API key length: ${this.apiKey.length}`)
      console.log(
        `🔑 API key preview: ${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`,
      )
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

  async getClients(
    page = 1,
    limit = 50,
  ): Promise<{
    success: boolean
    clients?: any[]
    message?: string
    total?: number
  }> {
    try {
      const result = await this.makeRequest(`/clients/?page=${page}&limit=${limit}`)

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
      const body = {
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
