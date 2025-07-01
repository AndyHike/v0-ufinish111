import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import remonline from "@/lib/api/remonline"

export async function GET() {
  try {
    // Check if the user is an admin
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Testing RemOnline API connection...")

    // Test basic connection
    const connectionTest = await remonline.testConnection()

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to connect to RemOnline API",
          details: connectionTest,
        },
        { status: 500 },
      )
    }

    // Test fetching branches
    const branchesTest = await remonline.getBranches()

    // Test fetching clients (first page, limit 5)
    const clientsTest = await remonline.getClients({ page: 1, limit: 5 })

    // Test fetching order statuses
    const statusesTest = await remonline.getOrderStatuses()

    return NextResponse.json({
      success: true,
      message: "RemOnline API is working correctly",
      tests: {
        connection: connectionTest,
        branches: {
          success: branchesTest.success,
          count: branchesTest.data?.data?.length || 0,
          message: branchesTest.success ? "Branches fetched successfully" : branchesTest.message,
        },
        clients: {
          success: clientsTest.success,
          count: clientsTest.data?.data?.length || 0,
          total: clientsTest.data?.count || 0,
          message: clientsTest.success ? "Clients fetched successfully" : clientsTest.message,
        },
        orderStatuses: {
          success: statusesTest.success,
          count: statusesTest.data?.data?.length || 0,
          message: statusesTest.success ? "Order statuses fetched successfully" : statusesTest.message,
        },
      },
    })
  } catch (error) {
    console.error("Error testing RemOnline API:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to test RemOnline API",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
