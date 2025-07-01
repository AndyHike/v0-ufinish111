// RemOnline API Client - Updated for new Bearer token authentication
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

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    console.log(`📨 Response status: ${response.status} ${response.statusText}`)
    console.log(`📨 Response headers:`, Object.fromEntries(response.headers.entries()))

    return response
  }

  // Test the API connection
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

      // Try to fetch order statuses as a simple test
      const response = await this.makeRequest("/statuses/orders")

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API test failed with status ${response.status}:`, errorText)

        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        return {
          success: false,
          message: `API test failed with status ${response.status}`,
          details: errorDetails,
        }
      }

      const data = await response.json()
      console.log("✅ API test successful, received order statuses:", data.data?.length || 0)

      return {
        success: true,
        message: "API connection successful",
        data,
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
    } = {},
  ) {
    try {
      console.log("👥 Fetching clients from RemOnline API...")

      // Build query string from params
      const queryParams = new URLSearchParams()

      // Set default pagination
      queryParams.append("page", String(params.page || 1))

      // RemOnline API returns up to 50 entries per page by default
      if (params.limit && params.limit <= 50) {
        queryParams.append("limit", String(params.limit))
      }

      if (params.query) {
        queryParams.append("query", params.query)
      }

      if (params.email) {
        queryParams.append("email", params.email)
      }

      if (params.phone) {
        queryParams.append("phone", params.phone)
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
        currentPage: params.page || 1,
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

      // Use the query parameter to search for the client
      const response = await this.getClients({ query: email })

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

      // Normalize phone number by removing non-digit characters
      const normalizedPhone = phone.replace(/\D/g, "")

      // Use the query parameter to search for the client
      const response = await this.getClients({ query: normalizedPhone })

      if (response.success && response.data.data) {
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
    first_name: string
    last_name: string
    email: string
    phone?: string[]
    address?: string
  }) {
    try {
      console.log("➕ Creating client with data:", {
        ...clientData,
        phone: clientData.phone?.length || 0,
      })

      // Ensure phone is an array
      const dataToSend = {
        ...clientData,
        phone: Array.isArray(clientData.phone) ? clientData.phone : clientData.phone ? [clientData.phone] : [],
      }

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
      created_from?: string
      created_to?: string
    } = {},
  ) {
    try {
      console.log("📋 Fetching orders from RemOnline API...")

      // Build query string from params
      const queryParams = new URLSearchParams()

      // Set default pagination
      queryParams.append("page", String(params.page || 1))

      if (params.limit && params.limit <= 50) {
        queryParams.append("limit", String(params.limit))
      }

      if (params.client_id) {
        queryParams.append("client_id", String(params.client_id))
      }

      if (params.status_id) {
        queryParams.append("status_id", String(params.status_id))
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

  // Get tasks with pagination and optional filters
  async getTasks(
    params: {
      page?: number
      limit?: number
      order_id?: number
      status_id?: number
    } = {},
  ) {
    try {
      console.log("📝 Fetching tasks from RemOnline API...")

      // Build query string from params
      const queryParams = new URLSearchParams()

      // Set default pagination
      queryParams.append("page", String(params.page || 1))

      if (params.limit && params.limit <= 50) {
        queryParams.append("limit", String(params.limit))
      }

      if (params.order_id) {
        queryParams.append("order_id", String(params.order_id))
      }

      if (params.status_id) {
        queryParams.append("status_id", String(params.status_id))
      }

      const url = `/tasks?${queryParams.toString()}`
      const response = await this.makeRequest(url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch tasks with status ${response.status}:`, errorText)

        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        return {
          success: false,
          message: `Failed to fetch tasks with status ${response.status}`,
          details: errorDetails,
        }
      }

      const data = await response.json()
      console.log("✅ Tasks response:", {
        hasData: !!data.data,
        dataLength: data.data?.length || 0,
        totalCount: data.count || 0,
      })

      return { success: true, data }
    } catch (error) {
      console.error("❌ RemOnline getTasks error:", error)
      return {
        success: false,
        message: "Failed to fetch tasks from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get inventory items
  async getInventory(
    params: {
      page?: number
      limit?: number
      query?: string
    } = {},
  ) {
    try {
      console.log("📦 Fetching inventory from RemOnline API...")

      // Build query string from params
      const queryParams = new URLSearchParams()

      queryParams.append("page", String(params.page || 1))

      if (params.limit && params.limit <= 50) {
        queryParams.append("limit", String(params.limit))
      }

      if (params.query) {
        queryParams.append("query", params.query)
      }

      const url = `/inventory?${queryParams.toString()}`
      const response = await this.makeRequest(url)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Failed to fetch inventory with status ${response.status}:`, errorText)

        let errorDetails
        try {
          errorDetails = JSON.parse(errorText)
        } catch {
          errorDetails = errorText
        }

        return {
          success: false,
          message: `Failed to fetch inventory with status ${response.status}`,
          details: errorDetails,
        }
      }

      const data = await response.json()
      console.log("✅ Inventory fetched successfully, count:", data.data?.length || 0)

      return { success: true, data }
    } catch (error) {
      console.error("❌ RemOnline getInventory error:", error)
      return {
        success: false,
        message: "Failed to fetch inventory from RemOnline API",
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
