// RemOnline API Client - Updated for new API version
class RemonlineClient {
  private baseUrl = "https://api.remonline.app"
  private apiKey: string | null = null
  private requestCount = 0
  private lastRequestTime = 0
  private readonly RATE_LIMIT = 3 // 3 requests per second
  private readonly RATE_LIMIT_WINDOW = 1000 // 1 second in milliseconds

  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.REMONLINE_API_KEY || process.env.REMONLINE_API_TOKEN || null

    if (!this.apiKey) {
      console.error("❌ RemOnline API key not found in environment variables")
      console.error("Expected: REMONLINE_API_KEY or REMONLINE_API_TOKEN")
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

  // Get the authorization headers for API requests
  private getAuthHeaders() {
    if (!this.apiKey) {
      throw new Error("API key is not configured")
    }

    return {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "DeviceHelp-API-Client/1.0",
    }
  }

  // Make authenticated request with rate limiting
  private async makeRequest(url: string, options: RequestInit = {}) {
    await this.enforceRateLimit()

    const fullUrl = url.startsWith("http") ? url : `${this.baseUrl}${url}`

    console.log(`🌐 Making ${options.method || "GET"} request to: ${fullUrl}`)

    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    }

    console.log(`📋 Request headers:`, {
      ...headers,
      Authorization: `Bearer ${this.apiKey?.substring(0, 8)}...${this.apiKey?.substring(this.apiKey.length - 4)}`,
    })

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      })

      console.log(`📨 Response status: ${response.status} ${response.statusText}`)
      console.log(`📨 Response headers:`, Object.fromEntries(response.headers.entries()))

      return response
    } catch (error) {
      console.error(`❌ Network error making request to ${fullUrl}:`, error)
      throw error
    }
  }

  // Test the API connection with a simple endpoint
  async testConnection() {
    try {
      console.log("🧪 Testing RemOnline API connection...")

      if (!this.apiKey) {
        return {
          success: false,
          message: "API key is not configured",
          details: "Environment variables REMONLINE_API_KEY or REMONLINE_API_TOKEN are not set",
        }
      }

      // Try different endpoints to test connection
      const testEndpoints = [
        { path: "/branches", name: "Branches" },
        { path: "/statuses/orders", name: "Order Statuses" },
        { path: "/clients", name: "Clients" },
      ]

      let lastError = null

      for (const endpoint of testEndpoints) {
        try {
          console.log(`🧪 Testing endpoint: ${endpoint.name} (${endpoint.path})`)

          const response = await this.makeRequest(endpoint.path)

          if (response.ok) {
            const data = await response.json()
            console.log(`✅ API test successful with ${endpoint.name} endpoint`)

            return {
              success: true,
              message: `API connection successful via ${endpoint.name} endpoint`,
              endpoint: endpoint.path,
              data,
            }
          } else {
            const errorText = await response.text()
            console.log(`⚠️ ${endpoint.name} endpoint failed with status ${response.status}:`, errorText)

            let errorDetails
            try {
              errorDetails = JSON.parse(errorText)
            } catch {
              errorDetails = errorText
            }

            lastError = {
              endpoint: endpoint.path,
              status: response.status,
              details: errorDetails,
            }
          }
        } catch (error) {
          console.log(`⚠️ ${endpoint.name} endpoint error:`, error)
          lastError = {
            endpoint: endpoint.path,
            error: error instanceof Error ? error.message : String(error),
          }
        }
      }

      // If we get here, all endpoints failed
      return {
        success: false,
        message: "All test endpoints failed",
        details: lastError,
      }
    } catch (error) {
      console.error("❌ RemOnline API test error:", error)
      return {
        success: false,
        message: "Failed to test API connection",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get branches (company locations)
  async getBranches() {
    try {
      console.log("🏢 Fetching branches...")

      const response = await this.makeRequest("/branches")

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch branches with status ${response.status}:`, errorText)

        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        return {
          success: false,
          message: `Failed to fetch branches with status ${response.status}`,
          details: errorDetails,
        }
      }

      const data = await response.json()
      console.log("✅ Branches fetched successfully:", data.data?.length || 0)

      return { success: true, data }
    } catch (error) {
      console.error("❌ RemOnline getBranches error:", error)
      return {
        success: false,
        message: "Failed to fetch branches from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get order statuses
  async getOrderStatuses() {
    try {
      console.log("📋 Fetching order statuses...")

      const response = await this.makeRequest("/statuses/orders")

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch order statuses with status ${response.status}:`, errorText)

        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        return {
          success: false,
          message: `Failed to fetch order statuses with status ${response.status}`,
          details: errorDetails,
        }
      }

      const data = await response.json()
      console.log("✅ Order statuses fetched successfully:", data.data?.length || 0)

      return { success: true, data }
    } catch (error) {
      console.error("❌ RemOnline getOrderStatuses error:", error)
      return {
        success: false,
        message: "Failed to fetch order statuses from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get clients with pagination and optional query parameters
  async getClients(
    params: {
      page?: number
      limit?: number
      query?: string
      email?: string
      phone?: string
      branch_ids?: number[]
    } = {},
  ) {
    try {
      console.log("👥 Fetching clients from RemOnline API...")

      // Build query string from params
      const queryParams = new URLSearchParams()

      // Set pagination - RemOnline uses offset-based pagination
      const page = params.page || 1
      const limit = Math.min(params.limit || 50, 100) // Max 100 per request
      const offset = (page - 1) * limit

      queryParams.append("limit", String(limit))
      queryParams.append("offset", String(offset))

      if (params.query) {
        queryParams.append("query", params.query)
      }

      if (params.email) {
        queryParams.append("email", params.email)
      }

      if (params.phone) {
        queryParams.append("phone", params.phone)
      }

      if (params.branch_ids && params.branch_ids.length > 0) {
        queryParams.append("branch_ids", params.branch_ids.join(","))
      }

      const url = `/clients?${queryParams.toString()}`
      console.log(`🔍 Query parameters: ${queryParams.toString()}`)

      const response = await this.makeRequest(url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch clients with status ${response.status}:`, errorText)

        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        return {
          success: false,
          message: `Failed to fetch clients with status ${response.status}`,
          details: errorDetails,
        }
      }

      const data = await response.json()
      console.log("✅ Clients response:", {
        hasData: !!data.data,
        dataLength: data.data?.length || 0,
        totalCount: data.count || 0,
        currentPage: page,
        limit,
        offset,
      })

      return { success: true, data }
    } catch (error) {
      console.error("❌ RemOnline getClients error:", error)
      return {
        success: false,
        message: "Failed to fetch clients from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get client by ID
  async getClientById(clientId: number) {
    try {
      console.log(`👤 Fetching client with ID: ${clientId}`)

      const response = await this.makeRequest(`/clients/${clientId}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch client details with status ${response.status}:`, errorText)

        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        return {
          success: false,
          message: `Failed to fetch client details with status ${response.status}`,
          details: errorDetails,
        }
      }

      const data = await response.json()
      console.log("✅ Client details fetched successfully")

      return { success: true, client: data }
    } catch (error) {
      console.error("❌ RemOnline getClientById error:", error)
      return {
        success: false,
        message: "Failed to fetch client details from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Find a client by email
  async getClientByEmail(email: string) {
    try {
      console.log(`📧 Looking for client with email: ${email}`)

      // Use the email parameter to search for the client
      const response = await this.getClients({ email })

      if (response.success && response.data.data) {
        // Find the client with the exact email match
        const client = response.data.data.find((c: any) => c.email && c.email.toLowerCase() === email.toLowerCase())

        console.log("🔍 Client found by email:", client ? "Found" : "Not found")

        return {
          success: true,
          exists: !!client,
          client: client || null,
        }
      }

      return {
        success: false,
        exists: false,
        message: "Failed to find client",
        details: response,
      }
    } catch (error) {
      console.error("❌ RemOnline getClientByEmail error:", error)
      return {
        success: false,
        exists: false,
        message: "Failed to find client by email",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Find a client by phone number
  async getClientByPhone(phone: string) {
    try {
      console.log(`📱 Looking for client with phone: ${phone}`)

      // Use the phone parameter to search for the client
      const response = await this.getClients({ phone })

      if (response.success && response.data.data) {
        // Normalize phone number by removing non-digit characters
        const normalizedPhone = phone.replace(/\D/g, "")

        // Find the client with a matching phone number
        const client = response.data.data.find((c: any) => {
          if (!c.phone || !Array.isArray(c.phone)) return false

          // Normalize stored phone numbers for comparison
          const clientPhones = c.phone.map((p: string) => p.replace(/\D/g, ""))
          return clientPhones.some((p) => p.includes(normalizedPhone) || normalizedPhone.includes(p))
        })

        console.log("🔍 Client found by phone:", client ? "Found" : "Not found")

        return {
          success: true,
          exists: !!client,
          client: client || null,
        }
      }

      return {
        success: false,
        exists: false,
        message: "Failed to find client",
        details: response,
      }
    } catch (error) {
      console.error("❌ RemOnline getClientByPhone error:", error)
      return {
        success: false,
        exists: false,
        message: "Failed to find client by phone",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Create a new client
  async createClient(clientData: {
    name: string
    email?: string
    phone?: string[]
    address?: string
    notes?: string
    discount?: number
    juridical?: boolean
    manager_id?: number
    custom_fields?: Record<string, any>
  }) {
    try {
      console.log("➕ Creating client with data:", {
        ...clientData,
        phone: clientData.phone?.length || 0,
      })

      // Prepare the data according to RemOnline API requirements
      const dataToSend = {
        name: clientData.name, // Required field
        email: clientData.email || "",
        phone: Array.isArray(clientData.phone) ? clientData.phone : clientData.phone ? [clientData.phone] : [],
        address: clientData.address || "",
        notes: clientData.notes || "",
        discount: clientData.discount || 0,
        juridical: clientData.juridical || false,
        manager_id: clientData.manager_id || null,
        custom_fields: clientData.custom_fields || {},
      }

      console.log("📤 Sending client data:", dataToSend)

      const response = await this.makeRequest("/clients", {
        method: "POST",
        body: JSON.stringify(dataToSend),
      })

      const responseText = await response.text()
      console.log("📨 Response text length:", responseText.length)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("❌ Failed to parse response as JSON:", responseText)
        return {
          success: false,
          message: `Failed to parse response: ${responseText}`,
          details: e instanceof Error ? e.message : String(e),
        }
      }

      if (!response.ok) {
        console.error(`❌ Failed to create client with status ${response.status}:`, data)
        return {
          success: false,
          message: `Failed to create client with status ${response.status}`,
          details: data,
        }
      }

      console.log("✅ Client created successfully")
      return { success: true, client: data }
    } catch (error) {
      console.error("❌ RemOnline createClient error:", error)
      return {
        success: false,
        message: "Failed to create client in RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get orders with pagination and optional filters
  async getOrders(
    params: {
      page?: number
      limit?: number
      client_id?: number
      status_id?: number
      branch_ids?: number[]
      created_from?: string
      created_to?: string
    } = {},
  ) {
    try {
      console.log("📋 Fetching orders from RemOnline API...")

      // Build query string from params
      const queryParams = new URLSearchParams()

      // Set pagination - RemOnline uses offset-based pagination
      const page = params.page || 1
      const limit = Math.min(params.limit || 50, 100) // Max 100 per request
      const offset = (page - 1) * limit

      queryParams.append("limit", String(limit))
      queryParams.append("offset", String(offset))

      if (params.client_id) {
        queryParams.append("client_id", String(params.client_id))
      }

      if (params.status_id) {
        queryParams.append("status_id", String(params.status_id))
      }

      if (params.branch_ids && params.branch_ids.length > 0) {
        queryParams.append("branch_ids", params.branch_ids.join(","))
      }

      if (params.created_from) {
        queryParams.append("created_from", params.created_from)
      }

      if (params.created_to) {
        queryParams.append("created_to", params.created_to)
      }

      const url = `/orders?${queryParams.toString()}`
      const response = await this.makeRequest(url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch orders with status ${response.status}:`, errorText)

        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        return {
          success: false,
          message: `Failed to fetch orders with status ${response.status}`,
          details: errorDetails,
        }
      }

      const data = await response.json()
      console.log("✅ Orders fetched successfully, count:", data.data?.length || 0)

      return { success: true, data }
    } catch (error) {
      console.error("❌ RemOnline getOrders error:", error)
      return {
        success: false,
        message: "Failed to fetch orders from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get order by ID
  async getOrderById(orderId: number) {
    try {
      console.log(`📋 Fetching order with ID: ${orderId}`)

      const response = await this.makeRequest(`/orders/${orderId}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch order with status ${response.status}:`, errorText)

        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        return {
          success: false,
          message: `Failed to fetch order with status ${response.status}`,
          details: errorDetails,
        }
      }

      const data = await response.json()
      console.log("✅ Order fetched successfully")

      return { success: true, order: data }
    } catch (error) {
      console.error("❌ RemOnline getOrderById error:", error)
      return {
        success: false,
        message: "Failed to fetch order from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get orders for a specific client
  async getOrdersByClientId(
    clientId: number,
    params: {
      page?: number
      limit?: number
      status_id?: number
      branch_ids?: number[]
    } = {},
  ) {
    try {
      console.log(`📋 Fetching orders for client ID: ${clientId}`)

      return await this.getOrders({
        ...params,
        client_id: clientId,
      })
    } catch (error) {
      console.error("❌ RemOnline getOrdersByClientId error:", error)
      return {
        success: false,
        message: "Failed to fetch orders from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Legacy auth method - kept for backward compatibility
  async auth() {
    console.log("🔄 Legacy auth method called - using Bearer token authentication")

    if (!this.apiKey) {
      return {
        success: false,
        message: "API key is not configured",
      }
    }

    return {
      success: true,
      token: this.apiKey,
      message: "Using Bearer token authentication",
    }
  }
}

// Create a singleton instance
console.log("🚀 Initializing RemOnline client with Bearer token authentication")
const remonline = new RemonlineClient()

export default remonline
