import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  console.log("🔔 WEBHOOK POST REQUEST RECEIVED!")

  // Відразу повертаємо успішну відповідь, щоб не блокувати RemOnline
  const response = NextResponse.json(
    {
      success: true,
      message: "Webhook received",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  )

  // Асинхронно обробляємо webhook без блокування відповіді
  processWebhookAsync(request).catch((error) => {
    console.error("💥 Async webhook processing error:", error)
  })

  return response
}

export async function GET(request: NextRequest) {
  console.log("🔍 WEBHOOK GET REQUEST RECEIVED!")

  // Логуємо GET запит
  logWebhookAsync(
    {
      method: "GET",
      url: request.url,
      timestamp: new Date().toISOString(),
    },
    "received",
    "GET request to webhook endpoint",
  ).catch(console.error)

  return NextResponse.json(
    {
      status: "active",
      message: "RemOnline webhook endpoint is working",
      timestamp: new Date().toISOString(),
      url: request.url,
      methods: ["GET", "POST"],
    },
    { status: 200 },
  )
}

async function processWebhookAsync(request: NextRequest) {
  const startTime = Date.now()
  let webhookData: any = null
  let rawBody = ""

  try {
    console.log("📋 Processing webhook headers:", Object.fromEntries(request.headers.entries()))

    // Клонуємо request для читання body
    const clonedRequest = request.clone()
    rawBody = await clonedRequest.text()

    console.log("📋 Raw webhook body:", rawBody)
    console.log("📋 Body length:", rawBody.length)
    console.log("📋 Content-Type:", request.headers.get("content-type"))
    console.log("📋 User-Agent:", request.headers.get("user-agent"))

    // Намагаємося парсити JSON
    if (rawBody.trim()) {
      try {
        webhookData = JSON.parse(rawBody)
        console.log("✅ JSON parsed successfully:", JSON.stringify(webhookData, null, 2))
      } catch (parseError) {
        console.log("❌ JSON parse failed:", parseError)
        webhookData = {
          raw_body: rawBody,
          parse_error: String(parseError),
          content_type: request.headers.get("content-type"),
        }
      }
    } else {
      console.log("⚠️ Empty body received")
      webhookData = {
        empty_body: true,
        content_type: request.headers.get("content-type"),
        headers: Object.fromEntries(request.headers.entries()),
      }
    }

    // Визначаємо тип події
    const eventType =
      webhookData?.event_name ||
      webhookData?.event ||
      webhookData?.type ||
      webhookData?.eventType ||
      webhookData?.action ||
      "unknown_event"

    console.log(`🎯 Event type: ${eventType}`)

    const processingTime = Date.now() - startTime

    // Логуємо в базу даних
    await logWebhookAsync(
      {
        ...webhookData,
        _metadata: {
          headers: Object.fromEntries(request.headers.entries()),
          raw_body: rawBody,
          processing_time: processingTime,
          url: request.url,
        },
      },
      "success",
      `Webhook processed successfully (${eventType})`,
      processingTime,
    )

    console.log(`✅ Webhook processed successfully in ${processingTime}ms`)
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("💥 Webhook processing error:", error)

    // Логуємо помилку
    await logWebhookAsync(
      {
        error: String(error),
        raw_body: rawBody,
        _metadata: {
          headers: Object.fromEntries(request.headers.entries()),
          processing_time: processingTime,
          url: request.url,
        },
      },
      "error",
      `Processing error: ${error instanceof Error ? error.message : String(error)}`,
      processingTime,
    )
  }
}

async function logWebhookAsync(
  webhookData: any,
  status: "received" | "success" | "failed" | "error",
  message?: string,
  processingTime?: number,
) {
  try {
    console.log("💾 Attempting to log webhook to database...")

    const supabase = createClient()

    const logEntry = {
      event_type:
        webhookData?.event_name ||
        webhookData?.event ||
        webhookData?.type ||
        webhookData?.eventType ||
        webhookData?.action ||
        (webhookData?.method === "GET" ? "GET_REQUEST" : "unknown"),
      status,
      message: message || "",
      processing_time_ms: processingTime || 0,
      webhook_data: webhookData,
      created_at: new Date().toISOString(),
    }

    console.log("💾 Log entry:", {
      event_type: logEntry.event_type,
      status: logEntry.status,
      message: logEntry.message,
      data_keys: Object.keys(webhookData || {}),
    })

    const { data, error } = await supabase.from("webhook_logs").insert([logEntry]).select()

    if (error) {
      console.error("❌ Database insert error:", error)
      console.error("❌ Error details:", JSON.stringify(error, null, 2))
    } else {
      console.log("✅ Successfully logged to database:", data?.[0]?.id)
    }
  } catch (error) {
    console.error("💥 Logging function error:", error)
    console.error("💥 Error stack:", error instanceof Error ? error.stack : "No stack")
  }
}

// Додаємо OPTIONS для CORS
export async function OPTIONS(request: NextRequest) {
  console.log("🔧 OPTIONS request received")

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    },
  })
}
