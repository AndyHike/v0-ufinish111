// RemOnline API Client - Updated for new API version
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
    console.log(`📋 Request config:`, config)

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      console.log(`📨 Response status: ${response.status}`)
      console.log(`📨 Response data:`, data)

      if (!response.ok) {
        return {
          success: false,
          message: `Request failed with status ${response.status}`,
          details: data,
        }
      }

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
      const result = await this.makeRequest(`/orders?client_id=${clientId}&page=${page}&limit=${limit}`)

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
        return {
          success: true,
          statuses: result.data.data || result.data,
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
    const endpoints = ["/orders", "/clients/", "/statuses/orders"]

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
