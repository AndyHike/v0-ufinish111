// Remonline API Endpoints Reference
// Source: https://remonline.app/api/

export const REMONLINE_API_ENDPOINTS = {
  // Authentication
  AUTH: "/token/new",

  // Clients
  CLIENTS: "/clients",
  CLIENT_BY_ID: (id: string | number) => `/clients/${id}`,

  // Orders
  ORDERS: "/orders",
  ORDER_BY_ID: (id: string | number) => `/orders/${id}`,

  // Other endpoints can be added as needed
}

export const REMONLINE_API_METHODS = {
  // Example request to get clients
  GET_CLIENTS: {
    method: "GET",
    endpoint: "/clients",
    queryParams: {
      // Common query parameters
      branch_ids: "Filter by branch IDs (comma separated)",
      query: "Search text to filter results",
      limit: "Number of records to return (default: 50, max: 100)",
      offset: "Offset for pagination",
    },
  },

  // Example request to create a client
  CREATE_CLIENT: {
    method: "POST",
    endpoint: "/clients",
    requiredFields: ["name"],
    optionalFields: ["email", "phone", "address", "notes", "custom_fields", "discount", "juridical", "manager_id"],
  },
}
