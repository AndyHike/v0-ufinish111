import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Clone the request to access the body as text
    const clonedRequest = request.clone()
    const requestText = await clonedRequest.text()

    // Log the request
    console.log(`Forwarding webhook from ${request.url} to /api/webhooks/remonline/order`)

    // Create the target URL
    const url = new URL("/api/webhooks/remonline/order", request.url)

    // Forward the request to the actual handler
    const response = await fetch(url, {
      method: "POST",
      headers: request.headers,
      body: requestText,
      duplex: "half", // Add this option to fix the error
    })

    // Return the response from the actual handler
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    })
  } catch (error) {
    console.error("Error forwarding webhook:", error)
    // Return 200 OK even for errors to prevent webhook deactivation
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error forwarding webhook, but received",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
