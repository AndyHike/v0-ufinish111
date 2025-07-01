// Environment variables
const REMONLINE_API_TOKEN = process.env.REMONLINE_API_TOKEN
const REMONLINE_API_KEY = process.env.REMONLINE_API_KEY

if (!REMONLINE_API_TOKEN || !REMONLINE_API_KEY) {
  console.warn("RemOnline API credentials not found in environment variables")
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
  token?: string
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
}

interface StatusesResponse {
  success: boolean
  statuses?: any[]
  message?: string
}

class RemOnlineAPI {
  private authToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor() {
    // Initialize with environment variables if available
  }

  /**
   * Authenticate with RemOnline API
   */
  async auth(): Promise<AuthResponse> {
    try {
      // Check if we have a valid token
      if (this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return { success: true, token: this.authToken }
      }

      if (!REMONLINE_API_TOKEN || !REMONLINE_API_KEY) {
        return {
          success: false,
          message: "RemOnline API credentials not configured",
        }
      }

      const response = await fetch(`${BASE_URL}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_token: REMONLINE_API_TOKEN,
          api_key: REMONLINE_API_KEY,
        }),
      })

      if (!response.ok) {
        return {
          success: false,
          message: `Authentication failed: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()

      if (data.token) {
        this.authToken = data.token
        // Set token expiry to 1 hour from now (adjust based on RemOnline's token lifetime)
        this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000)
        return { success: true, token: data.token }
      }

      return {
        success: false,
        message: "No token received from authentication",
      }
    } catch (error) {
      console.error("RemOnline auth error:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Authentication failed",
      }
    }
  }

  /**
   * Make authenticated request to RemOnline API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const authResult = await this.auth()
    if (!authResult.success) {
      throw new Error(authResult.message || "Authentication failed")
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
        ...options.headers,
      },
    })

    return response
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<RemOnlineResponse> {
    try {
      const authResult = await this.auth()
      if (!authResult.success) {
        return {
          success: false,
          message: authResult.message || "Authentication failed",
        }
      }

      // Try to fetch a simple endpoint to test the connection
      const response = await this.makeRequest("/clients?limit=1")

      if (response.ok) {
        return {
          success: true,
          message: "Connection successful",
        }
      }

      return {
        success: false,
        message: `Connection test failed: ${response.status} ${response.statusText}`,
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      }
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(clientId: number): Promise<ClientResponse> {
    try {
      const response = await this.makeRequest(`/clients/${clientId}`)

      if (!response.ok) {
        return {
          success: false,
          message: `Failed to fetch client: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        client: data,
      }
    } catch (error) {
      console.error("Error fetching client:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch client",
      }
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: number): Promise<OrderResponse> {
    try {
      const response = await this.makeRequest(`/orders/${orderId}`)

      if (!response.ok) {
        return {
          success: false,
          message: `Failed to fetch order: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        order: data,
      }
    } catch (error) {
      console.error("Error fetching order:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch order",
      }
    }
  }

  /**
   * Get orders by client ID
   */
  async getOrdersByClientId(clientId: number): Promise<OrdersResponse> {
    try {
      const response = await this.makeRequest(`/orders?client_id=${clientId}`)

      if (!response.ok) {
        return {
          success: false,
          message: `Failed to fetch orders: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        orders: Array.isArray(data) ? data : data.orders || [],
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch orders",
      }
    }
  }

  /**
   * Get all order statuses
   */
  async getOrderStatuses(): Promise<StatusesResponse> {
    try {
      const response = await this.makeRequest("/order-statuses")

      if (!response.ok) {
        return {
          success: false,
          message: `Failed to fetch order statuses: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        statuses: Array.isArray(data) ? data : data.statuses || [],
      }
    } catch (error) {
      console.error("Error fetching order statuses:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to fetch order statuses",
      }
    }
  }

  /**
   * Create a new client
   */
  async createClient(clientData: {
    first_name: string
    last_name: string
    email: string
    phone?: string
    address?: string
  }): Promise<RemOnlineResponse> {
    try {
      const response = await this.makeRequest("/clients", {
        method: "POST",
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          message: `Failed to create client: ${response.status} ${response.statusText}`,
          error: errorData.message || errorData.error,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error("Error creating client:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create client",
      }
    }
  }

  /**
   * Update an existing client
   */
  async updateClient(
    clientId: number,
    clientData: {
      first_name?: string
      last_name?: string
      email?: string
      phone?: string
      address?: string
    },
  ): Promise<RemOnlineResponse> {
    try {
      const response = await this.makeRequest(`/clients/${clientId}`, {
        method: "PUT",
        body: JSON.stringify(clientData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          message: `Failed to update client: ${response.status} ${response.statusText}`,
          error: errorData.message || errorData.error,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error("Error updating client:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update client",
      }
    }
  }

  /**
   * Search clients
   */
  async searchClients(query: string, limit = 10): Promise<RemOnlineResponse> {
    try {
      const response = await this.makeRequest(`/clients?search=${encodeURIComponent(query)}&limit=${limit}`)

      if (!response.ok) {
        return {
          success: false,
          message: `Failed to search clients: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        data: Array.isArray(data) ? data : data.clients || [],
      }
    } catch (error) {
      console.error("Error searching clients:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to search clients",
      }
    }
  }
}

// Export singleton instance
const remonline = new RemOnlineAPI()
export default remonline
