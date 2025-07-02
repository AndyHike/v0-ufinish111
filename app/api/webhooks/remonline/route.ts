import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Функція для безпечного логування
function safeLog(message: string, data?: any) {
  console.log(`[WEBHOOK] ${message}`)
  if (data) {
    try {
      console.log(`[WEBHOOK] Data:`, JSON.stringify(data, null, 2))
    } catch (e) {
      console.log(`[WEBHOOK] Data (raw):`, data)
    }
  }
}

// POST обробник для webhooks
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  safeLog("🔔 POST REQUEST RECEIVED!")
  safeLog("📍 URL:", request.url)
  safeLog("🌐 Method:", request.method)

  // Логуємо всі headers
  const headers = Object.fromEntries(request.headers.entries())
  safeLog("📋 Headers:", headers)

  let rawBody = ""
  let parsedData: any = null
  const contentType = request.headers.get("content-type") || "unknown"

  try {
    // Читаємо raw body
    rawBody = await request.text()
    safeLog("📦 Raw Body Length:", rawBody.length)
    safeLog("📦 Raw Body:", rawBody)
    safeLog("📦 Content-Type:", contentType)

    // Намагаємося парсити JSON
    if (rawBody.trim()) {
      try {
        parsedData = JSON.parse(rawBody)
        safeLog("✅ JSON Parsed Successfully")
        safeLog("📊 Parsed Data:", parsedData)
      } catch (parseError) {
        safeLog("❌ JSON Parse Error:", parseError)
        parsedData = {
          _error: "JSON_PARSE_FAILED",
          _raw_body: rawBody,
          _parse_error: String(parseError),
        }
      }
    } else {
      safeLog("⚠️ Empty Body Received")
      parsedData = {
        _error: "EMPTY_BODY",
        _content_type: contentType,
      }
    }

    // Визначаємо тип події
    const eventType =
      parsedData?.event || parsedData?.event_name || parsedData?.type || parsedData?.action || "unknown_event"

    safeLog("🎯 Event Type:", eventType)

    // Створюємо повний об'єкт для збереження
    const webhookLogData = {
      event_type: eventType,
      status: "received" as const,
      message: `Webhook received successfully (${eventType})`,
      processing_time_ms: Date.now() - startTime,
      webhook_data: {
        parsed_payload: parsedData,
        raw_body: rawBody,
        headers: headers,
        metadata: {
          url: request.url,
          method: request.method,
          content_type: contentType,
          body_length: rawBody.length,
          timestamp: new Date().toISOString(),
          user_agent: request.headers.get("user-agent") || "unknown",
        },
      },
      created_at: new Date().toISOString(),
    }

    safeLog("💾 Saving to Database...")

    // Зберігаємо в базу даних
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("webhook_logs").insert([webhookLogData]).select()

      if (error) {
        safeLog("❌ Database Error:", error)
      } else {
        safeLog("✅ Saved to Database:", data?.[0]?.id)
      }
    } catch (dbError) {
      safeLog("💥 Database Exception:", dbError)
    }

    const processingTime = Date.now() - startTime
    safeLog(`⏱️ Total Processing Time: ${processingTime}ms`)

    // Завжди повертаємо успішну відповідь
    const response = {
      success: true,
      message: "Webhook received and processed",
      event_type: eventType,
      processing_time_ms: processingTime,
      timestamp: new Date().toISOString(),
      received_data: parsedData ? Object.keys(parsedData) : [],
    }

    safeLog("✅ Sending Response:", response)

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    safeLog("💥 CRITICAL ERROR:", error)

    // Навіть при помилці намагаємося зберегти лог
    try {
      const supabase = createClient()
      await supabase.from("webhook_logs").insert([
        {
          event_type: "error",
          status: "error" as const,
          message: `Critical error: ${error instanceof Error ? error.message : String(error)}`,
          processing_time_ms: processingTime,
          webhook_data: {
            error: String(error),
            raw_body: rawBody,
            headers: headers,
            stack: error instanceof Error ? error.stack : undefined,
          },
          created_at: new Date().toISOString(),
        },
      ])
    } catch (dbError) {
      safeLog("💥 Failed to log error to database:", dbError)
    }

    // Все одно повертаємо 200, щоб не ламати RemOnline
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Webhook received but processing failed",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    )
  }
}

// GET обробник для перевірки статусу
export async function GET(request: NextRequest) {
  safeLog("🔍 GET REQUEST RECEIVED")
  safeLog("📍 URL:", request.url)

  // Логуємо GET запит теж
  try {
    const supabase = createClient()
    await supabase.from("webhook_logs").insert([
      {
        event_type: "health_check",
        status: "success" as const,
        message: "GET request - endpoint health check",
        processing_time_ms: 0,
        webhook_data: {
          method: "GET",
          url: request.url,
          headers: Object.fromEntries(request.headers.entries()),
          timestamp: new Date().toISOString(),
        },
        created_at: new Date().toISOString(),
      },
    ])
  } catch (error) {
    safeLog("❌ Failed to log GET request:", error)
  }

  const response = {
    status: "active",
    message: "RemOnline webhook endpoint is working",
    endpoint: request.url,
    methods: ["GET", "POST", "OPTIONS"],
    timestamp: new Date().toISOString(),
    server_time: new Date().toLocaleString(),
    ready_for_webhooks: true,
  }

  safeLog("✅ GET Response:", response)

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

// OPTIONS обробник для CORS
export async function OPTIONS(request: NextRequest) {
  safeLog("🔧 OPTIONS REQUEST RECEIVED")

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Max-Age": "86400",
    },
  })
}
