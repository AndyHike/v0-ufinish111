// This is a wrapper for the Remonline API
class RemonlineClient {
  private baseUrl = "https://api.remonline.app"
  private apiKey: string | null = null

  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.REMONLINE_API_KEY || process.env.REMONLINE_API_TOKEN || null

    if (!this.apiKey) {
      console.error("Neither REMONLINE_API_KEY nor REMONLINE_API_TOKEN environment variables are set")
    } else {
      console.log("RemOnline API client initialized with key:", this.apiKey.substring(0, 8) + "...")
    }
  }

  // Get the authorization headers for API requests
  private getAuthHeaders() {
    if (!this.apiKey) {
      throw new Error("API key is not configured")
    }

    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }
  }

  // Test the API connection
  async testConnection() {
    try {
      console.log("Testing RemOnline API connection...")

      if (!this.apiKey) {
        return {
          success: false,
          message: "API key is not configured",
        }
      }

      // Try to fetch a small amount of data to test the connection
      const response = await fetch(`${this.baseUrl}/clients?limit=1`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      console.log("Test connection response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API test failed with status ${response.status}:`, errorText)
        return {
          success: false,
          message: `API test failed with status ${response.status}`,
          details: errorText,
        }
      }

      const data = await response.json()
      console.log("API test successful, received data structure:", Object.keys(data))

      return {
        success: true,
        message: "API connection successful",
        data,
      }
    } catch (error) {
      console.error("RemOnline API test error:", error)
      return {
        success: false,
        message: "Failed to test API connection",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get clients with optional query parameters
  async getClients(params = {}) {
    try {
      console.log("Fetching clients from RemOnline API...")

      if (!this.apiKey) {
        return {
          success: false,
          message: "API key is not configured",
        }
      }

      // Build query string from params
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value))
      })

      let url = `${this.baseUrl}/clients`
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }

      console.log("Fetching clients from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to fetch clients with status ${response.status}: ${errorText}`)
        return {
          success: false,
          message: `Failed to fetch clients with status ${response.status}`,
          details: errorText,
        }
      }

      const data = await response.json()
      console.log("Clients response structure:", {
        hasData: !!data.data,
        dataLength: data.data?.length || 0,
        totalCount: data.count || 0,
      })

      return { success: true, data }
    } catch (error) {
      console.error("RemOnline getClients error:", error)
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
      console.log(`Fetching client with ID: ${clientId}`)

      if (!this.apiKey) {
        return {
          success: false,
          message: "API key is not configured",
        }
      }

      const url = `${this.baseUrl}/clients/${clientId}`
      console.log("Request URL:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      console.log(`Response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to fetch client details with status ${response.status}: ${errorText}`)
        return {
          success: false,
          message: `Failed to fetch client details with status ${response.status}`,
          details: errorText,
        }
      }

      const data = await response.json()
      console.log("Client details fetched successfully")

      return { success: true, client: data }
    } catch (error) {
      console.error("RemOnline getClientById error:", error)
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
      console.log(`Looking for client with email: ${email}`)

      // Use the query parameter to search for the client
      const response = await this.getClients({ query: email })

      if (response.success && response.data.data) {
        // Find the client with the exact email match
        const client = response.data.data.find((c: any) => c.email && c.email.toLowerCase() === email.toLowerCase())

        console.log("Client found by email:", client ? "Found" : "Not found")

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
      console.error("RemOnline getClientByEmail error:", error)
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
      console.log(`Looking for client with phone: ${phone}`)

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

        console.log("Client found by phone:", client ? "Found" : "Not found")

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
      console.error("RemOnline getClientByPhone error:", error)
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
      console.log("Creating client with data:", { ...clientData, phone: clientData.phone?.length || 0 })

      if (!this.apiKey) {
        return {
          success: false,
          message: "API key is not configured",
        }
      }

      // Ensure phone is an array
      const dataToSend = {
        ...clientData,
        phone: Array.isArray(clientData.phone) ? clientData.phone : clientData.phone ? [clientData.phone] : [],
      }

      console.log("POST URL:", `${this.baseUrl}/clients`)

      const response = await fetch(`${this.baseUrl}/clients`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(dataToSend),
      })

      console.log("Response status:", response.status)

      const responseText = await response.text()
      console.log("Response text length:", responseText.length)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response as JSON:", responseText)
        return {
          success: false,
          message: `Failed to parse response: ${responseText}`,
          details: e instanceof Error ? e.message : String(e),
        }
      }

      if (!response.ok) {
        console.error(`Failed to create client with status ${response.status}:`, data)
        return {
          success: false,
          message: `Failed to create client with status ${response.status}`,
          details: data,
        }
      }

      console.log("Client created successfully")
      return { success: true, client: data }
    } catch (error) {
      console.error("RemOnline createClient error:", error)
      return {
        success: false,
        message: "Failed to create client in RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get order by ID
  async getOrderById(orderId: number) {
    try {
      console.log(`Fetching order with ID: ${orderId}`)

      if (!this.apiKey) {
        return {
          success: false,
          message: "API key is not configured",
        }
      }

      const url = `${this.baseUrl}/orders/${orderId}`
      console.log("Request URL:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to fetch order with status ${response.status}: ${errorText}`)
        return {
          success: false,
          message: `Failed to fetch order with status ${response.status}`,
          details: errorText,
        }
      }

      const data = await response.json()
      console.log("Order fetched successfully")

      return { success: true, order: data }
    } catch (error) {
      console.error("RemOnline getOrderById error:", error)
      return {
        success: false,
        message: "Failed to fetch order from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get orders for a client
  async getOrdersByClientId(clientId: number, params = {}) {
    try {
      console.log(`Fetching orders for client ID: ${clientId}`)

      if (!this.apiKey) {
        return {
          success: false,
          message: "API key is not configured",
        }
      }

      // Build query string from params
      const queryParams = new URLSearchParams({ client_id: String(clientId) })
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value))
      })

      const url = `${this.baseUrl}/orders?${queryParams.toString()}`
      console.log("Request URL:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to fetch orders with status ${response.status}: ${errorText}`)
        return {
          success: false,
          message: `Failed to fetch orders with status ${response.status}`,
          details: errorText,
        }
      }

      const data = await response.json()
      console.log("Orders fetched successfully, count:", data.data?.length || 0)

      return { success: true, data }
    } catch (error) {
      console.error("RemOnline getOrdersByClientId error:", error)
      return {
        success: false,
        message: "Failed to fetch orders from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Get tasks (new endpoint example)
  async getTasks(params = {}) {
    try {
      console.log("Fetching tasks from RemOnline API...")

      if (!this.apiKey) {
        return {
          success: false,
          message: "API key is not configured",
        }
      }

      // Build query string from params
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value))
      })

      let url = `${this.baseUrl}/tasks`
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`
      }

      console.log("Fetching tasks from:", url)

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Failed to fetch tasks with status ${response.status}: ${errorText}`)
        return {
          success: false,
          message: `Failed to fetch tasks with status ${response.status}`,
          details: errorText,
        }
      }

      const data = await response.json()
      console.log("Tasks response structure:", {
        hasData: !!data.data,
        dataLength: data.data?.length || 0,
        totalCount: data.count || 0,
      })

      return { success: true, data }
    } catch (error) {
      console.error("RemOnline getTasks error:", error)
      return {
        success: false,
        message: "Failed to fetch tasks from RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      }
    }
  }

  // Legacy auth method - kept for backward compatibility but now just returns the API key
  async auth() {
    console.log("Legacy auth method called - returning API key directly")

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
console.log("Initializing RemOnline client with new Bearer token authentication")
const remonline = new RemonlineClient()

export default remonline
