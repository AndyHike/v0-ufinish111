import { type NextRequest, NextResponse } from "next/server"
import { getUserRepairOrders } from "@/app/actions/repair-orders"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 GET /api/user/repair-orders called")

    const result = await getUserRepairOrders()

    console.log("📋 getUserRepairOrders result:", {
      success: result.success,
      ordersCount: result.orders?.length || 0,
      message: result.message,
    })

    if (!result.success) {
      console.error("❌ Failed to get user repair orders:", result.message)
      return NextResponse.json(
        {
          success: false,
          error: result.message || "Failed to fetch repair orders",
          details: result.details,
        },
        { status: 500 },
      )
    }

    console.log("✅ Successfully fetched repair orders")
    return NextResponse.json({
      success: true,
      orders: result.orders || [],
    })
  } catch (error) {
    console.error("💥 Error in GET /api/user/repair-orders:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
